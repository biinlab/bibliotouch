var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var mouseDragScroll = require('../helpers/mouseDragScroll');
var QuadBinPacker = require('../helpers/quadBinPacker');


/**
 * Utilitary function for the distance between 2 points
 * 
 * @param {Number} x1 - x1
 * @param {Number} y1 - y1
 * @param {Number} x2 - x2
 * @param {Number} y2 - y2
 * @returns {Number} - The distance between the 2 points
 */
var getDistance = function(x1, y1, x2, y2){
    return Math.hypot(x2-x1, y2-y1)
}

/**
 * Mixin for a Map of themes using the QuadBinPacker module for its constitution and is dragscrollable using the mouse
 * @mixin
 */
var packedThemeMapMixin = {
    data : function(){
        return {
            cthemes: [],
            loading: false,
            biggestNbDocs : -Infinity,
            smallestNbDocs : Infinity,
            ratio : 0
        }
    },
    created: function(){
        let self = this;
        this.retrieveThemeMapJson()
            .then(function(res){
                    let themes = JSON.parse(res);
                    self.loading = false;

                    this.quadBinPacker = new QuadBinPacker(self.bookcellHeight, self.bookcellWidth, self.ratio);
                    let sortedThemes = quadBinPacker.sortThemes(themes);
                    let packedThemes = quadBinPacker.pack(sortedThemes);
                    self.mapSize = quadBinPacker.mapSize;
                    packedThemes.forEach(function(element) {
                        self.cthemes.push(element);
                        //find biggest and smallest nbDocs
                        if(element.nbBooks > self.biggestNbDocs){
                            self.biggestNbDocs = element.nbBooks;
                        }
                        if(element.nbBooks < self.smallestNbDocs){
                            self.smallestNbDocs = element.nbBooks;
                        }
                    });
                    mouseDragScroll.enableDragScroll();
                    //FIND CURRENT THEME
                    self.setCurrentThemeFinderInterval()
                    if(self.$route.params.theme_id){
                        //Go to position of the given theme
                        let themeTarget = self.cthemes.find((element) => {return element.name === self.$route.params.theme_id});
                        window.setTimeout(function(){
                                window.scrollTo(themeTarget.fit.x,themeTarget.fit.y);
                        }, 500);
                    } else {
                        //Go to center of the map
                        window.setTimeout(function(){
                            if(self.mapSize){
                                window.scrollTo(self.mapSize.w/2,self.mapSize.h/2);
                            }
                        }, 500);
                    }

                },function(err){
                    self.error = err;
                    self.loading = false;
                    console.error(err);
                })
    },
    beforeDestroy: function(){
        mouseDragScroll.disableDragScroll();
    },
    methods: {
        /**
         * Returns the theme corresponding to some xy coordinates
         * 
         * @param {any} x - x
         * @param {any} y - y
         * @returns {Object} - The theme
         */
        getThemeElementFromPos : function (x,y) {
            for(let element of this.cthemes){
                    if(x >= element.fit.x && x < (element.fit.x + element.w) && y >= element.fit.y && y < (element.fit.y + element.h)){
                        return element;
                    }
                }
        },
        /**
         * Sets an Interval that regularly checks for the current hovered theme
         * @fires current-theme-changed
         * 
         */
        setCurrentThemeFinderInterval : function() {
            let self = this;
            window.setInterval(function(){
                let curX = window.scrollX+window.innerWidth/2, curY = window.scrollY+window.innerHeight/2;
                let element = self.getThemeElementFromPos(curX, curY);
                if(element && self.currentTheme != element.name){
                    self.currentTheme = element.name;
                    self.nbBooks = element.nbBooks;
                    self.findNeighbours(element);
                    /**
                     * Hovered theme changed
                     * @event current-theme-changed
                     * @type {Object}
                     */
                    self.$emit('current-theme-changed', self.currentTheme);
                    return;
                }
            }, 300);
        },
        /**
         * Start the loading of the list of the themes
         * 
         * @returns {Promise} 
         */
        retrieveThemeMapJson : function(){
            this.loading = true;
            return requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes`);
        },
        /**
         * Finds the nearest neighbours of a given theme
         * 
         * @param {Object} currentElement - The theme whose neighbours we are looking for
         */
        findNeighbours : function(currentElement){
            this.topNeighbour = this.botNeighbour = this.leftNeighbour = this.rightNeighbour = null;
            let topDist = Infinity,
                botDist = Infinity,
                leftDist = Infinity,
                rightDist = Infinity;
            let tmpTopNeighbour = null,
                tmpBotNeighbour = null,
                tmpLeftNeighbour = null,
                tmpRightNeighbour = null;
            let topX = currentElement.fit.x + currentElement.w/2;
            let topY = currentElement.fit.y;
            let botX = topX;
            let botY = topY + currentElement.h;
            let leftX = currentElement.fit.x;
            let leftY = currentElement.fit.y + currentElement.h/2;
            let rightX = currentElement.fit.x + currentElement.w;
            let rightY = leftY;

            for(let element of this.cthemes){
                tmpTopDist = getDistance(topX, topY,element.fit.x + element.w/2, element.fit.y + element.h);
                tmpBotDist = getDistance(botX, botY, element.fit.x + element.w/2, element.fit.y);
                tmpLeftDist = getDistance(leftX, leftY, element.fit.x + element.w, element.fit.y + element.h/2);
                tmpRightDist = getDistance(rightX, rightY, element.fit.x, element.fit.y + element.h/2);

                if(tmpTopDist < topDist){
                    topDist = tmpTopDist;
                    tmpTopNeighbour = element;
                }
                if(tmpBotDist < botDist){
                    botDist = tmpBotDist;
                    tmpBotNeighbour = element;
                }
                if(tmpLeftDist < leftDist){
                    leftDist = tmpLeftDist;
                    tmpLeftNeighbour = element;
                }
                if(tmpRightDist < rightDist){
                    rightDist = tmpRightDist;
                    tmpRightNeighbour = element;
                }
            }
            this.topNeighbour = tmpTopNeighbour;
            this.botNeighbour = tmpBotNeighbour;
            this.leftNeighbour = tmpLeftNeighbour;
            this.rightNeighbour = tmpRightNeighbour;
        }
    }
}

module.exports = packedThemeMapMixin;
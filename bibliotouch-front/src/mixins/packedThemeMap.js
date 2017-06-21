var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var mouseDragScroll = require('../helpers/mouseDragScroll');
var QuadBinPacker = require('../helpers/quadBinPacker');


var getDistance = function(x1, y1, x2, y2){
    return Math.hypot(x2-x1, y2-y1)
}

var packedThemeMapMixin = {
    data : function(){
        return {
            cthemes: [],
            loading: false,
            biggestNbDocs : -Infinity,
            smallestNbDocs : Infinity
        }
    },
    created: function(){
        let self = this;
        this.retrieveThemeMapJson()
            .then(function(res){
                    let themes = JSON.parse(res);
                    self.loading = false;

                    this.quadBinPacker = new QuadBinPacker(self.bookcellHeight, self.bookcellWidth);
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
        getThemeElementFromPos : function (x,y) {
            for(let element of this.cthemes){
                    if(x >= element.fit.x && x < (element.fit.x + element.w) && y >= element.fit.y && y < (element.fit.y + element.h)){
                        return element;
                    }
                }
        },
        setCurrentThemeFinderInterval : function() {
            let self = this;
            window.setInterval(function(){
                let curX = window.scrollX+window.innerWidth/2, curY = window.scrollY+window.innerHeight/2;
                let element = self.getThemeElementFromPos(curX, curY);
                if(element && self.currentTheme != element.name){
                    self.currentTheme = element.name;
                    self.nbBooks = element.nbBooks;
                    self.findNeighbours(element);
                    self.$emit('current-theme-changed', self.currentTheme);
                    return;
                }
            }, 300);
        },
        retrieveThemeMapJson : function(){
            this.loading = true;
            return requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes`);
        },
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
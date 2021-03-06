var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var packedThemeMapMixin = require('./mixins/packedThemeMap');
var ZoomHandler = require('./helpers/pinchToZoomHandler');
require('./components/borderIndicators');
require('./components/searchBox');

/**
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module
 */

//These values are used by the bin-packing algorithm (packedThemeMap.js)
//Apply changes to the CSS classes outer-map-*
//Sorry
var bookcellHeight = 65,
    bookcellWidth = 35,
    bookcoverHeight = 35,
    bookcoverWidth = 5;
    
Vue.use(VueLazyLoad, {
    preLoad : 3,
    lazyComponent : true
});

/**
 * Component displaying a single book spine
 */
var BookElement = {
    template : `<div class="outer-map-book-cell">
                    <img    class="outer-map-book-cover"
                            v-bind:src="generatedCoverSrc">
                    </img>
                </div>`,
    computed: {
        generatedCoverSrc : function(){
            let rnd = Math.trunc((Math.random()*7)+1);
            return `/res/covers/cover_${rnd}.png`;
        }
    }
}

/**
 * Component displaying books for a given theme
 * 
 * @property {string} theme - The theme of the component
 * @property {Number} biggestNbDocs - The biggest number of documents across the themes
 * @property {Number} ratio - Scale factor of the component 
 */
var ThemeWrapper = {
    template : `
                    <lazy-component 
                                @show="loadBooks"
                                v-bind:style="{
                                    position : 'absolute',
                                    left : theme.fit.x + 'px',
                                    top : theme.fit.y + 'px',
                                    width : theme.w + 'px',
                                    height : theme.h + 'px',         
                                    userSelect: 'none'}">
                        <book-element
                                    v-for="book in books"
                                    v-bind:key="book">
                        </book-element>
                        <div v-bind:style="{
                            position : 'absolute',
                            top : '50%',
                            left : '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex : '-5'
                            }">
                            <p v-bind:style="{
                                    fontFamily: 'Montserrat',
                                    fontWeight: '600',
                                    fontSize: themeFontSize+'px',
                                    textTransform : 'capitalize',
                                    color: '#000000',
                                    letterSpacing: '0',
                                    margin: '4px',
                                    textAlign: 'center'}">
                                {{theme.name}}
                            </p>
                            <p v-bind:style="{
                                    fontFamily: 'Montserrat',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    color: '#000000',
                                    marginTop: '0',
                                    textAlign: 'center'
                                }">
                                {{theme.nbBooks}} documents
                            </p>
                        </div>
                        <div    class="enter-theme-button"
                                v-bind:style="{
                                    width: enterThemeButtonSize+'px',
                                    height: enterThemeButtonSize+'px',
                                }"
                                v-on:click="$router.push('/theme-map/'+theme.name)">
                            <img src="/res/arrow_right.png"/>
                        </div>
                    </lazy-component>`,
    props : ['theme', 'biggestNbDocs', 'smallestNbDocs', 'ratio'],
    data : function () {
        return {
            books : []
        }
    },
    computed : {
        themeFontSize : function(){
            let maxSize = 58, minSize = 22;
            return Math.trunc(minSize + ((this.theme.nbBooks - this.smallestNbDocs)/(this.biggestNbDocs-this.smallestNbDocs))*(maxSize-minSize));
        },
        enterThemeButtonSize : function(){
        let maxSize = 48, minSize = 32;
            return Math.trunc(minSize + ((this.theme.nbBooks - this.smallestNbDocs)/(this.biggestNbDocs-this.smallestNbDocs))*(maxSize-minSize));    
        }
    },
    methods : {
        /**
         * Sets to itself an empty Array according to ratio
         * 
         * @param {any} component 
         */
        loadBooks : function(component){
            this.books = new Array(this.ratio > 0 ? Math.trunc(this.theme.nbBooks/this.ratio) : this.theme.nbBooks);
        }
    },
    components : {
        'book-element' : BookElement
    }
};

/**
 * Component display a map of themes, based on the PackedThemeMapMixin mixin
 */
var ThemeMap = Vue.extend({
    template : `<div id="outer-theme-map">
                    <theme-wrapper  v-for="theme in cthemes" 
                                    v-bind:key="theme.id"
                                    v-bind:theme="theme"
                                    v-bind:biggestNbDocs="biggestNbDocs"
                                    v-bind:smallestNbDocs="smallestNbDocs"
                                    v-bind:ratio="ratio">
                    </theme-wrapper>
                </div>`,
    mixins : [packedThemeMapMixin],
    data : function(){
        return {
            cthemes : [],
            error : null,
            loading : false,
            currentTheme : '',
            nbBooks : 0,
            bookcellHeight : bookcellHeight,
            bookcellWidth : bookcellWidth,
            ratio : 4,
            mapSize : null,
            zoomHandler : null
        }
    },
    mounted: function(){
        let self = this;

        let zoomInHandler = function (x,y) {
            let element = self.getThemeElementFromPos(x,y);
            if(element) {
                self.$router.push('/theme-map/'+element.name);
            } else {
                self.$router.push('/theme-map/'+self.currentTheme);
            }
        }

        self.zoomHandler = new ZoomHandler(document.getElementById('outer-theme-map'));
        self.zoomHandler.setZoomHandlers(zoomInHandler,()=>{});
    },
    beforeDestroy: function(){
        this.zoomHandler.removeZoomHandlers();
    },
    components : {
        'theme-wrapper' : ThemeWrapper
    }
});

module.exports = ThemeMap;
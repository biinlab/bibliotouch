var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var gridDispatcher = require('./helpers/fixedGridDispatcher');
var ZoomHandler = require('./helpers/pinchToZoomHandler');
var packedThemeMapMixin = require('./mixins/packedThemeMap');
require('./components/borderIndicators');
require('./components/searchBox');

var bookcellHeight = 140,
    bookcellWidth = 116,
    bookcoverHeight = 80,
    bookcoverWidth = 56;

var imgTopMargin = (bookcellHeight-bookcoverHeight)/2;
var imgLeftMargin = (bookcellWidth-bookcoverWidth)/2;


Vue.use(VueLazyLoad, {
    preLoad : 3,
    lazyComponent : true
});


var bookCoverStyleObject = {
    position : 'absolute',
    width : `${bookcoverWidth}px`,
    height : `${bookcoverHeight}px`,
    left : `${imgTopMargin}px`,
    top : `${imgLeftMargin}px`,
    boxShadow: '0 0 10px 0 rgba(0,0,0,0.12)',
    userDrag : 'none',
    userSelect : 'none',
    backgroundColor : 'lightgrey',
    objectFit : 'cover'
}

var generatedBookCoverTitleStyleObject = {
    position : 'absolute',
    width : `${bookcoverWidth-10}px`,
    height : `${bookcoverHeight-10}px`,
    left : `${imgTopMargin}px`,
    top : `${imgLeftMargin}px`,
    fontSize : '8px',
    margin : '5px',
    overflow : 'hidden'
}

var BookElement = {
    template : `<div v-bind:style="{
                        position : 'absolute',
                        left : book.dispatch.x + 'px',
                        top : book.dispatch.y + 'px',
                        width : '${bookcellWidth}px',
                        height : '${bookcellHeight}px',}"
                        @show="setOnScreen">
                    <!--<transition name="fade">-->
                        <img    v-if="!imgAvailable"
                                v-bind:style="bookCoverStyleObject"
                                v-bind:src="generatedCoverSrc">
                                <p  v-if="!imgAvailable"
                                    v-bind:style="generatedBookCoverTitleStyleObject">
                                    {{book.title}}
                                </p>
                        </img>
                    <!--</transition>-->
                    <lazy-component v-if="book.hasCover"
                                    @show="loadCover">
                        <transition name="fade">
                            <img    v-if="imgAvailable"
                                    v-bind:style="bookCoverStyleObject"
                                    v-bind:src="imgSrc">
                            </img>
                        </transition>
                    </lazy-component>
                </div>`,
    props : ['book'],
    data : function(){
        return {
            onScreen : false,
            imgAvailable : false,
            imgSrc : '',
            bookCoverStyleObject : bookCoverStyleObject,
            generatedBookCoverTitleStyleObject : generatedBookCoverTitleStyleObject
        }
    },
    computed: {
        generatedCoverSrc : function(){
            let rnd = Math.trunc((Math.random()*7)+1);
            return `/res/covers/cover_${rnd}.png`;
        }
    },
    methods:{
        loadCover: function(component){
            let self = this;
            let isbn = this.book.isbn;
            if(isbn){
                requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/covers/isbn/${isbn}-56.jpg`)
                    .then(function(body){
                        self.imgAvailable = true;
                        self.imgSrc = './covers/isbn/'+isbn+'-56.jpg';
                    })
                    .catch(function(err){});
            }
        },
        setOnScreen : function(component){
            this.onScreen = true;
        },
        getRndColor : function(){
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.floor(Math.random() * 10)+6];
            }
            return color;
        }
    }
}

var ThemeWrapper = {
    template : `
                    <lazy-component 
                                @show="loadBooks"
                                @rest="unloadBooks"
                                @unrest="loadBooks"
                                v-bind:style="{
                                    position : 'absolute',
                                    left : theme.fit.x + 'px',
                                    top : theme.fit.y + 'px',
                                    width : theme.w + 'px',
                                    height : theme.h + 'px',         
                                    userSelect: 'none'}">
                        <book-element
                                    v-for="book in books"
                                    v-bind:key="book.id"
                                    v-bind:book="book">
                        </book-element>
                    </lazy-component>`,
    props : ['theme'],
    data : function () {
        return {
            books : []
        }
    },
    methods : {
        loadBooks : function(component){
            let self = this;
            requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes/${component.$parent.theme.name}/books`)
                .then(function(retrievedBooks){
                    let parsedBooks = JSON.parse(retrievedBooks);
                    gridDispatcher.dispatch(parsedBooks,component.$parent.theme.w/bookcellWidth, bookcellWidth, bookcellHeight);
                    parsedBooks.forEach(function(book){
                        self.books.push(book);
                    });
                });
        },
        unloadBooks: function(){
            this.books.splice(0, this.books.length);
        }
    },
    components : {
        'book-element' : BookElement
    }
};

var ThemeMap = Vue.extend({
    template : `<div id="theme-map">
                    <theme-wrapper  v-for="theme in cthemes" 
                                    v-bind:key="theme.id"
                                    v-bind:theme="theme">
                    </theme-wrapper>
                    <div   v-bind:style="{
                                    position : 'fixed',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontFamily : 'Montserrat',
                                    color: '#000000',
                                    zIndex : '-1',         
                                    userSelect: 'none'
                                }">
                        <p  v-bind:style="{
                                    fontSize : '150px',
                                    textTransform : 'capitalize',
                                    letterSpacing: '0',
                                    lineHeight: '200px',
                                    margin : '0px'
                                    }">
                            {{currentTheme}}
                        </p>
                        <p  v-if="nbBooks > 0"
                            v-bind:style="{
                                    fontSize : '30px',
                                    lineHeight: '15px',
                                    margin : '0'
                                    }">
                            {{nbBooks}} documents
                        </p>
                    </div>
                    <border-indicators
                                        v-bind:topNeighbour="topNeighbour"
                                        v-bind:botNeighbour="botNeighbour"
                                        v-bind:leftNeighbour="leftNeighbour"
                                        v-bind:rightNeighbour="rightNeighbour">
                    </border-indicators>
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
            mapSize : null,
            topNeighbour : null,
            botNeighbour : null,
            leftNeighbour : null,
            rightNeighbour : null,
            zoomHandler : null
        }
    },
    mounted: function(){
        let self = this;

        let zoomInHandler = function (x,y) {
            let element = self.getThemeElementFromPos(x,y);
            if(element) {
                self.$router.push('/inner-theme-map/'+element.name);
            } else {
                self.$router.push('/inner-theme-map/'+self.currentTheme);
            }
        }

        let zoomOutHandler = function () {
            self.$router.push('/outer-theme-map/'+self.currentTheme);
        }
        self.zoomHandler = new ZoomHandler(document.getElementById('theme-map'));
        self.zoomHandler.setZoomHandlers(zoomInHandler,zoomOutHandler);
    },
    beforeDestroy: function(){
        this.zoomHandler.removeZoomHandlers();
    },
    components : {
        'theme-wrapper' : ThemeWrapper
    }
});

module.exports = ThemeMap;
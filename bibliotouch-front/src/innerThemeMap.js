var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var gridDispatcher = require('./helpers/fixedGridDispatcher');
var requestp = require('request-promise-native');
var mouseDragScroll = require('./helpers/mouseDragScroll');
var ZoomHandler = require('./helpers/pinchToZoomHandler');
require('./components/searchBox');

var eventBus = new Vue();

//These values are used by the bin-packing algorithm (packedThemeMap.js)
//Apply changes to the CSS classes inner-map-*
//Sorry
var bookcellHeight = 168+60,
    bookcellWidth = 184+60,
    bookcoverHeight = 168,
    bookcoverWidth = 100;

Vue.use(VueLazyLoad, {
    preLoad : 3,
    lazyComponent : true
});

var BookElement = {
    template : `<!--<lazy-component @show="setOnScreen">-->
                    <div v-bind:style="{
                        left : book.dispatch.x + 'px',
                        top : book.dispatch.y + 'px'}"
                        class="inner-map-book-cell">
                        <img    v-if="!imgAvailable"
                                class="inner-map-book-cover"
                                v-bind:src="generatedCoverSrc"
                                v-on:mousedown="initiateShowBookDetail"
                                v-on:mousemove="invalidateShowBookDetail"
                                v-on:mouseup="showBookDetail">
                                <p  v-if="!imgAvailable"
                                    class="inner-map-generated-book-cover-title"
                                    v-on:mousedown="initiateShowBookDetail"
                                    v-on:mousemove="invalidateShowBookDetail"
                                    v-on:mouseup="showBookDetail">
                                    {{book.title}}
                                </p>
                        </img>
                        <lazy-component v-if="book.hasCover"
                                        @show="loadCover">
                                        
                            <transition name="fade">
                                <img    v-if="imgAvailable"
                                        class="inner-map-book-cover"
                                        v-bind:src="imgSrc"
                                        v-on:mousedown="initiateShowBookDetail"
                                        v-on:mousemove="invalidateShowBookDetail"
                                        v-on:mouseup="showBookDetail">
                                </img>
                            </transition>
                        </lazy-component>
                        <div    class="cartouche-box"
                                v-on:mousedown="initiateShowBookDetail"
                                v-on:mousemove="invalidateShowBookDetail"
                                v-on:mouseup="showBookDetail">
                            <p  class="cartouche-title"
                                v-bind:id="titleId">
                                {{book.title}}
                            </p>
                            <p  class="cartouche-ellipsis"
                                v-if="isOverflown">
                                ...
                            </p>
                            <p  class="cartouche-author"
                                v-bind:id="authorsId">
                                {{firstAuthor}}
                            </p>
                            <p  class="cartouche-date">
                                {{parsedDatePub}}
                            </p>
                        </div>
                    </div>
                <!--</lazy-component>-->`,
    props : ['book'],
    data : function(){
        return {
            onScreen : false,
            imgAvailable : false,
            imgSrc : '',
            isOverflown : false,
            zoomHandler: null
        }
    },
    mounted: function(){
        let element = document.getElementById(this.titleId);
        this.isOverflown = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    },
    computed: {
        generatedCoverSrc : function(){
            let rnd = Math.trunc((Math.random()*7)+1);
            return `/res/covers/cover_${rnd}.png`;
        },
        authorsId : function(){
            return `${this.book.id}authors`
        },
        titleId : function(){
            return `${this.book.id}title`;
        },
        firstAuthor : function(){
            if(!this.book.authors) return '';
            return this.book.authors.length >= 1 ? this.book.authors[0] : '';
        },
        parsedDatePub: function(){
            if(!this.book.datePub) return '';
            let matches = this.book.datePub.match(/\d{4}/);
            return (matches && matches.length >= 1) ? matches[0] : '';
        }
    },
    methods:{
        loadCover: function(component){
            let self = this;
            let isbn = this.book.isbn;
            if(isbn){
                requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/covers/isbn/${isbn}-100.jpg`)
                    .then(function(body){
                        self.imgAvailable = true;
                        self.imgSrc = './covers/isbn/'+isbn+'-100.jpg';
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
        },
        initiateShowBookDetail : function () {
            this.moved = false;
        },
        invalidateShowBookDetail : function(){
            if(!this.moved){
                this.moved = true;
            }
        },
        showBookDetail : function(){
            if(!this.moved){
                eventBus.$emit('show-book-detail', this.book);
            }
        }
    }
}

var InnerThemeMap = Vue.extend({
    template : `<div id="inner-theme-map">
                    <book-element
                            v-for="book in books"
                            v-bind:key="book.id"
                            v-bind:book="book">
                    </book-element>
                </div>`,
    data : function () {
        return {
            books : [],
            theme : ''
        }
    },
    watch: {
        '$route' (to, from) {
            if(to.path.match(/^\/inner-theme-map/)){
                this.populateMapFromTheme(to.params.theme_id);
            } else if(to.path.match(/^\/search-map/)) {
                this.populateMapFromQuery(to.params.query);
            }
        }
    },
    mounted : function(component){
        let self = this;
        this.theme = this.$route.params.theme_id || '';
        eventBus.$on('show-book-detail',(book)=>{self.$emit('show-book-detail', book)})
        if(this.$route.path.match(/^\/inner-theme-map/)){
            this.populateMapFromTheme(this.theme);
        } else if(this.$route.path.match(/^\/search-map/)) {
            this.populateMapFromQuery(this.$route.params.query);
        }
        mouseDragScroll.enableDragScroll();
        this.zoomHandler = new ZoomHandler(document.getElementById('inner-theme-map'));
        this.zoomHandler.setZoomHandlers(()=>{},()=>{self.$router.push(`/theme-map/${self.theme}`)});
    },
    beforeDestroy : function(){
        mouseDragScroll.disableDragScroll();
        this.zoomHandler.removeZoomHandlers();
    },
    components : {
        'book-element' : BookElement
    },
    methods : {
        populateMapFromTheme : function(theme){
            let self = this;
            //Remove currently charged books
            this.books.splice(0, this.books.length);
            requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes/${theme}/books`)
                .then(function(retrievedBooks){
                    let parsedBooks = JSON.parse(retrievedBooks);
                    let larg = Math.trunc((Math.sqrt(parsedBooks.length)+1));
                    let haut = Math.trunc(parsedBooks.length/larg)+1;
                    self.$emit('current-theme-changed',theme);

                    gridDispatcher.dispatch(parsedBooks,larg, bookcellWidth, bookcellHeight);
                    parsedBooks.forEach(function(book){
                        self.books.push(book);
                    });
                });
        },
        populateMapFromQuery : function(query){
            let self = this;
            //Remove currently charged books
            this.books.splice(0, this.books.length);

            let queryOptions = {
                method: 'POST',
                uri: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/search/`,
                body: {
                    query: query
                },
                json: true
            };
    
            requestp(queryOptions)
                .then(function(retrievedBooks){
                    let parsedBooks = [];
                    for(let result of retrievedBooks){
                        parsedBooks.push(result.document);
                    }
                    let larg = Math.trunc((Math.sqrt(parsedBooks.length)+1));
                    let haut = Math.trunc(parsedBooks.length/larg)+1;

                    gridDispatcher.dispatch(parsedBooks,larg, bookcellWidth, bookcellHeight);
                    parsedBooks.forEach(function(book){
                        self.books.push(book);
                    });
                });
        }
    }
});

module.exports = InnerThemeMap;
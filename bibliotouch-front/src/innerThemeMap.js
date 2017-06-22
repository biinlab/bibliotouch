var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var gridDispatcher = require('./helpers/fixedGridDispatcher');
var requestp = require('request-promise-native');
var mouseDragScroll = require('./helpers/mouseDragScroll');
var ZoomHandler = require('./helpers/pinchToZoomHandler');
require('./components/searchBox');

var eventBus = new Vue();

var bookcellHeight = 168+60,
    bookcellWidth = 184+60,
    bookcoverHeight = 168,
    bookcoverWidth = 100;

var imgTopMargin = 60;
var imgLeftMargin = 60;

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
    overflow : 'hidden',
    objectFit : 'cover',
    backgroundColor : 'lightgrey'
}

var generatedBookCoverTitleStyleObject = {
    position : 'absolute',
    left : `${imgLeftMargin}px`,
    top : `${imgTopMargin}px`,
    margin : '7px',
    width : `${bookcoverWidth-14}px`,
    height : `${bookcoverHeight-14}px`,
    overflow : 'hidden',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '10px',
    color: '#000000'
}

var BookElement = {
    template : `<!--<lazy-component @show="setOnScreen">-->
                    <div v-bind:style="{
                        position : 'absolute',
                        left : book.dispatch.x + 'px',
                        top : book.dispatch.y + 'px',
                        width : '${bookcellWidth}px',
                        height : '${bookcellHeight}px'}"
                        v-on:click="showBookDetail">
                        <img    v-if="!imgAvailable"
                                v-bind:style="bookCoverStyleObject"
                                v-bind:src="generatedCoverSrc">
                                <p  v-if="!imgAvailable"
                                    v-bind:style="generatedBookCoverTitleStyleObject">
                                    {{book.title}}
                                </p>
                        </img>
                        <lazy-component v-if="book.hasCover"
                                        @show="loadCover">
                                        
                            <transition name="fade">
                                <img    v-if="imgAvailable"
                                        v-bind:style="bookCoverStyleObject"
                                        v-bind:src="imgSrc">
                                </img>
                            </transition>
                        </lazy-component>
                        <div    class="cartouche-box">
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
            bookCoverStyleObject : bookCoverStyleObject,
            generatedBookCoverTitleStyleObject : generatedBookCoverTitleStyleObject,
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
                        self.imgSrc = './covers/isbn/'+isbn+'.jpg';
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
        showBookDetail : function(){
            eventBus.$emit('show-book-detail', this.book);
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
            books : []
        }
    },
    watch: {
        '$route' (to, from) {
            //console.log(to);
            this.populateMap(to.params.theme_id);
        }
    },
    mounted : function(component){
        let self = this;
        eventBus.$on('show-book-detail',(book)=>{self.$emit('show-book-detail', book)})
        this.populateMap(this.$route.params.theme_id);
        mouseDragScroll.enableDragScroll();
        this.zoomHandler = new ZoomHandler(document.getElementById('inner-theme-map'));
        this.zoomHandler.setZoomHandlers(()=>{},()=>{self.$router.push(`/theme-map/${self.$route.params.theme_id}`)});
    },
    beforeDestroy : function(){
        mouseDragScroll.disableDragScroll();
        this.zoomHandler.removeZoomHandlers();
    },
    components : {
        'book-element' : BookElement
    },
    methods : {
        populateMap : function(theme){
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
        }
    }
});

module.exports = InnerThemeMap;
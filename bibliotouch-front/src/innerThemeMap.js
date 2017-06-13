var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var gridDispatcher = require('./helpers/fixedGridDispatcher');
var requestp = require('request-promise-native');
require('./components/searchBox');


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

var BookElement = {
    template : `<div v-bind:style="{
                        position : 'absolute',
                        left : book.dispatch.x + 'px',
                        top : book.dispatch.y + 'px',
                        width : ${bookcellWidth} + 'px',
                        height : ${bookcellHeight} + 'px',}"
                        @show="setOnScreen">
                    <img    v-if="!imgAvailable"
                            v-bind:style="{
                                    position : 'absolute',
                                    width : ${bookcoverWidth} + 'px',
                                    height : ${bookcoverHeight} + 'px',
                                    left : ${imgTopMargin}+'px',
                                    top : ${imgLeftMargin}+'px',
                                    boxShadow: '0 0 10px 0 rgba(0,0,0,0.12)',
                                    userDrag : 'none',
                                    userSelect : 'none',
                                    overflow : 'hidden',
                                    objectFit : 'cover',
                                    backgroundColor : 'lightgrey'}"
                            v-bind:src="generatedCoverSrc">
                            <p  v-if="!imgAvailable"
                                v-bind:style="{
                                    position : 'absolute',
                                    left : ${imgLeftMargin}+'px',
                                    top : ${imgTopMargin}+'px',
                                    margin : '7px',
                                    width : ${bookcoverWidth-14}+'px',
                                    height : ${bookcoverHeight-14}+'px',
                                    overflow : 'hidden',
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '10px',
                                    color: '#000000'
                                    }">
                                {{book.title}}
                            </p>
                    </img>
                    <lazy-component v-if="book.hasCover"
                                    @show="loadCover">
                                    
                        <transition name="fade">
                            <img    v-if="imgAvailable"
                                    v-bind:style="{
                                        position : 'absolute',
                                        width : ${bookcoverWidth} + 'px',
                                        height : ${bookcoverHeight} + 'px',
                                        left : ${imgTopMargin}+'px',
                                        top : ${imgLeftMargin}+'px',
                                        boxShadow: '0 0 10px 0 rgba(0,0,0,0.12)',
                                        userDrag : 'none',
                                        userSelect : 'none',
                                        overflow : 'hidden',
                                        objectFit : 'cover',
                                        backgroundColor : 'lightgrey'}"
                                    v-bind:src="imgSrc">
                            </img>
                        </transition>
                    </lazy-component>
                    <div    v-bind:style="{
                                        top : '100px',
                                        left : '116px',
                                        position : 'absolute',
                                        color : 'white',
                                        backgroundColor : 'black',
                                        width : '128px',
                                        height : '84px'
                                    }">
                        <p  v-bind:style="{
                                    fontFamily : 'Montserrat, sans-serif',
                                    fontWeight : '600',
                                    fontSize : '12px',
                                    color : 'white',
                                    letterSpacing : '0',
                                    lineHeight : '15px',
                                    marginLeft : '7px',
                                    marginTop : '7px',
                                    marginRight : '9px',
                                    marginBottom : '0px',
                                    height : '30px',
                                    overflow : 'hidden'}"
                            v-bind:id="titleId"
                            class="block-with-text"
                                    >
                            {{book.title}}
                        </p>
                        <p  v-if="isOverflown"
                            v-bind:style="{
                                    fontFamily: 'Montserrat, sans-serif',
                                    margin : '0',
                                    marginLeft : '8px',
                                    lineHeight : '3px'
                                }">...</p>
                        <p  v-bind:style="{
                                    fontFamily : 'Montserrat, sans-serif',
                                    fontWeight : '400',
                                    fontSize : '8px',
                                    textTransform : 'uppercase',
                                    color : 'rgba(255,255,255,0.60)',
                                    marginLeft : '8px',
                                    marginTop : '10px',
                                    marginBottom : '0px',
                                    position : 'absolute',
                                    bottom : '21px',
                                    height : '10px',
                                    width : '112px',
                                    whiteSpace : 'nowrap',
                                    overflow : 'hidden',
                                    textOverflow : 'ellipsis'
                                }"
                            v-bind:id="authorsId"
                                >
                            {{firstAuthor}}
                        </p>
                        <p  v-bind:style="{
                                    fontFamily : 'Montserrat, sans-serif',
                                    fontWeight : '400',
                                    fontSize : '8px',
                                    color : 'rgba(255,255,255,0.60)',
                                    marginLeft : '8px',
                                    marginTop : '5px',
                                    marginBottom : '7px',
                                    bottom : '0px',
                                    position : 'absolute'
                                }">
                            {{parsedDatePub}}
                        </p>
                    </div>
                </div>`,
    props : ['book'],
    data : function(){
        return {
            onScreen : false,
            imgAvailable : false,
            imgSrc : '',
            isOverflown : false
        }
    },
    mounted : function(){
        let element = document.getElementById(this.titleId);
        this.isOverflown = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    },
    computed: {
        generatedCoverSrc : function(){
            let rnd = Math.trunc((Math.random()*5)+1);
            return `/res/covers/cover_generate_${rnd}.png`;
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
                requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/covers/isbn/${isbn}.jpg`)
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
        }
    }
}

var InnerThemeMap = Vue.extend({
    template : `<div>
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
    created : function(component){
        let self = this;
        requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes/${this.$route.params.theme_id}/books`)
            .then(function(retrievedBooks){
                let parsedBooks = JSON.parse(retrievedBooks);
                let larg = Math.trunc((Math.sqrt(parsedBooks.length)+1));
                let haut = Math.trunc(parsedBooks.length/larg)+1;

                gridDispatcher.dispatch(parsedBooks,larg, bookcellWidth, bookcellHeight);
                parsedBooks.forEach(function(book){
                    self.books.push(book);
                });
            });
    },
    components : {
        'book-element' : BookElement
    }
});

module.exports = InnerThemeMap;
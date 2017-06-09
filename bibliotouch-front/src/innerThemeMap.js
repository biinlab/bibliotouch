var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var gridDispatcher = require('./helpers/fixedGridDispatcher');
var requestp = require('request-promise-native');


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
                    <!--<transition name="fade">-->
                        <div    v-if="!imgAvailable"
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
                                        backgroundColor : getRndColor()}">
                                <p  v-bind:style="{
                                            fontSize : '8px',
                                            margin : '5px'}">
                                    {{book.title}}
                                </p>
                        </div>
                    <!--</transition>-->
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
                                        backgroundColor : 'lightgrey'}"
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
            imgSrc : ''
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
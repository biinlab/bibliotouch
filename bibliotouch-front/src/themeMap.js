var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var PackerGrowing = require('./helpers/packerGrowing');
var gridDispatcher = require('./helpers/fixedGridDispatcher');

var bookcellHeight = 140,
    bookcellWidth = 116,
    bookcoverHeight = 80,
    bookcoverWidth = 56;

var imgTopMargin = (bookcellHeight-bookcoverHeight)/2;
var imgLeftMargin = (bookcellWidth-bookcoverWidth)/2;

var mousemove, mousedown, mouseup;

Vue.use(VueLazyLoad, {
    preLoad : 3,
    lazyComponent : true
});

var enableDragScroll = function(){
    var curYPos, curXPos, curDown;

    mousemove = function(e){ 
        if(curDown){
            window.scrollTo(scrollX - e.movementX, scrollY - e.movementY);
        }
    };

    mousedown = function(e){ 
        curYPos = e.pageY; 
        curXPos = e.pageX; 
        curDown = true; 
    };

    mouseup =  function(e){ 
        curDown = false; 
    };

    window.addEventListener('mousemove', mousemove);

    window.addEventListener('mousedown', mousedown);

    window.addEventListener('mouseup', mouseup);
};

var disableDragScroll = function(){
    window.removeEventListener('mousemove', mousemove);
    window.removeEventListener('mousedown', mousedown);
    window.removeEventListener('mouseup', mouseup);
}

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
    template : `<div>
                    <theme-wrapper  v-for="theme in cthemes" 
                                    v-bind:key="theme.id"
                                    v-bind:theme="theme">
                    </theme-wrapper>
                    <transition name="fade">
                        <div   v-bind:style="{
                                        position : 'fixed',
                                        left : '33%',
                                        top : '33%',
                                        fontFamily : 'Montserrat',
                                        color: '#000000',
                                        zIndex : '-5',         
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
                    </transition>
                </div>`,
    data : function(){
        return {
            cthemes : [],
            error : null,
            loading : false,
            currentTheme : '',
            nbBooks : 0,
            bookcellHeight : bookcellHeight,
            bookcellWidth : bookcellWidth
        }
    },
    created: function(){
        let self = this;
        this.retrieveThemeMapJson()
            .then(function(res){
                    let themes = JSON.parse(res);
                    self.loading = false;

                    let sortedThemes = self.sortThemes(themes);
                    let packedThemes = self.pack(sortedThemes);
                    packedThemes.forEach(function(element) {
                        self.cthemes.push(element);
                    });
                    enableDragScroll();
                    window.setInterval(function(){
                        let curX = window.scrollX+window.innerWidth/2, curY = window.scrollY+window.innerHeight/2;
                        self.cthemes.forEach(function(element){
                            if(curX >= element.fit.x && curX < (element.fit.x + element.w) && curY >= element.fit.y && curY < (element.fit.y + element.h)){
                                if(self.currentTheme != element.name){
                                    self.currentTheme = element.name;
                                    self.nbBooks = element.nbBooks;
                                }
                            }
                        });
                    }, 200);
                    
                },function(err){
                    self.error = err;
                    self.loading = false;
                    console.error(err);
                })
    },
    beforeDestroy: function(){
        disableDragScroll();
    },
    methods: {
        retrieveThemeMapJson : function(){
            this.loading = true;
            return requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/themes`);
        },
        sortThemes : function(themes){
            if(!themes){
                return;
            }
            let sortedThemes = [];

            for (var key in themes){
                let larg = Math.trunc((Math.sqrt(themes[key].nbBooks)+1)*1.2);
                let haut = Math.trunc(themes[key].nbBooks/larg)+1;
                if(larg && haut){
                    themes[key].w = larg*this.bookcellWidth;
                    themes[key].h = haut*this.bookcellHeight;
                    themes[key].id = key;
                    sortedThemes.push(themes[key]);
                } else {
                    console.error(themes[key]);
                }
            }
            sortedThemes.sort(function(a, b) {
                return b.h - a.h;
            });
            return sortedThemes;
        },
        pack : function(sortedThemes){
            let getBiggestSizePack = function(roots){
                let biggestW = -1;
                let biggestH = -1;
                for(let i = 0 ; i<roots.length ; i++){
                    if(roots[i].w > biggestW){
                        biggestW = roots[i].w;
                    }
                    if(roots[i].h > biggestH){
                        biggestH = roots[i].h;
                    }
                }
                return {w : biggestW, h : biggestH};
            }

            if(sortedThemes.length == 0){
                return;
            }

            let multi = [];
            multi[0] = [];  //upleft
            multi[1] = [];  //upright
            multi[2] = [];  //downleft
            multi[3] = [];  //downright

            let i = 0;
            sortedThemes.forEach(function(theme){
                multi[i%4].push(theme);
                i++;
            }, this)

            let packer = new PackerGrowing();
            let roots = [];
            for(i = 0 ; i<multi.length ; i++){
                packer.fit(multi[i]);
                roots.push({w : packer.root.w, h : packer.root.h});
            }

            let maxSizes = getBiggestSizePack(roots);

            //Upleft
            multi[0].forEach(function(theme){
                theme.fit.x = maxSizes.w - theme.w - theme.fit.x;
                theme.fit.y = maxSizes.h - theme.h - theme.fit.y;
            });

            //Upright
            multi[1].forEach(function(theme){
                theme.fit.x = theme.fit.x + maxSizes.w;
                theme.fit.y = maxSizes.h - theme.h - theme.fit.y;
            });

            //DownLeft
            multi[2].forEach(function(theme){
                theme.fit.x = maxSizes.w - theme.w - theme.fit.x;
                theme.fit.y = theme.fit.y + maxSizes.h;
            });

            //Downright
            multi[3].forEach(function(theme){
                theme.fit.x = theme.fit.x + maxSizes.w;
                theme.fit.y = theme.fit.y + maxSizes.h;
            });

            let packedThemes = [];
            for(i = 0 ; i < multi.length ; i++){
                Array.prototype.push.apply(packedThemes, multi[i]);
            }

            return packedThemes;
        }
    },
    components : {
        'theme-wrapper' : ThemeWrapper
    }
});

module.exports = ThemeMap;
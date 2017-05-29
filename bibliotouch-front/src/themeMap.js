var Vue = require('vue');
var VueLazyLoad = require('vue-lazyload');
var requestp = require('request-promise-native');
var PackerGrowing = require('./helpers/packerGrowing');

Vue.use(VueLazyLoad, {
    preLoad : 2,
    lazyComponent : true
});

var BookElement = {
    template : `<div>
                    <img></img>
                    <p>{{book.title}}</p>
                </div>`,
    props : ['book']
}

var ThemeWrapper = {
    template : `<lazy-component 
                            @show="loadBooks"
                            v-bind:style="{
                            border : '1px solid black',
                            position : 'absolute',
                            left : theme.fit.x + 'px',
                            top : theme.fit.y + 'px',
                            width : theme.w + 'px',
                            height : theme.h + 'px'}">
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
                    JSON.parse(retrievedBooks).forEach(function(book){
                        self.books.push(book);
                    })
                });
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
                </div>`,
    data : function(){
        return {
            cthemes : [],
            error : null,
            loading : false,
            bookcellHeight : 96,
            bookcellWidth : 72
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
                    
                },function(err){
                    self.error = err;
                    self.loading = false;
                    console.error(err);
                })
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
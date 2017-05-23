var Vue = require('vue');
var requestp = require('request-promise-native');
var PackerGrowing = require('./packerGrowing');


Vue.component('theme-wrapper', {
    template : `<div v-bind:style="{
                        border : '1px solid black',
                        position : 'absolute',
                        left : theme.fit.x + 'px',
                        top : theme.fit.y + 'px',
                        width : theme.w + 'px',
                        height : theme.h + 'px'}">
    
                </div>`,
    props : ['theme']
});

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
                    self.pack(sortedThemes);
                    sortedThemes.forEach(function(element) {
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
            if(sortedThemes.length == 0){
                return;
            }

            let packer = new PackerGrowing();
            packer.fit(sortedThemes);
        }
    }
});

module.exports = ThemeMap;
var Vue = require('vue');
var requestp = require('request-promise-native');

var SuggestionLine = {
    template: ` <tr>
                    <td class="suggestion-name">{{suggestion[0]}}</td>
                    <td class="suggestion-count">{{suggestion[1]}}</td>
                </tr>`,
    props:['suggestion']
}

var SearchQueryBuilder = Vue.component('search-query-builder', {
    template: ` <div id="blurred-background">
                    <div id="search-elements-wrapper">
                        <img src="./res/picto_search_white.png"/>
                        <span>Je cherche</span>
                        <div class="search-term">
                            <img src="./res/cross.png"/>
                            <span>imprimerie</span>
                        </div>
                        <div id="add-term-button">
                            <img src="./res/icon_plus.png" />
                        </div>
                        <div id="search-term-input-wrapper">
                            <div id="search-term-input">
                                <input size="9" v-model="currentlyWritingTerm"/>
                            </div>
                            <div id="suggestion-wrapper">
                                <div class="suggestion-categ">
                                    <p class="suggestion-categ-title">Sujets</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in subjectSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion">
                                        </suggestion-line>
                                    </table>
                                </div>
                                <div class="suggestion-categ">
                                    <p class="suggestion-categ-title">Auteurs</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in authorSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion">
                                        </suggestion-line>
                                    </table>
                                </div>
                                <div class="suggestion-categ">
                                    <p class="suggestion-categ-title">Titre</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in titleSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion">
                                        </suggestion-line>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div id="search-start-button"
                                v-on:click="launchSearch()">
                            <p>C'est parti</p>
                            <img src="./res/picto_search_white.png"/>
                        </div>
                    </div>
                </div>`,
    data : function(){
        return {
            terms: [],
            currentlyWritingTerm: '',
            subjectSuggestions: [],
            authorSuggestions: [],
            titleSuggestions: []
        }
    },
    watch:{
        currentlyWritingTerm : function(newTerm){
            let self = this;
            let subjectOptions = {
                method: 'POST',
                uri: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/autocomplete/`,
                body: {
                    query : {
                        field: 'mainAuthorities',
                        text: newTerm
                    }
                },
                json: true
            };

            let authorOptions = {
                method: 'POST',
                uri: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/autocomplete/`,
                body: {
                    query: {
                        field: 'authors',
                        text: newTerm
                    }
                },
                json: true
            };

            let titleOptions = {
                method: 'POST',
                uri: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/autocomplete/`,
                body: {
                    query: {
                        field: 'title',
                        text: newTerm
                    }
                },
                json: true
            };
    
            requestp(subjectOptions)
                .then(function(suggestions){
                    self.subjectSuggestions = suggestions;
                });
            requestp(authorOptions)
                .then(function(suggestions){
                    self.authorSuggestions = suggestions;
                });
            requestp(titleOptions)
                .then(function(suggestions){
                    self.titleSuggestions = suggestions;
                });
        }
    },
    components : {
        'suggestion-line' : SuggestionLine
    },
    methods : {
        launchSearch:function(){
            this.$emit('hide-search-query-builder');
            this.$route.push('/inner-theme-map/');
        }
    }
})
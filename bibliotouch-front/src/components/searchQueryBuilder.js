var Vue = require('vue');
var requestp = require('request-promise-native');

var BooleanOperator = Object.freeze({
    AND: 1,
    OR: 2,
    NOT: 3
})

var defaultBooleanOperator = BooleanOperator.AND;

var SuggestionLine = {
    template: ` <tr v-on:click="$emit('add-search-term', {field:field,text:suggestion[0]})">
                    <td class="suggestion-name">{{suggestion[0]}}</td>
                    <td class="suggestion-count">{{suggestion[1]}}</td>
                </tr>`,
    props:['suggestion', 'field']
}

var SearchTermItem = {
    template: `<div class="search-term-wrapper">
                    <span class="search-term-boolean-operator" v-if="index!=0"> {{booleanOperator}} </span>
                    <span class="search-term-field-desc">{{fieldDesc}}</span>
                    <div class="search-term">
                        <img src="./res/cross.png"/>
                        <span>{{term.text}}</span>
                    </div>
                </div>`,
    props:['term','index'],
    computed : {
        booleanOperator : function(){
            switch(this.term.operator){
                case BooleanOperator.AND:
                    return 'et';
                case BooleanOperator.OR:
                    return 'ou';
                case BooleanOperator.NOT:
                    return 'sauf';
            }
        },
        fieldDesc : function(){
            if(this.term.field == 'subject') {
                return 'sur le sujet';
            }
            if(this.term.field == 'author') {
                return 'ayant pour auteur';
            }
            if(this.term.field == 'title') {
                return this.term.booleanOperator == BooleanOperator.NOT ? 'si il a dans le titre' : 'avec dans le titre';
            }

            return 'à propos de'
        }
    }
}

var SearchQueryBuilder = Vue.component('search-query-builder', {
    template: ` <div id="blurred-background">
                    <div id="search-elements-wrapper">
                        <img src="./res/picto_search_white.png"/>
                        <span>Je cherche un document</span>
                        <search-term-item   v-for="(term, index) in terms"
                                            v-bind:term="term"
                                            v-bind:index="index"
                                            v-bind:key="index">
                        </search-term-item>
                        <div    id="add-term-button"
                                v-if="!showSearchTermInput"
                                v-on:click="showSearchTermInput = true">
                            <img src="./res/icon_plus.png" />
                        </div>
                        <div    id="search-term-input-wrapper"
                                v-if="showSearchTermInput">
                            <div id="search-term-input">
                                <input  size="9" 
                                        v-model="currentlyWritingTerm"
                                        v-on:keyup.enter="addSearchTerm"/>
                            </div>
                            <div    id="suggestion-wrapper"
                                    v-if="subjectSuggestions.length > 0 || authorSuggestions.length > 0 || titleSuggestions.length > 0">
                                <div    class="suggestion-categ"
                                        v-if="subjectSuggestions.length > 0">
                                    <p class="suggestion-categ-title">Sujets</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in subjectSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion"
                                                            v-bind:field="'subject'"
                                                            v-on:add-search-term="addSearchTerm">
                                        </suggestion-line>
                                    </table>
                                </div>
                                <div    class="suggestion-categ"
                                        v-if="authorSuggestions.length > 0">
                                    <p class="suggestion-categ-title">Auteurs</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in authorSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion"
                                                            v-bind:field="'author'"
                                                            v-on:add-search-term="addSearchTerm">
                                        </suggestion-line>
                                    </table>
                                </div>
                                <div    class="suggestion-categ"
                                        v-if="titleSuggestions.length > 0">
                                    <p class="suggestion-categ-title">Titre</p>
                                    <span class="suggestion-categ-voirtout">voir tout</span>
                                    <hr/>
                                    <table>
                                        <suggestion-line    v-for="suggestion in titleSuggestions"
                                                            v-bind:key="suggestion[0]"
                                                            v-bind:suggestion="suggestion"
                                                            v-bind:field="'title'"
                                                            v-on:add-search-term="addSearchTerm">
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
            titleSuggestions: [],
            showSearchTermInput:true
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
        'suggestion-line' : SuggestionLine,
        'search-term-item' : SearchTermItem
    },
    methods : {
        launchSearch:function(){
            this.$emit('hide-search-query-builder');
            this.$route.push('/inner-theme-map/');
        },
        addSearchTerm : function(term){
            if(term.field && term.text){
                term.operator = defaultBooleanOperator
                this.terms.push(term);
            } else {
                let freeWordsArray = this.currentlyWritingTerm.split(' ');
                for(let freeWord of freeWordsArray){
                    this.terms.push({field:'*',text:freeWord, operator: defaultBooleanOperator});
                }
            }
            this.showSearchTermInput = false;
            this.currentlyWritingTerm = '';
        }
    }
})
var Vue = require('vue');
var requestp = require('request-promise-native');
var stopword = require('stopword');
var queryBuilder = require('../helpers/queryBuilder');


var defaultBooleanOperator = queryBuilder.BooleanOperator.AND;

var SuggestionLine = {
    template: ` <tr v-on:click="$emit('add-search-term', {field:field,text:suggestion[0]})">
                    <td class="suggestion-name">{{suggestion[0]}}</td>
                    <td class="suggestion-count">{{suggestion[1]}}</td>
                </tr>`,
    props:['suggestion', 'field']
}

var BooleanOperator = {
    template : `<span class="search-term-boolean-operator" v-if="index!=0">
                    <div class="up-down-arrow up-arrow" v-on:click="nextBooleanOp()"><img src="./res/arrow.png"></div>
                            {{treatedBooleanOperator}}
                    <div class="up-down-arrow down-arrow" v-on:click="precBooleanOp()"><img src="./res/arrow.png"></div>
                </span>`,
    props: ['booleanOperator', 'index'],
    computed : {
        treatedBooleanOperator : function(){
            switch(this.booleanOperator){
                case queryBuilder.BooleanOperator.AND:
                    return 'et';
                case queryBuilder.BooleanOperator.OR:
                    return 'ou';
                case queryBuilder.BooleanOperator.NOT:
                    return 'sauf';
            }
        }
    },
    methods: {
        nextBooleanOp : function(){
            let operator = (this.booleanOperator+1)%3;
            this.$emit('operator-changed', operator);
        },
        precBooleanOp : function(){
            let operator = this.booleanOperator == 0 ? 2 : this.booleanOperator-1;
            this.$emit('operator-changed', operator);
        }
    }
}

var SearchTermItem = {
    template: `<div class="search-term-wrapper">
                    <boolean-operator v-bind:booleanOperator="term.operator"
                                        v-bind:index="index"
                                        v-on:operator-changed="newOp => { term.operator = newOp; $emit('search-term-changed'); }">
                    </boolean-operator>
                    <span class="search-term-field-desc">{{fieldDesc}}</span>
                    <div class="search-term"
                            v-bind:style="{
                                backgroundColor : randomColor
                            }">
                        <img src="./res/cross.png"
                                v-on:click="$emit('delete-search-item',index)">
                        <span>{{term.text}}</span>
                    </div>
                </div>`,
    props:['term','index'],
    components:{
        'boolean-operator' : BooleanOperator
    },
    computed : {
        fieldDesc : function(){
            if(this.term.field == 'mainAuthorities') {
                return 'sur le sujet';
            }
            if(this.term.field == 'authors') {
                return 'ayant pour auteur';
            }
            if(this.term.field == 'title') {
                return this.term.booleanOperator == queryBuilder.BooleanOperator.NOT ? 'si il a dans le titre' : 'avec dans le titre';
            }

            return 'à propos de';
        },
        randomColor : function(){
            //Returns a random integer between min (inclusive) and max (inclusive)
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            let colors = ['#FF3043','#FF4701','#FF8B01','#FFCE01','#FFCA3B','#E4FA5C','#00E86E','#5CFF83','#9EFFCC','#00D8BE','#1BC6EB','#3E73DC','#422DA8'];
            return colors[getRandomInt(0,colors.length-1)];
        }
    }
}

var SearchQueryBuilder = Vue.component('search-query-builder', {
    template: ` <div id="blurred-background">
                    <div id="search-elements-wrapper">
                        <img src="./res/picto_search_white.png"/>
                        <span>Je cherche <span v-if="terms.length > 0">un document</span></span>
                        <search-term-item   v-for="(term, index) in terms"
                                            v-bind:term="term"
                                            v-bind:index="index"
                                            v-bind:key="index"
                                            v-on:delete-search-item="deleteSearchItem"
                                            v-on:search-term-changed="getQueryHits()">
                        </search-term-item>
                        <div class="search-term-wrapper">
                            <boolean-operator v-bind:index="terms.length"
                                                v-bind:booleanOperator="defaultBooleanOperator"
                                                v-on:operator-changed="newOp => { defaultBooleanOperator = newOp }">
                            </boolean-operator>
                        </div>
                        <div    id="search-term-input-wrapper">
                            <div id="search-term-input">
                                <input  size="9" 
                                        v-model="currentlyWritingTerm"
                                        v-on:keyup.enter="addSearchTerm"
                                        v-focus/>
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
                                                            v-bind:field="'mainAuthorities'"
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
                                                            v-bind:field="'authors'"
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
                    </div>
                    <div id="search-start-button"
                            v-on:click="launchSearch()"
                            v-if="subjectSuggestions.length == 0 && authorSuggestions.length == 0 && titleSuggestions.length == 0">
                        <p>{{totalHits}}</p>
                        <div id="upper-hits-wrapper">
                            <img src="./res/books.png">
                            <p>Résultats</p>
                            <hr>
                        </div>
                    </div>
                    <div   id="close-search-button"
                            v-if="subjectSuggestions.length == 0 && authorSuggestions.length == 0 && titleSuggestions.length == 0"
                            v-on:click="$emit('hide-search-query-builder')">
                            <img src="/res/cross.png"/>
                    </div>
                </div>`,
    data : function(){
        return {
            terms: [],
            currentlyWritingTerm: '',
            subjectSuggestions: [],
            authorSuggestions: [],
            titleSuggestions: [],
            totalHits:0,
            autofocus:true,
            defaultBooleanOperator: queryBuilder.BooleanOperator.AND
        }
    },
    directives : {
        focus : {
            inserted: function (el) {
                el.focus();
            }
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
        'search-term-item' : SearchTermItem,
        'boolean-operator' : BooleanOperator
    },
    methods : {
        deleteSearchItem : function(index){
            this.terms.splice(index,1);
            this.getQueryHits();
        },
        getQueryHits : function(){
            let self = this;
            let queryOptions = {
                method: 'POST',
                uri: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/total-hits/`,
                body: {
                    query : self.getQuery()
                },
                json: true
            };
            requestp(queryOptions)
                .then(function(totalHits){
                    self.totalHits = totalHits.totalHits;
                });
        },
        launchSearch:function(){
            this.$emit('hide-search-query-builder');
            this.$router.push(`/search-map/${encodeURIComponent(JSON.stringify(this.getQuery()))}`);
        },
        addSearchTerm : function(term){
            if(term.field && term.text){
                term.operator = this.defaultBooleanOperator
                this.terms.push(term);
            } else {
                let freeWordsArray = stopword.removeStopwords(this.currentlyWritingTerm.split(/[ -']/), stopword.fr);
                for(let freeWord of freeWordsArray){
                    this.terms.push({field:'*',text:freeWord, operator: this.defaultBooleanOperator});
                }
            }
            this.getQueryHits();
            this.currentlyWritingTerm = '';
        },
        getQuery : function(){
            return queryBuilder.buildQuery(this.terms);
        }
    }
})
var Vue = require('vue');
var requestp = require('request-promise-native');
var queryBuilder = require('../helpers/queryBuilder');
var stopword = require('stopword');
var favStore = require('../helpers/favStore');

/**
 * Enum for book availability status, values correspond to displayed text
 * @readonly
 * @enum {string}
 */
var Availability = Object.freeze({
    UNAVAILABLE : 'indisponible',
    UNKNOWN : 'disponibilité inconnue',
    AVAILABLE : 'disponible'
});

/**
 *  Book Detail modal displaying information about the book the user selected
 */
var BookDetail = Vue.component('book-detail', {
    template : `<div    id="blurrer"
                        class="modal"
                        v-on:click.self="$emit('close-book-modal')">
                    <div id="scroll-hide-wrapper"
                            v-on:scroll.once>
                        <div id="book-modal-wrapper">
                            <div id="scroll-hide">
                                <div id="cover-title-wrapper">
                                    <img v-bind:src="imgSrc" id="cover-image"/>
                                    <div id="title-wrapper">
                                        <p>{{book.title}}</p>
                                    </div>
                                </div>
                                <div id="disponibility-wrapper">
                                    <p id="disponibility-text"
                                        v-bind:style="{
                                            color: availabilityColor()    
                                        }">
                                        {{available}}
                                    </p>
                                    <p id="disponibility-cote">côte <span>{{callNumber}}</span></p>
                                </div>
                                <div id="fav-wrapper">
                                    <div id="fav-element"
                                            v-on:click="toogleFav">
                                        <img src="./res/unfavorites.png" v-if="isFav">
                                        <img src="./res/favorites.png" v-if="!isFav">
                                    </div>
                                    <p>Je le garde !</p>
                                </div>
                                <div id="info-wrapper">
                                    <div id="authors-wrapper">
                                        <span v-for="author in book.authors" v-on:click="searchField(author, 'authors')">{{author}}</span>
                                    </div>
                                    <div id="publication-wrapper">
                                        <p id="editor-name" v-on:click="searchField(book.editor, 'editor')">{{book.editor}}</p>
                                        <p id="collection-name" v-on:click="searchField(book.collection, 'collection')">{{book.collection}}</p>
                                        <p id="publication-date" v-on:click="searchField(parseDate(book.datePub), 'datePub')">{{book.datePub}}</p>
                                    </div>
                                    <div id="vedettes-wrapper">
                                        <div v-for="authority in book.mainAuthorities" v-on:click="searchField(authority, 'mainAuthorities')">{{authority}}</div>
                                    </div>
                                    <div id="book-description">
                                        {{book.description}}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <span   id="close-button"
                                v-on:click="$emit('close-book-modal')">
                                <img src="/res/cross.png"/>
                        </span>
                    </div>
                </div>
                    `,
    props: ['book'],
    data : function(){
        return {
            imgSrc: '',
            available: Availability.UNKNOWN,
            callNumber: 'inconnue',
            isFav: false
        }
    },
    created : function(){
            let rnd = Math.trunc((Math.random()*7)+1);
            this.imgSrc =  `/res/covers/cover_${rnd}.png`;
            this.getTrueCover();
            this.getAvailability();
            this.isFav = favStore.contains(this.book.id);
    },
    methods : {
        /*
        * Toggle the fav status of the book, adding or removing it from the FavStore
         */
        toogleFav : function () {
            if(this.isFav){
                favStore.removeBook(this.book.id);
                this.isFav = false;
            } else {
                favStore.addBook(this.book.id);
                this.isFav = true;
            }
        },
        /** 
         * Tries to get the book cover, if available the component is updated accordingly
        */
        getTrueCover : function () {
            let self = this;
            let isbn = this.book.isbn;
            if(isbn){
                requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/covers/isbn/${isbn}.jpg`)
                    .then(function(body){
                        self.imgSrc = './covers/isbn/'+isbn+'.jpg';
                    })
                    .catch(function(err){});
            }
        },
        /**
         * Tries to get the book availability, updates the component accordingly
         */
        getAvailability : function(){
            let self = this;
            let reqOptions = {
                url:`${window.location.protocol}//${window.location.hostname}:${window.location.port}/cors-bypass/availability/${this.book.id}`
            };

            requestp(reqOptions)
                .then(function(body){
                    let response = JSON.parse(body);
                    if(response.exemplaires && response.exemplaires.length > 0){
                        self.callNumber = response.exemplaires[0].itemcallnumber;
                        for(let exemplaire of response.exemplaires){
                            if(exemplaire.notforloan == '0' && !exemplaire.onloan) {
                                self.available = Availability.AVAILABLE;
                            }
                        }
                    }
                    if(self.available != Availability.AVAILABLE){
                        self.available = Availability.UNAVAILABLE;
                    }
                })
                .catch(function(err){console.error(err)});
        },
        /**
         * Returns a color code depending in the book availability status
         * @returns {string} a color code
         */
        availabilityColor : function(){
            if(this.available === Availability.AVAILABLE){
                return '#009A1A';
            }
            if(this.available === Availability.UNAVAILABLE){
                return 'red';
            }
            if(this.available === Availability.UNKNOWN){
                return 'grey';
            }
        },
        /**
         * Starts a search operation on a given field
         * @param {string} authority - The string from which we want to build the query
         * @param {string} field - The field on which we want to apply the query, must correspond to the name of one of the fields of the book object
         * @fires close-book-modal
         */
        searchField : function(authority, field) {
            let splitAuthority = authority.split(/[ \-']/g);
            splitAuthority = stopword.removeStopwords(splitAuthority, stopword.fr);
            let termsArray = [];
            for(let auth of splitAuthority){
                termsArray.push({
                    field : field,
                    text : auth,
                    operator : queryBuilder.BooleanOperator.AND
                });
            }
            let queryArray = queryBuilder.buildQuery(termsArray);
            this.$router.push(`/search-map/${encodeURIComponent(JSON.stringify(queryArray))}`);
            /**
             * @event close-book-modal - Close signal to hide the book modal
             */
            this.$emit('close-book-modal');
        },
        /**
         * Returns the first four digit string that looks like a year
         * @param {string} stinkyDate - The string in which we are looking for a date
         * @returns {string} - The first four digit string looking like a year, or a default date if nothing found 
         */
        parseDate : function(stinkyDate) {
            let defaultDate = '1993';//The world was sad, empty and meaningless before that year
            let matches =  stinkyDate.match(/\d{4}/);
            return matches.length > 0 ? matches[0] : defaultDate;
        }
    }
})
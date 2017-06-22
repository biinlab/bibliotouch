var Vue = require('vue');
var requestp = require('request-promise-native');

var BookDetail = Vue.component('book-detail', {
    template : `<div    id="blurrer"
                        class="modal"
                        v-on:click="$emit('close-book-modal')">
                    <div id="book-modal-wrapper">
                        <div id="cover-title-wrapper">
                        <img v-bind:src="imgSrc" id="cover-image"/>
                        <div id="title-wrapper">
                            <p>{{book.title}}</p>
                        </div>
                        </div>
                        <div id="disponibility-wrapper">
                            <p id="disponibility-text">disponible</p>
                            <p id="disponibility-cote">côte <span>15457521</span></p>
                        </div>
                        <div id="authors-wrapper">
                            <span v-for="author in book.authors">{{author}}</span>
                        </div>
                        <div id="publication-wrapper">
                            <p id="editor-name">{{book.editor}}</p>
                            <p id="collection-name">{{book.collection}}</p>
                            <p id="publication-date">{{book.datePub}}</p>
                        </div>
                        <div id="vedettes-wrapper">
                            <div v-for="authority in book.mainAuthorities">{{authority}}</div>
                        </div>
                        <div id="book-description">
                            {{book.description}}
                        </div>
                        <span   id="close-button"
                                v-on:click="close-book-modal">
                                <img src="/res/cross.png"/>
                        </span>
                    </div>
                    </div>
                    `,
    props: ['book'],
    data : function(){
        return {
            imgSrc: ''
        }
    },
    created : function(){
            let rnd = Math.trunc((Math.random()*7)+1);
            this.imgSrc =  `/res/covers/cover_${rnd}.png`;
            this.getTrueCover();
    },
    methods : {
        getTrueCover : function () {
            let self = this;
            let isbn = this.book.isbn;
            if(isbn){
                requestp(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/covers/isbn/${isbn}-100.jpg`)
                    .then(function(body){
                        self.imgSrc = './covers/isbn/'+isbn+'.jpg';
                    })
                    .catch(function(err){});
            }
        }
    }
})
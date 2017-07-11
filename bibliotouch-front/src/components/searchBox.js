var Vue = require('vue');

/**
* Floating central bar showing the SearchQueryBuilder when clicked
*/
Vue.component('search-box', {
    template : `<div id="search-box"
                        v-on:click="showSearchQueryBuilder()">
                    <img id="search-icon"
                        alt="research"
                        src="/res/research.png"></img>
                    <p id="search-input">Je cherche...</p>
                    <div id="others-reading-div"
                            v-on:click="showGiveMeAnIdea()">
                        Donnez moi une idée
                    </div>
                </div>`,
    methods: {
        /**
         * @fires show-search-query-builder
         */
        showSearchQueryBuilder : function(){
            /**
             * @event show-search-query-builder - Show search query builder screen event
             */
            this.$emit('show-search-query-builder');
        },
        showGiveMeAnIdea: function(){
            //alert('GIMME GIMME GIMME !')
        }
    }
})
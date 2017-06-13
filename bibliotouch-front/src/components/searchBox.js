var Vue = require('vue');

Vue.component('search-box', {
    template : `<div id="search-box">
                    <img id="search-icon"
                        alt="research"
                        src="/res/research.png"></img>
                    <input id="search-input"
                            autocomplete="false"
                            type="text"
                            placeholder="Je cherche..."
                            size="32"></input>
                    <div id="others-reading-div">
                        Que lisent les autres ?
                    </div>
                </div>`
})
var Vue = require('vue');

Vue.component('zoom-nav-box', {
    template : `<div id="zoom-nav-box">
                    <p id="zoom-nav-label">Vues</p>
                    <div class="pin pin-active" zoomName="Vue éloignée"></div>
                    <div class="pin" zoomName="Vue bibliothèque"></div>
                    <div class="pin" zoomName="Vue thème"></div>
                </div>`
});
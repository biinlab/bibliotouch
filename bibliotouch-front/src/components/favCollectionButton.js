var Vue = require('vue');

/**
 * Allows to diplay the favorites chosen by the user
 */
Vue.component('fav-collection-button', {
    template: `<div id="fav-collection-button">
                    <span></span>
                    <p id="active-theme-label">
                        Mes favoris
                    </p>
                </div>`,
    props: ['favStoreBooks']
})
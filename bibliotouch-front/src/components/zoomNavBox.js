var Vue = require('vue');

Vue.component('zoom-nav-box', {
    template : `<div id="zoom-nav-box">
                    <p id="zoom-nav-label">Vues</p>
                    <div    v-bind:class="{'pin-active':isFarZoom}"
                            class="pin"
                            zoomName="Vue éloignée"
                            v-on:click="$router.push('/outer-theme-map/'+currentTheme)">
                    </div>
                    <div    v-bind:class="{'pin-active':isMiddleZoom}"
                            class="pin"
                            zoomName="Vue bibliothèque"
                            v-on:click="$router.push('/theme-map/'+currentTheme)">
                    </div>
                    <div    v-bind:class="{'pin-active':isCloseZoom}"
                            class="pin"
                            zoomName="Vue thème"
                            v-on:click="$router.push('/inner-theme-map/'+currentTheme)">
                    </div>
                </div>`,
    data : function() {
        return {
            isFarZoom : false,
            isMiddleZoom : false,
            isCloseZoom : false
        }
    },
    props : ['currentTheme'],
    created : function() {
        this.setCurrentZoom(this.$route);
    },
    watch : {
        '$route' (to, from) {
            this.setCurrentZoom(to);
        }
    },
    methods : {
        setCurrentZoom(route){
            if(route.fullPath.match(/^\/outer-theme-map/)){
                this.isMiddleZoom = false;
                this.isCloseZoom = false;
                this.isFarZoom = true;
            } else if(route.fullPath.match(/^\/theme-map/)){
                this.isMiddleZoom = true;
                this.isCloseZoom = false;
                this.isFarZoom = false;
            } else if(route.fullPath.match(/^\/inner-theme-map/)){
                this.isMiddleZoom = false;
                this.isCloseZoom = true;
                this.isFarZoom = false;
            }
        }
    }
});
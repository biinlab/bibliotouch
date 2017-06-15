var Vue = require('vue');

Vue.component('active-theme-box', {
    template: `<div id="active-theme-box"
                    v-if="showActiveTheme">
                    <p id="active-theme-label">
                        {{currentTheme}}
                    </p>
                </div>`,
    data : function() {
        return {
            showActiveTheme : false,
            currentTheme : ''
        }
    },
    created : function(){
        if(this.$route.fullPath.match(/^\/inner-theme-map/)) {
            this.showActiveTheme = true;
            this.currentTheme = this.$route.params.theme_id;
        }
    },
    watch : {
        '$route' (to, from) {
            if(to.fullPath.match(/^\/inner-theme-map/)) {
                this.showActiveTheme = true;
                this.currentTheme = to.params.theme_id;
            } else {
                this.showActiveTheme = false;
                this.currentTheme = '';
            }
        }
    }
})
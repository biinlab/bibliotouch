var Vue = require('vue');
var VueRouter = require('vue-router');

Vue.use(VueRouter);

require('./components/searchBox');
require('./components/zoomNavBox');
require('./components/activeThemeBox');
require('./components/bookDetail');
require('./components/searchQueryBuilder');

var ThemeMap = require('./themeMap');
var InnerThemeMap = require('./innerThemeMap');
var OuterThemeMap = require('./outerThemeMap');

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// Vue.extend(), or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/', component: OuterThemeMap},
  { path: '/outer-theme-map', component: OuterThemeMap},
  { path: '/outer-theme-map/:theme_id', component: OuterThemeMap},
  { path: '/theme-map', component: ThemeMap },
  { path: '/theme-map/:theme_id', component: ThemeMap },
  { path: '/inner-theme-map/:theme_id', component: InnerThemeMap}
];

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes
})

// 4. Create and mount the root instance.
// Make sure to inject the router with the router option to make the
// whole app router-aware.
const app = new Vue({
  router,
  data : {
    currentTheme : '',
    bookToShow: {},
    showBookModal: false,
    showSearchQueryBuilderModal: false
  },
  methods : {
    blurrAppContent : function(){
      document.getElementById('app-content').classList.add('blurred');
    },
    unblurrAppContent : function(){
      document.getElementById('app-content').classList.remove('blurred');
    },
    updateCurrentTheme : function(newTheme){
      this.currentTheme = newTheme;
    },
    showBookDetail : function(bookToShow){
      this.currentBook = bookToShow;
      this.showBookModal = true;
      this.blurrAppContent();
    },
    closeBookModal : function(){
      this.showBookModal = false;
      this.unblurrAppContent();
    },
    showSearchQueryBuilder : function(){
      this.showSearchQueryBuilderModal = true;
      this.blurrAppContent();
    },
    hideSearchQueryBuilder : function(){
      this.showSearchQueryBuilderModal = false;
      this.unblurrAppContent();
    }
  }
}).$mount('#app')



window.addEventListener("touchstart", function (event){
    if(event.touches.length > 1){
        //the event is multi-touch
        event.preventDefault();
    }
});

window.addEventListener("touchmove", function (event){
    if(event.touches.length > 1){
        //the event is multi-touch
        event.preventDefault();
    }
});
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

//Routes
const routes = [
  { path: '/', component: OuterThemeMap},
  { path: '/outer-theme-map', component: OuterThemeMap},
  { path: '/outer-theme-map/:theme_id', component: OuterThemeMap},
  { path: '/theme-map', component: ThemeMap },
  { path: '/theme-map/:theme_id', component: ThemeMap },
  { path: '/inner-theme-map/:theme_id', component: InnerThemeMap},
  { path: '/search-map/:query', component: InnerThemeMap}
];

const router = new VueRouter({
  routes
})

/**
 * Main Vue of the app
 */
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


//If we detect multitouch we don't want to trigger simple touch everywhere
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
var Vue = require('vue');
var VueRouter = require('vue-router');

Vue.use(VueRouter);

require('./components/searchBox');
require('./components/zoomNavBox');
require('./components/activeThemeBox');

var ThemeMap = require('./themeMap');
var InnerThemeMap = require('./innerThemeMap');

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// Vue.extend(), or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/theme-map', component: ThemeMap },
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
  router
}).$mount('#app')

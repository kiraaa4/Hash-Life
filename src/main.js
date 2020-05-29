import Vue from 'vue'
import { VueHammer } from 'vue2-hammer'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

Vue.component('VueSlider', VueSlider)
Vue.use(VueHammer)
Vue.use(BootstrapVue)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

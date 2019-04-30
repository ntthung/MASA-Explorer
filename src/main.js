import Vue from 'vue'
import VueGG from 'vue-gg'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import App from './App.vue'

Vue.component('VueSlider', VueSlider)
Vue.use(VueGG)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

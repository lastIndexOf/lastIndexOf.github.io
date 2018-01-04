import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'
import router from './routes'

import './assets/reset.scss'

Vue.use(VueRouter)

new Vue({
  name: 'main',
  router,
  render: h => h(App)
}).$mount('#app')

router.push('/')

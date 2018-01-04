import VueRouter from 'vue-router'
import Index from './views/pages/Index/Index'
import Animation from './views/pages/Animation/Animation'

let routes = [
  {
    path: '/',
    component: Index
  },
  {
    path: '/animation',
    component: Animation
  }
]




const router = new VueRouter({ routes })

export default router

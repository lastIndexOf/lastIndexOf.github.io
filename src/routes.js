import VueRouter from 'vue-router'
import Index from './views/pages/Index/Index'
import Animation from './views/pages/Animation/Animation'
import AnimePage from './views/pages/Animation/_id?AnimaPage'

let routes = [
  {
    path: '/',
    component: Index
  },
  {
    path: '/animation/:id',
    component: Animation,
  }
]




const router = new VueRouter({ routes })

export default router

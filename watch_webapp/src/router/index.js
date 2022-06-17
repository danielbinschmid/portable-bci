import Vue from 'vue'
import Router from 'vue-router'
import MuseInterface from '@/components/MuseInterface'
Vue.use(Router)

export default new Router({
  routes: [
    {
        path: '/',
        name: 'MuseInterface',
        component: MuseInterface
    }
  ]
})

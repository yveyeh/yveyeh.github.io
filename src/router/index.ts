import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView/HomeView'
import BlogListView from '../views/BlogListView/BlogListView'
import BlogPostView from '../views/BlogPostView/BlogPostView'
import AdminStudioView from '../views/AdminStudioView/AdminStudioView'
import JobsView from '../views/JobsView/JobsView'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Didi Online - Didier Yufenyuy Veyeh' },
  },
  {
    path: '/blog',
    name: 'blog',
    component: BlogListView,
    meta: { title: 'Blog - Didier Yufenyuy Veyeh | DevSecOps & Cloud Engineering' },
  },
  {
    path: '/blog/:slug',
    name: 'blog-post',
    component: BlogPostView,
    meta: { title: 'Article - Didier Yufenyuy Veyeh' },
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: JobsView,
    meta: { title: 'Tech Job Opportunities - Didier Yufenyuy Veyeh' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminStudioView,
    meta: { title: 'Blog & Job Studio - Didier Yufenyuy Veyeh' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  if (to.meta?.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
  next()
})

export default router

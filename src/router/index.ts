import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import RegistrationList from '@/pages/RegistrationList.vue'
import Dormitory from '@/pages/Dormitory.vue'
import ResidentList from '@/pages/ResidentList.vue'
import ProbationList from '@/pages/ProbationList.vue'
import ResidentDetail from '@/pages/ResidentDetail.vue'
import Attendance from '@/pages/Attendance.vue'
import AttendanceRecords from '@/pages/AttendanceRecords.vue'
import Notifications from '@/pages/Notifications.vue'
import Layout from '@/components/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '首页看板' }
      },
      {
        path: 'registration',
        name: 'RegistrationList',
        component: RegistrationList,
        meta: { title: '挂单登记' }
      },
      {
        path: 'dormitory',
        name: 'Dormitory',
        component: Dormitory,
        meta: { title: '寮房管理' }
      },
      {
        path: 'residents',
        name: 'ResidentList',
        component: ResidentList,
        meta: { title: '常住僧人' }
      },
      {
        path: 'residents/probation',
        name: 'ProbationList',
        component: ProbationList,
        meta: { title: '考察期管理' }
      },
      {
        path: 'residents/:id',
        name: 'ResidentDetail',
        component: ResidentDetail,
        meta: { title: '常住档案' }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: Attendance,
        meta: { title: '考勤管理' }
      },
      {
        path: 'attendance/records',
        name: 'AttendanceRecords',
        component: AttendanceRecords,
        meta: { title: '考勤记录' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: Notifications,
        meta: { title: '消息中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

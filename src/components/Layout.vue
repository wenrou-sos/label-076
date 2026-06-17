<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NDropdown,
  NAvatar,
  NBadge,
  useMessage
} from 'naive-ui'
import {
  LayoutDashboard,
  ClipboardList,
  BedDouble,
  Users,
  Clock,
  CalendarDays,
  FileText,
  LogOut,
  User,
  Bell
} from 'lucide-vue-next'

const renderIcon = (icon: any) => {
  return () => h(icon, { size: 18 })
}
import { useAuthStore } from '@/stores/auth'
import { getUnreadCount } from '@/api/notification'
import type { Notification } from '../../shared/types'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const collapsed = ref(false)
const unreadCount = ref(0)
let unreadPollingTimer: number | null = null

const menuOptions: any[] = [
  {
    label: '首页看板',
    key: '/dashboard',
    icon: renderIcon(LayoutDashboard)
  },
  {
    label: '挂单登记',
    key: '/registration',
    icon: renderIcon(ClipboardList)
  },
  {
    label: '寮房管理',
    key: '/dormitory',
    icon: renderIcon(BedDouble)
  },
  {
    label: '常住僧人',
    key: '/residents',
    icon: renderIcon(Users)
  },
  {
    label: '考察期管理',
    key: '/residents/probation',
    icon: renderIcon(Clock)
  },
  {
    label: '考勤管理',
    key: '/attendance',
    icon: renderIcon(CalendarDays)
  },
  {
    label: '考勤记录',
    key: '/attendance/records',
    icon: renderIcon(FileText)
  },
  {
    label: '消息中心',
    key: '/notifications',
    icon: renderIcon(Bell)
  }
]

const activeKey = computed(() => route.path)

const userDropdownOptions: any[] = [
  {
    label: '个人信息',
    key: 'profile',
    icon: renderIcon(User)
  },
  {
    type: 'divider' as const
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOut)
  }
]

const handleMenuSelect = (key: string) => {
  router.push(key)
}

const handleUserSelect = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    message.success('已退出登录')
    router.push('/login')
  }
}

const goToNotifications = () => {
  router.push('/notifications')
}

const loadUnreadCount = async () => {
  if (!authStore.isLoggedIn) return
  try {
    unreadCount.value = await getUnreadCount()
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

onMounted(() => {
  authStore.initAuth()
  if (authStore.isLoggedIn) {
    loadUnreadCount()
    unreadPollingTimer = window.setInterval(loadUnreadCount, 30000)
  }
})

onUnmounted(() => {
  if (unreadPollingTimer) {
    clearInterval(unreadPollingTimer)
  }
})
</script>

<template>
  <NLayout has-sider style="min-height: 100vh">
    <NLayoutSider
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="240"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="h-16 flex items-center justify-center border-b border-amber-200/30">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg">
            禅
          </div>
          <span v-if="!collapsed" class="text-lg font-semibold text-amber-900">
            寺院管理系统
          </span>
        </div>
      </div>
      
      <div class="p-4">
        <NMenu
          :value="activeKey"
          :options="menuOptions"
          :collapsed="collapsed"
          :collapsed-width="64"
          @update:value="handleMenuSelect"
          class="bg-transparent"
        />
      </div>
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader class="h-16 bg-white/80 backdrop-blur-sm border-b border-amber-200/30 flex items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold text-amber-900">
            {{ route.meta.title || '寺院管理系统' }}
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
          <NBadge :value="unreadCount" :show="unreadCount > 0" type="error">
            <button
              class="p-2 rounded-lg hover:bg-amber-50 transition-colors"
              @click="goToNotifications"
              title="消息中心"
            >
              <Bell class="w-5 h-5 text-amber-700" />
            </button>
          </NBadge>
          
          <NDropdown
            :options="userDropdownOptions"
            @select="handleUserSelect"
          >
            <div class="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors">
              <NAvatar size="small" round>
                {{ authStore.user?.dharmaName?.charAt(0) || '用' }}
              </NAvatar>
              <div class="text-right">
                <div class="text-sm font-medium text-amber-900">
                  {{ authStore.user?.dharmaName || '用户' }}
                </div>
                <div class="text-xs text-amber-600">
                  {{ authStore.user?.role === 'admin' ? '管理员' : authStore.user?.role === 'receptionist' ? '客堂知客' : '维那师' }}
                </div>
              </div>
            </div>
          </NDropdown>
        </div>
      </NLayoutHeader>

      <NLayoutContent class="p-6 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

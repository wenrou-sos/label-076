<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  NCard,
  NList,
  NListItem,
  NTag,
  NSpace,
  NButton,
  useMessage,
  NEmpty,
  NPagination,
  NSelect,
  NBadge,
  NDivider
} from 'naive-ui'
import {
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  UserCheck,
  CheckCheck
} from 'lucide-vue-next'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  runDailyCheck
} from '@/api/notification'
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  PaginatedResponse
} from '../../shared/types'
import {
  NotificationTypeLabels,
  NotificationPriorityLabels,
  NotificationPriorityColors
} from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const markingAll = ref(false)
const runningCheck = ref(false)
const notifications = ref<Notification[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterType = ref<NotificationType | 'all'>('all')
const filterRead = ref<string | undefined>(undefined)

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '挂单到期提醒', value: 'registration_expiring' },
  { label: '挂单已到期', value: 'registration_expired' },
  { label: '缺勤提醒', value: 'absent_warning' },
  { label: '考察期到期提醒', value: 'probation_expiring' }
]

const readOptions = [
  { label: '全部状态', value: 'all' },
  { label: '未读', value: 'false' },
  { label: '已读', value: 'true' }
]

const getTypeIcon = (type: NotificationType) => {
  switch (type) {
    case 'registration_expiring':
      return Clock
    case 'registration_expired':
      return AlertTriangle
    case 'absent_warning':
      return AlertTriangle
    case 'probation_expiring':
      return Calendar
  }
}

const getTypeColor = (type: NotificationType) => {
  switch (type) {
    case 'registration_expiring':
      return 'warning'
    case 'registration_expired':
      return 'error'
    case 'absent_warning':
      return 'error'
    case 'probation_expiring':
      return 'warning'
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filterType.value !== 'all') {
      params.type = filterType.value
    }
    if (filterRead.value !== undefined && filterRead.value !== 'all') {
      params.isRead = filterRead.value === 'true'
    }
    const result = await getNotifications(params) as PaginatedResponse<Notification>
    notifications.value = result.data
    total.value = result.total
  } catch (error) {
    message.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

const handleMarkRead = async (notif: Notification) => {
  if (notif.isRead) return
  try {
    await markNotificationRead(notif.id)
    notif.isRead = true
    notif.readAt = new Date()
  } catch (error) {
    message.error('标记已读失败')
  }
}

const handleMarkAllRead = async () => {
  markingAll.value = true
  try {
    const count = await markAllNotificationsRead()
    notifications.value.forEach(n => {
      n.isRead = true
      n.readAt = new Date()
    })
    message.success(`已将 ${count} 条消息标记为已读`)
  } catch (error) {
    message.error('全部标记已读失败')
  } finally {
    markingAll.value = false
  }
}

const handleRunCheck = async () => {
  runningCheck.value = true
  try {
    const result = await runDailyCheck()
    message.success(`检查完成：新增 ${result.created} 条提醒，${result.expired} 人已到期，${result.expiring} 人即将到期，${result.absentWarnings} 条缺勤预警`)
    loadData()
  } catch (error) {
    message.error('执行检查失败')
  } finally {
    runningCheck.value = false
  }
}

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const formatDate = (date: Date | string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <NSpace>
          <Bell class="w-6 h-6 text-amber-600" />
          <h2 class="text-xl font-bold text-amber-900">消息中心</h2>
          <NBadge :value="unreadCount" v-if="unreadCount > 0" type="error" />
        </NSpace>
        <NSpace>
          <NSelect
            v-model:value="filterType"
            :options="typeOptions"
            style="width: 160px"
            @update:value="page = 1; loadData()"
          />
          <NSelect
            v-model:value="filterRead"
            :options="readOptions"
            style="width: 120px"
            @update:value="page = 1; loadData()"
          />
          <NButton :loading="runningCheck" @click="handleRunCheck">
            <template #icon>
              <CheckCircle class="w-4 h-4" />
            </template>
            立即检查
          </NButton>
          <NButton type="primary" :loading="markingAll" @click="handleMarkAllRead">
            <template #icon>
              <CheckCheck class="w-4 h-4" />
            </template>
            全部已读
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false">
      <div v-if="loading" class="text-center py-12 text-gray-400">
        加载中...
      </div>
      <div v-else-if="notifications.length === 0" class="py-16">
        <NEmpty description="暂无消息" />
      </div>
      <div v-else>
        <NList bordered>
          <NListItem
            v-for="notif in notifications"
            :key="notif.id"
            class="cursor-pointer hover:bg-amber-50/50 transition-colors"
            :class="{ 'opacity-60': notif.isRead }"
            @click="handleMarkRead(notif)"
          >
            <template #prefix>
              <NBadge :show="!notif.isRead" dot type="error">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="{
                    'bg-amber-100': notif.priority === 'medium',
                    'bg-red-100': notif.priority === 'high',
                    'bg-gray-100': notif.priority === 'low'
                  }"
                >
                  <component
                    :is="getTypeIcon(notif.type)"
                    class="w-5 h-5"
                    :class="{
                      'text-amber-600': notif.priority === 'medium',
                      'text-red-600': notif.priority === 'high',
                      'text-gray-600': notif.priority === 'low'
                    }"
                  />
                </div>
              </NBadge>
            </template>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-gray-800">{{ notif.title }}</span>
                <NTag :type="getTypeColor(notif.type)" size="small">
                  {{ NotificationTypeLabels[notif.type] }}
                </NTag>
                <NTag :type="NotificationPriorityColors[notif.priority]" size="small" quaternary>
                  {{ NotificationPriorityLabels[notif.priority] }}
                </NTag>
              </div>
              <p class="text-sm text-gray-600 line-clamp-2">{{ notif.content }}</p>
            </div>
            <div class="text-right ml-4 flex-shrink-0">
              <div class="text-xs text-gray-400">
                {{ formatDate(notif.createdAt) }}
              </div>
              <div v-if="notif.isRead && notif.readAt" class="text-xs text-green-500 mt-1">
                已读 {{ formatDate(notif.readAt) }}
              </div>
            </div>
          </NListItem>
        </NList>
        <div class="mt-4 flex justify-center">
          <NPagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :item-count="total"
            show-size-picker
            :page-sizes="[10, 20, 50, 100]"
            @update:page="loadData"
            @update:page-size="page = 1; loadData()"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
:deep(.n-list-item) {
  padding: 16px 20px;
}
</style>

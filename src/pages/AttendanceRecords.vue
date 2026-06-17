<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  NCard,
  NDataTable,
  NDatePicker,
  NSelect,
  NButton,
  NSpace,
  useMessage,
  NTag,
  NGrid,
  NGridItem,
  NEmpty,
  NInput
} from 'naive-ui'
import {
  Calendar,
  Search,
  FileText,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-vue-next'
import { getAttendance, getAbsentCount } from '@/api/attendance'
import { getRegistrations } from '@/api/registration'
import { getResidents } from '@/api/resident'
import type {
  Attendance,
  AttendanceStatus,
  AttendanceSession,
  GuestRegistration,
  Resident
} from '../../shared/types'
import { AttendanceStatusLabels as statusLabels, AttendanceSessionLabels as sessionLabels } from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const records = ref<Attendance[]>([])
const guests = ref<GuestRegistration[]>([])
const residents = ref<Resident[]>([])

const dateRange = ref<[number, number] | null>([
  dayjs().subtract(7, 'day').valueOf(),
  Date.now()
])
const monkFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: '全部', value: null },
  { label: '出勤', value: 'present' },
  { label: '缺勤', value: 'absent' },
  { label: '请假', value: 'leave' }
]

const statusColorMap: Record<AttendanceStatus, 'success' | 'error' | 'warning'> = {
  present: 'success',
  absent: 'error',
  leave: 'warning'
}

const statusIconMap: Record<AttendanceStatus, any> = {
  present: CheckCircle2,
  absent: XCircle,
  leave: Clock
}

const monkOptions = computed(() => {
  const options: { label: string; value: string; type: string }[] = []
  guests.value.forEach(g => {
    options.push({ label: `${g.dharmaName} (挂单)`, value: g.id, type: 'guest' })
  })
  residents.value.forEach(r => {
    options.push({ label: `${r.dharmaName} (常住)`, value: r.id, type: 'resident' })
  })
  return options
})

const absentStats = computed(() => {
  const countMap = new Map<string, { count: number; name: string; type: string }>()
  
  records.value
    .filter(r => r.status === 'absent')
    .forEach(r => {
      const existing = countMap.get(r.monkId)
      if (existing) {
        existing.count++
      } else {
        const monk = [...guests.value, ...residents.value].find(m => m.id === r.monkId)
        countMap.set(r.monkId, {
          count: 1,
          name: monk?.dharmaName || '未知',
          type: r.monkType
        })
      }
    })
  
  return Array.from(countMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const loadData = async () => {
  loading.value = true
  try {
    const [regData, resData] = await Promise.all([
      getRegistrations(),
      getResidents()
    ])
    guests.value = regData.data
    residents.value = resData.data
    
    const params: any = {}
    if (dateRange.value) {
      params.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    if (monkFilter.value) {
      params.monkId = monkFilter.value
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const attData = await getAttendance(params)
    records.value = attData.data
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const getMonkName = (monkId: string, monkType: string) => {
  if (monkType === 'guest') {
    return guests.value.find(g => g.id === monkId)?.dharmaName || '未知'
  }
  return residents.value.find(r => r.id === monkId)?.dharmaName || '未知'
}

const columns = [
  {
    title: '日期',
    key: 'date',
    width: 130,
    render: (row: Attendance) =>
      h('div', { class: 'flex items-center gap-2 text-gray-600' }, [
        h(Calendar, { class: 'w-4 h-4 text-amber-500' }),
        dayjs(row.date).format('YYYY-MM-DD')
      ])
  },
  {
    title: '课程',
    key: 'session',
    width: 100,
    render: (row: Attendance) =>
      h(NTag, { type: 'default' }, { default: () => sessionLabels[row.session] })
  },
  {
    title: '僧人',
    key: 'monkId',
    render: (row: Attendance) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center' }, [
          h('span', { class: 'text-xs font-semibold text-amber-700' }, getMonkName(row.monkId, row.monkType).charAt(0))
        ]),
        h('div', [
          h('div', { class: 'font-medium text-gray-800' }, getMonkName(row.monkId, row.monkType)),
          h('div', { class: 'text-xs text-gray-500' }, row.monkType === 'resident' ? '常住' : '挂单')
        ])
      ])
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: Attendance) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(statusIconMap[row.status], { class: `w-4 h-4 ${row.status === 'present' ? 'text-green-500' : row.status === 'absent' ? 'text-red-500' : 'text-amber-500'}` }),
        h(NTag, { type: statusColorMap[row.status], size: 'small' }, { default: () => statusLabels[row.status] })
      ])
  },
  {
    title: '备注',
    key: 'notes',
    render: (row: Attendance) => row.notes || '-'
  }
]

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <NGrid :cols="5" :x-gap="12" :y-gap="12">
        <NGridItem :span="2">
          <NDatePicker
            v-model:value="dateRange"
            type="daterange"
            value-format="timestamp"
            placeholder="选择日期范围"
            clearable
            @update:value="loadData"
            class="w-full"
          />
        </NGridItem>
        <NGridItem>
          <NSelect
            v-model:value="monkFilter"
            :options="monkOptions"
            placeholder="选择僧人"
            clearable
            filterable
            @update:value="loadData"
            class="w-full"
          />
        </NGridItem>
        <NGridItem>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            @update:value="loadData"
            class="w-full"
          />
        </NGridItem>
        <NGridItem class="text-right">
          <NButton type="primary" @click="loadData">
            <template #icon>
              <Search class="w-4 h-4" />
            </template>
            查询
          </NButton>
        </NGridItem>
      </NGrid>
    </NCard>

    <NGrid :cols="5" :x-gap="12" :y-gap="12" class="mb-4">
      <NGridItem :span="3">
        <NCard :bordered="false">
          <div class="flex items-center gap-2 mb-4">
            <FileText class="w-5 h-5 text-amber-600" />
            <h3 class="text-lg font-semibold text-amber-900">考勤记录</h3>
          </div>
          <div v-if="loading" class="text-center py-12 text-gray-400">
            加载中...
          </div>
          <div v-else-if="records.length === 0" class="py-12">
            <NEmpty description="暂无考勤记录" />
          </div>
          <NDataTable
            v-else
            :columns="columns"
            :data="records"
            :bordered="false"
            :pagination="{ pageSize: 10 }"
          />
        </NCard>
      </NGridItem>

      <NGridItem :span="2">
        <NCard :bordered="false">
          <div class="flex items-center gap-2 mb-4">
            <AlertTriangle class="w-5 h-5 text-red-500" />
            <h3 class="text-lg font-semibold text-amber-900">缺勤统计</h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="stat in absentStats"
              :key="stat.id"
              class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span class="text-sm font-semibold text-red-600">{{ stat.name.charAt(0) }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-800">{{ stat.name }}</div>
                  <div class="text-xs text-gray-500">{{ stat.type === 'resident' ? '常住' : '挂单' }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-red-600">{{ stat.count }}</div>
                <div class="text-xs text-gray-500">次缺勤</div>
              </div>
            </div>
            <div v-if="absentStats.length === 0" class="text-center py-12 text-gray-400">
              <Users class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无缺勤记录</p>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped>
:deep(.n-card),
:deep(.n-data-table) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
</style>

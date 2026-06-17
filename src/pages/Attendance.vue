<script setup lang="ts">
import { ref, onMounted, computed, h, watch, nextTick } from 'vue'
import {
  NCard,
  NDatePicker,
  NButton,
  NButtonGroup,
  NRadioGroup,
  NRadio,
  NSpace,
  useMessage,
  NTag,
  NGrid,
  NGridItem,
  NEmpty,
  NCheckbox,
  NTabs,
  NTabPane
} from 'naive-ui'
import {
  Sunrise,
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  CheckSquare,
  BarChart3,
  PieChart
} from 'lucide-vue-next'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

const renderIcon = (icon: any) => {
  return () => h(icon, { size: 18 })
}
import { batchCreateAttendance, getAttendance, getAttendanceStatistics } from '@/api/attendance'
import { getRegistrations } from '@/api/registration'
import { getResidents } from '@/api/resident'
import type {
  AttendanceStatus,
  AttendanceSession,
  AttendanceBatchItem,
  GuestRegistration,
  Resident,
  MonkType,
  AttendanceStatistics
} from '../../shared/types'
import { AttendanceStatusLabels as statusLabels, AttendanceSessionLabels as sessionLabels } from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const statsLoading = ref(false)
const saving = ref(false)
const selectedDate = ref<number>(Date.now())
const selectedSession = ref<AttendanceSession>('morning')
const allPresent = ref(false)
const activeTab = ref('register')

const guests = ref<GuestRegistration[]>([])
const residents = ref<Resident[]>([])
const existingAttendance = ref<Map<string, AttendanceStatus>>(new Map())
const statistics = ref<AttendanceStatistics | null>(null)

const weeklyChartRef = ref<HTMLDivElement | null>(null)
const monthlyChartRef = ref<HTMLDivElement | null>(null)
const sessionChartRef = ref<HTMLDivElement | null>(null)
let weeklyChart: ECharts | null = null
let monthlyChart: ECharts | null = null
let sessionChart: ECharts | null = null

interface AttendanceItem {
  id: string
  dharmaName: string
  type: MonkType
  status: AttendanceStatus
  notes?: string
}

const attendanceList = ref<AttendanceItem[]>([])

const sessionOptions = [
  { label: '早课', value: 'morning', icon: Sunrise },
  { label: '晚课', value: 'evening', icon: Moon }
]

const statusColorMap: Record<AttendanceStatus, 'success' | 'error' | 'warning'> = {
  present: 'success',
  absent: 'error',
  leave: 'warning'
}

const loadData = async () => {
  loading.value = true
  try {
    const [regData, resData, attData] = await Promise.all([
      getRegistrations({ status: 'active' }),
      getResidents({ status: 'active' }),
      getAttendance({
        date: dayjs(selectedDate.value).format('YYYY-MM-DD'),
        session: selectedSession.value
      })
    ])
    
    guests.value = (regData as any).data?.filter((g: any) => g.status === 'active') || []
    residents.value = (resData as any).data?.filter((r: any) => r.status === 'active' || r.status === 'probation') || []
    
    existingAttendance.value = new Map(
      ((attData as any).data || []).map((a: any) => [a.monkId, a.status])
    )
    
    buildAttendanceList()
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  statsLoading.value = true
  try {
    statistics.value = await getAttendanceStatistics()
    await nextTick()
    renderCharts()
  } catch (error) {
    message.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

const buildAttendanceList = () => {
  const list: AttendanceItem[] = []
  
  guests.value.forEach(guest => {
    list.push({
      id: guest.id,
      dharmaName: guest.dharmaName,
      type: 'guest',
      status: existingAttendance.value.get(guest.id) || 'present'
    })
  })
  
  residents.value.forEach(resident => {
    list.push({
      id: resident.id,
      dharmaName: resident.dharmaName,
      type: 'resident',
      status: existingAttendance.value.get(resident.id) || 'present'
    })
  })
  
  attendanceList.value = list
  updateAllPresent()
}

const updateAllPresent = () => {
  allPresent.value = attendanceList.value.every(item => item.status === 'present')
}

const markAllPresent = () => {
  attendanceList.value.forEach(item => {
    item.status = 'present'
  })
  allPresent.value = true
  message.success('已全部标记为出勤')
}

const handleSessionChange = () => {
  loadData()
}

const handleDateChange = () => {
  loadData()
}

const handleSave = async () => {
  saving.value = true
  try {
    const records: AttendanceBatchItem[] = attendanceList.value.map(item => ({
      monkId: item.id,
      monkType: item.type,
      status: item.status,
      notes: item.notes
    }))
    
    await batchCreateAttendance({
      date: dayjs(selectedDate.value).format('YYYY-MM-DD'),
      session: selectedSession.value,
      records
    })
    
    message.success('考勤记录保存成功')
    loadData()
  } catch (error: any) {
    message.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const getStatusIcon = (status: AttendanceStatus) => {
  switch (status) {
    case 'present':
      return h(CheckCircle2, { class: 'w-5 h-5 text-green-500' })
    case 'absent':
      return h(XCircle, { class: 'w-5 h-5 text-red-500' })
    case 'leave':
      return h(Clock, { class: 'w-5 h-5 text-amber-500' })
  }
}

const stats = computed(() => ({
  total: attendanceList.value.length,
  present: attendanceList.value.filter(a => a.status === 'present').length,
  absent: attendanceList.value.filter(a => a.status === 'absent').length,
  leave: attendanceList.value.filter(a => a.status === 'leave').length
}))

const renderCharts = () => {
  if (!statistics.value) return

  const themeColors = ['#D4A574', '#8B6914', '#B8860B', '#CD853F', '#DAA520']

  if (weeklyChartRef.value && statistics.value.weeklyTrend.length > 0) {
    weeklyChart = echarts.init(weeklyChartRef.value)
    weeklyChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = params[0]
          return `${item.name}<br/>缺勤率: ${item.value}%`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: statistics.value.weeklyTrend.map(w => w.week.slice(5)),
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#ddd' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%', color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [{
        data: statistics.value.weeklyTrend.map(w => w.absentRate),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#D4A574', width: 3 },
        itemStyle: { color: '#D4A574' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(212, 165, 116, 0.4)' },
            { offset: 1, color: 'rgba(212, 165, 116, 0.05)' }
          ])
        }
      }]
    })
  }

  if (monthlyChartRef.value && statistics.value.monthlyTrend.length > 0) {
    monthlyChart = echarts.init(monthlyChartRef.value)
    monthlyChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = params[0]
          return `${item.name}<br/>缺勤次数: ${item.value}次`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: statistics.value.monthlyTrend.map(m => m.month),
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#ddd' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [{
        data: statistics.value.monthlyTrend.map(m => m.absentCount),
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#D4A574' },
            { offset: 1, color: '#B8860B' }
          ]),
          borderRadius: [6, 6, 0, 0]
        }
      }]
    })
  }

  if (sessionChartRef.value && statistics.value.sessionComparison.length > 0) {
    sessionChart = echarts.init(sessionChartRef.value)
    sessionChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const name = params.name === 'morning' ? '早课' : '晚课'
          return `${name}<br/>缺勤率: ${params.value}%`
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        data: statistics.value.sessionComparison.map(s => s.session === 'morning' ? '早课' : '晚课'),
        textStyle: { color: '#666' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          formatter: (params: any) => {
            const name = params.name === 'morning' ? '早课' : '晚课'
            return `${name}\n${params.value}%`
          },
          color: '#666'
        },
        labelLine: { show: true },
        data: statistics.value.sessionComparison.map((s, i) => ({
          value: s.absentRate,
          name: s.session,
          itemStyle: { color: themeColors[i % themeColors.length] }
        }))
      }]
    })
  }
}

watch(activeTab, (newVal) => {
  if (newVal === 'statistics' && !statistics.value) {
    loadStatistics()
  }
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <NTabs v-model:value="activeTab" size="large" class="mb-4">
      <NTabPane name="register">
        <template #tab>
          <div class="flex items-center gap-2">
            <Users class="w-4 h-4" />
            考勤登记
          </div>
        </template>
      </NTabPane>
      <NTabPane name="statistics">
        <template #tab>
          <div class="flex items-center gap-2">
            <BarChart3 class="w-4 h-4" />
            缺勤统计
          </div>
        </template>
      </NTabPane>
    </NTabs>

    <div v-show="activeTab === 'register'">
      <NCard :bordered="false" class="mb-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <NSpace>
            <NDatePicker
              v-model:value="selectedDate"
              type="date"
              value-format="timestamp"
              @update:value="handleDateChange"
              style="width: 200px"
            />
            <NButtonGroup>
              <NButton
                v-for="opt in sessionOptions"
                :key="opt.value"
                :type="selectedSession === opt.value ? 'primary' : 'default'"
                @click="selectedSession = opt.value as AttendanceSession; handleSessionChange()"
              >
                <component :is="opt.icon" class="w-4 h-4 mr-1" />
                {{ opt.label }}
              </NButton>
            </NButtonGroup>
          </NSpace>
          <NSpace>
            <NButton @click="markAllPresent">
              <template #icon>
                <CheckSquare class="w-4 h-4" />
              </template>
              一键全选出勤
            </NButton>
            <NButton type="primary" :loading="saving" @click="handleSave">
              <template #icon>
                <Save class="w-4 h-4" />
              </template>
              保存考勤
            </NButton>
          </NSpace>
        </div>
      </NCard>

      <NCard :bordered="false" class="mb-4">
        <NGrid :cols="4" :x-gap="16">
          <NGridItem>
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <div class="text-3xl font-bold text-amber-700">{{ stats.total }}</div>
              <div class="text-sm text-gray-500">应到人数</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-green-50 rounded-xl">
              <div class="text-3xl font-bold text-green-600">{{ stats.present }}</div>
              <div class="text-sm text-gray-500">出勤</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-red-50 rounded-xl">
              <div class="text-3xl font-bold text-red-600">{{ stats.absent }}</div>
              <div class="text-sm text-gray-500">缺勤</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-amber-50 rounded-xl">
              <div class="text-3xl font-bold text-amber-600">{{ stats.leave }}</div>
              <div class="text-sm text-gray-500">请假</div>
            </div>
          </NGridItem>
        </NGrid>
      </NCard>

      <NCard :bordered="false">
        <div class="flex items-center gap-2 mb-4">
          <Users class="w-5 h-5 text-amber-600" />
          <h3 class="text-lg font-semibold text-amber-900">
            {{ dayjs(selectedDate).format('YYYY年MM月DD日') }} {{ sessionLabels[selectedSession] }}考勤
          </h3>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-400">
          加载中...
        </div>

        <div v-else-if="attendanceList.length === 0" class="py-16">
          <NEmpty description="今日暂无需考勤的僧人" />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in attendanceList"
            :key="item.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
                <span class="text-white font-semibold text-sm">{{ item.dharmaName.charAt(0) }}</span>
              </div>
              <div>
                <div class="font-medium text-gray-800">{{ item.dharmaName }}</div>
                <div class="text-xs text-gray-500">
                  {{ item.type === 'resident' ? '常住' : '挂单' }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <NRadioGroup v-model:value="item.status" @update:value="updateAllPresent">
                <NSpace size="large">
                  <NRadio value="present">
                    <span class="flex items-center gap-1">
                      <CheckCircle2 class="w-4 h-4 text-green-500" />
                      出勤
                    </span>
                  </NRadio>
                  <NRadio value="absent">
                    <span class="flex items-center gap-1">
                      <XCircle class="w-4 h-4 text-red-500" />
                      缺勤
                    </span>
                  </NRadio>
                  <NRadio value="leave">
                    <span class="flex items-center gap-1">
                      <Clock class="w-4 h-4 text-amber-500" />
                      请假
                    </span>
                  </NRadio>
                </NSpace>
              </NRadioGroup>
              <NTag :type="statusColorMap[item.status]" size="small">
                {{ statusLabels[item.status] }}
              </NTag>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <div v-show="activeTab === 'statistics'">
      <div v-if="statsLoading" class="text-center py-16 text-gray-400">
        加载统计数据中...
      </div>

      <template v-else-if="statistics">
        <NGrid :cols="4" :x-gap="16" class="mb-4">
          <NGridItem>
            <div class="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
              <div class="text-3xl font-bold text-amber-700">{{ statistics.overallAttendanceRate }}%</div>
              <div class="text-sm text-gray-600">整体出勤率</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-green-50 rounded-xl">
              <div class="text-3xl font-bold text-green-600">{{ statistics.totalPresent }}</div>
              <div class="text-sm text-gray-500">累计出勤</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-red-50 rounded-xl">
              <div class="text-3xl font-bold text-red-600">{{ statistics.totalAbsent }}</div>
              <div class="text-sm text-gray-500">累计缺勤</div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="text-center p-4 bg-yellow-50 rounded-xl">
              <div class="text-3xl font-bold text-yellow-600">{{ statistics.totalLeave }}</div>
              <div class="text-sm text-gray-500">累计请假</div>
            </div>
          </NGridItem>
        </NGrid>

        <NGrid :cols="2" :x-gap="16" class="mb-4">
          <NGridItem>
            <NCard :bordered="false" title="周缺勤率趋势">
              <template #header-extra>
                <div class="text-sm text-gray-500">近8周</div>
              </template>
              <div ref="weeklyChartRef" class="h-72"></div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard :bordered="false" title="月缺勤次数统计">
              <template #header-extra>
                <div class="text-sm text-gray-500">近6个月</div>
              </template>
              <div ref="monthlyChartRef" class="h-72"></div>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard :bordered="false" title="早晚课缺勤率对比">
          <template #header>
            <div class="flex items-center gap-2">
              <PieChart class="w-5 h-5 text-amber-600" />
              <span>早晚课缺勤率对比</span>
            </div>
          </template>
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <div ref="sessionChartRef" class="h-72"></div>
            </NGridItem>
            <NGridItem>
              <div class="space-y-4 pt-8">
                <div
                  v-for="s in statistics.sessionComparison"
                  :key="s.session"
                  class="p-4 bg-gray-50 rounded-xl"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-800">
                      {{ s.session === 'morning' ? '早课' : '晚课' }}
                    </span>
                    <span class="text-xl font-bold" :class="s.absentRate > 10 ? 'text-red-600' : 'text-green-600'">
                      {{ s.absentRate }}%
                    </span>
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <span>缺勤: {{ s.absentCount }}次</span>
                    <span>总计: {{ s.totalCount }}次</span>
                  </div>
                  <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="s.absentRate > 10 ? 'bg-red-500' : 'bg-amber-500'"
                      :style="{ width: `${Math.min(s.absentRate, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </NGridItem>
          </NGrid>
        </NCard>
      </template>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
:deep(.n-tabs-nav) {
  margin-bottom: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NGrid, NGridItem, NStatistic, NSpace, useMessage, NTag } from 'naive-ui'
import {
  Users,
  UserPlus,
  Home,
  Bed,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-vue-next'
import * as echarts from 'echarts'
import { getDashboardStats } from '@/api/dashboard'
import { getAbsentAlerts } from '@/api/attendance'
import { getExpiringRegistrations } from '@/api/notification'
import type { DashboardStats, AbsentAlert, GuestRegistration } from '../../shared/types'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()
const stats = ref<DashboardStats | null>(null)
const absentAlerts = ref<AbsentAlert[]>([])
const expiringRegistrations = ref<GuestRegistration[]>([])
const loading = ref(false)
const chartRef = shallowRef<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const loadData = async () => {
  loading.value = true
  try {
    const [statsData, alertsData, expiringData] = await Promise.all([
      getDashboardStats(),
      getAbsentAlerts(),
      getExpiringRegistrations()
    ])
    stats.value = statsData
    absentAlerts.value = alertsData
    expiringRegistrations.value = expiringData
    updateChart()
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const updateChart = () => {
  if (!chartRef.value || !stats.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#D4A574',
      textStyle: {
        color: '#5D4E37'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.value.monthlyGuestTrend.map(item => item.month),
      axisLine: {
        lineStyle: {
          color: '#D4A574'
        }
      },
      axisLabel: {
        color: '#5D4E37'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#D4A574'
        }
      },
      axisLabel: {
        color: '#5D4E37'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(212, 165, 116, 0.2)'
        }
      }
    },
    series: [
      {
        name: '挂单人数',
        type: 'line',
        smooth: true,
        data: stats.value.monthlyGuestTrend.map(item => item.count),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(212, 165, 116, 0.4)' },
            { offset: 1, color: 'rgba(212, 165, 116, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#D4A574',
          width: 3
        },
        itemStyle: {
          color: '#D4A574'
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

const getExpectedLeaveDate = (reg: GuestRegistration) => {
  return dayjs(reg.arrivalDate).add(reg.expectedStayDays, 'day').format('YYYY-MM-DD')
}

const getDaysLeft = (reg: GuestRegistration) => {
  const expected = dayjs(reg.arrivalDate).add(reg.expectedStayDays, 'day')
  return expected.diff(dayjs(), 'day') + 1
}

const goToRegistration = () => {
  router.push('/registration')
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div>
    <div
      v-if="expiringRegistrations.length > 0"
      class="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl cursor-pointer hover:shadow-md transition-all"
      @click="goToRegistration"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div class="font-semibold text-amber-800">
              有 {{ expiringRegistrations.length }} 位挂单僧人即将到期
            </div>
            <div class="text-sm text-amber-600">
              <span v-for="(reg, idx) in expiringRegistrations.slice(0, 3)" :key="reg.id">
                {{ reg.dharmaName }}（还剩 {{ getDaysLeft(reg) }} 天）<span v-if="idx < Math.min(expiringRegistrations.length, 3) - 1">、</span>
              </span>
              <span v-if="expiringRegistrations.length > 3">等{{ expiringRegistrations.length }}人</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 text-amber-600">
          <span class="text-sm">查看详情</span>
          <ChevronRight class="w-4 h-4" />
        </div>
      </div>
    </div>

    <NGrid :cols="4" :x-gap="20" :y-gap="20" class="mb-6">
      <NGridItem>
        <NCard class="stat-card border-l-green-500">
          <NSpace justify="space-between" align="center">
            <div>
              <div class="text-sm text-gray-500 mb-1">今日挂单</div>
              <NStatistic :value="stats?.activeGuests || 0" valueStyle="{ color: '#52C41A', fontSize: '32px' }" />
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus class="w-6 h-6 text-green-600" />
            </div>
          </NSpace>
        </NCard>
      </NGridItem>
      
      <NGridItem>
        <NCard class="stat-card border-l-amber-500">
          <NSpace justify="space-between" align="center">
            <div>
              <div class="text-sm text-gray-500 mb-1">常住僧人</div>
              <NStatistic :value="stats?.activeResidents || 0" valueStyle="{ color: '#D4A574', fontSize: '32px' }" />
            </div>
            <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Users class="w-6 h-6 text-amber-600" />
            </div>
          </NSpace>
        </NCard>
      </NGridItem>
      
      <NGridItem>
        <NCard class="stat-card border-l-blue-500">
          <NSpace justify="space-between" align="center">
            <div>
              <div class="text-sm text-gray-500 mb-1">空闲床位</div>
              <NStatistic :value="stats?.availableBeds || 0" valueStyle="{ color: '#1890FF', fontSize: '32px' }" />
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Bed class="w-6 h-6 text-blue-600" />
            </div>
          </NSpace>
        </NCard>
      </NGridItem>
      
      <NGridItem>
        <NCard class="stat-card border-l-red-500">
          <NSpace justify="space-between" align="center">
            <div>
              <div class="text-sm text-gray-500 mb-1">缺勤提醒</div>
              <NStatistic :value="stats?.absentAlerts || 0" valueStyle="{ color: '#F5222D', fontSize: '32px' }" />
            </div>
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle class="w-6 h-6 text-red-600" />
            </div>
          </NSpace>
        </NCard>
      </NGridItem>
    </NGrid>
    
    <NGrid :cols="3" :x-gap="20" :y-gap="20">
      <NGridItem :span="2">
        <NCard title="挂单趋势" :bordered="false">
          <template #header-extra>
            <div class="flex items-center gap-2 text-sm text-amber-600">
              <TrendingUp class="w-4 h-4" />
              近6个月数据
            </div>
          </template>
          <div ref="chartRef" class="w-full h-80"></div>
        </NCard>
      </NGridItem>
      
      <NGridItem :span="1">
        <NCard title="缺勤提醒" :bordered="false">
          <template #header-extra>
            <span class="text-sm text-red-500">{{ absentAlerts.length }} 人需关注</span>
          </template>
          <div class="space-y-3 max-h-80 overflow-auto">
            <div
              v-for="alert in absentAlerts"
              :key="alert.monkId"
              class="p-3 bg-red-50 rounded-lg border border-red-100"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-amber-900">{{ alert.dharmaName }}</span>
                <span class="text-xs text-red-500 font-medium">
                  缺勤 {{ alert.absentCount }} 次
                </span>
              </div>
              <div class="text-xs text-gray-500">
                最近缺勤：{{ dayjs(alert.lastAbsentDate).format('YYYY-MM-DD') }}
              </div>
            </div>
            <div v-if="absentAlerts.length === 0" class="text-center py-8 text-gray-400">
              <ClipboardCheck class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无缺勤提醒</p>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
    
    <NGrid :cols="4" :x-gap="20" :y-gap="20" class="mt-6">
      <NGridItem>
        <NCard class="h-full">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-700 mb-2">{{ stats?.totalGuests || 0 }}</div>
            <div class="text-sm text-gray-500">累计挂单</div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="h-full">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-700 mb-2">{{ stats?.occupiedBeds || 0 }}</div>
            <div class="text-sm text-gray-500">已住床位</div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="h-full">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-700 mb-2">{{ stats?.totalResidents || 0 }}</div>
            <div class="text-sm text-gray-500">累计常住</div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="h-full">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-700 mb-2">{{ stats?.todayAttendanceRate || 0 }}%</div>
            <div class="text-sm text-gray-500">今日出勤率</div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

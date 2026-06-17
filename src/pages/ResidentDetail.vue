<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard,
  NTabs,
  NTabPane,
  NTag,
  NSpace,
  NButton,
  useMessage,
  NGrid,
  NGridItem,
  NDescriptions,
  NDescriptionsItem,
  NEmpty
} from 'naive-ui'
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  BookOpen,
  Edit3,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getResident } from '@/api/resident'
import { getMonkAttendanceCalendar } from '@/api/attendance'
import type {
  Resident,
  ResidentStatus,
  MonkAttendanceCalendar
} from '../../shared/types'
import { ResidentStatusLabels, PositionOptions, AttendanceStatusLabels, AttendanceSessionLabels } from '../../shared/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const calendarLoading = ref(false)
const resident = ref<Resident | null>(null)
const activeTab = ref('basic')

const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const attendanceCalendar = ref<MonkAttendanceCalendar | null>(null)

const id = computed(() => route.params.id as string)

const statusColorMap: Record<ResidentStatus, 'success' | 'warning' | 'error' | 'default'> = {
  probation: 'warning',
  active: 'success',
  suspended: 'error',
  left: 'default'
}

const positionMap = new Map(PositionOptions.map(p => [p.value, p.label]))

const getPositionLabel = (position?: string) => {
  if (!position) return '-'
  return positionMap.get(position) || position
}

const loadData = async () => {
  if (!id.value) return
  loading.value = true
  try {
    resident.value = await getResident(id.value)
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadAttendanceCalendar = async () => {
  if (!id.value) return
  calendarLoading.value = true
  try {
    attendanceCalendar.value = await getMonkAttendanceCalendar(
      id.value,
      'resident',
      calendarYear.value,
      calendarMonth.value
    )
  } catch (error) {
    message.error('加载考勤记录失败')
  } finally {
    calendarLoading.value = false
  }
}

const prevMonth = () => {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

const nextMonth = () => {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

watch([calendarYear, calendarMonth], () => {
  if (activeTab.value === 'attendance') {
    loadAttendanceCalendar()
  }
})

watch(activeTab, (newVal) => {
  if (newVal === 'attendance' && !attendanceCalendar.value) {
    loadAttendanceCalendar()
  }
})

const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1)
  const lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days: Array<{ day: number | null; date?: string; morning?: string; evening?: string }> = []
  
  for (let i = 0; i < startWeekday; i++) {
    days.push({ day: null })
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const morningRecord = attendanceCalendar.value?.records.find(r => r.date === dateStr && r.session === 'morning')
    const eveningRecord = attendanceCalendar.value?.records.find(r => r.date === dateStr && r.session === 'evening')
    days.push({
      day: d,
      date: dateStr,
      morning: morningRecord?.status,
      evening: eveningRecord?.status
    })
  }
  
  return days
})

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

const goBack = () => {
  router.push('/residents')
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="mb-4">
      <NButton text @click="goBack">
        <template #icon>
          <ArrowLeft class="w-4 h-4" />
        </template>
        返回列表
      </NButton>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">
      加载中...
    </div>

    <div v-else-if="!resident" class="py-16">
      <NEmpty description="未找到该常住僧人信息" />
    </div>

    <div v-else class="grid grid-cols-12 gap-4">
      <div class="col-span-4">
        <NCard :bordered="false" class="h-full">
          <div class="text-center py-6">
            <div class="w-28 h-28 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User class="w-14 h-14 text-white" />
            </div>
            <h2 class="text-2xl font-bold text-amber-900 mb-1">
              {{ resident.dharmaName }}
            </h2>
            <p class="text-gray-500 mb-4">
              {{ resident.generationName }} 字辈
            </p>
            <NTag :type="statusColorMap[resident.status]" size="large">
              {{ ResidentStatusLabels[resident.status] }}
            </NTag>
          </div>
          <div class="border-t border-gray-100 pt-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <User class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div class="text-xs text-gray-400">剃度师</div>
                <div class="text-gray-700 font-medium">{{ resident.tonsureMaster }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Briefcase class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div class="text-xs text-gray-400">职务</div>
                <div class="text-gray-700 font-medium">{{ getPositionLabel(resident.position) }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Calendar class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div class="text-xs text-gray-400">受戒日期</div>
                <div class="text-gray-700 font-medium">{{ dayjs(resident.preceptsDate).format('YYYY-MM-DD') }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <MapPin class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div class="text-xs text-gray-400">受戒寺院</div>
                <div class="text-gray-700 font-medium">{{ resident.preceptsTemple }}</div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      <div class="col-span-8">
        <NCard :bordered="false">
          <NTabs v-model:value="activeTab" size="large">
            <NTabPane name="basic" tab="基本信息">
              <div class="pt-4">
                <NDescriptions :column="2" bordered>
                  <NDescriptionsItem label="法名">
                    {{ resident.dharmaName }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="字辈">
                    {{ resident.generationName }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="剃度师">
                    {{ resident.tonsureMaster }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="职务">
                    {{ getPositionLabel(resident.position) }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="受戒日期">
                    {{ dayjs(resident.preceptsDate).format('YYYY-MM-DD') }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="受戒寺院">
                    {{ resident.preceptsTemple }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="状态">
                    <NTag :type="statusColorMap[resident.status]">
                      {{ ResidentStatusLabels[resident.status] }}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="建档时间">
                    {{ dayjs(resident.createdAt).format('YYYY-MM-DD') }}
                  </NDescriptionsItem>
                </NDescriptions>
              </div>
            </NTabPane>

            <NTabPane name="precepts" tab="受戒记录">
              <div class="pt-4 space-y-4">
                <NCard :bordered="false" class="bg-amber-50/50">
                  <div class="flex items-center gap-3 mb-4">
                    <BookOpen class="w-5 h-5 text-amber-600" />
                    <span class="font-semibold text-amber-900">受戒信息</span>
                  </div>
                  <NGrid :cols="2" :x-gap="16" :y-gap="12">
                    <div>
                      <div class="text-sm text-gray-500 mb-1">受戒日期</div>
                      <div class="text-gray-800 font-medium">{{ dayjs(resident.preceptsDate).format('YYYY年MM月DD日') }}</div>
                    </div>
                    <div>
                      <div class="text-sm text-gray-500 mb-1">受戒寺院</div>
                      <div class="text-gray-800 font-medium">{{ resident.preceptsTemple }}</div>
                    </div>
                    <div v-if="resident.ordinationCeremonyDate">
                      <div class="text-sm text-gray-500 mb-1">正式受戒典礼</div>
                      <div class="text-gray-800 font-medium">{{ dayjs(resident.ordinationCeremonyDate).format('YYYY年MM月DD日') }}</div>
                    </div>
                  </NGrid>
                </NCard>
                <NCard :bordered="false" class="bg-amber-50/50">
                  <div class="flex items-center gap-3 mb-4">
                    <Clock class="w-5 h-5 text-amber-600" />
                    <span class="font-semibold text-amber-900">考察期记录</span>
                  </div>
                  <NGrid :cols="2" :x-gap="16" :y-gap="12">
                    <div>
                      <div class="text-sm text-gray-500 mb-1">考察开始日期</div>
                      <div class="text-gray-800 font-medium">{{ dayjs(resident.probationStartDate).format('YYYY年MM月DD日') }}</div>
                    </div>
                    <div v-if="resident.probationEndDate">
                      <div class="text-sm text-gray-500 mb-1">考察结束日期</div>
                      <div class="text-gray-800 font-medium">{{ dayjs(resident.probationEndDate).format('YYYY年MM月DD日') }}</div>
                    </div>
                  </NGrid>
                </NCard>
              </div>
            </NTabPane>

            <NTabPane name="attendance" tab="考勤记录">
              <div class="pt-4">
                <div v-if="calendarLoading" class="text-center py-16 text-gray-400">
                  加载考勤记录中...
                </div>
                <template v-else>
                  <NCard :bordered="false" class="bg-amber-50/50 mb-4">
                    <NGrid :cols="4" :x-gap="16">
                      <NGridItem>
                        <div class="text-center">
                          <div class="text-2xl font-bold text-green-600">{{ attendanceCalendar?.totalPresent || 0 }}</div>
                          <div class="text-xs text-gray-500 mt-1">出勤</div>
                        </div>
                      </NGridItem>
                      <NGridItem>
                        <div class="text-center">
                          <div class="text-2xl font-bold text-red-600">{{ attendanceCalendar?.totalAbsent || 0 }}</div>
                          <div class="text-xs text-gray-500 mt-1">缺勤</div>
                        </div>
                      </NGridItem>
                      <NGridItem>
                        <div class="text-center">
                          <div class="text-2xl font-bold text-amber-600">{{ attendanceCalendar?.totalLeave || 0 }}</div>
                          <div class="text-xs text-gray-500 mt-1">请假</div>
                        </div>
                      </NGridItem>
                      <NGridItem>
                        <div class="text-center">
                          <div class="text-2xl font-bold text-amber-700">{{ attendanceCalendar?.attendanceRate || 0 }}%</div>
                          <div class="text-xs text-gray-500 mt-1">出勤率</div>
                        </div>
                      </NGridItem>
                    </NGrid>
                  </NCard>

                  <NCard :bordered="false">
                    <div class="flex items-center justify-between mb-4">
                      <NSpace>
                        <Calendar class="w-5 h-5 text-amber-600" />
                        <span class="font-semibold text-amber-900">
                          {{ resident?.dharmaName }} 考勤日历
                        </span>
                      </NSpace>
                      <NSpace>
                        <NButton size="small" text @click="prevMonth">
                          <ChevronLeft class="w-4 h-4" />
                        </NButton>
                        <span class="font-medium text-gray-700 min-w-[100px] text-center">
                          {{ calendarYear }}年{{ calendarMonth + 1 }}月
                        </span>
                        <NButton size="small" text @click="nextMonth">
                          <ChevronRight class="w-4 h-4" />
                        </NButton>
                      </NSpace>
                    </div>

                    <div class="grid grid-cols-7 gap-1 mb-2">
                      <div
                        v-for="weekday in weekdayLabels"
                        :key="weekday"
                        class="text-center text-xs font-medium text-gray-500 py-2"
                      >
                        {{ weekday }}
                      </div>
                    </div>

                    <div class="grid grid-cols-7 gap-1">
                      <div
                        v-for="(cell, idx) in calendarDays"
                        :key="idx"
                        class="min-h-[90px] p-2 rounded-lg border transition-colors"
                        :class="cell.day ? (
                          (cell.morning === 'absent' || cell.evening === 'absent')
                            ? 'bg-red-50 border-red-200'
                            : (cell.morning || cell.evening)
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-100 hover:bg-amber-50'
                        ) : 'bg-transparent border-transparent'"
                      >
                        <template v-if="cell.day">
                          <div class="text-xs font-medium text-gray-600 mb-2">{{ cell.day }}</div>
                          <div class="space-y-1">
                            <div
                              v-if="cell.morning"
                              class="flex items-center gap-1 text-xs rounded px-1.5 py-0.5"
                              :class="{
                                'bg-green-100 text-green-700': cell.morning === 'present',
                                'bg-red-100 text-red-700': cell.morning === 'absent',
                                'bg-amber-100 text-amber-700': cell.morning === 'leave'
                              }"
                            >
                              <CheckCircle2 v-if="cell.morning === 'present'" class="w-3 h-3" />
                              <XCircle v-else-if="cell.morning === 'absent'" class="w-3 h-3" />
                              <Clock v-else class="w-3 h-3" />
                              早{{ AttendanceStatusLabels[cell.morning as keyof typeof AttendanceStatusLabels] }}
                            </div>
                            <div
                              v-if="cell.evening"
                              class="flex items-center gap-1 text-xs rounded px-1.5 py-0.5"
                              :class="{
                                'bg-green-100 text-green-700': cell.evening === 'present',
                                'bg-red-100 text-red-700': cell.evening === 'absent',
                                'bg-amber-100 text-amber-700': cell.evening === 'leave'
                              }"
                            >
                              <CheckCircle2 v-if="cell.evening === 'present'" class="w-3 h-3" />
                              <XCircle v-else-if="cell.evening === 'absent'" class="w-3 h-3" />
                              <Clock v-else class="w-3 h-3" />
                              晚{{ AttendanceStatusLabels[cell.evening as keyof typeof AttendanceStatusLabels] }}
                            </div>
                            <div v-if="!cell.morning && !cell.evening" class="text-xs text-gray-400">
                              无记录
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
                        有出勤记录
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-red-100 border border-red-300"></span>
                        有缺勤记录
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>
                        无考勤记录
                      </div>
                    </div>
                  </NCard>
                </template>
              </div>
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
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

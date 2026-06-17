<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
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
  NCheckbox
} from 'naive-ui'
import {
  Sunrise,
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  CheckSquare
} from 'lucide-vue-next'

const renderIcon = (icon: any) => {
  return () => h(icon, { size: 18 })
}
import { batchCreateAttendance, getAttendance } from '@/api/attendance'
import { getRegistrations } from '@/api/registration'
import { getResidents } from '@/api/resident'
import type {
  AttendanceStatus,
  AttendanceSession,
  AttendanceBatchItem,
  GuestRegistration,
  Resident,
  MonkType
} from '../../shared/types'
import { AttendanceStatusLabels as statusLabels, AttendanceSessionLabels as sessionLabels } from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const selectedDate = ref<number>(Date.now())
const selectedSession = ref<AttendanceSession>('morning')
const allPresent = ref(false)

const guests = ref<GuestRegistration[]>([])
const residents = ref<Resident[]>([])
const existingAttendance = ref<Map<string, AttendanceStatus>>(new Map())

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
    
    guests.value = regData.data.filter(g => g.status === 'active')
    residents.value = resData.data.filter(r => r.status === 'active' || r.status === 'probation')
    
    existingAttendance.value = new Map(
      attData.data.map(a => [a.monkId, a.status])
    )
    
    buildAttendanceList()
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
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
  } catch (error) {
    message.error('保存失败')
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

onMounted(loadData)
</script>

<template>
  <div>
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
</template>

<style scoped>
:deep(.n-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
</style>

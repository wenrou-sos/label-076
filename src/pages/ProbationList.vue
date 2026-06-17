<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  NCard,
  NDataTable,
  NProgress,
  NTag,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NDatePicker,
  NSpace,
  useMessage,
  NPopconfirm,
  NEmpty
} from 'naive-ui'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  CalendarDays,
  User
} from 'lucide-vue-next'
import {
  getProbationResidents,
  completeProbation
} from '@/api/resident'
import type {
  Resident
} from '../../shared/types'
import { ResidentStatusLabels as statusLabels } from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const residents = ref<Resident[]>([])
const showCompleteModal = ref(false)
const selectedId = ref<string | null>(null)
const ordinationDate = ref<number | null>(null)

const PROBATION_MIN_DAYS = 90
const PROBATION_MAX_DAYS = 180

interface ProbationResident extends Resident {
  daysPassed: number
  progress: number
  isNearEnd: boolean
  isOverdue: boolean
  remainingDays: number
}

const probationResidents = computed(() => {
  return residents.value.map(r => {
    const startDate = dayjs(r.probationStartDate)
    const daysPassed = dayjs().diff(startDate, 'day')
    const progress = Math.min(100, Math.max(0, (daysPassed / PROBATION_MAX_DAYS) * 100))
    const isNearEnd = daysPassed >= PROBATION_MIN_DAYS
    const isOverdue = daysPassed > PROBATION_MAX_DAYS
    const remainingDays = PROBATION_MAX_DAYS - daysPassed
    
    return {
      ...r,
      daysPassed,
      progress,
      isNearEnd,
      isOverdue,
      remainingDays
    }
  })
})

const loadData = async () => {
  loading.value = true
  try {
    residents.value = await getProbationResidents()
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const openCompleteModal = (id: string) => {
  selectedId.value = id
  ordinationDate.value = Date.now()
  showCompleteModal.value = true
}

const handleComplete = async () => {
  if (!selectedId.value || !ordinationDate.value) {
    message.warning('请填写完整信息')
    return
  }
  try {
    await completeProbation(selectedId.value, {
      ordinationCeremonyDate: dayjs(ordinationDate.value).format('YYYY-MM-DD')
    })
    message.success('考察期已完成')
    showCompleteModal.value = false
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const getProgressColor = (resident: ProbationResident) => {
  if (resident.isOverdue) return '#F5222D'
  if (resident.isNearEnd) return '#FAAD14'
  return '#52C41A'
}

const columns: any[] = [
  {
    title: '法名',
    key: 'dharmaName',
    render: (row: Resident) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center' }, [
          h(User, { class: 'w-4 h-4 text-amber-600' })
        ]),
        h('span', { class: 'font-medium text-amber-900' }, row.dharmaName)
      ])
  },
  {
    title: '考察开始日期',
    key: 'probationStartDate',
    render: (row: Resident) =>
      h('div', { class: 'flex items-center gap-2 text-gray-600' }, [
        h(CalendarDays, { class: 'w-4 h-4 text-amber-500' }),
        dayjs(row.probationStartDate).format('YYYY-MM-DD')
      ])
  },
  {
    title: '已考察天数',
    key: 'daysPassed',
    width: 150,
    render: (row: ProbationResident) =>
      h('div', { class: 'text-center' }, [
        h('div', { class: 'text-lg font-bold text-amber-700' }, row.daysPassed),
        h('div', { class: 'text-xs text-gray-500' }, `约 ${Math.floor(row.daysPassed / 30)} 个月`)
      ])
  },
  {
    title: '考察进度',
    key: 'progress',
    width: 250,
    render: (row: ProbationResident) =>
      h('div', { class: 'space-y-2' }, [
        h(NProgress, {
          percentage: row.progress,
          color: getProgressColor(row),
          showIndicator: true,
          height: 12
        }),
        h('div', { class: 'flex justify-between text-xs text-gray-500' }, [
          '3个月',
          row.isOverdue ? h(NTag, { type: 'error', size: 'small' }, { default: () => '已超期' }) :
          row.isNearEnd ? h(NTag, { type: 'warning', size: 'small' }, { default: () => '即将到期' }) :
          h('span', `还剩 ${row.remainingDays} 天`),
          '6个月'
        ])
      ])
  },
  {
    title: '状态',
    key: 'status',
    render: (row: Resident) =>
      h(NSpace, { size: 'small' }, {
        default: () => [
          row.status === 'probation' &&
            h(NTag, { type: 'warning' }, { default: () => statusLabels[row.status] })
        ]
      })
  },
  {
    title: '操作',
    width: 150,
    render: (row: Resident) =>
      h(NPopconfirm, { onPositiveClick: () => openCompleteModal(row.id) }, {
        trigger: () =>
          h(NButton, {
            type: 'primary',
            size: 'small'
          }, {
            icon: () => h(CheckCircle, { class: 'w-4 h-4' }),
            default: () => '完成考察'
          }),
        default: () => '确认该僧人已完成考察期，可以转为正式常住？'
      })
  }
]

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-semibold text-amber-900">考察期管理</h2>
          <NSpace size="small">
            <div class="flex items-center gap-1 text-sm">
              <Clock class="w-4 h-4 text-gray-400" />
              <span class="text-gray-500">考察期 3-6 个月</span>
            </div>
            <div v-if="probationResidents.some(r => r.isOverdue)" class="flex items-center gap-1 text-sm">
              <AlertTriangle class="w-4 h-4 text-red-500" />
              <span class="text-red-500">{{ probationResidents.filter(r => r.isOverdue).length }} 人超期</span>
            </div>
            <div v-if="probationResidents.some(r => r.isNearEnd && !r.isOverdue)" class="flex items-center gap-1 text-sm">
              <AlertTriangle class="w-4 h-4 text-amber-500" />
              <span class="text-amber-500">{{ probationResidents.filter(r => r.isNearEnd && !r.isOverdue).length }} 人即将到期</span>
            </div>
          </NSpace>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false">
      <div v-if="loading" class="text-center py-12 text-gray-400">
        加载中...
      </div>
      <div v-else-if="probationResidents.length === 0" class="py-16">
        <NEmpty description="暂无考察期僧人" />
      </div>
      <NDataTable
        v-else
        :columns="columns"
        :data="probationResidents"
        :bordered="false"
        :pagination="{ pageSize: 10 }"
      />
    </NCard>

    <NModal
      v-model:show="showCompleteModal"
      preset="card"
      title="完成考察期"
      style="width: 400px"
    >
      <NForm label-placement="top">
        <NFormItem label="请选择正式受戒日期" required>
          <NDatePicker
            v-model:value="ordinationDate"
            type="date"
            placeholder="选择日期"
            value-format="timestamp"
            class="w-full"
          />
        </NFormItem>
        <p class="text-sm text-gray-500">
          确认后，该僧人将从考察期转为正式常住状态。
        </p>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCompleteModal = false">取消</NButton>
          <NButton type="primary" @click="handleComplete">确认完成</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
:deep(.n-card),
:deep(.n-data-table) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
:deep(.n-progress-line) {
  border-radius: 6px;
}
</style>

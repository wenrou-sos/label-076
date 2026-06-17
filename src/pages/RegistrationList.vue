<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NSelect,
  NButton,
  NSpace,
  NCard,
  NTag,
  useMessage,
  NPopconfirm,
  NInputNumber,
  NGrid,
  NGridItem
} from 'naive-ui'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BedDouble,
  Clock,
  X
} from 'lucide-vue-next'
import {
  getRegistrations,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  assignBed,
  startProbation
} from '@/api/registration'
import { getDormitories } from '@/api/dormitory'
import type {
  GuestRegistration,
  GuestStatus,
  Dormitory
} from '../../shared/types'
import { GuestStatusLabels } from '../../shared/types'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const registrations = ref<GuestRegistration[]>([])
const dormitories = ref<Dormitory[]>([])
const keyword = ref('')
const statusFilter = ref<string | null>(null)

const showModal = ref(false)
const showBedModal = ref(false)
const editingId = ref<string | null>(null)
const bedAssignId = ref<string | null>(null)

const form = ref({
  dharmaName: '',
  originalTemple: '',
  preceptsCertificateNo: '',
  arrivalDate: null as number | null,
  expectedStayDays: 7
})

const bedForm = ref({
  roomNumber: '',
  bedNumber: ''
})

const statusOptions = [
  { label: '全部', value: null },
  { label: '在住', value: 'active' },
  { label: '已离寺', value: 'checked_out' },
  { label: '考察期', value: 'probation' },
  { label: '已转常住', value: 'resident' }
]

type TagType = 'default' | 'error' | 'warning' | 'info' | 'success' | 'primary'

const statusColorMap: Record<GuestStatus, TagType> = {
  active: 'success',
  checked_out: 'default',
  probation: 'warning',
  resident: 'primary'
}

const filteredData = computed(() => {
  return registrations.value.filter(item => {
    const matchKeyword = !keyword.value ||
      item.dharmaName.includes(keyword.value) ||
      item.originalTemple.includes(keyword.value)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const loadData = async () => {
  loading.value = true
  try {
    const [regData, dormData] = await Promise.all([
      getRegistrations(),
      getDormitories()
    ])
    registrations.value = regData.data
    dormitories.value = dormData
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingId.value = null
  form.value = {
    dharmaName: '',
    originalTemple: '',
    preceptsCertificateNo: '',
    arrivalDate: Date.now(),
    expectedStayDays: 7
  }
  showModal.value = true
}

const openEditModal = (item: GuestRegistration) => {
  editingId.value = item.id
  form.value = {
    dharmaName: item.dharmaName,
    originalTemple: item.originalTemple,
    preceptsCertificateNo: item.preceptsCertificateNo || '',
    arrivalDate: new Date(item.arrivalDate).getTime(),
    expectedStayDays: item.expectedStayDays
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.dharmaName || !form.value.originalTemple || !form.value.arrivalDate) {
    message.warning('请填写必填项')
    return
  }
  try {
    const data = {
      dharmaName: form.value.dharmaName,
      originalTemple: form.value.originalTemple,
      preceptsCertificateNo: form.value.preceptsCertificateNo || undefined,
      arrivalDate: dayjs(form.value.arrivalDate).format('YYYY-MM-DD'),
      expectedStayDays: form.value.expectedStayDays
    }
    if (editingId.value) {
      await updateRegistration(editingId.value, data)
      message.success('更新成功')
    } else {
      await createRegistration(data)
      message.success('创建成功')
    }
    showModal.value = false
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteRegistration(id)
    message.success('注销成功')
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const openBedModal = (item: GuestRegistration) => {
  bedAssignId.value = item.id
  bedForm.value = {
    roomNumber: item.roomNumber || '',
    bedNumber: item.bedNumber || ''
  }
  showBedModal.value = true
}

const handleAssignBed = async () => {
  if (!bedAssignId.value || !bedForm.value.roomNumber || !bedForm.value.bedNumber) {
    message.warning('请填写房间和床位')
    return
  }
  try {
    await assignBed(bedAssignId.value, bedForm.value)
    message.success('分配成功')
    showBedModal.value = false
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const handleStartProbation = async (id: string) => {
  try {
    await startProbation(id)
    message.success('已开始考察期')
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const columns: any[] = [
  { title: '法名', key: 'dharmaName' },
  { title: '出家寺庙', key: 'originalTemple' },
  { title: '戒牒编号', key: 'preceptsCertificateNo', default: '-' },
  {
    title: '到寺日期',
    key: 'arrivalDate',
    render: (row: GuestRegistration) => dayjs(row.arrivalDate).format('YYYY-MM-DD')
  },
  { title: '预计住期', key: 'expectedStayDays', render: (row: GuestRegistration) => `${row.expectedStayDays} 天` },
  {
    title: '状态',
    key: 'status',
    render: (row: GuestRegistration) =>
      h(NTag, { type: statusColorMap[row.status] }, { default: () => GuestStatusLabels[row.status] })
  },
  {
    title: '房间/床位',
    render: (row: GuestRegistration) => row.roomNumber ? `${row.roomNumber}-${row.bedNumber}` : '-'
  },
  {
    title: '操作',
    render: (row: GuestRegistration) =>
      h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => openEditModal(row)
          }, { icon: () => h(Edit2) }),
          row.status === 'active' && h(NButton, {
            size: 'small',
            type: 'success',
            quaternary: true,
            onClick: () => openBedModal(row)
          }, { icon: () => h(BedDouble) }),
          row.status === 'active' && h(NButton, {
            size: 'small',
            type: 'warning',
            quaternary: true,
            onClick: () => handleStartProbation(row.id)
          }, { icon: () => h(Clock) }),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error',
              quaternary: true
            }, { icon: () => h(Trash2) }),
            default: () => '确定要注销该挂单记录吗？'
          })
        ]
      })
  }
]

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <NGrid :cols="4" :x-gap="12" :y-gap="12">
        <NGridItem>
          <NInput
            v-model:value="keyword"
            placeholder="搜索法名/寺庙"
            clearable
            @input="loadData"
          >
            <template #prefix>
              <Search class="w-4 h-4 text-gray-400" />
            </template>
          </NInput>
        </NGridItem>
        <NGridItem>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            @update:value="loadData"
          />
        </NGridItem>
        <NGridItem :span="2" class="text-right">
          <NButton type="primary" @click="openCreateModal">
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
            新增挂单
          </NButton>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard :bordered="false">
      <NDataTable
        :loading="loading"
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="card"
      :title="editingId ? '编辑挂单' : '新增挂单'"
      style="width: 500px"
    >
      <NForm label-placement="top">
        <NFormItem label="法名" required>
          <NInput v-model:value="form.dharmaName" placeholder="请输入法名" />
        </NFormItem>
        <NFormItem label="出家寺庙" required>
          <NInput v-model:value="form.originalTemple" placeholder="请输入出家寺庙" />
        </NFormItem>
        <NFormItem label="戒牒编号">
          <NInput v-model:value="form.preceptsCertificateNo" placeholder="请输入戒牒编号" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="12">
          <NFormItem label="到寺日期" required>
            <NDatePicker
              v-model:value="form.arrivalDate"
              type="date"
              placeholder="选择日期"
              value-format="timestamp"
              class="w-full"
            />
          </NFormItem>
          <NFormItem label="预计住期(天)" required>
            <NInputNumber v-model:value="form.expectedStayDays" :min="1" class="w-full" />
          </NFormItem>
        </NGrid>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="showBedModal"
      preset="card"
      title="分配床位"
      style="width: 400px"
    >
      <NForm label-placement="top">
        <NFormItem label="房间号" required>
          <NSelect
            v-model:value="bedForm.roomNumber"
            :options="[...new Set(dormitories.map(d => d.roomNumber))].map(r => ({ label: r, value: r }))"
            placeholder="选择房间"
          />
        </NFormItem>
        <NFormItem label="床位号" required>
          <NSelect
            v-model:value="bedForm.bedNumber"
            :options="[...new Set(dormitories.map(d => d.bedNumber))].map(b => ({ label: b, value: b }))"
            placeholder="选择床位"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBedModal = false">取消</NButton>
          <NButton type="primary" @click="handleAssignBed">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
:deep(.n-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
:deep(.n-data-table) {
  border-radius: 12px;
}
</style>

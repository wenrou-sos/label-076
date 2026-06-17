<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NTag,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  useMessage,
  NInputNumber
} from 'naive-ui'
import { Plus, Edit2, BedDouble, Wrench, Users } from 'lucide-vue-next'
import {
  getDormitories,
  createDormitory,
  updateDormitory
} from '@/api/dormitory'
import type {
  Dormitory,
  DormitoryStatus
} from '../../shared/types'
import { DormitoryStatusLabels as statusLabels } from '../../shared/types'

const message = useMessage()
const loading = ref(false)
const dormitories = ref<Dormitory[]>([])
const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  roomNumber: '',
  bedNumber: '',
  floor: 1,
  capacity: 1,
  status: 'available' as DormitoryStatus,
  notes: ''
})

const statusColorMap: Record<DormitoryStatus, string> = {
  available: 'border-green-400 bg-green-50',
  occupied: 'border-red-400 bg-red-50',
  maintenance: 'border-gray-400 bg-gray-50'
}

const statusTagColorMap: Record<DormitoryStatus, 'success' | 'error' | 'default'> = {
  available: 'success',
  occupied: 'error',
  maintenance: 'default'
}

const floors = computed(() => {
  const floorMap = new Map<number, Dormitory[]>()
  dormitories.value.forEach(dorm => {
    if (!floorMap.has(dorm.floor)) {
      floorMap.set(dorm.floor, [])
    }
    floorMap.get(dorm.floor)!.push(dorm)
  })
  return Array.from(floorMap.entries()).sort((a, b) => a[0] - b[0])
})

const statusOptions = [
  { label: '空闲', value: 'available' },
  { label: '已住', value: 'occupied' },
  { label: '维修中', value: 'maintenance' }
]

const loadData = async () => {
  loading.value = true
  try {
    const data = await getDormitories()
    dormitories.value = (data as any).data || data
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingId.value = null
  form.value = {
    roomNumber: '',
    bedNumber: '',
    floor: 1,
    capacity: 1,
    status: 'available',
    notes: ''
  }
  showModal.value = true
}

const openEditModal = (item: Dormitory) => {
  editingId.value = item.id
  form.value = {
    roomNumber: item.roomNumber,
    bedNumber: item.bedNumber,
    floor: item.floor,
    capacity: item.capacity,
    status: item.status,
    notes: item.notes || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.roomNumber || !form.value.bedNumber) {
    message.warning('请填写必填项')
    return
  }
  try {
    if (editingId.value) {
      await updateDormitory(editingId.value, form.value)
      message.success('更新成功')
    } else {
      await createDormitory(form.value)
      message.success('创建成功')
    }
    showModal.value = false
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

const getStatusIcon = (status: DormitoryStatus) => {
  switch (status) {
    case 'available':
      return h(BedDouble, { class: 'w-5 h-5 text-green-600' })
    case 'occupied':
      return h(Users, { class: 'w-5 h-5 text-red-600' })
    case 'maintenance':
      return h(Wrench, { class: 'w-5 h-5 text-gray-600' })
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-semibold text-amber-900">寮房管理</h2>
          <NSpace size="small">
            <div class="flex items-center gap-1 text-sm">
              <span class="w-3 h-3 rounded-full bg-green-400"></span>
              <span class="text-gray-600">空闲</span>
            </div>
            <div class="flex items-center gap-1 text-sm">
              <span class="w-3 h-3 rounded-full bg-red-400"></span>
              <span class="text-gray-600">已住</span>
            </div>
            <div class="flex items-center gap-1 text-sm">
              <span class="w-3 h-3 rounded-full bg-gray-400"></span>
              <span class="text-gray-600">维修中</span>
            </div>
          </NSpace>
        </div>
        <NButton type="primary" @click="openCreateModal">
          <template #icon>
            <Plus class="w-4 h-4" />
          </template>
          新增床位
        </NButton>
      </div>
    </NCard>

    <div v-if="loading" class="text-center py-12 text-gray-400">
      加载中...
    </div>

    <div v-else class="space-y-6">
      <div v-for="[floor, beds] in floors" :key="floor">
        <NCard :bordered="false" class="overflow-hidden">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-amber-800">{{ floor }} 楼</span>
              <span class="text-sm text-gray-500">
                共 {{ beds.length }} 个床位
              </span>
            </div>
          </template>
          <NGrid :cols="6" :x-gap="12" :y-gap="12">
            <NGridItem v-for="bed in beds" :key="bed.id">
              <div
                class="p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg"
                :class="statusColorMap[bed.status]"
                @click="openEditModal(bed)"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="font-semibold text-amber-900">
                    {{ bed.roomNumber }}-{{ bed.bedNumber }}
                  </span>
                  <component :is="getStatusIcon(bed.status)" />
                </div>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">楼层</span>
                    <span class="text-gray-700">{{ bed.floor }}F</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">容量</span>
                    <span class="text-gray-700">{{ bed.capacity }}人</span>
                  </div>
                  <div class="pt-2 border-t border-gray-200 mt-2">
                    <NTag :type="statusTagColorMap[bed.status]" size="small">
                      {{ statusLabels[bed.status] }}
                    </NTag>
                  </div>
                  <div v-if="bed.currentOccupantId" class="text-xs text-gray-500 pt-1">
                    住客ID: {{ bed.currentOccupantId }}
                  </div>
                </div>
              </div>
            </NGridItem>
          </NGrid>
        </NCard>
      </div>

      <div v-if="dormitories.length === 0" class="text-center py-16 text-gray-400">
        <BedDouble class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>暂无寮房数据，点击右上角添加床位</p>
      </div>
    </div>

    <NModal
      v-model:show="showModal"
      preset="card"
      :title="editingId ? '编辑床位' : '新增床位'"
      style="width: 450px"
    >
      <NForm label-placement="top">
        <NGrid :cols="2" :x-gap="12">
          <NFormItem label="房间号" required>
            <NInput v-model:value="form.roomNumber" placeholder="如：101" />
          </NFormItem>
          <NFormItem label="床位号" required>
            <NInput v-model:value="form.bedNumber" placeholder="如：A" />
          </NFormItem>
        </NGrid>
        <NGrid :cols="2" :x-gap="12">
          <NFormItem label="楼层" required>
            <NInputNumber v-model:value="form.floor" :min="1" class="w-full" />
          </NFormItem>
          <NFormItem label="容量(人)" required>
            <NInputNumber v-model:value="form.capacity" :min="1" class="w-full" />
          </NFormItem>
        </NGrid>
        <NFormItem label="状态">
          <NSelect
            v-model:value="form.status"
            :options="statusOptions"
            placeholder="选择状态"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="form.notes" type="textarea" placeholder="输入备注信息" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
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
</style>

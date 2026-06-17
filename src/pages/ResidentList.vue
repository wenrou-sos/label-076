<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NGrid,
  NGridItem,
  NTag,
  NInput,
  NSelect,
  NSpace,
  useMessage,
  NBadge,
  NEmpty
} from 'naive-ui'
import {
  Search,
  User,
  Briefcase,
  Calendar,
  ChevronRight
} from 'lucide-vue-next'
import { getResidents } from '@/api/resident'
import type {
  Resident,
  ResidentStatus
} from '../../shared/types'
import { ResidentStatusLabels, PositionOptions } from '../../shared/types'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const residents = ref<Resident[]>([])
const keyword = ref('')
const statusFilter = ref<string | null>(null)

const statusColorMap: Record<ResidentStatus, 'success' | 'warning' | 'error' | 'default'> = {
  probation: 'warning',
  active: 'success',
  suspended: 'error',
  left: 'default'
}

const statusOptions = [
  { label: '全部', value: null },
  { label: '考察期', value: 'probation' },
  { label: '常住', value: 'active' },
  { label: '暂停', value: 'suspended' },
  { label: '已离寺', value: 'left' }
]

const positionMap = new Map(PositionOptions.map(p => [p.value, p.label]))

const filteredData = computed(() => {
  return residents.value.filter(item => {
    const matchKeyword = !keyword.value ||
      item.dharmaName.includes(keyword.value) ||
      item.generationName.includes(keyword.value) ||
      item.tonsureMaster.includes(keyword.value)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const loadData = async () => {
  loading.value = true
  try {
    const response = await getResidents()
    residents.value = response.data
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const goToDetail = (id: string) => {
  router.push(`/residents/${id}`)
}

const getPositionLabel = (position?: string) => {
  if (!position) return '-'
  return positionMap.get(position) || position
}

onMounted(loadData)
</script>

<template>
  <div>
    <NCard :bordered="false" class="mb-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-amber-900">常住僧人</h2>
        <NSpace>
          <NInput
            v-model:value="keyword"
            placeholder="搜索法名/字辈/剃度师"
            clearable
            class="w-64"
          >
            <template #prefix>
              <Search class="w-4 h-4 text-gray-400" />
            </template>
          </NInput>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            @update:value="loadData"
            style="width: 150px"
          />
        </NSpace>
      </div>
    </NCard>

    <div v-if="loading" class="text-center py-12 text-gray-400">
      加载中...
    </div>

    <div v-else-if="filteredData.length === 0" class="py-16">
      <NEmpty description="暂无常住僧人数据" />
    </div>

    <NGrid v-else :cols="4" :x-gap="16" :y-gap="16">
      <NGridItem v-for="resident in filteredData" :key="resident.id">
        <NCard
          hoverable
          :bordered="false"
          class="resident-card cursor-pointer transition-all duration-300"
          @click="goToDetail(resident.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
              <User class="w-7 h-7 text-white" />
            </div>
            <NBadge :value="ResidentStatusLabels[resident.status]" :type="statusColorMap[resident.status]" />
          </div>
          <h3 class="text-lg font-semibold text-amber-900 mb-1">
            {{ resident.dharmaName }}
          </h3>
          <p class="text-sm text-gray-500 mb-4">
            {{ resident.generationName }} 字辈
          </p>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <User class="w-4 h-4 text-amber-500" />
              <span class="text-gray-500 w-16">剃度师：</span>
              <span class="truncate">{{ resident.tonsureMaster }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <Briefcase class="w-4 h-4 text-amber-500" />
              <span class="text-gray-500 w-16">职务：</span>
              <span>{{ getPositionLabel(resident.position) }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <Calendar class="w-4 h-4 text-amber-500" />
              <span class="text-gray-500 w-16">受戒：</span>
              <span>{{ dayjs(resident.preceptsDate).format('YYYY-MM-DD') }}</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <NTag :type="statusColorMap[resident.status]" size="small">
              {{ ResidentStatusLabels[resident.status] }}
            </NTag>
            <div class="flex items-center gap-1 text-amber-600 text-sm">
              查看详情
              <ChevronRight class="w-4 h-4" />
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped>
:deep(.n-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}
.resident-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(212, 165, 116, 0.15);
}
:deep(.n-badge .n-badge-slot) {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  ArrowLeft
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getResident } from '@/api/resident'
import type {
  Resident,
  ResidentStatus
} from '../../shared/types'
import { ResidentStatusLabels, PositionOptions } from '../../shared/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const resident = ref<Resident | null>(null)
const activeTab = ref('basic')

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
                <NCard :bordered="false" class="bg-amber-50/50 mb-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <Calendar class="w-5 h-5 text-amber-600" />
                      <span class="font-semibold text-amber-900">近期考勤</span>
                    </div>
                    <NButton size="small" type="primary" quaternary>
                      <template #icon>
                        <Edit3 class="w-4 h-4" />
                      </template>
                      查看全部
                    </NButton>
                  </div>
                </NCard>
                <div class="text-center py-12 text-gray-400">
                  <Calendar class="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>考勤记录功能开发中...</p>
                </div>
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

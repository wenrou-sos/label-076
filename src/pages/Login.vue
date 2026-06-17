<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCard,
  useMessage,
  NLoadingBarProvider
} from 'naive-ui'
import { User, Lock, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    message.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  try {
    await authStore.login({
      username: formData.username,
      password: formData.password
    })
    message.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    message.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.initAuth()
  if (authStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <NLoadingBarProvider>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
      </div>
      
      <NCard class="w-full max-w-md mx-4 relative z-10 shadow-2xl" content-style="padding: 48px;">
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
            <span class="text-4xl text-white font-bold">禅</span>
          </div>
          <h1 class="text-2xl font-bold text-amber-900 mb-2">寺院管理系统</h1>
          <p class="text-amber-600">僧人挂单与常住管理平台</p>
        </div>
        
        <NForm>
          <NFormItem label="用户名">
            <NInput
              v-model:value="formData.username"
              placeholder="请输入用户名"
              size="large"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <User class="w-5 h-5 text-amber-500" />
              </template>
            </NInput>
          </NFormItem>
          
          <NFormItem label="密码">
            <NInput
              v-model:value="formData.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <Lock class="w-5 h-5 text-amber-500" />
              </template>
            </NInput>
          </NFormItem>
          
          <NButton
            type="primary"
            size="large"
            block
            :loading="loading"
            @click="handleLogin"
            class="mt-4 h-12 text-lg"
          >
            <template #icon>
              <LogIn class="w-5 h-5" />
            </template>
            登 录
          </NButton>
        </NForm>
        
        <div class="mt-8 text-center text-sm text-amber-600">
          <p>测试账号：admin / password123</p>
          <p class="mt-1">客堂知客：receptionist / password123</p>
          <p class="mt-1">维那师：chanting / password123</p>
        </div>
      </NCard>
    </div>
  </NLoadingBarProvider>
</template>

<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="login-copy">
        <div class="login-copy__eyebrow">fortune-hub admin</div>
        <h1 class="login-copy__title">运营后台登录</h1>
        <p class="login-copy__text">
          这版后台已经接入管理员鉴权、菜单骨架、内容中心和商业化配置入口。
        </p>
      </div>

      <el-card class="login-card" shadow="never">
        <el-form label-position="top" @submit.prevent>
          <el-form-item label="管理员账号">
            <el-input v-model="form.username" placeholder="admin" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入管理员密码"
            />
          </el-form-item>

          <el-button type="primary" :loading="submitting" class="login-button" @click="handleLogin">
            登录后台
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useAdminSessionStore } from '../stores/admin-session';

const router = useRouter();
const adminSessionStore = useAdminSessionStore();
const submitting = ref(false);
const form = reactive({
  username: 'admin',
  password: 'fortune123',
});

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请先输入账号和密码');
    return;
  }

  try {
    submitting.value = true;
    await adminSessionStore.login(form.username, form.password);
    ElMessage.success('登录成功');
    void router.replace('/');
  } catch (error) {
    console.warn('admin login failed', error);
    ElMessage.error('登录失败，请检查账号密码');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: 40px;
  background:
    radial-gradient(circle at top left, rgba(127, 188, 255, 0.16), transparent 22%),
    linear-gradient(135deg, #f6f8fb 0%, #eef3f7 48%, #f8f4eb 100%);
}

.login-shell {
  display: grid;
  gap: 28px;
  max-width: 980px;
  margin: 0 auto;
  padding-top: 80px;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 420px);
}

.login-copy,
.login-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(23, 41, 64, 0.08);
}

.login-copy {
  display: grid;
  align-content: center;
  gap: 16px;
  padding: 40px;
}

.login-copy__eyebrow {
  font-size: 12px;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: #6b7a8f;
}

.login-copy__title {
  margin: 0;
  font-size: 46px;
  line-height: 1.1;
  color: #1b2a38;
}

.login-copy__text {
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: #5d6c7d;
}

.login-card {
  padding: 12px;
}

.login-button {
  width: 100%;
}

@media (max-width: 900px) {
  .login-shell {
    grid-template-columns: 1fr;
    padding-top: 24px;
  }
}
</style>

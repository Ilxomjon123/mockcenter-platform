<template>
  <div class="container">
    <div class="box">
      <h2>Kirish</h2>
      
      <label>Email</label>
      <input v-model="email" type="email" placeholder="email@example.com" />

      <label>Parol</label>
      <input v-model="password" type="password" placeholder="••••••••" />

      <button @click="handleSubmit">
        {{ isLoading ? 'Yuklanmoqda...' : 'Kirish' }}
      </button>

      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  await authStore.login(email.value, password.value);
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.box {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 40px;
  width: 600px;
  max-width: 90%;
}

h2 {
  color: #dc2626;
  font-size: 28px;
  text-align: center;
  margin-bottom: 30px;
}

label {
  display: block;
  margin: 15px 0 5px;
  color: #333;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #999;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background: #555;
}

.error {
  margin-top: 15px;
  padding: 12px;
  border-radius: 4px;
  text-align: center;
  background: #fee;
  color: #c00;
}
</style>
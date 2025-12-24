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

const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await fetch('http://localhost:8000/api/exam/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        key: password.value,
      }),
    });

    console.log(response);
    
    const data = await response.json();

    console.log(data);
    

    if (response.ok && data.data.access_token) {
      localStorage.setItem('token', data.data.token);
      router.push('/listening');
    } else {
      errorMessage.value = data.message || 'Login yoki parol noto\'g\'ri';
    }
  } catch (error) {
    errorMessage.value = 'Serverga ulanishda xatolik';
  } finally {
    isLoading.value = false;
  }
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
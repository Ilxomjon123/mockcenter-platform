import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL;

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  const token = ref(localStorage.getItem('token') || '');
  const isLoading = ref(false);
  const errorMessage = ref('');

  const login = async (email: string, password: string) => {
    errorMessage.value = '';
    isLoading.value = true;

    try {
      const response = await fetch(`${API_URL}/api/exam/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          key: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.data.access_token) {
        token.value = data.data.access_token;
        localStorage.setItem('token', data.data.access_token);
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

  const logout = () => {
    token.value = '';
    localStorage.removeItem('token');
    router.push('/login');
  };

  return { token, isLoading, errorMessage, login, logout };
});
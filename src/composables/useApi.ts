import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

// Axios instance yaratish
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor - har bir so'rovga token qo'shish
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - xatolarni boshqarish
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const useApi = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Helper to extract error message from unknown error
  const getErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || err.message || 'Xatolik yuz berdi'
    }
    if (err instanceof Error) {
      return err.message
    }
    return 'Xatolik yuz berdi'
  }

  // GET so'rovi
  const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AxiosResponse<T> = await axiosInstance.get(url, config)
      return response.data
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // POST so'rovi
  const post = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AxiosResponse<T> = await axiosInstance.post(url, data, config)
      return response.data
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // PUT so'rovi
  const put = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AxiosResponse<T> = await axiosInstance.put(url, data, config)
      return response.data
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // PATCH so'rovi
  const patch = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config)
      return response.data
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // DELETE so'rovi
  const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AxiosResponse<T> = await axiosInstance.delete(url, config)
      return response.data
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    get,
    post,
    put,
    patch,
    del,
    isLoading,
    error,
    axiosInstance, // Direct access if needed
  }
}

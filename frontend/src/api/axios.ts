import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

// This will be set by the ClerkTokenProvider after Clerk initializes
let getTokenFn: (() => Promise<string | null>) | null = null

export const setTokenGetter = (fn: () => Promise<string | null>) => {
  getTokenFn = fn
}

apiClient.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // No active session — request proceeds without auth header
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized — Clerk session may have expired')
    }
    return Promise.reject(error)
  }
)

export default apiClient

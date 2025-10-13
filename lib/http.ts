"use client"

import axios from "axios"

type PendingRequest = {
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}

let isRefreshing = false
let queue: PendingRequest[] = []

function getToken() {
  try {
    return localStorage.getItem("token") || null
  } catch {
    return null
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem("token", token)
  } catch {}
}

function clearAuth() {
  try {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  } catch {}
}

export const http = axios.create({ withCredentials: true })

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as any)["Authorization"] = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {}
    if (!response || !config) throw error
    const status = response.status
    const requestUrl = String((config as any).url || "")
    const isRefreshEndpoint = requestUrl.includes("/api/external/auth/refresh")

    if (status === 401 && !(config as any).__isRetryRequest) {
      if (isRefreshEndpoint) {
        clearAuth()
        queue.forEach((p) => p.reject(error))
        queue = []
        throw error
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        })
          .then(() => {
            ;(config as any).__isRetryRequest = true
            return http(config)
          })
          .catch((err) => {
            throw err
          })
      }

      isRefreshing = true
      ;(config as any).__isRetryRequest = true
      try {
        const current = getToken()
        if (!current) {
          clearAuth()
          queue.forEach((p) => p.reject(error))
          queue = []
          throw error
        }
        const res = await http.post("/api/external/auth/refresh", { token: current })
        const nextToken = res?.data?.data?.token
        if (nextToken) setToken(nextToken)
        queue.forEach((p) => p.resolve(undefined))
        queue = []
        return http(config)
      } catch (e) {
        clearAuth()
        queue.forEach((p) => p.reject(e))
        queue = []
        throw e
      } finally {
        isRefreshing = false
      }
    }

    throw error
  }
)

export default http

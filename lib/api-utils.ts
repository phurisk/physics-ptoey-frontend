import http from "@/lib/http"


const API_BASE_URL =
  (process.env.NEXT_PUBLIC_ELEARNING_BASE_URL as string | undefined) ||
  (process.env.API_BASE_URL as string | undefined) ||
  "http://localhost:3000/"

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase()
  const headers = options.headers as Record<string, string> | undefined
  const data = options.body ? (() => { try { return JSON.parse(options.body as any) } catch { return options.body } })() : undefined
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  switch (method) {
    case "GET":
      return http.get(url, { headers })
    case "POST":
      return http.post(url, data, { headers })
    case "PUT":
      return http.put(url, data, { headers })
    case "PATCH":
      return http.patch(url, data, { headers })
    case "DELETE":
      return http.delete(url, { headers })
    default:
      return http.request({ url, method, data, headers })
  }
}

export async function getMyCourses() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const response = await apiCall(`/api/my-courses?userId=${user.id}`)
    return (response as any).data
  } catch (error) {
    console.error("Failed to fetch my courses:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดคอร์ส",
      courses: [],
      count: 0,
    };
  }
}

export async function validateToken(token: string) {
  try {
    const response = await apiCall("/api/external/auth/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
    return (response as any).data
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, message: "เกิดข้อผิดพลาดในการตรวจสอบ token" };
  }
}

export async function refreshToken(token: string) {
  try {
    const response = await apiCall("/api/external/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
    return (response as any).data
  } catch (error) {
    console.error("Token refresh error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการรีเฟรช token" };
  }
}

export async function exchangeToken(userId: string, lineId?: string) {
  try {
    const response = await apiCall("/api/external/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ userId, lineId }),
    })
    return (response as any).data
  } catch (error) {
    console.error("Token exchange error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการแลก token" };
  }
}

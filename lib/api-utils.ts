// Utility functions สำหรับการเรียก API ที่ต้องใช้ authentication
// เชื่อมต่อกับ e-learning backend

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/";

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}${
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      }`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // when token expired, remove and redirect to login
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // may redirect to login or refresh page
  }

  return response;
}

export async function getMyCourses() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await apiCall(`/api/my-courses?userId=${user.id}`);
    return await response.json();
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
    });
    return await response.json();
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
    });
    return await response.json();
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
    });
    return await response.json();
  } catch (error) {
    console.error("Token exchange error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการแลก token" };
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main

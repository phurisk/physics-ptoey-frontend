# Frontend Authentication Implementation

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. สร้าง Authentication Utility Functions
**ไฟล์**: `lib/api-auth-utils.ts`

สร้าง helper functions สำหรับ API routes:
- `getAuthHeaders(req)` - ดึง cookie และ authorization headers
- `hasAuth(req)` - เช็คว่ามี authentication หรือไม่
- `unauthorizedResponse()` - สร้าง 401 response
- `proxyErrorResponse()` - สร้าง error response
- `checkApiConfig()` - เช็คว่า API_BASE_URL ถูกตั้งค่าแล้ว

### 2. อัพเดท API Proxy Routes ให้ส่ง Auth Headers

#### Orders APIs
- ✅ `/api/orders` (GET, POST) - ส่ง cookie + authorization header
- ✅ `/api/orders/[id]` (GET) - ส่ง cookie + authorization header

#### My Courses APIs
- ✅ `/api/my-courses` (GET) - ส่ง cookie + authorization header
- ✅ `/api/my-courses/course/[id]` (GET) - ส่ง cookie + authorization header

#### Progress APIs
- ✅ `/api/progress` (GET, DELETE) - ส่ง cookie + authorization header
- ✅ `/api/update-progress` (POST) - ส่ง cookie + authorization header

#### Reviews APIs
- ✅ `/api/reviews` (GET, POST) - ส่ง cookie + authorization header

#### Payment APIs
- ✅ `/api/payments/upload-slip` (POST) - ส่ง cookie + authorization header

## 🔄 การทำงานของ Authentication

### 1. Client-Side Authentication
- ใช้ `AuthProvider` component ที่มีอยู่แล้ว
- เก็บ token ใน localStorage
- HTTP client (axios) มี interceptor ที่ส่ง `Authorization: Bearer <token>` อัตโนมัติ

### 2. API Routes (Server-Side)
- รับ authentication จาก 2 ที่:
  - **Cookie**: สำหรับ server-side rendering และ session-based auth
  - **Authorization Header**: สำหรับ client-side API calls
- Proxy request ไปยัง backend พร้อม headers ทั้งหมด

### 3. Backend Validation
- Backend (e-learning-backoffice) จะตรวจสอบ authentication
- ถ้าไม่ผ่าน จะ return 401 หรือ 403
- Frontend จะแสดง error หรือ redirect ไป login

## 📊 Flow Diagram

```
User Browser
    |
    | (with token in localStorage)
    |
    v
Frontend API Route (/api/orders)
    |
    | getAuthHeaders(req)
    | - cookie: ...
    | - authorization: Bearer <token>
    |
    v
Backend API (/api/orders)
    |
    | requireAuth() check
    |
    v
Response (200 or 401)
```

## 🔐 Authentication Methods Supported

### 1. LINE Login
- OAuth flow via LINE
- Token exchange (`/api/external/auth/line`)
- Token stored in localStorage

### 2. Email/Password Login
- Credentials authentication
- JWT token returned
- Token stored in localStorage

### 3. Session Cookie
- NextAuth.js session
- Cookie-based authentication
- Automatically sent in requests

## 📝 Code Examples

### Frontend API Call (Client)
```typescript
// In React component
import http from "@/lib/http"

// http.interceptors automatically adds Authorization header
const response = await http.get("/api/orders")
```

### API Route (Server)
```typescript
import { getAuthHeaders, checkApiConfig } from "@/lib/api-auth-utils"

export async function GET(req: Request) {
  const config = checkApiConfig()
  if (!config.ok) return config.error
  
  const authHeaders = getAuthHeaders(req)
  // authHeaders includes both cookie and authorization
  
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    headers: authHeaders
  })
  
  return NextResponse.json(await res.json())
}
```

## 🎯 Protected Routes Summary

### User Private APIs (ต้อง login)
- `/api/orders` - ดูและสร้าง orders
- `/api/my-courses` - ดู courses ที่ซื้อแล้ว
- `/api/progress` - ดูและอัพเดท progress
- `/api/update-progress` - อัพเดท progress
- `/api/reviews` - สร้างและดู reviews
- `/api/payments/upload-slip` - อัพโหลดสลิปชำระเงิน

### Public APIs (ไม่ต้อง login)
- `/api/courses` - ดู course list
- `/api/ebooks` - ดู ebook list
- `/api/posts` - ดู posts
- `/api/auth/*` - Authentication endpoints

## 🔧 Environment Variables Required

```env
# Backend API URL
API_BASE_URL=https://your-backend-api.com

# LINE Login (Optional)
NEXT_PUBLIC_LINE_CLIENT_ID=your_line_client_id
```

## ⚠️ Error Handling

### 401 Unauthorized
```json
{
  "success": false,
  "error": "กรุณาเข้าสู่ระบบ"
}
```
**Frontend Action**: Redirect to login page

### 403 Forbidden
```json
{
  "success": false,
  "error": "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
}
```
**Frontend Action**: Show error message

### 502 Bad Gateway
```json
{
  "success": false,
  "message": "Failed to connect to API"
}
```
**Frontend Action**: Show connection error

## 🚀 การทดสอบ

### 1. ทดสอบ Login
```bash
# ใช้ browser console
localStorage.setItem('token', 'your-jwt-token')
```

### 2. ทดสอบ API Call
```javascript
// In browser console
fetch('/api/orders', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
}).then(r => r.json()).then(console.log)
```

### 3. ทดสอบ Logout
```javascript
// In browser console
localStorage.removeItem('token')
localStorage.removeItem('user')
```

## 📚 Related Files

### Authentication
- `components/auth-provider.tsx` - Auth Context Provider
- `lib/external-auth.ts` - External auth helpers
- `lib/http.ts` - HTTP client with auto-auth

### API Routes
- `app/api/orders/route.ts`
- `app/api/my-courses/route.ts`
- `app/api/progress/route.ts`
- `app/api/update-progress/route.ts`
- `app/api/reviews/route.ts`
- `app/api/payments/upload-slip/route.ts`

## ✨ Benefits

1. **Consistent Auth**: ทุก API route ส่ง auth headers แบบเดียวกัน
2. **Easy Maintenance**: ใช้ utility functions แทนการเขียนซ้ำ
3. **Better Security**: Backend ตรวจสอบ auth ทุก request
4. **Type Safety**: TypeScript types สำหรับ auth utils
5. **Error Handling**: Consistent error responses

## 🔄 Next Steps (Optional)

1. เพิ่ม token refresh mechanism
2. เพิ่ม auth middleware สำหรับ Next.js app directory
3. เพิ่มการ cache user profile
4. เพิ่ม loading states สำหรับ auth operations
5. เพิ่ม retry logic สำหรับ 401 errors

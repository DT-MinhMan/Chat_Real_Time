# 🚀 Real-Time Chat Application

Ứng dụng chat thời gian thực (Real-time Chat) được xây dựng nhằm mô phỏng hệ thống nhắn tin hiện đại với khả năng cập nhật tin nhắn ngay lập tức, quản lý người dùng và giao diện thân thiện.

## 🧠 Giới thiệu

Dự án này cho phép người dùng:
- Đăng ký / đăng nhập tài khoản
- Gửi và nhận tin nhắn theo thời gian thực
- Hiển thị trạng thái online/offline
- Tương tác mượt mà như các ứng dụng chat hiện đại

## 🏗️ Công nghệ sử dụng

### Frontend
- React / Next.js
- TypeScript
- Zustand (quản lý state)
- TailwindCSS / UI Library

### Backend
- Node.js / Express
- WebSocket / Socket.IO (real-time communication)
- RESTful API

### Database
- MongoDB / PostgreSQL (tùy implementation)

## ⚙️ Tính năng chính

- 🔐 Authentication (JWT)
- 💬 Chat real-time (Socket)
- 🟢 Online status tracking
- 📦 Quản lý state với Zustand
- 🔔 Thông báo (toast)

## 📂 Cấu trúc thư mục
```
Chat_Real_Time/
│
├── client/ # Frontend (React / Next.js)
│ ├── src/
│ │ ├── components/ # UI components (ChatBox, Sidebar, Message...)
│ │ ├── pages/ # Pages / Routes
│ │ ├── store/ # Zustand state management
│ │ ├── services/ # API calls (auth, chat...)
│ │ ├── hooks/ # Custom hooks
│ │ ├── utils/ # Helper functions
│ │ ├── types/ # TypeScript types/interfaces
│ │ └── assets/ # Images, icons
│ │
│ ├── public/ # Static files
│ └── package.json
│
├── server/ # Backend (Node.js / Express)
│ ├── src/
│ │ ├── controllers/ # Xử lý request/response
│ │ ├── routes/ # API routes
│ │ ├── models/ # Database models
│ │ ├── middleware/ # Auth, error handling
│ │ ├── sockets/ # Socket.IO handlers (real-time)
│ │ ├── services/ # Business logic
│ │ ├── utils/ # Helper functions
│ │ └── config/ # DB, env config
│ │
│ ├── .env
│ └── package.json
│
├── README.md
└── package.json
```
## 🚀 Cài đặt & chạy dự án

### 1. Clone project
```bash
git clone https://github.com/DT-MinhMan/Chat_Real_Time.git
cd Chat_Real_Time
```
### 2. Cài dependencies
Frontend
```
cd client
npm install
```
Backend
```
cd server
npm install
```
### 3. Chạy ứng dụng
Backend
```
npm run dev
```
Frontend
```
npm run dev
```
### 4. Truy cập
```
http://localhost:3000
```
🔑 Biến môi trường
Tạo file .env trong server:
```
PORT=5000
MONGO_URI=your_database_url
JWT_SECRET=your_secret_key
```
### 📸 Demo

LINK DEMO FRONTEND: https://chat-real-timefrontend.vercel.app/

LINK DEMO BACKEND: https://chat-real-time-backend.onrender.com

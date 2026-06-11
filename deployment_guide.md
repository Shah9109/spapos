# SpaPOS SaaS - Deployment Guide

This guide describes how to deploy the **SpaPOS** SaaS application: the React frontend on **Vercel** and the Node.js/Express backend on **Render**.

---

## 🖥️ Frontend Deployment (Vercel)

Vercel is optimized for frontend hosting. Follow these steps to deploy the `admin-panel`:

### 1. Connect Git Repository
1. Log in to the [Vercel Dashboard](https://vercel.com/).
2. Click **Add New > Project**.
3. Import your Git repository containing the `spapos` project folder.

### 2. Configure Project Settings
- **Framework Preset**: Select **Vite** (Vercel usually auto-detects this).
- **Root Directory**: Click *Edit* and select **`admin-panel`** (this is important, as the frontend code is in this subdirectory).
- **Build Command**: `npm run build` (default).
- **Output Directory**: `dist` (default).

### 3. Add Environment Variables
Add the following key-value pairs in the **Environment Variables** section:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | `500088214386-eokjlr3c0nufvb0o0i32i9qll92qpt94.apps.googleusercontent.com` | Google OAuth Client ID |
| `VITE_API_URL` | `https://[your-render-app-url].onrender.com/api/v1` | URL pointing to your Render backend API |

### 4. Deploy
- Click **Deploy**. Vercel will build the React application and output your production domain (e.g., `https://spapos-admin.vercel.app`).

---

## ⚙️ Backend Deployment (Render)

Render hosts Node.js apps. Follow these steps to deploy the `backend`:

### 1. Create a New Web Service
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New + > Web Service**.
3. Connect your Git repository.

### 2. Configure Web Service Settings
- **Name**: `spapos-backend`
- **Region**: Choose a region closest to your users.
- **Branch**: `main` (or your active branch)
- **Root Directory**: **`backend`** (points to the server subdirectory)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

### 3. Add Environment Variables
Click **Advanced** and add the following keys under **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `DATABASE_URL` | *[Your MongoDB Atlas Connection URI]* | MongoDB connection string |
| `JWT_SECRET` | *[Enter a long random string]* | Secret key for signing authorization tokens |
| `JWT_EXPIRES_IN` | `1d` | Session expiry time |

### 4. Deploy and Prevent Sleep Mode (Keep-Alive)
- Click **Create Web Service**. Render will provision and launch your server.
- **Keep-Alive Configuration**: Since you are using Render's Free tier, the service goes to sleep after 15 minutes of inactivity. 
- To prevent this, go to [cron-job.org](https://cron-job.org/) (or UptimeRobot):
  - Set up a cron task to send an **HTTP GET request** to:
    `https://[your-render-app-url].onrender.com/ping`
  - Set the execution interval to run **every 5 minutes** continuously 24/7.

# <img src="frontend/public/logo.svg" alt="MoneyIO Logo" width="32" height="32" style="vertical-align: middle;"> MoneyIO

This repository contains both the **Django backend** and the **Vue (Vite) frontend** in a single monorepo structure.

## **Project Structure**

    moneyio/
      backend/    # Django project
      frontend/   # Vue 3 + Vite project

***

## **1. Backend Setup (Django)**

### **Install dependencies**

```bash
cd backend
conda create -n moneyio python=3.10
conda activate moneyio
pip install -r requirements.txt     # or: pip install django djangorestframework django-cors-headers
```

### **Run migrations**

```bash
python manage.py migrate
```

### **Start development server**

```bash
python manage.py runserver
# Backend runs on: http://localhost:8000
```

***

## **2. Frontend Setup (Vue + Vite)**

### **Install dependencies**

```bash
cd frontend
bun install
```

### **Start development server**

```bash
bun dev
# Frontend runs on: http://localhost:5173
```

***

## **3. API Base URL**

Frontend expects the backend API on:

    http://localhost:8000/api

You can adjust this in:

    frontend/.env.development

Example:

    VITE_API_BASE=http://localhost:8000/api

***

## **4. Production Build (Frontend)**

### **Build**

```bash
cd frontend
bun run build
```

This creates a production bundle in `frontend/dist/`.

### **(Optional) Copy build into Django static folder**

If you want Django/Nginx to serve the frontend:

```bash
# from repository root
rm -rf backend/static/frontend
mkdir -p backend/static/frontend
cp -R frontend/dist/* backend/static/frontend/
```

***

## **5. Run Both (Convenient Option)**

You can run both servers manually:

```bash
# Terminal 1
cd backend
python manage.py runserver

# Terminal 2
cd frontend
bun dev
```

***

## **6. Requirements**

*   Python 3.10+
*   Node.js 20+
*   Bun.js

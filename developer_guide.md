# SpaPOS - Developer Guide & Documentation

This document provides a comprehensive overview of the architecture, stack, current feature set, and proposed feature extensions for the **SpaPOS** SaaS platform.

---

## 🛠 Tech Stack

The application is built using the following technologies:
* **Frontend Core**: React 19 + TypeScript + Vite (Single Page Application architecture).
* **Styling**: TailwindCSS 3 + custom Claymorphic CSS variable overrides.
* **State Management**: Zustand (with Persist middleware for browser `localStorage` syncing).
* **Routing**: React Router DOM 7.
* **Database Persistency**: 
  - **Cloud State**: Replicated locally via Zustand localStorage persistence.
  - **Local Disk Storage**: Browser File System Access API (`showDirectoryPicker`) for direct directory read/write access + browser IndexedDB for directory handle serialization.
* **Icons**: Lucide React.

---

## 📦 Current Features

### 1. Multi-Tenant POS System
* Direct cart management supporting both Services (with therapist assignees) and Physical Products.
* Automatic tax, discount percentage computations, and payment method selectors.
* Thermal receipt printer preview layouts with dynamic logo/coordinates rendering.

### 2. Multi-Tier Membership Manager
* Supports customer profiles with pre-assigned memberships (Monthly, Quarterly, 6-Month, Yearly, Custom).
* Tracking of remaining service credits (attendance count left) with auto-decrement on POS booking checkout.

### 3. Staff & HR Management
* Role-based staff registration: **SPA_OWNER**, **MANAGER**, **RECEPTIONIST**, **THERAPIST**, **ACCOUNTANT**.
* Daily attendance tracker (Present, Absent, Half Day, On Leave) and automated basic/net payroll calculation engine.

### 4. Inventory & Suppliers
* Real-time product counts with low-stock alerts.
* Supplier management sheets and Purchase Order sheets.

### 5. Multi-Theme engine
* **Flat Classic**: Sleek, clean flat panels.
* **Soft Claymorphism**: Pastels, rounded borders, soft double-inset shadows, and glassmorphic sidebars.

### 6. Hybrid Storage Engine
* **Online Cloud Mode**: State is saved to standard cloud database (represented by `localStorage`).
* **Offline Local Disk Mode**: Saves database changes reactively to `spapos_db.json` in a custom computer folder chosen by the Spa Owner.
* **Privacy/Exclusion Gate**: Walk-in customer invoice items details are stripped before saving to Cloud database, storing them *only* on the local disk. Totals, count statistics, and invoice numbers are synced to both to keep revenue metrics accurate.

---

## 🚀 Proposed Future Enhancements (What to Add Next)

### 1. Dynamic UPI QR-Code Payments
* **Feature**: Generate dynamic payment QR codes at POS checkout matching the invoice subtotal.
* **Implementation**: Integrate a UPI link generator (e.g. `upi://pay?pa=spa@upi&pn=SpaPOS&am=150.00`) and render it dynamically inside the checkout dialog and receipt print view.

### 2. Twilio WhatsApp/SMS Reminders
* **Feature**: Automated receipt messages and booking slot alerts sent to clients.
* **Implementation**: Configure API webhook triggers inside `store.ts` actions to fire SMS payloads on checkout or reservation events.

### 3. Therapist Performance & Commission Matrix
* **Feature**: Automated therapist commissions depending on services rendered.
* **Implementation**: Add commission percentage fields to `Staff` profiles and compile commission payouts dynamically inside the HR/Finance reporting tabs.

### 4. Multi-Branch Franchise Synchronization
* **Feature**: Central management console for owners managing multiple distinct branches.
* **Implementation**: Map database indices with `branchId` filters and configure cross-origin replication schemes in the state manager.

### 5. Progressive Web App (PWA) Offline Service Workers
* **Feature**: Make the page load and function without any internet connection.
* **Implementation**: Configure `vite-plugin-pwa` strategies to cache all script assets, utilizing IndexedDB queues to store actions that sync with the server once connectivity is restored.

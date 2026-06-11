# Phase 4: Electron Desktop POS & Billing Engine Architecture

## 1. Overview
The SpaPOS Desktop application is built using Electron, React, and SQLite (or IndexedDB/Local Storage via localforage) to provide a resilient, high-performance point-of-sale system that can operate offline and automatically sync with the central SaaS backend.

## 2. Core Technologies
- **Framework:** Electron (with IPC for node integration)
- **Frontend UI:** React 19, TailwindCSS, Zustand (State Management)
- **Local Database:** SQLite3 (via better-sqlite3 in Electron main process) / LocalStorage fallback
- **Offline Sync:** Custom Sync Engine (queue-based background sync)
- **Peripheral Integration:** Node USB/Serial libraries for Thermal Printers and Barcode Scanners.

## 3. System Architecture

### 3.1 Components
- **Main Process (Node.js):** 
  - Manages application lifecycle.
  - Handles hardware integrations (Printers, Scanners).
  - Connects to local SQLite database.
  - Executes background sync workers.
- **Renderer Process (React):**
  - Provides the POS UI (Cart, Product Search, Billing).
  - Communicates with Main process via IPC bridge (`contextBridge`).

### 3.2 Offline-First Sync Strategy
1. **Initial Load:** 
   - Downloads Master Data (Products, Services, Combos, Taxes, Staff) from Cloud via REST APIs.
   - Stores locally in SQLite.
2. **Offline Operation:** 
   - All searches, cart operations, and invoice generation read from the local database.
   - Newly created Invoices and Payments are saved locally with `sync_status = 'PENDING'`.
3. **Auto Sync Engine:**
   - Background worker checks internet connectivity every X seconds.
   - When online, fetches records where `sync_status = 'PENDING'`.
   - Pushes to the Cloud Backend.
   - On success, updates local `sync_status = 'SYNCED'`.

## 4. Hardware Integration
- **Barcode Scanner:** Acts as keyboard input. The React UI listens for rapid keypresses ending with `Enter` to capture barcodes and trigger add-to-cart.
- **Thermal Receipt Printer:** Electron main process communicates directly with the printer via USB or Network using raw ESC/POS commands or standard OS print dialogs (silent printing).

## 5. Security & Permissions
- **Local Data Encryption:** Sensitive data (if any) is encrypted at rest using SQLCipher.
- **Role-Based Access Control (RBAC):**
  - Cashiers/Receptionists can create bills but cannot view total revenue/profit or issue refunds without Manager override.
  - Financial data visibility is controlled via JWT payload and local state flags.

## 6. Data Models (Local Schema)

### Local Products Table
```sql
CREATE TABLE local_products (
  id TEXT PRIMARY KEY,
  name TEXT,
  barcode TEXT,
  price REAL,
  stock_quantity INTEGER,
  last_updated DATETIME
);
```

### Local Invoices Table
```sql
CREATE TABLE local_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  total_amount REAL,
  status TEXT,
  sync_status TEXT DEFAULT 'PENDING',
  created_at DATETIME
);
```

## 7. Sync Flow Diagram
```text
[ Electron React UI ]
        |
        v (IPC)
[ Electron Main Process ] -> Writes to -> [ Local SQLite DB ]
        |                                        |
        | (Background Worker)                    v
        +--------------------------------> [ Cloud Backend API ] -> [ PostgreSQL ]
```

## 8. Deployment
- **Packaging:** Electron Builder or Electron Forge to create executables for Windows (`.exe`) and macOS (`.dmg`/`.app`).
- **Auto-Updates:** Integrated `electron-updater` to pull new releases from AWS S3 or GitHub Releases.
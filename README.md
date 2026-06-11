# Key4Health WMS
### Warehouse Management System — v1.0

A full-featured, browser-based warehouse management system built for Key4Health. Deployable to Vercel and accessible from anywhere in the world.

---

## 🔐 Default Login Credentials

| Name | Username | Password | Role |
|------|----------|----------|------|
| Warren Thomas | `warren` | `warren123` | Manager |
| Divan | `divan` | `divan123` | Warehouse |

> **Change passwords immediately after first login** via User Management → Change Password.

---

## ✅ Features

### All Staff
- **Stock In** — scan barcode (Code 128 / EAN / QR / any format) to receive stock
- **Stock Out** — scan to dispatch with automatic FEFO (First Expiry, First Out)
- **Inventory** — view all products, batch details, stock levels per location
- **Expiry Alerts** — real-time dashboard of expired / critical / warning batches
- **Deliveries** — view dispatch log and vehicle assignments

### Managers Only
- **Reports** — movement charts, inventory value, CSV export (transactions + inventory)
- **User Management** — add/edit/deactivate staff, set roles, change passwords
- **Product Management** — add/edit/delete products with barcodes, SKUs, min stock
- **Vehicle / Fleet** — manage vehicles, registration plates, and drivers

---

## 🚀 Deploy to GitHub + Vercel

### Step 1 — Push to GitHub

```bash
cd k4h-wms
git init
git add .
git commit -m "Initial commit — Key4Health WMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/k4h-wms.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your `k4h-wms` GitHub repository
4. Framework: **Vite** (auto-detected)
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy**

Your app will be live at `https://k4h-wms.vercel.app` (or your custom domain).

### Step 3 — Custom Domain (optional)

In Vercel → Project Settings → Domains → add your domain (e.g. `wms.key4health.co.za`).

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 📦 Tech Stack

- **React 18** + **Vite** — fast, modern frontend
- **Recharts** — stock movement charts
- **date-fns** — date formatting and expiry calculations
- **localStorage** — client-side persistence (no backend required for now)
- **Vercel** — zero-config global deployment

---

## 🔒 Data Storage

Currently uses **localStorage** in the browser — data is stored per device/browser. 

When you're ready to connect to a real server/database, the `AppContext.jsx` file is the single source of truth — replace the `load()`/`save()` functions with API calls to your backend (Node.js/PostgreSQL recommended).

---

## 📋 Barcode Scanner

The system supports **any USB/Bluetooth barcode scanner** that acts as a keyboard (HID mode). This covers:
- Code 128 ✅
- EAN-13, EAN-8 ✅
- QR Code ✅
- Code 39, Code 93 ✅
- DataMatrix ✅

Simply focus the scanner input field and scan — the scanner sends the barcode followed by Enter, which the app handles automatically.

---

## 📁 Project Structure

```
src/
├── contexts/
│   ├── AppContext.jsx      ← Global state, all business logic
│   └── AuthContext.jsx     ← Login / session management
├── components/
│   ├── UI.jsx              ← Shared components (Modal, Badge, Scanner, etc.)
│   └── AppLayout.jsx       ← Reference layout (unused, see App.jsx)
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── StockIn.jsx
│   ├── StockOut.jsx
│   ├── Inventory.jsx
│   ├── ExpiryAlerts.jsx
│   ├── Deliveries.jsx
│   ├── Reports.jsx
│   └── UserManagement.jsx
├── data/
│   └── seed.js             ← Initial products, batches, vehicles, users
├── App.jsx                 ← Root component + routing
├── main.jsx
└── index.css               ← All styles
```

---

## 📞 Support

Built for Key4Health by Herman in conjuntion with Claude (Anthropic). For backend integration or feature additions, hand this codebase to a developer — it's clean, well-structured React and ready to be extended.

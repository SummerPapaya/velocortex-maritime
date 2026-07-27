<div align="center">

# 🚢 VeloCortex AI
### Global Maritime & Intermodal Container Track-and-Trace Intelligence Platform

[![React 19](https://img.shields.io/badge/React-19.0-blue.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite 6](https://img.shields.io/badge/Vite-6.2-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Powered_by-Google_Gemini-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)

<p align="center">
  🌐 <b><a href="README.md">🇺🇸 English</a></b> | <a href="README_zh.md">🇨🇳 简体中文 (Chinese)</a>
</p>

<p align="center">
  <b>Next-Generation Maritime & Intermodal Supply Chain Command Center</b><br>
  Real-time vessel and container tracking, predictive ETA analytics, demurrage risk mitigation, IoT telemetry (with optional specialized cold-chain monitoring), and AI-driven route optimization.
</p>

[Key Features](#--key-features) • [Architecture](#--system-architecture) • [Tech Stack](#--technology-stack) • [Quick Start](#--quick-start) • [Export Engine](#--multi-format-export-engine) • [i18n Localization](#--bilingual-localization)

</div>

---

## 🌟 Overview

In modern global maritime logistics and intermodal supply chains, end-to-end real-time visibility is essential. Unforeseen terminal congestion, port bottleneck delays, container demurrage risks, or environmental deviations (such as temperature fluctuations in perishable cargo) can disrupt operations and cause substantial financial losses.

**VeloCortex AI** bridges the visibility gap across global shipping lanes and major oceanic corridors. By integrating **real-time Iridium satellite telemetry**, **interactive maritime mapping**, and **Google Gemini AI predictive analytics**, VeloCortex delivers comprehensive track-and-trace capabilities for cargo vessels, standard containers, and specialized reefers—transforming raw data streams into actionable supply chain intelligence.

```
+-----------------------------------------------------------------------------------+
|                            VELOCORTEX AI COMMAND CENTER                           |
|                                                                                   |
|   [ 🛰️ Iridium IoT Telemetry ] ---> [ 🚢 Global Fleet Map ] ---> [ 🧠 Gemini AI ] |
|            |                                |                           |         |
|            v                                v                           v         |
|  * Active Container & Fleet Tracking  * Port Bottleneck & Dwell Analytics         |
|  * Real-Time IoT Sensor Telemetry     * Demurrage & Detention Risk Mitigation     |
|  * Specialized Reefer Cold-Chain Mod  * Gemini AI Predictive Route Optimization   |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

### 🌐 1. Live Maritime & Intermodal Command Dashboard
* **Interactive Fleet Visualizer:** Monitor container ships in real time across global shipping corridors (Maersk, MSC, CMA CGM, Hapag-Lloyd, Evergreen, ONE, ZIM).
* **Multi-Carrier Search & Filtering:** Instant filtering by Carrier Line, Operational Status (`IN_TRANSIT`, `TEMP_EXCURSION`, `PORT_CONGESTION`, `CUSTOMS_HOLD`, `BERTHED`), or special identifier (PO#, Invoice#, BOL#, Container Number).
* **Live Container Management (CRUD):** Add custom containers to the live tracking dashboard, edit telemetry parameters on the fly, remove retired containers, or reset back to initial demo simulation states with a single click.

### ❄️ 2. Biopharma Cold-Chain IoT Telemetry
* **Precision Reefer Monitoring:** Track internal temperatures down to 0.1°C against strict SLA target thresholds.
* **Environmental & Integrity Sensors:** Continuous monitoring of relative humidity (% RH), internal battery voltages, physical shock events (G-force spikes), and automated optical gantry door seal verifications.
* **Instant Excursion Alerts:** Visual pulse notifications and priority triage when thermal drift threatens perishable cargo.

### 🧠 3. Gemini AI Predictive Risk Analytics
* **Automated Demurrage & Detention Calculation:** Predicts financial exposure in USD before vessels dock at congested berths.
* **AI Route Optimization:** Evaluates weather patterns, terminal gate queues, and customs clearance delays to recommend speed adjustments or alternative discharge terminals.
* **Zero-Trust Backend Routing:** All LLM inference requests are securely proxied through a Node.js/Express server layer (`/api/*`), ensuring zero API key exposure in client browsers.

### 📋 4. Bulk Manifest Lookup & Multi-Format Export Engine
* **Omni-Identifier Batch Processing:** Paste hundreds of comma, space, or newline-separated identifiers simultaneously (supports mixing POs, Invoices, BOLs, and Container Numbers).
* **Dual-Mode Data Export:**
  * 📊 **Excel (.xlsx) - Spreadsheet Ready:** Formatted workbooks with custom column styling, visual SLA headers, and operational summaries generated via SheetJS (`xlsx`).
  * 📄 **Universal CSV (.csv) - EDI/ERP Compatible:** Clean, UTF-8 comma-separated datasets ready for instant ingestion into SAP, Oracle, or custom logistics EDI pipelines.
* **Unified Export Dropdown:** Clean, accessible split-button dropdown menu with instant preview tooltips.

### 🌍 5. Native Bilingual Localization (i18n)
* **English & Simplified Chinese (中文):** Full interface translation supporting global trade operations between Asian manufacturing hubs and Western destination ports.
* **Dynamic Currency & SLA Formatting:** Localized terminology for customs holds, terminal berths, and shipping documents.

---

## 🏗️ System Architecture

VeloCortex AI is built as a high-performance **full-stack modern web application** optimized for containerized cloud deployment (Google Cloud Run / Docker).

```
┌───────────────────────────────────────────────────────────────────┐
│                        Client Layer (Vite 6)                      │
│   React 19 • TypeScript • Tailwind CSS • Lucide Icons • Recharts  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  HTTP / REST JSON
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Server Layer (Express v4)                    │
│      Port 3000 Ingress • Vite Middleware • API Security Proxy     │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  Server-Side SDK (@google/genai)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Google Gemini AI                          │
│     Predictive Demurrage Models • Supply Chain Anomaly Engine     │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe reactive UI components & hooks |
| **Styling & Layout** | [Tailwind CSS 4.1](https://tailwindcss.com/) | Mobile-first utility styling & responsive animations |
| **Motion & Transitions** | [Motion](https://motion.dev/) (`motion/react`) | Fluid card expansions and route transitions |
| **Data Visualization** | [Recharts 3.10](https://recharts.org/) + [Lucide Icons](https://lucide.dev/) | Telemetry charts, temperature logs, & symbology |
| **Spreadsheet Export** | [SheetJS (`xlsx`)](https://sheetjs.com/) | Client-side generation of `.xlsx` and `.csv` reports |
| **Backend API Server** | [Node.js](https://nodejs.org/) + [Express 4](https://expressjs.com/) | Production server & secure Gemini API proxying |
| **AI / LLM Engine** | [@google/genai 2.4](https://www.npmjs.com/package/@google/genai) | Official Google Gen AI SDK for telemetry inference |
| **Build & Bundling** | [Vite 6](https://vitejs.dev/) + [esbuild](https://esbuild.github.io/) | Fast HMR dev server & single-file CJS server bundling |

---

## 🏁 Quick Start

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **bun** package manager
* A valid **Google Gemini API Key** (for predictive AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/velocortex-ai.git
cd velocortex-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and insert your server-side API keys:
```bash
cp .env.example .env
```

Open `.env` and configure:
```env
# Server-side Gemini API Key (Never exposed to the client browser)
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Start Development Server
Launch both the Express API backend and the Vite development server on port `3000`:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build & Deployment

VeloCortex AI uses a unified build pipeline that compiles both the frontend React application and the backend TypeScript Express server into standalone, container-ready artifacts:

```bash
# Clean and generate production bundle
npm run build

# Start the production server
npm run start
```
The build command outputs static UI assets to `dist/` and compiles `server.ts` into a self-contained CommonJS bundle at `dist/server.cjs`, ensuring zero ES Module relative path resolution issues in production cloud environments.

---

## 🌐 Bilingual Localization

Switch languages dynamically in the application without reloading or losing state, or switch between our documentation languages:
* 📖 **Documentation:** Read this guide in **[🇨🇳 简体中文 (Simplified Chinese)](README_zh.md)** or **[🇺🇸 English](README.md)**.
* 🇺🇸 **English App Interface:** Standard international logistics maritime terminology.
* 🇨🇳 **中文 App Interface (Simplified Chinese):** Optimized for transpacific freight forwarders, terminal operators, and port authorities (港口拥堵, 冷链监控, 滞箱费风险预测).

---

## 🤝 Contributing

We welcome contributions from logistics specialists, IoT engineers, and full-stack developers!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the GNU Affero General Public License v3.0 (AGPL-3.0). See `LICENSE` for more information.

<p align="center">
  Built with ❤️ for Global Maritime & Intermodal Supply Chain Excellence.
</p>

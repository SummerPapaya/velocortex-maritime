<div align="center">

# 🚢 VeloCortex AI 智联物控
### 全球集装箱物流与海运多式联运实时追踪智慧调度中心

[![React 19](https://img.shields.io/badge/React-19.0-blue.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite 6](https://img.shields.io/badge/Vite-6.2-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Powered_by-Google_Gemini-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)

<p align="center">
  🌐 <a href="README.md">🇺🇸 English (英文)</a> | <b><a href="README_zh.md">🇨🇳 简体中文</a></b>
</p>

<p align="center">
  <b>新一代全球海运与多式联运智慧供应链调度中心</b><br>
  提供全球船舶与集装箱实时追踪、ETA 预测分析、滞期费风险主动干预、全栈物联网遥测（含特种冷链温控扩展模块）以及基于 AI 的智能航线与港口调度。
</p>

[核心功能](#--核心功能) • [系统架构](#--系统架构) • [技术栈](#--技术栈) • [快速开始](#--快速开始) • [导出引擎](#--多格式导出引擎) • [双语支持](#--双语国际化)

</div>

---

## 🌟 系统概览

在现代跨国供应链与海运物流体系中，端到端的在途实时透明度至关重要。不可预见的码头港口拥堵、物流枢纽转运延误、集装箱滞期费溢出风险，以及特殊货物的温控或震动异常，都会对国际贸易与供应链交付带来巨大的挑战和经济损失。

**VeloCortex AI 智联物控** 打通了跨太平洋航线、大西洋航线以及全球主要海事咽喉要道的物流信息壁垒。通过深度融合 **实时 Iridium 卫星物联网遥测**、**高精度海事交互地图** 与 **Google Gemini AI 预测性分析引擎**，VeloCortex 为全球干线货轮、标准集装箱及特种冷藏箱提供了全方位的 Track-and-Trace 实时追踪能力，将海量底层 IoT 数据流转化为可执行的供应链商业决策与调度指令。

```
+-----------------------------------------------------------------------------------+
|                           VELOCORTEX AI 智联物控指挥中心                            |
|                                                                                   |
|   [ 🛰️ Iridium 卫星遥测 ] ---> [ 🚢 全球舰队与航线大屏 ] ---> [ 🧠 Gemini AI 引擎 ] |
|            |                                  |                           |       |
|            v                                  v                           v       |
|  * 全球集装箱与干线船舶在途追踪    * 港口拥堵与码头排队实况监测        * 滞港滞期费风险主动预判   |
|  * 全栈物联网 IoT 传感器遥测监控   * 门封完整性与物理重力冲击检测      * 航线履约 SLA 审计        |
|  * 特种冷藏箱冷链温控监控模块      * 动态档案与 PO/Invoice 业务关联    * 智能路径与调度优化建议   |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 核心功能

### 🌐 1. 实时海运及多式联运控制台大屏
* **全球舰队交互式可视化：** 实时监控穿梭于全球主要物流走廊（马士革 Maersk, 地中海 MSC, 达飞 CMA CGM, 赫伯罗特 Hapag-Lloyd, 长荣 Evergreen, 海洋 ONE, 以星 ZIM）的货运集装箱船队。
* **多维度筛选与秒级检索：** 支持按承运船东、运行状态（`海运在途`、`温度超限`、`港口拥堵`、`海关扣留`、`靠泊卸货`）或业务关联单号（采购订单 PO#、发票号 Invoice#、海运提单 BOL#、集装箱号 Container#）进行深度过滤与联合查询。
* **集装箱实时档案管理 (CRUD)：** 一键将自定义集装箱纳入实时监控大屏、在线编辑或模拟环境传感器参数、剔除已签收结案单号，或直接重置为初始演示沙盒数据。

### ❄️ 2. 生物医药级冷链 IoT 传感器监控
* **0.1°C 高精度温度追踪：** 全天候监控冷藏集装箱（Reefer）内部核心温度，严格比对高价值货物的温控 SLA 靶向红线。
* **多维环境与结构安全遥测：** 实时监控箱内相对湿度（% RH）、物联网智能设备终端电池电压、物理冲击（G 力异常峰值），并联动 OCR 自动化龙门架核验货柜电子封条完整性。
* **异常温漂突发告警：** 遇冷链断链或温控越界风险时，系统立刻触发高亮视觉脉冲警告并推进工单化分级处置。

### 🧠 3. Gemini AI 预测性风险分析与避险
* **自动测算滞港与滞期费 (Demurrage & Detention)：** 结合船期与泊位拥堵排队数据，在船舶靠泊前提前测算美元滞期费风险曝露金额。
* **AI 智能航线调度与重定向：** 实时综合分析极端气象形态、码头闸口通过率与海关放行时效，为轮机长及调度员提供航速修正或替换港口卸料的优化建议。
* **零信任服务端推理路由：** 所有大语言模型（LLM）推理请求均通过 Node.js/Express 后端代理层 (`/api/*`) 完成安全加密通信，彻底避免 API Key 暴露于前端浏览器。

### 📋 4. 海量单号协同查询与多格式导出引擎
* **全要素智能批量解析：** 支持一键粘贴或拖拽数以百计的逗号、空格或换行分隔符清单，系统能自动识别混合输入的采购订单号、发票编号、提单号及集装箱箱号。
* **双通道工业级报表导出：**
  * 📊 **Excel (.xlsx) 表格格式：** 通过 SheetJS (`xlsx`) 生成内嵌专业样式、SLA 合规性状态标签及统计分析报表的企业级电子表格。
  * 📄 **通用 CSV (.csv) 格式：** 导出符合国际标准、不乱码的纯文本数据文件，无缝对接 SAP、Oracle 及企业内部定制 EDI / ERP 供应链数据总线。
* **多功能下拉导出菜单：** 界面采用极简交互的分体式按钮与下拉式操作选项，内嵌详尽的数据结构说明提示框。

### 🌍 5. 国际化双语支持 (i18n)
* **中文简体 / 英文无缝切换：** 全栈界面词条双语覆盖，专为连接亚洲生产制造基地与欧美目的港业务调度团队打造。
* **本地化商业与物流专业术语：** 针对海关查验、码头作业、多式联运及货代单证等专业词汇进行精准语境校对。

---

## 🏗️ 系统架构

VeloCortex AI 采用现代 **前后端一体化全栈 Web 架构** 构建，完美适配容器化云原生部署（Google Cloud Run / Docker）。

```
┌───────────────────────────────────────────────────────────────────┐
│                        前端交互层 (Vite 6)                         │
│   React 19 • TypeScript • Tailwind CSS • Lucide Icons • Recharts  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  HTTP / REST JSON
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                      后端服务层 (Express v4)                      │
│      Port 3000 单端口代理 • Vite 资产路由 • API 鉴权与安全防护       │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  服务端 SDK (@google/genai)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Google Gemini AI                          │
│     预测性滞期费计算模型 • 智慧供应链异常诊断与航线建议引擎          │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

| 技术分类 | 采用框架 / 工具 | 应用场景 |
| :--- | :--- | :--- |
| **前端开发框架** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | 强类型响应式组件化开发与状态托管 |
| **样式与原子化布局** | [Tailwind CSS 4.1](https://tailwindcss.com/) | 移动优先原子化样式、暗黑模式与流畅 UI 交互 |
| **动画与视觉过渡** | [Motion](https://motion.dev/) (`motion/react`) | 模态框平滑展开、卡片悬浮与页面切换过渡 |
| **数据可视化图标** | [Recharts 3.10](https://recharts.org/) + [Lucide Icons](https://lucide.dev/) | IoT 温湿度历史折线图、航线图表与专业图表符号 |
| **报表导出引擎** | [SheetJS (`xlsx`)](https://sheetjs.com/) | 纯前端高性能生成企业级 `.xlsx` 与 `.csv` 报表 |
| **后端 API 服务器** | [Node.js](https://nodejs.org/) + [Express 4](https://expressjs.com/) | 生产环境 HTTP 托管服务与安全代理 Gemini 推理 |
| **AI 大模型引擎** | [@google/genai 2.4](https://www.npmjs.com/package/@google/genai) | Google 官方最新 Gen AI SDK，驱动供应链智能分析 |
| **构建与打包工具** | [Vite 6](https://vitejs.dev/) + [esbuild](https://esbuild.github.io/) | 极速 HMR 热重载开发体验与单文件 CJS 后端打包 |

---

## 🏁 快速开始

### 环境依赖
* **Node.js** (推荐 v18 或更高版本)
* **npm** 或 **bun** 软件包管理器
* 有效的 **Google Gemini API Key**（用于驱动 AI 智能路径规划与风险诊断功能）

### 1. 克隆代码仓库
```bash
git clone https://github.com/your-org/velocortex-ai.git
cd velocortex-ai
```

### 2. 安装工程依赖
```bash
npm install
```

### 3. 配置环境变量
复制环境变量模版文件，在其中写入您的服务端 API 密钥配置：
```bash
cp .env.example .env
```

打开 `.env` 文件并进行配置：
```env
# 服务端专用 Gemini API Key (禁止泄露至前端浏览器)
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. 启动本地开发服务
执行以下命令，同时启动 Express API 后端与 Vite 开发服务器（统一绑定至端口 `3000`）：
```bash
npm run dev
```
打开浏览器并访问 `http://localhost:3000` 即可开始使用。

---

## 📦 生产环境构建与部署

VeloCortex AI 采用优化的全栈自动化构建流水线，一键将前端 React 交互应用与后端 TypeScript Express 服务同时打包为适合容器直接运行的产物：

```bash
# 清理旧构建并执行生产环境全局打包
npm run build

# 启动生产环境部署服务
npm run start
```
执行构建后，前端静态网页资源将整洁输出至 `dist/` 目录，同时后端 `server.ts` 会通过 `esbuild` 深度整合成独立无依赖的 CommonJS  bundle 单文件 `dist/server.cjs`，彻底解决云原生容器冷启动时的模块路径解析问题。

---

## 🌐 双语国际化

在界面右上角一键无缝切换语言（状态不丢失、数据不停服），或者无缝查阅不同语言版本的项目说明文档：
* 📖 **项目文档：** 查阅本说明文档的 **[🇺🇸 英文版本 (English)](README.md)** 或 **[🇨🇳 中文版本 (Simplified Chinese)](README_zh.md)**。
* 🇨🇳 **简体中文界面：** 针对中国及亚太地区港口码头、货代调度团队、船东轮机长及冷链管理专家定制。
* 🇺🇸 **英文界面 (English)：** 符合海事物流与航运管理体系的国际标准业务专业词汇。

---

## 🤝 参与贡献

欢迎国际物流专家、物联网架构师及全栈开发工程师共同参与项目的建设与优化！
1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送至分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

---

## 📜 许可证

本项目基于 GNU Affero General Public License v3.0 (AGPL-3.0) 许可证开源。请查阅 `LICENSE` 文件了解更多细节。

<p align="center">
  Built with ❤️ for Global Maritime & Intermodal Supply Chain Excellence.
</p>

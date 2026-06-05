# 🧭 Career Compass AI *(resume-zen Ai)*

> Build a world-class, ATS-compliant English resume simply by chatting in your native language.

[![Live Project](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen)](https://career-compass-ai-three-lime.vercel.app/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Framework](https://img.shields.io/badge/Framework-React%2019-blue)](https://react.dev/)
[![Routing](https://img.shields.io/badge/Routing-TanStack%20Start-orange)](https://tanstack.com/router/v1/docs/start/overview)

---

## 🎙️ About The Project

**Career Compass AI** (locally known as **resume-zen Ai**) is an interactive, voice-first resume building platform. Instead of fighting with page layouts, margins, or writing professional experience summaries manually, you just have a voice conversation.

Chat naturally in your preferred language (supporting English, Hindi, Marathi, Telugu, Tamil, Gujarati, Spanish, French, and more). The AI listens, asks clarifying questions about your projects and roles, translates the details, and automatically compiles them into an ATS-friendly layout.

---

## 🚀 Key Features

* **Voice & Keyboard Modes:** Tap the microphone to talk or switch to keyboard input to review suggestions and type.
* **ElevenLabs Integration:** Implements low-latency real-time Speech-to-Text (STT) and voice playback with ElevenLabs token integration.
* **10+ Localized Languages:** Fully localized interface utilizing `i18next` that dynamically adapts to your selected interview language.
* **Visual Onboarding Guidance:** Spotlight-highlighting guided tours built specifically for mobile layout responsiveness.
* **Dynamic Premium PDFs:** Instantly export your resume as standard English, native translation, or side-by-side Bilingual layouts.
* **Suppressed Overlap backdrops:** Tour modals automatically check target heights on mobile viewports to float top/bottom dynamically to prevent button occlusion.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
* **Routing & SSR:** TanStack Start (file-based routing + SSR compilation)
* **Backend:** Supabase (Database, Auth, Edge Functions)
* **Audio & STT:** ElevenLabs React SDK
* **Translation:** i18next & react-i18next

---

## ⚙️ Development Installation

### Prerequisites
* Node.js (v18+) or Bun
* Supabase instance keys

### Setup Instructions

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Jayesh252511/career-compass-ai.git
   cd career-compass-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in the Supabase details:
   ```bash
   cp .env.example .env
   ```

4. **Launch development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

---

## 🛡️ License

This project is private and developed for hackathon purposes.

# OmniPresence

**Your Everyday Life, Intelligently Unified.**

OmniPresence is a full-stack AI-powered personal lifestyle intelligence platform built with Next.js 15, React 19, and Tailwind CSS. It unifies digital wardrobe management, weather-aware outfit planning, financial tracking, calendar event preparation, and an intelligent marketplace — all orchestrated by **OP AI**, a context-aware personal assistant.

🌐 **Live Demo:** [https://omni-presence.vercel.app/](https://omni-presence.vercel.app/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally (Offline)](#running-locally-offline)
- [Online Deployment](#online-deployment)
- [Marketplace Architecture](#marketplace-architecture)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

### 🗄️ Digital Wardrobe
- Upload, catalog, and manage clothing items with AI-powered color detection and category classification.
- Track wear frequency, favorites, and last-worn dates.
- Filter and search by category, color, brand, season, occasion, and wear frequency.
- Per-user data isolation — each user's wardrobe is private and separate.

### 👔 Outfit Planning & Recommendations
- Weather-aware outfit suggestions that factor in temperature, rain probability, UV index, and humidity.
- Occasion-based dress code intelligence (formal, casual, festive, athletic).
- Carry-item suggestions (umbrella, sunglasses, layers) based on forecast conditions.
- Save and manage planned outfits.

### 🌦️ Weather Context Engine
- Real-time weather data via OpenWeatherMap API.
- Fully functional offline fallback with deterministic weather simulation.
- Automatic fabric and layering recommendations based on conditions.

### 📅 Calendar & Event Understanding
- Semantic event analysis — infers formality, occasion type, and dress code from event names (e.g., "Interview at TCS" → Formal, "Wedding Reception" → Festive).
- Google Calendar URL and .ICS file generation for event export.
- Proactive preparation checklists with readiness scoring.

### 🚆 Smart Transportation
- Multi-modal transit planning (Train, Metro, Cab, Auto, Bus) with duration and cost estimates.
- Departure time calculation based on event start time and travel duration.

### 💰 Financial Intelligence & "Do I Need This?"
- Monthly budget tracking with transaction logging.
- Purchase necessity evaluation — detects wardrobe redundancy (e.g., owning 4 black shirts), category saturation, and budget impact.
- Verdicts: *Essential Addition*, *Versatile Match*, *High Redundancy*, *Budget Alert*.
- Complementary color and style suggestions when redundancy is detected.

### 🛒 Marketplace
- Provider-abstracted marketplace architecture supporting **Local Catalog**, **Amazon**, and **Flipkart**.
- Hybrid search and ranking combining semantic matching, wardrobe compatibility, budget fit, and occasion relevance.
- Shopping intent parsing from natural language (e.g., "Find a red oversized shirt under ₹1500").
- Wishlist with per-user isolation.
- Product detail modal with wardrobe pairing suggestions.

> **⚠️ Important — Marketplace Note:**
> The live deployment at [omni-presence.vercel.app](https://omni-presence.vercel.app/) does **not** have Amazon PA-API or Flipkart Affiliate API keys configured. As a result, only the **offline development catalog** (labeled "Dev Catalog") is displayed. Amazon and Flipkart providers are architecturally integrated and will activate automatically when valid API credentials are supplied via environment variables. No local products are ever mislabeled as Amazon or Flipkart products.

### 🤖 OP AI — Personal Intelligence Assistant
- Context-aware conversational assistant powered by Google Gemini (online) with a full deterministic local reasoning fallback (offline).
- Handles wardrobe queries, outfit recommendations, financial advice, event preparation, transit planning, general knowledge, coding help, and more.
- Tool-calling architecture with an allowlisted Tool Registry for structured actions.
- Write-action confirmation protocol — destructive operations (expenses, reminders) require explicit user approval before execution.
- Zero hallucination policy — never fabricates wardrobe items, financial data, or personal information.

### 🎨 Design System
- Clean, minimal UI with a custom CSS variable-based design system.
- Full dark/light/system theme support.
- Responsive layout across mobile, tablet, and desktop.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 19, Tailwind CSS 3, Lucide Icons |
| **Language** | TypeScript 5 |
| **AI (Online)** | Google Gemini 2.5 Flash / Pro |
| **AI (Offline)** | Deterministic Local Knowledge Reasoner |
| **Weather** | OpenWeatherMap API (with offline fallback) |
| **Marketplace** | Provider Registry (Local, Amazon PA-API 5.0, Flipkart Affiliate) |
| **Visual AI** | FashionCLIP (optional Python microservice) |
| **Storage** | Client-side `localStorage` with in-memory SSR fallback |
| **Deployment** | Vercel |

---

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated dashboard routes
│   │   ├── assistant/      # OP AI chat interface
│   │   ├── calendar/       # Calendar & event management
│   │   ├── finance/        # Budget tracking & purchase evaluation
│   │   ├── home/           # Dashboard home
│   │   ├── marketplace/    # Shopping marketplace
│   │   ├── outfits/        # Outfit planner
│   │   ├── profile/        # User profile & preferences
│   │   ├── reminders/      # Reminders management
│   │   ├── settings/       # App settings & provider health
│   │   └── wardrobe/       # Digital wardrobe
│   ├── api/v1/             # API routes (weather, wardrobe, outfits, marketplace)
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
│   ├── ai/                 # AI chat components
│   ├── layout/             # App shell, header, sidebar, mobile nav
│   ├── outfits/            # Outfit planner components
│   ├── ui/                 # Design system primitives (Button, Card, etc.)
│   ├── wardrobe/           # Wardrobe item cards, upload, filters
│   └── weather/            # Weather display widgets
├── context/                # React contexts (Auth, Theme, Toast)
├── lib/                    # Core business logic
│   ├── ai/                 # AI provider, config, tools, local reasoner
│   ├── marketplace/        # Provider registry, aggregator, retrieval engine
│   ├── fashion/            # FashionCLIP client
│   ├── recommendationEngine.ts
│   ├── financialEngine.ts
│   ├── eventUnderstandingEngine.ts
│   ├── transportationEngine.ts
│   ├── readinessEngine.ts
│   ├── colorVocabulary.ts
│   └── storage.ts          # Persistent storage with user isolation
├── services/               # Service layer (wardrobe, weather, finance, etc.)
└── types/                  # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x (recommended: 20.x or later)
- **npm** ≥ 9.x
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/sundhip/OmniPresence.git
cd OmniPresence

# Install dependencies
npm install
```

### Environment Variables

Copy the example environment file and configure any keys you have:

```bash
cp .env.example .env.local
```

**All environment variables are optional.** The application is designed to run fully offline without any API keys.

| Variable | Purpose | Required? |
| :--- | :--- | :---: |
| `GEMINI_API_KEY` | Google Gemini AI for OP AI online intelligence | Optional |
| `OPENWEATHER_API_KEY` | Live weather data from OpenWeatherMap | Optional |
| `AMAZON_ACCESS_KEY` | Amazon PA-API 5.0 marketplace search | Optional |
| `AMAZON_SECRET_KEY` | Amazon PA-API 5.0 authentication | Optional |
| `AMAZON_PARTNER_TAG` | Amazon Associates partner tag | Optional |
| `FLIPKART_AFFILIATE_ID` | Flipkart Affiliate API ID | Optional |
| `FLIPKART_AFFILIATE_TOKEN` | Flipkart Affiliate API token | Optional |
| `FASHION_CLIP_URL` | FashionCLIP microservice URL (default: `http://127.0.0.1:8000`) | Optional |

**Without any keys configured:**
- OP AI uses the deterministic local reasoning engine (no Gemini dependency).
- Weather uses intelligent offline simulation.
- Marketplace shows the development catalog only.
- All core features (wardrobe, outfits, finance, calendar, transport) work fully offline.

### Running Locally (Offline)

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Click **"Instant Demo"** on the landing page to sign in with a pre-configured demo account and explore all features immediately.

#### Optional: FashionCLIP Visual AI Service

If you want AI-powered visual clothing analysis (not required for core functionality):

```bash
# Set up Python virtual environment (one-time)
cd services/fashion_clip_service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Run the FashionCLIP microservice
cd ../..
npm run fashion-clip
```

#### Production Build (Local)

```bash
# Build for production
npm run build

# Start the production server
npm start
```

---

## Online Deployment

OmniPresence is deployed on **Vercel** with zero-configuration Next.js support.

### Live URL

🌐 **[https://omni-presence.vercel.app/](https://omni-presence.vercel.app/)**

### Deploy Your Own

1. **Fork** the repository on GitHub.
2. Go to [vercel.com](https://vercel.com) and import your forked repository.
3. Vercel will auto-detect Next.js and configure the build.
4. (Optional) Add environment variables in **Vercel → Project Settings → Environment Variables** for Gemini, OpenWeather, or marketplace API keys.
5. Click **Deploy**. Your app will be live within minutes.

### Vercel Deployment Notes

- The `scripts/` directory is excluded from TypeScript compilation via `tsconfig.json` to prevent test utilities from blocking production builds.
- All API routes under `src/app/api/v1/` are serverless functions on Vercel.
- Client-side storage (`localStorage`) handles all persistent data — no external database is required.

---

## Marketplace Architecture

The marketplace follows a **provider abstraction pattern** that cleanly separates data sources:

```
┌─────────────────────────────────────────────────┐
│              MarketplaceAggregator               │
│         (parallel query, dedup, ranking)         │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
  ┌──────────┐ ┌────────┐ ┌──────────┐
  │  Local   │ │ Amazon │ │ Flipkart │
  │ Catalog  │ │ PA-API │ │Affiliate │
  │ (ACTIVE) │ │(DISABLED)│ │(DISABLED)│
  └──────────┘ └────────┘ └──────────┘
```

| Provider | Status | Badge Shown | Data Source |
| :--- | :---: | :--- | :--- |
| **Local Catalog** | ✅ Active | `Dev Catalog` (green) | Built-in realistic product catalog |
| **Amazon** | ⏸️ Disabled | `Amazon` (amber) | Amazon PA-API 5.0 (requires credentials) |
| **Flipkart** | ⏸️ Disabled | `Flipkart` (blue) | Flipkart Affiliate API (requires credentials) |

- **No scraping** of Amazon or Flipkart is performed.
- **No fake products** are ever labeled as Amazon or Flipkart.
- Local catalog products always display `source: "local"`, `provider: "Local"`, and `priceStatus: "development"`.
- When valid API credentials are added to environment variables, the corresponding providers activate **automatically** — no code changes required.

---

## Running Tests

OmniPresence includes comprehensive acceptance test suites covering all features:

```bash
# Marketplace architecture (15 scenarios, 43 assertions)
npm run test:marketplace

# OP AI personal intelligence (22 tests)
npm run test:op-ai

# OP AI general knowledge & multi-domain (23 tests)
npm run test:op-ai-general

# Features 13–22: Calendar, transport, readiness, finance (19 tests)
npm run test:features13-22

# Core: Color detection, weather, recommendations, data isolation (24 tests)
npm run test:all
```

All test suites run offline without any API keys and are designed to pass at **100%**.

---

## Project Structure

```
OmniPresence/
├── public/                     # Static assets
├── scripts/                    # Test suites and git utilities
├── services/                   # Optional microservices (FashionCLIP)
├── src/
│   ├── app/                    # Next.js pages and API routes
│   ├── components/             # React UI components
│   ├── context/                # Auth, Theme, Toast providers
│   ├── lib/                    # Core engines and business logic
│   ├── services/               # Service layer
│   └── types/                  # TypeScript interfaces
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ using Next.js, React, and Tailwind CSS
</p>

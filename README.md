# ✦ OmniPresence — OP AI Personal Intelligence Platform

> **Connected personal intelligence platform integrating digital wardrobe management, weather context, and multi-factor AI styling curation.**

OmniPresence is a dynamic, high-performance web application engineered with Next.js 15, TypeScript, Tailwind CSS, and local/cloud AI architecture.

---

## 🚀 Key Features

### 1. 🎨 Design System & Theme
- Custom OmniPresence design tokens with adaptive Light and Dark modes.
- Responsive mobile/desktop layouts with fluid animations and smooth transitions.

### 2. 🔐 Isolated Multi-User Authentication & Profiles
- Independent session state and persistent user data isolation (`op_wardrobe_${userId}`, `op_outfits_${userId}`, `op_wear_events_${userId}`).
- Onboarding flow calibrating sizes, fit preferences (e.g. *Oversized*, *Relaxed*, *Slim*), color palettes, and aesthetics.

### 3. 👕 Digital Wardrobe & Intelligent Scanning
- Full cataloging with categories (Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories).
- AI garment vision detection extracting categories, colors, fit, and pre-filling saved profile sizing defaults.
- Controlled Color Vocabulary: 12 primary colors, 13 extended shades, secondary accent colors, and synonym normalization (e.g. Red, Navy, Olive).
- Independent item editing that preserves user modifications permanently.

### 4. 📈 Wear Logging & Timeline History
- Wear count tracking, last-worn dates, and rotation frequency metrics (*Unworn*, *Light*, *Regular*, *High*).

### 5. 🌤️ Feature #11: Weather Context
- Secure server-side weather route (`/api/v1/weather`) utilizing OpenWeather API with zero client-side secret exposure.
- 20-minute client cache (`op_weather_cache`), manual city switcher, and device geolocation detection.
- Deterministic normalization fallback guaranteeing offline and local resilience.

### 6. 🧠 Feature #12: Weather-Aware Recommendation Engine (OP AI)
- Multi-factor intelligence scoring model:
  - **Occasion Fit (25%)**
  - **Preference & Fit Match (20%)**
  - **Weather Compatibility (20%)**: Warm ($\ge 28^\circ\text{C}$) lightweight pieces, cool ($\le 18^\circ\text{C}$) thermal layering, and rain-conscious footwear.
  - **Color Harmony (15%)**
  - **Wear Rotation Balance (10%)**
  - **Wardrobe Availability (10%)**
- Generates primary ensemble recommendations, distinct alternatives, natural rationales, and styling tips.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+ (Tested on v24.x)
- **npm** or **yarn** / **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sundhip/OmniPresence.git
   cd OmniPresence
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment (Optional)**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Optional keys for Gemini Vision AI and OpenWeather API)*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🧪 Testing & Verification

Run the acceptance and regression test suite:
```bash
npx tsx scripts/test-acceptance.ts
```

Run TypeScript type validation:
```bash
npx tsc --project tsconfig.json --noEmit
```

---

## 🏛️ Project Architecture

```
omnipresence/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Login, Signup, Onboarding
│   │   ├── (dashboard)/             # Home, Wardrobe, Outfits, Profile, Settings
│   │   └── api/v1/                  # Secure REST API Endpoints (Weather, Recommendations, Wardrobe)
│   ├── components/
│   │   ├── ai/                      # OP AI Panel & Recommendation Cards
│   │   ├── outfits/                 # Outfit Planner Canvas & Selector Modals
│   │   ├── ui/                      # Button, Input, Modal, Card, Badge, Tabs
│   │   ├── wardrobe/                # Wardrobe Grid, Forms, Filters, Detail Modals
│   │   └── weather/                 # WeatherCard & Location Switcher
│   ├── context/                     # AuthContext, ThemeContext, ToastContext
│   ├── lib/                         # Recommendation Engine, Color Vocabulary, Storage, Mock Data
│   ├── services/                    # Auth, Wardrobe, Outfit, Weather, AI Services
│   └── types/                       # User, Wardrobe, Outfit, Weather, Recommendation Types
├── scripts/
│   └── test-acceptance.ts           # End-to-end regression test suite
└── public/                          # Static assets and icons
```

---

## 📄 License
MIT License.

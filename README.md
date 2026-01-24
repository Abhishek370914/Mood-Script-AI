MoodScript 🌙

An AI-powered emotional companion & creative journaling app for Gen Z

MoodScript is a mobile-first AI life companion that helps users reflect on their emotions, express themselves creatively, and build emotional awareness through daily check-ins, journaling, and visual mood concepts.

✨ Features (MVP)

Daily Emotional Check-In
Save daily reflections with AI-powered mood summaries.

Creative Journaling Prompts
Personalized writing prompts based on user emotions.

Mood Art Concept Generator
Text-based AI prompts to generate emotional art concepts.

Streaks & XP
Gamified emotional awareness with streak tracking.

Live AI Responses
Real-time LLM responses powered by GPT-5.2 via Emergent.

Synced Accounts
Google social login with multi-device sync.

🧠 Tech Stack
Frontend

Expo (React Native)

Expo Router

Context API for auth state

Pastel UI theme (mobile-first)

Backend

FastAPI (Python)

MongoDB

Emergent Google OAuth

Emergent Universal LLM Key

AI

OpenAI GPT-5.2 (via emergentintegrations)

Structured JSON responses for UI rendering

🗂️ Project Structure
/app
  /(auth)/login.tsx
  /(tabs)/home.tsx
  /(tabs)/create.tsx
  /(tabs)/profile.tsx
/src
  /state/AuthContext.tsx
  /lib/api.ts
  /theme/*
/backend
  main.py
  routes/
  services/

🔐 Authentication Flow

User signs in via Google (Emergent OAuth)

Backend exchanges session_id for user + session token

Token stored locally and used for all API calls

Auth-gated app shell loads main tabs

📡 API Endpoints (MVP)

POST /api/auth/exchange

GET /api/auth/me

POST /api/auth/logout

POST /api/entries/checkin

GET /api/entries

GET /api/stats/overview

🎨 Design Philosophy

Soft pastel gradients

Calm animations

Thumb-first navigation

Emotional, poetic microcopy

Zero clinical or robotic language

🚀 Roadmap
Phase 1

Google login

Auth shell

Basic navigation

Phase 2

Daily check-ins

History view

Phase 3

Live AI

Mood analysis

Journaling prompts

Phase 4

Streaks + XP

Phase 5

Weekly insights

Premium features

🫶 Vision

MoodScript is not just another AI app.
It’s a digital emotional companion — part journal, part creative space, part life coach.

“A safe place for your thoughts, feelings, and inner world.”

📜 License

MIT License – free to use, modify, and scale.

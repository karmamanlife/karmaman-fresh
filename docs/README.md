# 🔥 Karmaman App

**AI wingman in every man's pocket**

A 24/7 AI mentor and accountability partner guiding men toward becoming their best selves through fitness, nutrition, and whole-life transformation.

---

## 📱 Current Status

**Phase:** 1 (MVP) - ~92% Complete  
**Platform:** Android (React Native / Expo)  
**Backend:** Supabase  
**Testing:** Samsung S23 Ultra (Wireless ADB)

---

## ✅ Completed Features

### Authentication
- User sign-up/sign-in
- Profile setup with picture upload
- Profile avatar navigation system

### Nutrition Tracking
- Daily calorie and macro targets (protein, carbs, fats)
- Meal logging with food search
- Visual macro rings showing consumption vs. targets
- Meal history tracking

### Workout System
- Workout hub interface
- Today's workout detail screen
- Exercise cards with set/rep/weight logging
- Database integration for workout logs
- Exercise completion tracking
- Duration calculation

### UI/UX
- KoruBackground component (brand consistency)
- Standardized headers across all screens
- ProfileAvatar component on all screens
- Tab navigation (Home, Workout, Nutrition, Tribe)
- Card component system (outlined, elevated, flat variants)

---

## 🚧 In Development

- Dynamic button states based on workout completion
- Load workout status from database on app launch
- "Nice Work!!" state when workouts complete

---

## 🎯 Next Up (Phase 1 Completion)

1. Load exercises from database (not hardcoded)
2. Package Android APK for alpha testing (10-20 testers)
3. Email verification (Phase 1.5)

---

## 🏗️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Supabase (PostgreSQL)
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State:** React Hooks
- **Testing Device:** Samsung S23 Ultra

---

## 📂 Project Structure

```
karmaman-fresh/
├── app/
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Home screen
│   │   ├── workout.tsx      # Workout hub
│   │   ├── nutrition.tsx    # Nutrition tracking
│   │   ├── board.tsx        # Tribe (community)
│   │   └── profile.tsx      # User profile (hidden from nav)
│   ├── workout/
│   │   └── today.tsx        # Workout detail screen
│   ├── auth/
│   │   └── sign-in.tsx      # Authentication
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── KoruBackground.tsx
│   │   ├── ProfileAvatar.tsx
│   │   └── ui/
│   │       └── Card.tsx
│   ├── lib/
│   │   └── supabase.ts      # Supabase client
│   └── services/
│       └── workoutService.ts # Workout database operations
├── docs/
│   ├── KARMA_GOV.md         # Development rules
│   ├── FUTURE_FLAGS.md      # Features & AI nudges for later
│   └── CHANGES_LOG.md       # Architecture decisions
├── assets/
│   └── images/
└── README.md
```

---

## 🗄️ Database Schema

### User Tables
- `user_profiles` - User profile data
- `user_nutrition_profiles` - Nutrition targets
- `user_meals_history` - Logged meals
- `user_workout_logs` - Workout sessions
- `user_exercise_sets` - Individual sets (weight/reps)

### Template Tables
- `workout_programs` - Workout templates
- `workout_sessions` - Individual workouts in programs
- `session_exercises` - Exercises in sessions

---

## 🎨 Design System

### Colors
- **Main Green:** `#42534A`
- **Card Green:** `#3F6B5C`
- **Light Green:** `#A3D9A1`
- **Orange:** `#D28A41`
- **Red (Over Target):** `#D40C19`
- **Beige Background:** `#DCD1C1`

### Typography
- **Headers:** 24-28px, bold
- **Body:** 14-16px
- **Meta:** 12-14px, #666

### Card Styles
- **Outlined:** `backgroundColor: 'rgba(255, 255, 255, 0.3)'` with border
- **Elevated:** Full opacity with shadows
- **Flat:** No shadows, minimal styling

---

## 🚀 Development Workflow

### Repo Strategy
- **karmaman-fresh** (current): Testing & development
- **karmaman-life**: Production (manual migration of stable features)

### Git Workflow
```powershell
# Working branch
git checkout -b feature/new-feature

# Commit changes
git add "app/(tabs)/file.tsx"
git commit -m "feat: description"

# Manual migration to karmaman-life when stable
```

### Testing Device Connection
```powershell
# Pair Samsung S23 Ultra
adb pair 192.168.50.112:XXXXX

# Start Metro
cd "C:\Users\sngaw\karmaman-fresh"
npx expo start

# Launch on Android
Press 'a' in Metro terminal
```

---

## 📚 Documentation

- **KARMA_GOV.md** - Development rules and protocols
- **FUTURE_FLAGS.md** - Features, AI nudges, and considerations for later phases
- **CHANGES_LOG.md** - Non-obvious architectural decisions

---

## 🎯 Roadmap

### Phase 1.5 (Weeks 4-6)
- Beta polish
- Email verification
- 50-100 beta testers
- Stability improvements

### Phase 2 (Weeks 7-14)
- AI Mentor System
- Psychometric quiz
- Mentor archetype assignment
- Rule-based nudges
- LLM chat integration

### Phase 2.5 (Weeks 15-16)
- Tribe MVP (social feed)
- AI mentor comments on posts

### Phase 3 (Weeks 17-22)
- Spanish language support
- White-label pilot

### Phase 3.5 (Weeks 23-25)
- Wearables integration (Apple Watch, WHOOP, Fitbit, Garmin)

---

## 📄 License

Proprietary - Karmaman © 2025

---

## 🤝 Contributing

This is a private project. Development follows strict protocols outlined in `docs/KARMA_GOV.md`.

---

**Built with 💪 for men becoming their best selves**
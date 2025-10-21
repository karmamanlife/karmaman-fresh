# 🚩 FUTURE FLAGS - Features & AI Nudges for Later

This document tracks features, AI nudges, and considerations that need to be implemented in future phases.

---

## 🤖 AI NUDGES (Phase 2 - AI Mentor System)

### Workout Completion Nudges

**Location:** `app/workout/today.tsx`

**Scenario 1: User Leaves Mid-Workout**
- **Trigger:** User exits workout detail screen without finishing all exercises
- **Nudge:** "Hey you still there? Are you getting this done or what!!"
- **Implementation Notes:**
  - Track time since workout started
  - Send push notification after X minutes of inactivity
  - Mentor tone varies by archetype (Warrior = direct, Sage = encouraging)

**Scenario 2: User Attempts to Finish Incomplete Workout**
- **Trigger:** User taps "Finish Workout" with exercises still remaining
- **Nudge:** "Are you sure brother? You only have X exercises left"
- **Implementation Notes:**
  - Show confirmation alert with exercise count
  - Option to continue or go back
  - Log incomplete workouts differently for pattern analysis

---

## 🏋️ WORKOUT FEATURES

### Current Implementation Status

✅ **Completed:**
- Create workout log on session start
- Log individual sets (weight, reps) to database
- Mark exercises as complete
- Calculate and save workout duration
- Show completion badge on exercises

🟡 **In Progress:**
- Dynamic button states based on completion
- Load today's workout status from database

❌ **Not Started:**
- Load exercises from `workout_sessions` and `session_exercises` tables (currently hardcoded)
- Show previous workout data ("Last time: 100kg x 10 reps")
- Progress tracking over time
- Workout templates/programs

### Button State Logic

**"Lets Go" Button (Home + Workout Hub):**
- Default: "Lets Go"
- When today's workout complete: "Nice Work!!"
- Persists across sessions (database check)
- Resets at midnight (new day)

**"Finish Workout" Button (Detail Screen):**
- Default: "Finish Workout"
- When all exercises complete: "Nice Work!!"
- Shows confirmation if incomplete exercises remain
- State based on real-time completion tracking

### Timer Persistence

**Current:** Timer starts when workout detail screen loads
**Consideration:** What if user leaves mid-workout?
- Timer keeps running in database (logged_at timestamp)
- If user returns, calculate elapsed time from logged_at
- Option to "Resume" or "Restart" workout?

---

## 📊 DATA & ANALYTICS

### Workout Data Structure

**Tables:**
- `workout_programs` - Template programs (e.g., "4-Day Upper/Lower Split")
- `workout_sessions` - Individual workouts in a program (e.g., "Upper Body Day 1")
- `session_exercises` - Exercises in a session (template data)
- `user_workout_logs` - User's actual workout sessions
- `user_exercise_sets` - Individual sets logged by user

**Current Gap:**
- Hardcoded exercises in `app/workout/today.tsx`
- Need to load from `workout_sessions` + `session_exercises` tables
- Need to assign users a program (onboarding decision)

________________________________________
Workout Architecture: Hub + Detail Pattern
Date: October 20, 2025
Location: app/(tabs)/workout.tsx and app/workout/today.tsx
Change: Workout split into two screens instead of one
Structure:
1.	Workout Tab (app/(tabs)/workout.tsx) - Hub screen 
o	Today's Workout card
o	Workout Report card
o	Performance Analysis card
o	Recent Workouts card
2.	Today's Workout (app/workout/today.tsx) - Detail screen 
o	Exercise cards with images
o	Input fields for sets/reps/weight
o	Mark Complete buttons
o	Finish Workout button
Navigation:
•	Home screen "Let's Go!" button → /workout/today
•	Workout tab "Let's Go!" button → /workout/today
•	Workout tab itself → Shows hub with overview cards
Reason:
•	Separation of concerns: overview vs execution
•	Better UX: users can check stats without starting workout
•	Scalability: can add more hub features without cluttering workout logging
________________________________________


### Progress Tracking Needs

- Show "Last time" data for each exercise
- Track volume over time (total weight lifted)
- Track progressive overload (weight increases)
- Workout streak tracking
- Weekly/monthly summaries

________________________________________
Profile Tab Hidden (Not Removed)
Date: October 20, 2025
Location: app/(tabs)/_layout.tsx
Change: Profile tab set to href: null instead of removing completely
Reason:
•	ProfileAvatar component added to all screen headers (top-right) provides navigation to Profile screen
•	Tab hidden from bottom navigation bar but route kept functional
•	Keeping route in tabs prevents import path breaks and navigation issues
Code:
<Tabs.Screen name="profile" options={{ href: null }} />
Revert if needed:
Change back to:
<Tabs.Screen name="profile" options={{ title: 'Profile' }} />
________________________________________


---

## 🎨 UI/UX IMPROVEMENTS

### Keyboard Behavior
✅ Fixed: Added `paddingBottom: 400` to clear keyboard

**Future Considerations:**
- Auto-scroll to focused input
- "Next" button to jump between set inputs
- Haptic feedback on complete

### Exercise Cards

**Current:**
- Static images (UpperTorso2.png for all exercises)
- Manual input for weight/reps

**Future:**
- Exercise-specific images/animations
- Quick-fill from previous workout
- Rest timer between sets
- RPE (Rate of Perceived Exertion) input
- Notes per set

---

## 🔔 NOTIFICATIONS & REMINDERS

### Workout Reminders
- Daily workout notification at user-preferred time
- "You haven't worked out in X days" reminder
- Rest day notifications (active recovery suggestions)

### Progress Milestones
- PR (Personal Record) celebrations
- Streak milestones (7 days, 30 days, etc.)
- Volume milestones

---

## 🌐 MULTI-LANGUAGE SUPPORT

**Phase 3 Target:** Spanish + 4 other languages

**Considerations:**
- AI mentor persona translations (maintain tone/archetype)
- Exercise name translations
- UI text translations
- Cultural adaptation of nudges (e.g., "brother" might not translate well)

---

## 🔗 WEARABLES INTEGRATION

**Phase 3.5 Target**

### Supported Devices
- Apple Watch / Apple Health
- WHOOP
- Fitbit / Google Fit
- Garmin

### Data Integration
- Auto-detect workouts (no manual logging)
- Recovery score → mentor adjusts intensity
- Sleep quality → nutrition recommendations
- HRV monitoring → rest day suggestions

### Mentor Intelligence
- "Your HRV is low today. Let's do a lighter session."
- "You only slept 5 hours. Extra protein today for recovery."

---

## 📝 NOTES & CONSIDERATIONS

### Session Management
- Currently: New workout log created every time detail screen loads
- Problem: If user opens/closes screen multiple times, creates duplicate logs
- Solution needed: Check if today's workout log exists, resume if incomplete

### Data Ownership
- User agrees to anonymized data collection (TOS)
- Wearables data included (sleep, recovery, HRV)
- White-label partners: Data sharing incentivized via pricing tiers

### Performance
- Large workout history: Need pagination/lazy loading
- Image optimization for exercise cards
- Offline support (log workouts without internet, sync later)

---

## 🎯 PRIORITY ORDER

**High Priority (Phase 1 completion):**
1. Load exercises from database (not hardcoded)
2. Dynamic button states based on completion
3. Check today's workout status on load

**Medium Priority (Phase 1.5-2):**
4. Show "Last time" data
5. Workout completion nudges (alerts)
6. Progress tracking basics

**Low Priority (Phase 2-3):**
7. Push notifications
8. Wearables integration
9. Multi-language support

---

**Last Updated:** October 21, 2025
**Phase:** 1 (MVP)
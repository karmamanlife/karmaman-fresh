# Database Schema for Karmaman User Flow

## Current State
- user_nutrition_profiles: has macro goals only (meals_per_day, daily_calories_goal, etc.)

## Required Tables for Flow:

### user_profiles
- user_id (uuid, FK to auth.users)
- name (text)
- age (integer) 
- weight (decimal)
- height (decimal)
- meals_per_day (integer)
- created_at (timestamp)

### user_goals  
- user_id (uuid, FK to auth.users)
- goal_type (text: 'cut', 'maintain', 'bulk')
- training_days (integer)
- created_at (timestamp)

### user_calculations
- user_id (uuid, FK to auth.users)
- bmr (decimal)
- tdee (decimal) 
- daily_calories (decimal)
- daily_protein (decimal)
- daily_carbs (decimal)
- daily_fats (decimal)
- updated_at (timestamp)

## Implementation Strategy:
1. Extend current user_nutrition_profiles OR create separate normalized tables
2. Build onboarding screens that populate these tables
3. Auto-calculate macros based on profile + goals

// inside nutrition.tsx
const handleComplete = async () => {
  if (!validateForm()) return;
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Error','No user session found'); router.replace('/welcome'); return; }

    const computedBMR = calculateBMR({ gender, weight, height, age });
    const computedTDEE = calculateTDEE({ bmr: computedBMR, activityLevel });
    const macros = calculateMacros({ tdee: computedTDEE, goal });

    const { error } = await supabase.from('user_nutrition_profiles').insert({
      user_id: user.id,
      age: parseInt(age, 10),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      activity_level: activityLevel,
      goal,
      bmr: Math.round(computedBMR),
      tdee: Math.round(computedTDEE),
      daily_calories: Math.round(macros.calories),
      daily_protein: Math.round(macros.protein),
      daily_carbs: Math.round(macros.carbs),
      daily_fats: Math.round(macros.fats),
    });
    if (error) { console.error(error); Alert.alert('Error','Failed to save your profile.'); return; }

    router.replace('/onboarding/terms'); // âœ… Terms next
  } catch (e) {
    console.error(e); Alert.alert('Error','Something went wrong.');
  } finally { setLoading(false); }
};


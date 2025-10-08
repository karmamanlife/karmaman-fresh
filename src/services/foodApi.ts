// TEMPORARY - Testing API directly
const NUTRITIONIX_APP_ID = 'f2cb7916';
const NUTRITIONIX_API_KEY = '84fc927803fdcd6deb279a625870fa94';

// DEBUG
console.log('🔑 API ID loaded:', NUTRITIONIX_APP_ID ? 'YES' : 'NO');
console.log('🔑 API KEY loaded:', NUTRITIONIX_API_KEY ? 'YES' : 'NO');
console.log('📝 Full API ID:', NUTRITIONIX_APP_ID);
console.log('📝 Full API KEY:', NUTRITIONIX_API_KEY);

export const searchFood = async (query: string) => {
  try {
    const url = `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`;
    
    console.log('🔍 Searching for:', query);
    console.log('🌐 URL:', url);
    console.log('📤 Headers being sent:', {
      'x-app-id': NUTRITIONIX_APP_ID,
      'x-app-key': NUTRITIONIX_API_KEY
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY,
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    console.log('✅ Got results:', data.common?.length || 0, 'items');
    return data.common || [];
  } catch (error) {
    console.error('💥 Food search error:', error);
    return [];
  }
};

export const getFoodNutrients = async (foodName: string) => {
  try {
    console.log('🔍 Getting nutrients for:', foodName);
    
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: foodName })
    });
    
    console.log('📥 Nutrients response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Nutrients Error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Got nutrients for:', data.foods?.[0]?.food_name);
    return data.foods?.[0] || null;
  } catch (error) {
    console.error('💥 Nutrient fetch error:', error);
    return null;
  }
};
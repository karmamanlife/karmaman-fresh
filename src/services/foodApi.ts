const NUTRITIONIX_APP_ID = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID;
const NUTRITIONIX_API_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY;

export const searchFood = async (query: string) => {
  try {
    const url = `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID || '',
        'x-app-key': NUTRITIONIX_API_KEY || '',
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    return data.common || [];
  } catch (error) {
    console.error('Food search error:', error);
    return [];
  }
};

export const getFoodNutrients = async (foodName: string) => {
  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID || '',
        'x-app-key': NUTRITIONIX_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: foodName })
    });
    
    if (!response.ok) {
      console.error('Nutrients Error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.foods?.[0] || null;
  } catch (error) {
    console.error('Nutrient fetch error:', error);
    return null;
  }
};

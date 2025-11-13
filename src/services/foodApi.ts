// Edamam Food Database API
// Using NUTRITIONIX variable names for backwards compatibility (no refactor needed)
// But actually calling Edamam API endpoints

const NUTRITIONIX_APP_ID = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID || '';
const NUTRITIONIX_API_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY || '';

// DEBUG - Check credentials loaded
console.log('🔑 API ID loaded:', NUTRITIONIX_APP_ID ? 'YES' : 'NO');
console.log('🔑 API KEY loaded:', NUTRITIONIX_API_KEY ? 'YES' : 'NO');

export const searchFood = async (query: string) => {
  try {
    // Edamam Food Database API - Parser endpoint
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${NUTRITIONIX_APP_ID}&app_key=${NUTRITIONIX_API_KEY}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`;
    
    console.log('🔍 Searching for:', query);
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    
    // Transform Edamam response to match our existing app structure
    const hints = data.hints || [];
    const transformed = hints.map((hint: any) => ({
      food_name: hint.food.label,
      serving_unit: hint.measures?.[0]?.label || 'serving',
      serving_qty: hint.measures?.[0]?.weight || 100,
      photo: {
        thumb: hint.food.image || ''
      },
      // Store full Edamam data for nutrient lookup
      _edamam_food_id: hint.food.foodId,
      _edamam_measures: hint.measures || []
    }));
    
    console.log('✅ Got results:', transformed.length, 'items');
    return transformed;
  } catch (error) {
    console.error('💥 Food search error:', error);
    return [];
  }
};

export const getFoodNutrients = async (foodName: string, foodId?: string, measureUri?: string) => {
  try {
    console.log('🔍 Getting nutrients for:', foodName);
    
    // If we have Edamam food ID and measure from search, use it
    // Otherwise, search again to get it
    let edamamFoodId = foodId;
    let edamamMeasureUri = measureUri;
    
    if (!edamamFoodId) {
      // Search to get food ID
      const searchResults = await searchFood(foodName);
      if (searchResults.length === 0) {
        console.error('❌ No food found for:', foodName);
        return null;
      }
      edamamFoodId = searchResults[0]._edamam_food_id;
      edamamMeasureUri = searchResults[0]._edamam_measures?.[0]?.uri;
    }
    
    // Edamam Nutrients endpoint
    const url = `https://api.edamam.com/api/food-database/v2/nutrients?app_id=${NUTRITIONIX_APP_ID}&app_key=${NUTRITIONIX_API_KEY}`;
    
    const requestBody = {
      ingredients: [
        {
          quantity: 1,
          measureURI: edamamMeasureUri || `http://www.edamam.com/ontologies/edamam.owl#Measure_serving`,
          foodId: edamamFoodId
        }
      ]
    };
    
    console.log('📤 Requesting nutrients for food ID:', edamamFoodId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 Nutrients response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Nutrients Error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    
    // Transform Edamam nutrients response to match our app structure
    const nutrients = data.totalNutrients || {};
    const transformed = {
      food_name: foodName,
      serving_qty: 1,
      serving_unit: 'serving',
      serving_weight_grams: data.totalWeight || 100,
      nf_calories: nutrients.ENERC_KCAL?.quantity || 0,
      nf_total_fat: nutrients.FAT?.quantity || 0,
      nf_saturated_fat: nutrients.FASAT?.quantity || 0,
      nf_cholesterol: nutrients.CHOLE?.quantity || 0,
      nf_sodium: nutrients.NA?.quantity || 0,
      nf_total_carbohydrate: nutrients.CHOCDF?.quantity || 0,
      nf_dietary_fiber: nutrients.FIBTG?.quantity || 0,
      nf_sugars: nutrients.SUGAR?.quantity || 0,
      nf_protein: nutrients.PROCNT?.quantity || 0,
      // Store original Edamam data in case we need it
      _edamam_data: data
    };
    
    console.log('✅ Got nutrients:', {
      calories: transformed.nf_calories,
      protein: transformed.nf_protein,
      carbs: transformed.nf_total_carbohydrate,
      fat: transformed.nf_total_fat
    });
    
    return transformed;
  } catch (error) {
    console.error('💥 Nutrient fetch error:', error);
    return null;
  }
};
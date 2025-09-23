const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupUser(email) {
  console.log(`Cleaning up data for: ${email}`);
  
  console.log(`
    ============================================
    Run this SQL in your Supabase Dashboard:
    
    1. Go to: https://supabase.com/dashboard
    2. Select your project
    3. Click "SQL Editor" in left sidebar
    4. Paste and run this SQL:
    
    -- Delete all data for email: ${email}
    DELETE FROM user_agreements WHERE user_id = (SELECT id FROM auth.users WHERE email = '${email}');
    DELETE FROM user_nutrition_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = '${email}');
    DELETE FROM meals WHERE user_id = (SELECT id FROM auth.users WHERE email = '${email}');
    DELETE FROM auth.users WHERE email = '${email}';
    
    ============================================
  `);
}

cleanupUser('sngawaka@gmail.com');
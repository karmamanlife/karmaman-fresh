import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
console.log('🟢 PROFILE SCREEN LOADED');

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editTrainingDays, setEditTrainingDays] = useState(0);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const [profileResult, goalsResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_goals').select('*').eq('user_id', user.id).single()
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
        if (profileResult.data.profile_picture_url) {
          setProfilePicUrl(profileResult.data.profile_picture_url);
        }
      }
      if (goalsResult.data) {
        setGoals(goalsResult.data);
        setEditGoal(goalsResult.data.goal_type);
        setEditTrainingDays(goalsResult.data.training_days);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

    if (!result.canceled && result.assets[0]) {
        Alert.alert('PICKER', 'Image selected: ' + result.assets[0].uri);
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

const uploadProfilePicture = async (uri) => {
  try {
    setUploadingPic(true);
    console.log('🔵 Upload started - URI:', uri);
    
    const supabase = getSupabase();
    console.log('🔵 Supabase client obtained:', !!supabase);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔵 User fetched:', user?.id);

    if (!user) {
      console.log('🔴 No user found, aborting upload');
      return;
    }

    // Create file name
    const fileExt = uri.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    console.log('🔵 File path created:', filePath);

    // NEW APPROACH: Use fetch with ArrayBuffer instead of blob
    console.log('🔵 Fetching URI as ArrayBuffer...');
    const response = await fetch(uri);
    console.log('🔵 Fetch response status:', response.status);
    console.log('🔵 Fetch response OK:', response.ok);
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('🔵 ArrayBuffer created - size:', arrayBuffer.byteLength);

    // Convert ArrayBuffer to Uint8Array for upload
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('🔵 Uint8Array created - length:', uint8Array.length);

    // Upload to Supabase Storage with ArrayBuffer
    console.log('🔵 Starting storage upload to bucket: profile-pictures');
    console.log('🔵 Upload params:', { 
      filePath, 
      dataSize: uint8Array.length, 
      contentType: `image/${fileExt}`, 
      upsert: true 
    });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, uint8Array, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    console.log('🔵 Upload response data:', uploadData);
    console.log('🔵 Upload response error:', uploadError);

    if (uploadError) {
      console.error('🔴 Upload error full details:', JSON.stringify(uploadError, null, 2));
      console.error('🔴 Upload error message:', uploadError.message);
      console.error('🔴 Upload error name:', uploadError.name);
      console.error('🔴 Upload error stack:', uploadError.stack);
      Alert.alert('Upload Failed', `Error: ${uploadError.message}\n\nCheck Metro logs for details.`);
      return;
    }

    // Get public URL
    console.log('🔵 Getting public URL for:', filePath);
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🔵 Public URL obtained:', publicUrl);

    // Update user profile with new picture URL
    console.log('🔵 Updating user_profiles table with URL');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('🔴 Profile update error:', updateError);
      Alert.alert('Error', 'Failed to save profile picture');
      return;
    }

    console.log('✅ Profile picture uploaded and saved successfully!');
    setProfilePicUrl(publicUrl);
    Alert.alert('Success', 'Profile picture updated!');
  } catch (error) {
    console.error('🔴 CATCH BLOCK - Upload error:', error);
    console.error('🔴 Error name:', error?.name);
    console.error('🔴 Error message:', error?.message);
    console.error('🔴 Error stack:', error?.stack);
    console.error('🔴 Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    Alert.alert('Error', `Upload failed: ${error?.message || 'Unknown error'}\n\nCheck Metro logs for full details.`);
  } finally {
    setUploadingPic(false);
  }
};

  const testStorageConnection = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.storage.listBuckets();
      console.log('Storage buckets:', data);
      console.log('Storage error:', error);
      Alert.alert('Storage Test', `Buckets: ${data?.length || 0}, Error: ${error?.message || 'none'}`);
    } catch (err) {
      console.error('Storage test error:', err);
      Alert.alert('Storage Test Failed', JSON.stringify(err));
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setGoals(null);
      setProfilePicUrl(null);
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleUpdateGoals = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_goals')
        .update({
          goal_type: editGoal,
          training_days: editTrainingDays
        })
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update goals');
        return;
      }

      Alert.alert('Success', 'Goals updated successfully');
      setEditing(false);
      loadUserData();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // LOGGED OUT STATE
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.loggedOutCard}>
          <Text style={styles.loggedOutText}>You're not signed in</Text>
          <Pressable
            style={styles.authButton}
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </Pressable>
          <Pressable
            style={[styles.authButton, styles.signUpButton]}
            onPress={() => router.push('/auth/sign-up')}
          >
            <Text style={styles.authButtonText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // LOGGED IN STATE
  const goalLabels = {
    cut: 'Cut Fat & Get Jacked',
    maintain: 'Maintain',
    bulk: 'Bulk Up Time'
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile Picture Section */}
      <View style={styles.profilePicSection}>
        <Pressable style={styles.profilePicContainer} onPress={handlePickImage} disabled={uploadingPic}>
          {uploadingPic ? (
            <ActivityIndicator size="large" color="#000" />
          ) : profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.silhouetteIcon}>👤</Text>
              <Text style={styles.tapToAddText}>Tap to add photo</Text>
            </View>
          )}
        </Pressable>
        {profilePicUrl && !uploadingPic && (
          <Pressable style={styles.changePicButton} onPress={handlePickImage}>
            <Text style={styles.changePicText}>Change Photo</Text>
          </Pressable>
        )}
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.emailText}>{user.email}</Text>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </View>

      {profile && (
        <>
          <Text style={styles.subtitle}>Your Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{profile.age} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight:</Text>
              <Text style={styles.value}>{profile.weight} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Height:</Text>
              <Text style={styles.value}>{profile.height} cm</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Meals per day:</Text>
              <Text style={styles.value}>{profile.meals_per_day}</Text>
            </View>
          </View>
        </>
      )}

      {goals && (
        <>
          <Text style={styles.subtitle}>Your Goals</Text>
          <View style={styles.card}>
            {!editing ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Goal:</Text>
                  <Text style={styles.value}>{goalLabels[goals.goal_type]}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Training days:</Text>
                  <Text style={styles.value}>{goals.training_days} per week</Text>
                </View>
                <Pressable style={styles.button} onPress={() => setEditing(true)}>
                  <Text style={styles.buttonText}>Edit Goals</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.editLabel}>Goal Type</Text>
                <View style={styles.goalOptions}>
                  {['cut', 'maintain', 'bulk'].map(g => (
                    <Pressable
                      key={g}
                      style={[styles.goalOption, editGoal === g && styles.selectedGoal]}
                      onPress={() => setEditGoal(g)}
                    >
                      <Text style={styles.goalText}>{goalLabels[g]}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.editLabel}>Training Days per Week</Text>
                <View style={styles.daysContainer}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <Pressable
                      key={d}
                      style={[styles.dayButton, editTrainingDays === d && styles.selectedDay]}
                      onPress={() => setEditTrainingDays(d)}
                    >
                      <Text style={[styles.dayText, editTrainingDays === d && styles.selectedDayText]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.buttonRow}>
                  <Pressable style={[styles.button, styles.cancelButton]} onPress={() => { setEditing(false); setEditGoal(goals.goal_type); setEditTrainingDays(goals.training_days); }}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.button} onPress={handleUpdateGoals}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

  // Profile Picture Styles
  profilePicSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePicContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteIcon: {
    fontSize: 50,
    color: '#999',
  },
  tapToAddText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  changePicButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  changePicText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Logged out styles
  loggedOutCard: {
    backgroundColor: '#f8f8f8',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40
  },
  loggedOutText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  authButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  signUpButton: {
    backgroundColor: '#666'
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // Logged in styles
  card: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },

  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  cancelButton: { backgroundColor: '#666', flex: 1, marginRight: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  editLabel: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 10 },
  goalOptions: { marginBottom: 20 },
  goalOption: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 10 },
  selectedGoal: { borderColor: '#000', backgroundColor: '#f0f0f0' },
  goalText: { fontSize: 16 },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  dayButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  selectedDay: { backgroundColor: '#000', borderColor: '#000' },
  dayText: { fontSize: 16, color: '#000' },
  selectedDayText: { color: '#fff' },
  buttonRow: { flexDirection: 'row', marginTop: 20 }
});
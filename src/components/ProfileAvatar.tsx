import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabase } from '../lib/supabase';

type ProfileAvatarProps = {
  size?: number;
  showBorder?: boolean;
  onPress?: () => void;
};

export function ProfileAvatar({ 
  size = 40, 
  showBorder = true,
  onPress 
}: ProfileAvatarProps) {
  const router = useRouter();
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('profile_picture_url')
        .eq('user_id', user.id)
        .single();

      if (profileData?.profile_picture_url) {
        setProfilePicUrl(profileData.profile_picture_url);
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/profile');
    }
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: showBorder ? 2 : 0,
    borderColor: '#3F6B5C',
  };

  if (loading) {
    return (
      <View style={[styles.container, containerStyle, styles.placeholder]}>
        <Text style={[styles.placeholderIcon, { fontSize: size * 0.5 }]}>👤</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.container, containerStyle]}>
        {profilePicUrl ? (
          <Image 
            source={{ uri: profilePicUrl }} 
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderIcon, { fontSize: size * 0.5 }]}>👤</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    color: '#999',
  },
});
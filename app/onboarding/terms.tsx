const handleAccept = async () => {
  setIsLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'No user session found');
      router.replace('/welcome');
      return;
    }

    // ✅ Record agreement without agreed_at (DB default handles timestamp)
    const { error } = await supabase
      .from('user_agreements')
      .insert({
        user_id: user.id,
        agreement_type: 'terms_and_conditions',
        version: '1.0',
      });

    if (error) {
      console.error('Error saving agreement:', error);
      Alert.alert('Error', 'Failed to save your agreement. Please try again.');
      return;
    }

    // ✅ Go to Complete screen after successful save
    router.replace('/onboarding/complete');
  } catch (error) {
    console.error('Error accepting terms:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


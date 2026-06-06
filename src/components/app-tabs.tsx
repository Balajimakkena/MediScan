import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { auth } from '../firebaseConfig';

export default function InteractionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // If not logged in, boot them back to the login/home screen immediately
        router.replace('/'); 
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf6' }}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  // Your actual screen code goes here...
  return (
    <View style={styles.container}>
      <Text>Secure Interaction Content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
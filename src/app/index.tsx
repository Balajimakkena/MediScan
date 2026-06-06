import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import * as WebBrowser from 'expo-web-browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

//const GROQ_API_KEY = ' ';

WebBrowser.maybeCompleteAuthSession();

//const GOOGLE_CLIENT_ID = ' ';

export default function HomeScreen() {
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App States
  const [medicine, setMedicine] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('Analyzing...');
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState('english');
  const [familyWarnings, setFamilyWarnings] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
  AsyncStorage.getItem('app_language').then((lang) => {
    if (lang) setLanguage(lang);
  });
}, []);
  const handleSignUp = async () => {
    if (!email || !password || !fullName || !age || !phone) {
      return Alert.alert('Missing Details', 'Please fill in all the basic details to register.');
    }
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      await setDoc(doc(db, 'users', newUser.uid), {
        fullName, age, phone, email,
        createdAt: new Date().toISOString()
      });
      Alert.alert('Account Created', `Welcome to MediScan, ${fullName}!`);
    } catch (e: any) {
      Alert.alert('Sign Up Error', e.message);
    }
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both your email and password.');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      Alert.alert('Login Error', e.message);
    }
    setAuthLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success' && result.authentication) {
        const idToken = result.authentication.idToken;
        if (!idToken) { Alert.alert('Error', 'Failed to get authentication token'); return; }
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const googleUser = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', googleUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', googleUser.uid), {
            fullName: googleUser.displayName || 'Google User',
            email: googleUser.email || '',
            phone: '', age: '',
            googleSignIn: true,
            createdAt: new Date().toISOString(),
            photoURL: googleUser.photoURL || ''
          });
        }
        Alert.alert('Success', `Welcome ${googleUser.displayName || 'User'}!`);
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In Error', e.message || 'Failed to sign in with Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      Speech.stop();
      await signOut(auth);
      setResult(null); setImage(null); setFamilyWarnings([]);
      setFullName(''); setAge(''); setPhone(''); setEmail(''); setPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getLangInstruction = (lang: string) => {
    if (lang === 'telugu') return 'Respond entirely in Telugu language only.';
    if (lang === 'hindi') return 'Respond entirely in Hindi language only.';
    return 'Respond in simple English only.';
  };

  const speakResult = (res: any) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = `${res.name} information. Uses: ${res.use}. Dosage: ${res.dosage}. Side Effects: ${res.sideEffects}. Warnings: ${res.warning}.`;
    const langCode = language === 'telugu' ? 'te-IN' : language === 'hindi' ? 'hi-IN' : 'en-IN';
    setSpeaking(true);
    Speech.speak(text, {
      language: langCode,
      rate: 0.85,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };
  
  const analyzeMedicineByName = async (name: string, lang: string) => {
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are a medical AI assistant. Respond ONLY in JSON format with no markdown backticks. ${getLangInstruction(lang)}: {"name":"medicine full name","use":"what it is used for","dosage":"dosage and timing","sideEffects":"common side effects","warning":"important warnings"}` },
            { role: 'user', content: `Analyze this medicine: ${name}` }
          ],
          max_tokens: 1000,
        })
      });
      const data = await response.json();
      const text = data.choices[0].message.content.replace(/```json|```/g, '').trim();
      const parsedResult = JSON.parse(text);
setResult(parsedResult);

// Save to Firestore history
if (user && auth.currentUser) {
  try {
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'medicine_history'), {
      name: parsedResult.name,
      result: parsedResult,
      language: lang,
      timestamp: new Date()
    });
  } catch (e) { 
    console.log('History save error:', e); 
  }
}
    } catch (e: any) { Alert.alert('Error', 'Please try again! ' + e.message); }
    setLoading(false);
  };

  const analyzeMedicine = async () => {
    if (!medicine.trim()) { Alert.alert('Error', 'Please type a medicine name!'); return; }
    setLoading(true); setResult(null); setLoadingText('Analyzing...');
    await analyzeMedicineByName(medicine, language);
  };

 
  

  const reset = () => {
    Speech.stop();
    setSpeaking(false);
    setMedicine('');
    setResult(null);
    setImage(null);
    setFamilyWarnings([]);
  };

  // ── AUTH SCREEN ──
  if (!user) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.authContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
          <View style={styles.brandingWrapper}>
            <Text style={styles.authLogoIcon}>💊</Text>
            <Text style={styles.authLogoText}>MediScan</Text>
            <Text style={styles.authSubtitle}>Secure AI Medical Assistant</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

            {isSignUp && (
              <>
                <TextInput style={styles.authInput} placeholder="Full Name" placeholderTextColor="#888" value={fullName} onChangeText={setFullName} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput style={[styles.authInput, { flex: 1 }]} placeholder="Age" placeholderTextColor="#888" value={age} onChangeText={setAge} keyboardType="numeric" maxLength={3} />
                  <TextInput style={[styles.authInput, { flex: 2 }]} placeholder="Phone Number" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </>
            )}

            <TextInput style={styles.authInput} placeholder="Email Address" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.authInput} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />

            {authLoading ? (
              <ActivityIndicator size="large" color="#1D9E75" style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ gap: 12 }}>
                <TouchableOpacity style={[styles.primaryAuthBtn, { backgroundColor: '#1D9E75' }]} onPress={isSignUp ? handleSignUp : handleLogin}>
                  <Text style={styles.authBtnText}>{isSignUp ? 'Register & Sign Up' : 'Login'}</Text>
                </TouchableOpacity>

                <View style={styles.separatorRow}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>or</Text>
                  <View style={styles.separatorLine} />
                </View>

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={!request}>
                  <Text style={styles.googleBtnText}>🌐 Sign in with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.switchAuthText}>
                    {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── HOME SCREEN ──
  return (
    <View style={styles.appContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Text style={styles.title}>💊 MediScan</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Logged in as: {user.email}</Text>
        </View>

        

        {image && <View style={styles.imageBox}><Image source={{ uri: image }} style={styles.previewImage} /></View>}

 
        <View style={styles.inputBox}>
          <View style={styles.inputRow}>
            <TextInput style={styles.inputFlex} placeholder="Type medicine name..." value={medicine === 'medicine (from photo)' ? '' : medicine} onChangeText={setMedicine} />
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeMedicine}>
              <Text style={styles.analyzeBtnText}>→</Text>
            </TouchableOpacity>
          </View>
          {(result || image) && <TouchableOpacity style={styles.resetBtn} onPress={reset}><Text style={styles.resetText}>🔄 Reset</Text></TouchableOpacity>}
        </View>

        {loading && <View style={styles.loadingBox}><ActivityIndicator size="large" color="#1D9E75" /><Text style={styles.loadingText}>{loadingText}</Text></View>}

        {result && (
          <View style={styles.card}>
            <Text style={styles.medName}>{result.name}</Text>
            <TouchableOpacity style={[styles.voiceBtn, speaking && styles.voiceBtnActive]} onPress={() => speakResult(result)}>
              <Text style={styles.voiceBtnText}>{speaking ? '🔴 Stop' : '🔊 Listen'}</Text>
            </TouchableOpacity>
            <View style={styles.row}><Text style={styles.label}>✅ Uses</Text><Text style={styles.value}>{result.use}</Text></View>
            <View style={styles.row}><Text style={styles.label}>💊 Dosage</Text><Text style={styles.value}>{result.dosage}</Text></View>
            <View style={styles.row}><Text style={styles.label}>⚠️ Side Effects</Text><Text style={styles.value}>{result.sideEffects}</Text></View>
            <View style={styles.row}><Text style={styles.label}>🚨 Warning</Text><Text style={styles.value}>{result.warning}</Text></View>
          </View>
        )}
      </ScrollView>

     <View style={styles.bottomNav}>
  <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profiles')}>
    <Text style={styles.navIcon}>👨‍👩‍👧</Text>
    <Text style={styles.navLabel}>Family</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem} onPress={() => router.push('/nearby-pharmacies')}>
    <Text style={styles.navIcon}>🏪</Text>
    <Text style={styles.navLabel}>Pharmacy</Text>
  </TouchableOpacity>

  {/* BIG SCANNER IN MIDDLE */}
  <TouchableOpacity style={styles.scannerNavBtn} onPress={() => router.push('/scanner')}>
    <Text style={styles.scannerIcon}>🔍</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem} onPress={() => router.push('/history')}>
    <Text style={styles.navIcon}>📋</Text>
    <Text style={styles.navLabel}>History</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
    <Text style={styles.navIcon}>⚙️</Text>
    <Text style={styles.navLabel}>Settings</Text>
  </TouchableOpacity>
</View>
</View>


     
  );
}

const styles = StyleSheet.create({
  scannerNavBtn: { 
  width: 70, 
  height: 70, 
  borderRadius: 35, 
  backgroundColor: '#1D9E75', 
  justifyContent: 'center', 
  alignItems: 'center',
  marginBottom: 20,
  shadowColor: '#1D9E75',
  shadowOpacity: 0.8,
  shadowRadius: 10,
  elevation: 5
},

scannerIcon: { fontSize: 35 },
  container: { flex: 1, backgroundColor: '#f0faf6' },
  appContainer: { flex: 1, backgroundColor: '#f0faf6' },
  authContainer: { flex: 1, backgroundColor: '#f0faf6', padding: 24 },
  brandingWrapper: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  authLogoIcon: { fontSize: 64, marginBottom: 8 },
  authLogoText: { fontSize: 36, fontWeight: 'bold', color: '#0F6E56', letterSpacing: 0.5 },
  authSubtitle: { fontSize: 14, color: '#557A70', marginTop: 4, fontWeight: '500' },
  formCard: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(29,158,117,0.15)' },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20, textAlign: 'center' },
  authInput: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, fontSize: 15, borderWidth: 1, borderColor: '#d3ede2', marginBottom: 16, color: '#333' },
  primaryAuthBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  authBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#d3ede2' },
  separatorText: { color: '#888', paddingHorizontal: 12, fontSize: 14 },
  googleBtn: { backgroundColor: '#ffffff', borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#d3ede2' },
  googleBtnText: { color: '#333', fontSize: 15, fontWeight: '600' },
  switchAuthText: { color: '#1D9E75', textAlign: 'center', fontSize: 14, fontWeight: '500' },
  header: { backgroundColor: '#1D9E75', padding: 24, paddingTop: 48, alignItems: 'flex-start' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: 'white', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  sub: { fontSize: 12, color: '#d0f0e8', marginTop: 4 },
  scanBox: { margin: 16, backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ccc' },
  bigCamBtn: { padding: 32, alignItems: 'center', backgroundColor: '#E1F5EE', borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  bigCamIcon: { fontSize: 56, marginBottom: 10 },
  bigCamText: { fontSize: 17, fontWeight: '700', color: '#0F6E56', marginBottom: 4 },
  bigCamSub: { fontSize: 12, color: '#666' },
  gallerySmallBtn: { padding: 14, alignItems: 'center' },
  gallerySmallText: { fontSize: 14, color: '#1D9E75', fontWeight: '600' },
  imageBox: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ccc' },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
  divider: { alignItems: 'center', marginVertical: 8 },
  dividerText: { fontSize: 12, color: '#888' },
  inputBox: { padding: 16, gap: 10 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputFlex: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5, borderColor: '#ccc' },
  analyzeBtn: { backgroundColor: '#1D9E75', borderRadius: 12, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  analyzeBtnText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  resetBtn: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#ddd' },
  resetText: { fontSize: 14, color: '#666' },
  loadingBox: { alignItems: 'center', marginTop: 20, gap: 10 },
  loadingText: { fontSize: 13, color: '#1D9E75' },
  card: { margin: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#ccc' },
  medName: { fontSize: 20, fontWeight: 'bold', color: '#0F6E56', marginBottom: 12, textAlign: 'center' },
  voiceBtn: { backgroundColor: '#E1F5EE', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#1D9E75' },
  voiceBtnActive: { backgroundColor: '#FCEBEB', borderColor: '#A32D2D' },
  voiceBtnText: { fontSize: 15, fontWeight: '600', color: '#0F6E56' },
  row: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  value: { fontSize: 14, color: '#333', lineHeight: 22 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingBottom: 16, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: '#555', fontWeight: '500' },
});

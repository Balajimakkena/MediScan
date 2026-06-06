import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

//const GROQ_API_KEY = ' ';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const scannerSize = 280;

export default function ScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Start scanning animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const scanLinePosition = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scannerSize - 4],
  });

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    try {
      setLoading(true);
      if (!cameraRef.current) return;

      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setLoading(false);

      if (photo.base64) {
        await analyzeMedicine(photo.base64);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', 'Failed to take picture: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        await analyzeMedicine(result.assets[0].base64);
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const getLangInstruction = (lang: string) => {
    if (lang === 'telugu') return 'Respond entirely in Telugu language only.';
    if (lang === 'hindi') return 'Respond entirely in Hindi language only.';
    return 'Respond in simple English only.';
  };

  const analyzeMedicine = async (base64: string) => {
    try {
      // Step 1: Get medicine name from image
      const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [{
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }, {
              type: 'text',
              text: 'What is the medicine name shown in this image? Reply with ONLY the medicine name, nothing else.'
            }]
          }],
          max_tokens: 50,
        })
      });

      const visionData = await visionRes.json();
      if (visionData.error) {
        Alert.alert('Error', 'Could not identify medicine from image');
        return;
      }

      const medicineName = visionData.choices[0].message.content.trim();

      // Step 2: Analyze medicine
      const analysisRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: `You are a medical AI. Respond ONLY in JSON: {"name":"medicine name","use":"uses","dosage":"dosage","sideEffects":"side effects","warning":"warnings"}. ${getLangInstruction(language)}`
          }, {
            role: 'user',
            content: `Analyze this medicine: ${medicineName}`
          }],
          max_tokens: 1000,
        })
      });

      const analysisData = await analysisRes.json();
      const analysisText = analysisData.choices[0].message.content.replace(/```json|```/g, '').trim();
      const result = JSON.parse(analysisText);

      // Step 3: Save to Firestore
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'medicine_history'), {
            name: result.name,
            result: result,
            language: language,
            timestamp: new Date()
          });
        } catch (e) {
          console.log('History save error:', e);
        }
      }

      // Step 4: Show result
      Alert.alert(
        result.name,
        `Uses: ${result.use}\n\nDosage: ${result.dosage}\n\nSide Effects: ${result.sideEffects}\n\nWarning: ${result.warning}`,
         [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Analysis failed: ' + error.message);
    }
  };

 return (
  <View style={styles.container}>
    <CameraView style={styles.camera} ref={cameraRef} facing="back" />

    {/* Overlay UI - Absolute positioning */}
    <View style={styles.overlay}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>💊 Scan Medicine</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scanning Area */}
      <View style={styles.scannerContainer}>
        <View style={styles.scannerBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLinePosition }] }
            ]}
          />
        </View>
        <Text style={styles.scanText}>Align medicine with scanner</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
          <Text style={styles.galleryBtnText}>🖼️ Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.captureBtn, loading && { opacity: 0.6 }]} 
          onPress={takePicture}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <View style={styles.captureCircle} />
          )}
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
overlay: { 
  position: 'absolute', 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  justifyContent: 'space-between',
  pointerEvents: 'box-none'
},
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerText: { color: 'white', fontSize: 18, fontWeight: '700' },
  placeholder: { width: 40 },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerBox: { width: scannerSize, height: scannerSize, borderColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderRadius: 20, overflow: 'hidden' },
  corner: { position: 'absolute', borderColor: '#1D9E75', borderWidth: 3, width: 30, height: 30 },
  topLeft: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', width: scannerSize, height: 4, backgroundColor: '#1D9E75', shadowColor: '#1D9E75', shadowOpacity: 0.8, shadowRadius: 10 },
  scanText: { color: 'rgba(255,255,255,0.7)', marginTop: 20, fontSize: 13, fontWeight: '500' },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingTop: 20 },
  galleryBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  galleryBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', justifyContent: 'center', alignItems: 'center', shadowColor: '#1D9E75', shadowOpacity: 0.8, shadowRadius: 15 },
  captureCircle: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: 'white' },
  spacer: { width: 80 },
  permissionText: { fontSize: 16, color: '#333', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  permissionBtnText: { color: 'white', fontWeight: '600' },
});

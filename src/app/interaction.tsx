import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';

// Use the same API key from your index.tsx
const GROQ_API_KEY = ' ';

export default function InteractionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Interaction States
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/'); 
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const checkInteraction = async () => {
    if (!med1.trim() || !med2.trim()) {
      return Alert.alert('Error', 'Please enter both medicine names to check for interactions.');
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${GROQ_API_KEY}` 
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert clinical pharmacist AI. Analyze the two provided medicines for drug-drug interactions. Respond ONLY in strict JSON format with no markdown wrappers or backticks. Format: {"severity":"Safe" | "Mild" | "Moderate" | "Severe", "description":"Detailed explanation of what happens if taken together", "recommendation":"What the patient should do (e.g., Consult doctor, space out by 2 hours, safe to take)"}' 
            },
            { 
              role: 'user', 
              content: `Check interaction between: ${med1} and ${med2}` 
            }
          ],
          max_tokens: 800,
        })
      });

      const data = await response.json();
      const text = data.choices[0].message.content.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(text));
    } catch (e: any) { 
      Alert.alert('Analysis Error', 'Could not check interaction. ' + e.message); 
    }
    
    setIsAnalyzing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'safe': return '#1D9E75'; // Green
      case 'mild': return '#F59E0B'; // Yellow
      case 'moderate': return '#EA580C'; // Orange
      case 'severe': return '#DC2626'; // Red
      default: return '#333';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>🔍 Drug Interaction</Text>
        <Text style={styles.subText}>Check if your scanned or prescribed medicines are safe to take together.</Text>

        <View style={styles.inputCard}>
          <TextInput 
            style={styles.input} 
            placeholder="First Medicine (e.g., Aspirin)" 
            placeholderTextColor="#888"
            value={med1} 
            onChangeText={setMed1} 
          />
          <View style={styles.plusContainer}>
            <Text style={styles.plusText}>+</Text>
          </View>
          <TextInput 
            style={styles.input} 
            placeholder="Second Medicine (e.g., Ibuprofen)" 
            placeholderTextColor="#888"
            value={med2} 
            onChangeText={setMed2} 
          />
          
          <TouchableOpacity 
            style={[styles.analyzeBtn, (!med1 || !med2) && { opacity: 0.7 }]} 
            onPress={checkInteraction}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.analyzeBtnText}>Check Interaction</Text>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={[styles.resultCard, { borderColor: getSeverityColor(result.severity) }]}>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(result.severity) }]}>
              <Text style={styles.severityText}>{result.severity} Interaction</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>⚠️ What Happens:</Text>
              <Text style={styles.resultValue}>{result.description}</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>💡 Recommendation:</Text>
              <Text style={styles.resultValue}>{result.recommendation}</Text>
            </View>

            <TouchableOpacity 
              style={styles.resetBtn} 
              onPress={() => { setMed1(''); setMed2(''); setResult(null); }}
            >
              <Text style={styles.resetText}>Clear & Check Another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf6', paddingHorizontal: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf6' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#d3ede2', borderRadius: 8 },
  backText: { color: '#0F6E56', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0F6E56', marginBottom: 6 },
  subText: { fontSize: 14, color: '#557A70', lineHeight: 20, marginBottom: 24 },
  inputCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#e8f5f0' },
  input: { backgroundColor: '#f9fcfb', borderWidth: 1, borderColor: '#d3ede2', padding: 16, borderRadius: 12, fontSize: 16, color: '#333' },
  plusContainer: { alignItems: 'center', marginVertical: -10, zIndex: 10 },
  plusText: { fontSize: 24, fontWeight: 'bold', color: '#1D9E75', backgroundColor: 'white', paddingHorizontal: 10, borderRadius: 20, overflow: 'hidden' },
  analyzeBtn: { backgroundColor: '#1D9E75', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  analyzeBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  resultCard: { marginTop: 24, backgroundColor: 'white', padding: 20, borderRadius: 20, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  severityBadge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 16 },
  severityText: { color: 'white', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  resultRow: { marginBottom: 16 },
  resultLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  resultValue: { fontSize: 15, color: '#555', lineHeight: 22 },
  resetBtn: { marginTop: 8, padding: 14, backgroundColor: '#f5f5f5', borderRadius: 10, alignItems: 'center' },
  resetText: { color: '#666', fontWeight: '600', fontSize: 14 }
});
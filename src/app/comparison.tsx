import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GROQ_API_KEY = ' ';

export default function ComparisonScreen() {
  const router = useRouter();
  const [compMed1, setCompMed1] = useState('');
  const [compMed2, setCompMed2] = useState('');
  const [compResult, setCompResult] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  const compareMedicines = async () => {
    if (!compMed1.trim() || !compMed2.trim()) { Alert.alert('Error', 'Enter both medicine names!'); return; }
    setCompLoading(true);
    setCompResult(null);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are a medical AI. Reply ONLY with JSON (no markdown): {"winner": "medicine name", "summary": "one line summary", "med1": {"name": "name", "pros": "advantages", "cons": "disadvantages", "bestFor": "best use case", "cost": "cheap/moderate/expensive"}, "med2": {"name": "name", "pros": "advantages", "cons": "disadvantages", "bestFor": "best use case", "cost": "cheap/moderate/expensive"}, "verdict": "final recommendation"}.` },
            { role: 'user', content: `Compare ${compMed1} vs ${compMed2} as medicines. Which is better and when?` }
          ],
          max_tokens: 600,
        })
      });
      const d = await res.json();
      const text = d.choices[0].message.content.replace(/```json|```/g, '').trim();
      setCompResult(JSON.parse(text));
    } catch (e: any) {
      Alert.alert('Error', 'Try again! ' + e.message);
    }
    setCompLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚖️ Compare Medicines</Text>
        <Text style={styles.sub}>Which medicine is better for you?</Text>
      </View>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="Medicine 1 (e.g. Paracetamol)" value={compMed1} onChangeText={setCompMed1} />
        <View style={styles.plusRow}><Text style={styles.plusText}>VS</Text></View>
        <TextInput style={styles.input} placeholder="Medicine 2 (e.g. Ibuprofen)" value={compMed2} onChangeText={setCompMed2} />
        <TouchableOpacity style={styles.btn} onPress={compareMedicines}><Text style={styles.btnText}>Compare</Text></TouchableOpacity>
        {compResult && <TouchableOpacity style={styles.resetBtn} onPress={() => { setCompResult(null); setCompMed1(''); setCompMed2(''); }}><Text style={styles.resetText}>🔄 Reset</Text></TouchableOpacity>}
      </View>
      {compLoading && <View style={styles.loadingBox}><ActivityIndicator size="large" color="#1D9E75" /><Text style={styles.loadingText}>Comparing medicines...</Text></View>}
      {compResult && (
        <View style={{margin:16}}>
          <View style={styles.winnerCard}>
            <Text style={styles.winnerLabel}>🏆 Generally Better</Text>
            <Text style={styles.winnerName}>{compResult.winner}</Text>
            <Text style={styles.winnerSummary}>{compResult.summary}</Text>
          </View>
          <View style={styles.compRow}>
            {[compResult.med1, compResult.med2].map((m, i) => (
              <View key={i} style={styles.compCard}>
                <Text style={styles.compMedName}>{m?.name}</Text>
                <Text style={styles.compLabel}>✅ Pros</Text><Text style={styles.compValue}>{m?.pros}</Text>
                <Text style={styles.compLabel}>❌ Cons</Text><Text style={styles.compValue}>{m?.cons}</Text>
                <Text style={styles.compLabel}>🎯 Best For</Text><Text style={styles.compValue}>{m?.bestFor}</Text>
                <View style={styles.costBadge}><Text style={styles.costText}>💰 {m?.cost}</Text></View>
              </View>
            ))}
          </View>
          <View style={styles.verdictCard}>
            <Text style={styles.verdictTitle}>📋 Final Verdict</Text>
            <Text style={styles.verdictText}>{compResult.verdict}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0faf6' },
  subHeader: { backgroundColor:'#1D9E75', padding:24, paddingTop:40 },
  title: { fontSize:22, fontWeight:'bold', color:'white' },
  sub: { fontSize:12, color:'#d0f0e8', marginTop:4 },
  backBtn: { alignSelf:'flex-start', marginBottom:12, paddingVertical:10, paddingHorizontal:16, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:10 },
  backText: { color:'white', fontSize:15, fontWeight:'700' },
  inputBox: { padding:16, gap:10 },
  input: { backgroundColor:'white', borderRadius:12, padding:14, fontSize:15, borderWidth:0.5, borderColor:'#ccc' },
  plusRow: { alignItems:'center' },
  plusText: { fontSize:24, fontWeight:'bold', color:'#1D9E75' },
  btn: { backgroundColor:'#1D9E75', borderRadius:12, padding:14, alignItems:'center' },
  btnText: { color:'white', fontSize:16, fontWeight:'600' },
  resetBtn: { backgroundColor:'#f5f5f5', borderRadius:12, padding:12, alignItems:'center', borderWidth:0.5, borderColor:'#ddd' },
  resetText: { fontSize:14, color:'#666' },
  loadingBox: { alignItems:'center', marginTop:20, gap:10 },
  loadingText: { fontSize:13, color:'#1D9E75' },
  winnerCard: { backgroundColor:'#E1F5EE', borderRadius:16, padding:16, marginBottom:12, borderWidth:1, borderColor:'#1D9E75', alignItems:'center' },
  winnerLabel: { fontSize:12, color:'#0F6E56', fontWeight:'600', marginBottom:4 },
  winnerName: { fontSize:22, fontWeight:'bold', color:'#0F6E56', marginBottom:4 },
  winnerSummary: { fontSize:13, color:'#444', textAlign:'center' },
  compRow: { flexDirection:'row', gap:10, marginBottom:12 },
  compCard: { flex:1, backgroundColor:'white', borderRadius:16, padding:12, borderWidth:0.5, borderColor:'#ccc' },
  compMedName: { fontSize:14, fontWeight:'bold', color:'#0F6E56', marginBottom:8, textAlign:'center' },
  compLabel: { fontSize:11, fontWeight:'600', color:'#555', marginTop:6, marginBottom:2 },
  compValue: { fontSize:12, color:'#333', lineHeight:18 },
  costBadge: { marginTop:8, backgroundColor:'#f0f0f0', borderRadius:20, paddingHorizontal:10, paddingVertical:4, alignSelf:'center' },
  costText: { fontSize:11, color:'#555', fontWeight:'500' },
  verdictCard: { backgroundColor:'white', borderRadius:16, padding:16, borderWidth:0.5, borderColor:'#ccc' },
  verdictTitle: { fontSize:15, fontWeight:'bold', color:'#1a1a1a', marginBottom:8 },
  verdictText: { fontSize:14, color:'#333', lineHeight:22 }
});
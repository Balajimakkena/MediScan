import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('english');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((lang) => { if(lang) setLanguage(lang); });
  }, []);

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.sub}>Customize your experience</Text>
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>🌐 Select Language</Text>
        <Text style={styles.settingsSub}>Choose language for medicine information</Text>
        {[
          { key: 'english', flag: '🇬🇧', name: 'English', desc: 'Simple English explanations' },
          { key: 'telugu', flag: '🇮🇳', name: 'Telugu (తెలుగు)', desc: 'All info in Telugu' },
          { key: 'hindi', flag: '🇮🇳', name: 'हिंदी (Hindi)', desc: 'All info in Hindi' },
        ].map(l => (
          <TouchableOpacity key={l.key}
            style={[styles.langOption, language === l.key && styles.langSelected]}
            onPress={() => changeLanguage(l.key)}>
            <Text style={styles.langFlag}>{l.flag}</Text>
            <View style={styles.langInfo}>
              <Text style={styles.langName}>{l.name}</Text>
              <Text style={styles.langDesc}>{l.desc}</Text>
            </View>
            {language === l.key && <Text style={styles.langCheck}>✅</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.settingsSection, {marginTop:12}]}>
        <View style={styles.currentLangCard}>
          <Text style={styles.currentLangText}>
            {language === 'english' ? '🇬🇧 English selected' : language === 'telugu' ? '🇮🇳 Telugu selected' : '🇮🇳 Hindi selected'}
          </Text>
          <Text style={styles.currentLangSub}>Results will appear in this language</Text>
        </View>
      </View>
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
  settingsSection: { margin:16, backgroundColor:'white', borderRadius:16, padding:16, borderWidth:0.5, borderColor:'#ccc' },
  settingsTitle: { fontSize:16, fontWeight:'bold', color:'#1a1a1a', marginBottom:4 },
  settingsSub: { fontSize:12, color:'#888', marginBottom:14 },
  langOption: { flexDirection:'row', alignItems:'center', padding:14, borderRadius:12, borderWidth:1, borderColor:'#ddd', marginBottom:10, backgroundColor:'#f9f9f9', gap:12 },
  langSelected: { borderColor:'#1D9E75', backgroundColor:'#E1F5EE' },
  langFlag: { fontSize:28 },
  langInfo: { flex:1 },
  langName: { fontSize:15, fontWeight:'600', color:'#1a1a1a' },
  langDesc: { fontSize:12, color:'#666', marginTop:2 },
  langCheck: { fontSize:20 },
  currentLangCard: { backgroundColor:'#E1F5EE', borderRadius:12, padding:14, alignItems:'center' },
  currentLangText: { fontSize:16, fontWeight:'600', color:'#0F6E56' },
  currentLangSub: { fontSize:12, color:'#444', marginTop:4 }
});
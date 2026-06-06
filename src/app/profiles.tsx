import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Import auth along with db
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const CONDITIONS = ['Diabetes', 'Blood Pressure', 'Heart Disease', 'Kidney Disease', 'Liver Disease', 'Asthma', 'Thyroid', 'Pregnancy'];

export default function ProfilesScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the current logged-in user's UID dynamically
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to manage family profiles.');
      router.replace('/'); // Redirect to home/login if not authenticated
      return;
    }
    loadProfiles();
  }, [currentUser]);

  // FETCH ROUTE MATCHING: users/{userId}/family_profiles
  const loadProfiles = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userProfilesRef = collection(db, 'users', currentUser.uid, 'family_profiles');
      const querySnapshot = await getDocs(userProfilesRef);
      const fetchedProfiles: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProfiles.push({ id: doc.id, ...doc.data() });
      });
      setProfiles(fetchedProfiles);
    } catch (error: any) {
      Alert.alert('Permission Error', 'Failed to load cloud profiles: ' + error.message);
    }
    setLoading(false);
  };

  // SAVE ROUTE MATCHING: users/{userId}/family_profiles
  const saveProfile = async () => {
    if (!currentUser) { Alert.alert('Error', 'User session not found.'); return; }
    if (!name.trim() || !age.trim()) {
      Alert.alert('ValidationError', 'Please enter Name and Age!');
      return;
    }

    try {
      const newProfileData = {
        name,
        age,
        conditions: selected,
        createdAt: new Date().toISOString()
      };

      const userProfilesRef = collection(db, 'users', currentUser.uid, 'family_profiles');
      const docRef = await addDoc(userProfilesRef, newProfileData);
      
      setProfiles([...profiles, { id: docRef.id, ...newProfileData }]);
      setModalVisible(false);
      setName(''); setAge(''); setSelected([]);
    } catch (error: any) {
      Alert.alert('Write Error', 'Failed to save profile data: ' + error.message);
    }
  };

  // DELETE ROUTE MATCHING: users/{userId}/family_profiles/{id}
  const deleteProfile = async (id: string) => {
    if (!currentUser) return;
    Alert.alert('Delete Profile?', 'Are you sure you want to delete this profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const profileDocRef = doc(db, 'users', currentUser.uid, 'family_profiles', id);
            await deleteDoc(profileDocRef);
            setProfiles(profiles.filter(p => p.id !== id));
          } catch (error: any) {
            Alert.alert('Delete Error', 'Failed to delete data: ' + error.message);
          }
        }
      }
    ]);
  };

  const toggleCondition = (c: string) => {
    setSelected(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👨‍👩‍👧 Family Profiles</Text>
        <Text style={styles.sub}>Save health information safely in your cloud account</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add New Member</Text>
      </TouchableOpacity>

      {loading && (
        <View style={{ marginVertical: 20 }}>
          <ActivityIndicator size="small" color="#1D9E75" />
          <Text style={{ textAlign: 'center', color: '#1D9E75', marginTop: 8 }}>Loading secure profiles...</Text>
        </View>
      )}

      {!loading && profiles.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
          <Text style={styles.emptyText}>No profiles found{'\n'}Tap the button above to add one!</Text>
        </View>
      )}

      {profiles.map(p => (
        <View key={p.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.name ? p.name[0].toUpperCase() : '?'}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{p.name}</Text>
              <Text style={styles.cardAge}>Age: {p.age} years old</Text>
            </View>
            <TouchableOpacity onPress={() => deleteProfile(p.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
          {p.conditions && p.conditions.length > 0 && (
            <View style={styles.conditions}>
              {p.conditions.map((c: string) => (
                <View key={c} style={styles.condBadge}>
                  <Text style={styles.condText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
          {(!p.conditions || p.conditions.length === 0) && (
            <Text style={styles.noConditions}>No health conditions entry ✅</Text>
          )}
        </View>
      ))}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add New Member</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
            <Text style={styles.condLabel}>Select Health Conditions:</Text>
            <View style={styles.condGrid}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.condOption, selected.includes(c) && styles.condSelected]}
                  onPress={() => toggleCondition(c)}
                >
                  <Text style={[styles.condOptionText, selected.includes(c) && styles.condSelectedText]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setName(''); setAge(''); setSelected([]); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0faf6' },
  header: { backgroundColor:'#1D9E75', padding:24, paddingTop:40, alignItems:'center' },
  backBtn: { alignSelf:'flex-start', marginBottom:8, paddingVertical:8, paddingHorizontal:14, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:10 },
  backText: { color:'white', fontSize:14, fontWeight:'700' },
  title: { fontSize:24, fontWeight:'bold', color:'white' },
  sub: { fontSize:13, color:'#d0f0e8', marginTop:4 },
  addBtn: { margin:16, backgroundColor:'#1D9E75', borderRadius:12, padding:14, alignItems:'center' },
  addBtnText: { color:'white', fontSize:16, fontWeight:'600' },
  empty: { alignItems:'center', marginTop:60, gap:12 },
  emptyIcon: { fontSize:60 },
  emptyText: { fontSize:15, color:'#888', textAlign:'center', lineHeight:24 },
  card: { margin:16, marginTop:0, backgroundColor:'white', borderRadius:16, padding:16, borderWidth:0.5, borderColor:'#ccc' },
  cardHeader: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  avatar: { width:44, height:44, borderRadius:22, backgroundColor:'#1D9E75', alignItems:'center', justifyContent:'center' },
  avatarText: { color:'white', fontSize:20, fontWeight:'bold' },
  cardInfo: { flex:1 },
  cardName: { fontSize:16, fontWeight:'600', color:'#1a1a1a' },
  cardAge: { fontSize:12, color:'#888', marginTop:2 },
  deleteBtn: { fontSize:20 },
  conditions: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  condBadge: { backgroundColor:'#FAEEDA', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  condText: { fontSize:11, color:'#854F0B', fontWeight:'500' },
  noConditions: { fontSize:12, color:'#1D9E75' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modal: { backgroundColor:'white', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'85%' },
  modalTitle: { fontSize:18, fontWeight:'bold', color:'#1a1a1a', marginBottom:16, textAlign:'center' },
  input: { backgroundColor:'#f5f5f5', borderRadius:12, padding:14, fontSize:15, marginBottom:12, borderWidth:0.5, borderColor:'#ddd' },
  condLabel: { fontSize:13, fontWeight:'600', color:'#555', marginBottom:10 },
  condGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  condOption: { paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:'#ccc', backgroundColor:'#f5f5f5' },
  condSelected: { backgroundColor:'#E1F5EE', borderColor:'#1D9E75' },
  condOptionText: { fontSize:12, color:'#666' },
  condSelectedText: { color:'#0F6E56', fontWeight:'600' },
  modalBtns: { flexDirection:'row', gap:10 },
  cancelBtn: { flex:1, padding:14, borderRadius:12, backgroundColor:'#f5f5f5', alignItems:'center' },
  cancelText: { fontSize:15, color:'#666' },
  saveBtn: { flex:1, padding:14, borderRadius:12, backgroundColor:'#1D9E75', alignItems:'center' },
  saveText: { fontSize:15, color:'white', fontWeight:'600' },
});
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function ScanHistoryScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in first');
      router.replace('/');
      return;
    }
    loadScanHistory();
  }, [currentUser]);

  const loadScanHistory = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'medicine_history');
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedScans: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedScans.push({ id: doc.id, ...doc.data() });
      });
      setScans(fetchedScans);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load history: ' + error.message);
    }
    setLoading(false);
  };

  const deleteScan = async (scanId: string) => {
    if (!currentUser) return;
    Alert.alert('Delete', 'Remove this scan from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'medicine_history', scanId));
            setScans(scans.filter(s => s.id !== scanId));
            Alert.alert('Deleted', 'Scan removed from history');
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete: ' + error.message);
          }
        }
      }
    ]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={{ marginTop: 10, color: '#1D9E75' }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Scan History</Text>
        <Text style={styles.sub}>All your medicine scans</Text>
      </View>

      {scans.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No scans yet{'\n'}Start by scanning a medicine!</Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={styles.countText}>Total scans: {scans.length}</Text>
          {scans.map((scan) => (
            <View key={scan.id} style={styles.historyCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.medicineName}>{scan.name || 'Unknown Medicine'}</Text>
                  <Text style={styles.scanDate}>📅 {formatDate(scan.timestamp)}</Text>
                  {scan.language && <Text style={styles.language}>🌐 {scan.language}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteScan(scan.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {scan.result && (
                <View style={styles.cardBottom}>
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>✅ Uses:</Text>
                    <Text style={styles.value}>{scan.result.use || 'N/A'}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>💊 Dosage:</Text>
                    <Text style={styles.value}>{scan.result.dosage || 'N/A'}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>⚠️ Side Effects:</Text>
                    <Text style={styles.value}>{scan.result.sideEffects || 'N/A'}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf6' },
  header: { backgroundColor: '#1D9E75', padding: 24, paddingTop: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10 },
  backText: { color: 'white', fontSize: 15, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  sub: { fontSize: 13, color: '#d0f0e8' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24 },
  countText: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 12 },
  historyCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 0.5, borderColor: '#ddd', marginBottom: 12, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  cardInfo: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: '700', color: '#0F6E56', marginBottom: 4 },
  scanDate: { fontSize: 12, color: '#888', marginBottom: 2 },
  language: { fontSize: 11, color: '#1D9E75', fontWeight: '600' },
  deleteBtn: { padding: 8, marginRight: -8 },
  deleteBtnText: { fontSize: 18 },
  cardBottom: { padding: 12, backgroundColor: '#f9f9f9' },
  resultRow: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#555' },
  value: { fontSize: 13, color: '#333', marginTop: 2, lineHeight: 20 },
});

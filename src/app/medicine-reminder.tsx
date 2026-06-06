import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
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
import { auth, db } from '../firebaseConfig';

// Configure notifications
 
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours'];

export default function MedicineReminderScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in first');
      router.replace('/');
      return;
    }
     loadReminders();
  }, [currentUser]);

  
  const loadReminders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const remindersRef = collection(db, 'users', currentUser.uid, 'medicine_reminders');
      const q = query(remindersRef, orderBy('time', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedReminders: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReminders.push({ id: doc.id, ...doc.data() });
      });
      setReminders(fetchedReminders);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load reminders: ' + error.message);
    }
    setLoading(false);
  };

  const addReminder = async () => {
    if (!medicineName.trim()) {
      return Alert.alert('Error', 'Please enter medicine name');
    }
    if (!currentUser) return;

    try {
      const remindersRef = collection(db, 'users', currentUser.uid, 'medicine_reminders');
      await addDoc(remindersRef, {
        medicineName,
        frequency,
        time,
        notes,
        createdAt: new Date().toISOString(),
        active: true
      });

      // Schedule notification
 
      setMedicineName('');
      setFrequency('Once daily');
      setTime('09:00');
      setNotes('');
      setModalVisible(false);
      loadReminders();
      Alert.alert('Success', 'Reminder added successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add reminder: ' + error.message);
    }
  };

   
  const deleteReminder = async (reminderId: string) => {
    if (!currentUser) return;
    Alert.alert('Delete', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'medicine_reminders', reminderId));
            setReminders(reminders.filter(r => r.id !== reminderId));
            Alert.alert('Deleted', 'Reminder removed');
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete: ' + error.message);
          }
        }
      }
    ]);
  };

  const getFrequencyEmoji = (freq: string) => {
    switch(freq) {
      case 'Once daily': return '☀️';
      case 'Twice daily': return '🌤️';
      case 'Three times daily': return '🌞';
      case 'Every 4 hours': return '⏰';
      case 'Every 6 hours': return '⏱️';
      case 'Every 8 hours': return '⏳';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={{ marginTop: 10, color: '#1D9E75' }}>Loading reminders...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⏰ Medicine Reminders</Text>
        <Text style={styles.sub}>Set reminders for your medicines</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Reminder</Text>
      </TouchableOpacity>

      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⏰</Text>
          <Text style={styles.emptyText}>No reminders set yet{'\n'}Add one to get started!</Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={styles.countText}>Total reminders: {reminders.length}</Text>
          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.medicineName}>{reminder.medicineName}</Text>
                  <Text style={styles.reminderTime}>🕐 {reminder.time}</Text>
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>
                      {getFrequencyEmoji(reminder.frequency)} {reminder.frequency}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteReminder(reminder.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {reminder.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>📝 Notes:</Text>
                  <Text style={styles.notesText}>{reminder.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Medicine Reminder</Text>

            <Text style={styles.inputLabel}>Medicine Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paracetamol"
              placeholderTextColor="#888"
              value={medicineName}
              onChangeText={setMedicineName}
            />

            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM (e.g. 09:00)"
              placeholderTextColor="#888"
              value={time}
              onChangeText={setTime}
            />

            <Text style={styles.inputLabel}>Frequency</Text>
            <ScrollView style={styles.frequencyScroll} horizontal showsHorizontalScrollIndicator={false}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.freqOption, frequency === freq && styles.freqSelected]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={[styles.freqText, frequency === freq && styles.freqSelectedText]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. Take with food"
              placeholderTextColor="#888"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setMedicineName('');
                  setFrequency('Once daily');
                  setTime('09:00');
                  setNotes('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addReminder}>
                <Text style={styles.saveText}>Add Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: { margin: 16, backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24 },
  countText: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 12 },
  reminderCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 0.5, borderColor: '#ddd', marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  cardInfo: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: '700', color: '#0F6E56', marginBottom: 4 },
  reminderTime: { fontSize: 13, color: '#666', marginBottom: 6 },
  frequencyBadge: { backgroundColor: '#E1F5EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  frequencyText: { fontSize: 12, color: '#0F6E56', fontWeight: '600' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  notesSection: { padding: 12, backgroundColor: '#f9f9f9', borderTopWidth: 0.5, borderTopColor: '#eee' },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#333', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5, borderColor: '#ddd', marginBottom: 12 },
  frequencyScroll: { marginBottom: 12 },
  freqOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9', marginRight: 8 },
  freqSelected: { backgroundColor: '#E1F5EE', borderColor: '#1D9E75' },
  freqText: { fontSize: 12, color: '#666', fontWeight: '500' },
  freqSelectedText: { color: '#0F6E56', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center' },
  saveText: { fontSize: 15, color: 'white', fontWeight: '600' },
});

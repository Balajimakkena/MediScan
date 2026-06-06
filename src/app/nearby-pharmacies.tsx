import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const GOOGLE_PLACES_API_KEY = ' AIzaSyCePfDd_Xd8k9PA7gm2Ba8Xc8GF5FN2x4I  ';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  phone?: string;
  latitude: number;
  longitude: number;
}

export default function NearbyPharmaciesScreen() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to find nearby pharmacies');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      await searchNearbyPharmacies(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to get location: ' + error.message);
      setLoading(false);
    }
  };

  const searchNearbyPharmacies = async (latitude: number, longitude: number) => {
  setLoading(true);
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=pharmacy&keyword=medical&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const pharmaciesData: Pharmacy[] = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        distance: calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        rating: place.rating || 0,
        phone: place.formatted_phone_number,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }));

      pharmaciesData.sort((a, b) => a.distance - b.distance);
      setPharmacies(pharmaciesData);
    } else {
      Alert.alert('No Results', 'No pharmacies or medical shops found nearby');
    }
  } catch (error: any) {
    Alert.alert('Error', 'Failed to search: ' + error.message);
  }
  setLoading(false);
};

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const openDirections = (latitude: number, longitude: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open directions')
    );
  };

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Could not make call')
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#1D9E75';
    if (rating >= 4) return '#F59E0B';
    if (rating >= 3.5) return '#EA580C';
    return '#999';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={{ marginTop: 10, color: '#1D9E75' }}>Finding nearby pharmacies...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏪 Nearby Pharmacies</Text>
        <Text style={styles.sub}>Find pharmacies near you</Text>
      </View>

      {userLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 Latitude: {userLocation.latitude.toFixed(4)}, Longitude: {userLocation.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={() => {
        if (userLocation) {
          searchNearbyPharmacies(userLocation.latitude, userLocation.longitude);
        }
      }}>
        <Text style={styles.refreshBtnText}>🔄 Refresh Locations</Text>
      </TouchableOpacity>

      {pharmacies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyText}>No pharmacies found{'\n'}Try refreshing or changing location</Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={styles.countText}>Found {pharmacies.length} pharmacies nearby</Text>
          {pharmacies.map((pharmacy) => (
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <Text style={styles.address}>{pharmacy.address}</Text>
                  <View style={styles.ratingRow}>
                    <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(pharmacy.rating) }]}>
                      <Text style={styles.ratingText}>⭐ {pharmacy.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.distance}>📍 {pharmacy.distance.toFixed(1)} km away</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openDirections(pharmacy.latitude, pharmacy.longitude, pharmacy.name)}
                >
                  <Text style={styles.actionBtnText}>🗺️ Directions</Text>
                </TouchableOpacity>

                {pharmacy.phone && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openPhone(pharmacy.phone!)}
                  >
                    <Text style={styles.actionBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  locationInfo: { margin: 16, backgroundColor: 'white', padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#ddd' },
  locationText: { fontSize: 12, color: '#666', fontWeight: '500' },
  refreshBtn: { margin: 16, marginTop: 0, backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center' },
  refreshBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24 },
  countText: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 12 },
  pharmacyCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 0.5, borderColor: '#ddd', marginBottom: 12, overflow: 'hidden' },
  cardHeader: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  cardInfo: { flex: 1 },
  pharmacyName: { fontSize: 16, fontWeight: '700', color: '#0F6E56', marginBottom: 4 },
  address: { fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingText: { fontSize: 12, color: 'white', fontWeight: '600' },
  distance: { fontSize: 12, color: '#1D9E75', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#f9f9f9' },
  actionBtn: { flex: 1, backgroundColor: '#E1F5EE', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 13, color: '#0F6E56', fontWeight: '600' },
});

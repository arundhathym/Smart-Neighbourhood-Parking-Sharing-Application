import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const UserBookingDetails = ({ route, navigation }) => {
  const { booking, spotName, spotLocation, spotImage } = route.params;
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this parking reservation? This action cannot be undone.",
      [
        { text: "No, keep it", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: confirmCancel }
      ]
    );
  };

  const confirmCancel = async () => {
    setIsCancelling(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/bookings/${booking._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert("Cancelled", "Your booking has been successfully removed.");
        navigation.goBack(); // Send them back to the history list!
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to cancel booking.");
      }
    } catch (error) {
      console.error("Cancel Error:", error);
      Alert.alert("Network Error", "Could not reach the server to cancel.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Spot Image & Basic Info */}
        <Image source={{ uri: spotImage }} style={styles.image} />
        
        <View style={styles.detailsCard}>
          <Text style={styles.title}>{spotName}</Text>
          <Text style={styles.location}><Ionicons name="location" size={14}/> {spotLocation}</Text>
          
          <View style={styles.divider} />

          {/* Booking Data Grid */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Booking ID</Text>
              <Text style={styles.gridValue}>{booking._id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Vehicle</Text>
              <Text style={styles.gridValue}>{booking.vehicleType || 'Car'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Duration</Text>
              <Text style={styles.gridValue}>{booking.durationHours} Hours</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Total Paid</Text>
              <Text style={[styles.gridValue, { color: '#10B981' }]}>${booking.totalAmount}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Arrival Time</Text>
            <Text style={styles.timeValue}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Cancel Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={handleCancelBooking}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator color="#E11D48" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  image: { width: '100%', height: 200, borderRadius: 20, marginBottom: 20 },
  detailsCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  location: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 20 },
  gridLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  gridValue: { fontSize: 16, color: '#0F172A', fontWeight: '800' },
  timeBox: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  timeValue: { fontSize: 16, color: '#3C467B', fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  cancelBtn: { backgroundColor: '#FFF0F2', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECDD3' },
  cancelBtnText: { color: '#E11D48', fontSize: 16, fontWeight: 'bold' }
});

export default UserBookingDetails;
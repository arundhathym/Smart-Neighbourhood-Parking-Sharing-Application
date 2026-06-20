import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const RequestDetails = ({ navigation, route }) => {
  // Extract the real MongoDB data passed from the HostDashboard
  const requestData = route.params?.requestData || {};
  const [isUpdating, setIsUpdating] = useState(false);

  const isPending = requestData.status === 'Pending' || requestData.status === 'Confirmed';
  
  // Safely extract details
  const spotName = requestData.spaceDetails?.name || requestData.spaceDetails?.location?.split(',')[0] || 'Parking Spot';
  const driverName = requestData.driverDetails?.name || 'Unknown Driver';
  const driverPhone = requestData.driverDetails?.phone || 'No phone provided';

  // Formatting dates and times
  const bookingDate = new Date(requestData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const bookingTime = new Date(requestData.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Backend API Call to update the status
  const updateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/bookings/${requestData._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        Alert.alert("Success", `Booking updated to ${newStatus}`);
        navigation.goBack(); // Return to dashboard to see the change
      } else {
        Alert.alert("Error", "Could not update booking.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your connection.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: requestData.status === 'Active' ? '#E5EBFA' : '#FFFBEB' }]}>
          <Text style={[styles.statusText, { color: requestData.status === 'Active' ? '#3C467B' : '#D97706' }]}>
            {requestData.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* CUSTOMER INFO CARD */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.customerAvatar} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{driverName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="call" size={12} color="#64748B" />
                <Text style={styles.ratingText}>{driverPhone}</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="chatbubble-outline" size={20} color="#3C467B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="call-outline" size={20} color="#3C467B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOOKING DETAILS CARD */}
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={20} color="#3C467B" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Parking Spot</Text>
              <Text style={styles.detailValue}>{spotName}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar" size={20} color="#3C467B" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Requested Schedule</Text>
              <Text style={styles.detailValue}>{bookingDate} • {bookingTime}</Text>
              <Text style={styles.detailSubValue}>Duration: {requestData.durationHours} Hours</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <FontAwesome5 name={requestData.vehicleType === 'Bike' ? 'motorcycle' : 'car-side'} size={18} color="#3C467B" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{requestData.vehicleType || 'Car'}</Text>
              <Text style={styles.detailSubValue}>Booking ID: {requestData._id?.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* EXTRAS & PRICING */}
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Fee ({requestData.durationHours} hr)</Text>
            <Text style={styles.totalPrice}>${requestData.totalAmount}</Text>
          </View>
        </View>

      </ScrollView>

      {/* STICKY FOOTER ACTIONS */}
      {isPending ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.declineBtn]} 
            onPress={() => updateStatus('Rejected')}
            disabled={isUpdating}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => updateStatus('Active')}
            disabled={isUpdating}
          >
            {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.acceptText}>Approve Request</Text>}
          </TouchableOpacity>
        </View>
      ) : requestData.status === 'Active' ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => updateStatus('Completed')}
            disabled={isUpdating}
          >
            {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.acceptText}>Mark as Completed</Text>}
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  statusBadge: { backgroundColor: '#E5EBFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#3C467B', fontSize: 12, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: '#DDE3F0' },
  
  // Customer Info
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5EBFA' },
  customerInfo: { flex: 1, marginLeft: 15 },
  customerName: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#64748B', marginLeft: 4 },
  contactActions: { flexDirection: 'row' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: '#DDE3F0' },
  
  // Trip Details
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  detailSubValue: { fontSize: 13, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },

  // Pricing
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: '#64748B' },
  totalPrice: { fontSize: 20, fontWeight: '900', color: '#3C467B' },

  // Footer Actions
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DDE3F0', flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDE3F0', marginRight: 10 },
  declineText: { color: '#64748B', fontWeight: 'bold', fontSize: 15 },
  acceptBtn: { backgroundColor: '#3C467B', shadowColor: '#3C467B', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});

export default RequestDetails;
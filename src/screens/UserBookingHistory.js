import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Image, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const UserBookingHistory = () => {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyBookings();
    }, [])
  );

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/bookings/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const rawText = await response.text();
      
      try {
        const data = JSON.parse(rawText);
        if (response.ok) {
          const now = new Date();
          
          const evaluatedBookings = data.map(booking => {
            const bookingTime = new Date(booking.createdAt);
            const expiryTime = new Date(bookingTime.getTime() + (booking.durationHours * 60 * 60 * 1000));
            const isExpired = now > expiryTime;
            
            return {
              ...booking,
              displayStatus: isExpired ? 'Expired' : (booking.status || 'Active'),
              isExpired: isExpired
            };
          });

          setBookings(evaluatedBookings);
        }
      } catch (parseError) {
        console.error("Server crashed:", rawText);
      }
    } catch (error) {
      console.error("Network error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending...';
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // UPDATED: Now accepts the dynamic phone number from the database
  const handleContactHost = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Not Available", "The host has not provided a contact number.");
      return;
    }

    Alert.alert(
      "Contact Host",
      `Do you want to call the host for directions?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call Host", 
          onPress: () => {
            // Using the real dynamic number
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert("Error", "Dialer is not available on this simulator/device.");
            });
          }
        }
      ]
    );
  };

  const renderBookingCard = ({ item }) => {
    const spotName = item.spaceDetails?.name || item.spaceDetails?.location?.split(',')[0] || 'Unknown Parking Spot';
    const spotLocation = item.spaceDetails?.location || 'Location unavailable';
    const spotImage = item.spaceDetails?.image || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1000&auto=format&fit=crop';
    
    // EXTRACT THE REAL PHONE NUMBER (Checks multiple common backend population paths)
    const hostPhone = item.hostId?.phone || item.hostDetails?.phone || item.spaceDetails?.hostId?.phone || null;

    const statusBgColor = item.isExpired ? '#F1F5F9' : '#ECFDF5';
    const statusTextColor = item.isExpired ? '#64748B' : '#10B981';

    const showContact = !item.isExpired && (item.displayStatus === 'Active' || item.displayStatus === 'Confirmed' || item.displayStatus === 'Pending');

    return (
      <TouchableOpacity 
        style={[styles.card, item.isExpired && { opacity: 0.7 }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('UserBookingDetails', { booking: item, spotName, spotLocation, spotImage })}
      >
        <Image source={{ uri: spotImage }} style={styles.cardImage} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.spotName} numberOfLines={1}>{spotName}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>{item.displayStatus}</Text>
            </View>
          </View>
          
          <Text style={styles.spotLocation} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#64748B" /> {spotLocation}
          </Text>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Duration / Total</Text>
                <Text style={styles.valueTotal}>{item.durationHours} hr • ₹{item.totalAmount}</Text>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              {showContact && (
                <TouchableOpacity style={styles.contactBtn} onPress={() => handleContactHost(hostPhone)}>
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                  <Text style={styles.contactBtnText}>Contact Host</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3C467B" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="calendar-clear-outline" size={60} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySub}>You haven't made any parking reservations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#DDE3F0', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardImage: { width: '100%', height: 120 },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  spotName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1, marginRight: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  spotLocation: { fontSize: 13, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  valueTotal: { fontSize: 14, color: '#3C467B', fontWeight: 'bold' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3C467B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  contactBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', marginLeft: 6 }
});

export default UserBookingHistory;
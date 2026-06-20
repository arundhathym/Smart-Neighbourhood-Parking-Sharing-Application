import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const BookingHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBookingHistory();
    }, [])
  );

  const fetchBookingHistory = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/bookings/host`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const bookingsData = await response.json();
        // This will include ALL bookings (Pending, Active, Completed, Cancelled, Rejected)
        setHistory(bookingsData);
      }
    } catch (error) {
      console.error("Failed to fetch booking history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColors = (status) => {
    switch(status) {
      case 'Completed': return { bg: '#D1FAE5', text: '#10B981' };
      case 'Active': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'Pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'Cancelled': 
      case 'Rejected': return { bg: '#FEE2E2', text: '#EF4444' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const HistoryCard = ({ name, car, date, duration, price, status }) => {
    const colors = getStatusColors(status);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{name}</Text>
            <Text style={styles.carDetails}>{car}</Text>
          </View>
          <Text style={styles.price}>₹{price}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <View style={styles.footerRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.footerText}>{date}</Text>
          </View>
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.footerText}>{duration} Hours</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Trail</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={22} color="#3C467B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3C467B" style={{ marginTop: 50 }} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No booking history found.</Text>
        ) : (
          history.map((item) => (
            <HistoryCard 
              key={item._id}
              name={item.driverDetails?.name || 'Unknown Driver'} 
              car={item.vehicleType || 'Vehicle'} 
              date={formatDate(item.createdAt)} 
              duration={item.durationHours} 
              price={(item.totalAmount || 0).toFixed(2)} 
              status={item.status} 
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  filterBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontStyle: 'italic' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#DDE3F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  carDetails: { fontSize: 13, color: '#64748B', marginTop: 2 },
  price: { fontSize: 18, fontWeight: '900', color: '#3C467B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#64748B', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' }
});

export default BookingHistory;
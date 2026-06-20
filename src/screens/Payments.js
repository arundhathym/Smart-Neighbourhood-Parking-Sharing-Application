import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const Payments = ({ navigation }) => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real booking data when the screen opens
  useFocusEffect(
    useCallback(() => {
      fetchEarningsData();
    }, [])
  );

  const fetchEarningsData = async () => {
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
        
        // Filter only Active or Completed bookings for earnings
        const paidBookings = bookingsData.filter(
          b => b.status === 'Completed' || b.status === 'Active'
        );

        // Calculate total amount collected in person
        const sum = paidBookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        setTotalEarnings(sum);

        // Set the transactions list
        setTransactions(paidBookings);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const Transaction = ({ name, date, amount, type }) => (
    <View style={styles.transactionCard}>
      <View style={styles.iconBox}>
        <Ionicons name={type === 'in' ? 'arrow-down' : 'arrow-up'} size={20} color="#3C467B" />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName}>{name}</Text>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: type === 'in' ? '#10B981' : '#1E293B' }]}>
        {type === 'in' ? '+' : '-'}₹{amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Ledger</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* EARNINGS CARD */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Cash Collected</Text>
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="large" style={{ marginVertical: 10 }} />
          ) : (
            <Text style={styles.balanceAmount}>₹{totalEarnings.toFixed(2)}</Text>
          )}
          <View style={styles.infoBadge}>
            <Ionicons name="information-circle" size={16} color="#3C467B" />
            <Text style={styles.infoBadgeText}>Earnings from 'Pay on Arrival' bookings</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Collection History</Text>
        
        {isLoading ? (
          <ActivityIndicator color="#3C467B" style={{ marginTop: 30 }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No completed bookings yet.</Text>
        ) : (
          transactions.map((t) => (
            <Transaction 
              key={t._id}
              name={`Booking - ${t.driverDetails?.name || 'Driver'}`} 
              date={formatDate(t.createdAt)} 
              amount={(t.totalAmount || 0).toFixed(2)} 
              type="in" 
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 20 },
  
  balanceCard: { backgroundColor: '#3C467B', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 30, shadowColor: '#3C467B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  balanceLabel: { color: '#C3D0F0', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 15 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5EBFA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  infoBadgeText: { color: '#3C467B', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, marginLeft: 4 },
  
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' },

  transactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#DDE3F0' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transactionInfo: { flex: 1 },
  transactionName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#64748B' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' }
});

export default Payments;
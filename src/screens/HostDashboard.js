import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, StatusBar, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const HostDashboard = ({ navigation }) => {
  const [hostData, setHostData] = useState({ name: 'Loading...', email: '', profilePic: null });
  const [stats, setStats] = useState({ earnings: 0, totalBookings: 0, spaces: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Notification States
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 1. Fetch Profile Data
      const userRes = await fetch(`${API_BASE_URL}/users/me`, { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setHostData({ name: userData.name, email: userData.email, profilePic: userData.profilePic });
      }

      // 2. Fetch Spaces Data
      const spacesRes = await fetch(`${API_BASE_URL}/spaces/me`, { headers });
      if (spacesRes.ok) {
        const spacesData = await spacesRes.json();
        setStats(prev => ({ ...prev, spaces: spacesData.length }));
      }

      // 3. Fetch Bookings Data
      const bookingsRes = await fetch(`${API_BASE_URL}/bookings/host`, { headers });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        
        let totalEarnings = 0;
        let pending = [];
        let active = [];

        bookingsData.forEach(booking => {
          if (booking.status === 'Completed' || booking.status === 'Active') {
            totalEarnings += booking.totalAmount;
          }

          if (booking.status === 'Pending' || booking.status === 'Confirmed') {
            pending.push(booking);
          } else if (booking.status === 'Active') {
            active.push(booking);
          }
        });

        setStats(prev => ({ 
          ...prev, 
          earnings: totalEarnings, 
          totalBookings: bookingsData.length 
        }));
        
        setPendingRequests(pending);
        setActiveBookings(active);

        // If there are pending requests, trigger the notification dot
        if (pending.length > 0) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      }

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        Alert.alert("Success", `Booking marked as ${newStatus}`);
        fetchDashboardData(); 
      } else {
        Alert.alert("Error", "Could not update booking status.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your connection.");
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = () => {
    if (hostData.profilePic && hostData.profilePic.length > 100) {
      if (hostData.profilePic.startsWith('data:image')) {
        return hostData.profilePic;
      }
      return `data:image/jpeg;base64,${hostData.profilePic}`;
    }
    const safeName = hostData.name !== 'Loading...' ? hostData.name : 'Host';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=E5EBFA&color=3C467B&size=150`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3C467B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      {/* NOTIFICATION MODAL */}
      <Modal visible={showNotifModal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.notifDropdown}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifHeaderTitle}>Notifications</Text>
              <Ionicons name="close" size={20} color="#64748B" onPress={() => setShowNotifModal(false)} />
            </View>
            
            {pendingRequests.length === 0 ? (
              <Text style={styles.notifEmpty}>No new parking requests right now.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                {pendingRequests.map((req, index) => (
                  <View key={`notif-${req._id}`} style={styles.notifItem}>
                    <Text style={styles.notifText}>
                      🚗 New request from <Text style={{fontWeight: 'bold'}}>{req.driverDetails?.name || 'a driver'}</Text> for {req.durationHours} hours. Check your queue to approve!
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <Image 
              source={{ uri: getAvatarUrl() }} 
              style={styles.profilePic} 
            />
            <View>
              <Text style={styles.greetingText}>{hostData.name}</Text>
              <Text style={styles.subGreeting}>{hostData.email}</Text>
            </View>
          </View>
          
          {/* NEW: Notification Bell Button */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => {
              setShowNotifModal(true);
              setHasUnread(false);
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            {hasUnread && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.statsWrapper}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{stats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.spaces}</Text>
            <Text style={styles.statLabel}>Spaces</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{pendingRequests.length} New</Text></View>
          )}
        </View>

        {pendingRequests.length === 0 ? (
          <Text style={styles.emptyText}>No pending requests right now.</Text>
        ) : (
          pendingRequests.map((req) => (
            <TouchableOpacity 
              key={req._id}
              style={styles.requestCard} 
              activeOpacity={0.8} 
              onPress={() => navigation.navigate('RequestDetails', { requestData: req })}
            >
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.driverName}>{req.driverDetails?.name || 'Driver'} ({req.vehicleType || 'Car'})</Text>
                  <Text style={styles.requestTime}>Requested: {formatTime(req.createdAt)}</Text>
                  <Text style={styles.requestTime}>Duration: {req.durationHours} Hours</Text>
                </View>
                <Text style={styles.requestPrice}>₹{req.totalAmount}</Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => updateBookingStatus(req._id, 'Rejected')}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => updateBookingStatus(req._id, 'Active')}
                >
                  <Text style={styles.acceptText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Currently Parked</Text>
          {activeBookings.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{activeBookings.length} Live</Text></View>
          )}
        </View>

        {activeBookings.length === 0 ? (
          <Text style={styles.emptyText}>No cars are currently parked in your spots.</Text>
        ) : (
          activeBookings.map((active) => {
            const spotName = active.spaceDetails?.name || active.spaceDetails?.location?.split(',')[0] || 'Parking Spot';
            
            return (
              <TouchableOpacity 
                key={active._id}
                style={styles.activeCard} 
                activeOpacity={0.8} 
                onPress={() => navigation.navigate('RequestDetails', { requestData: active })}
              >
                <View style={styles.activeCardTop}>
                  <View style={styles.iconBoxLive}>
                    <FontAwesome5 name={active.vehicleType === 'Bike' ? 'motorcycle' : 'car-side'} size={20} color="#3C467B" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activeDriverName}>{active.driverDetails?.name || 'Driver'} ({active.vehicleType || 'Car'})</Text>
                    <Text style={styles.activeLicensePlate}>ID: {active._id.substring(0,8).toUpperCase()}</Text>
                  </View>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                </View>
                
                <View style={styles.activeDetailsRow}>
                  <Ionicons name="location" size={16} color="#64748B" />
                  <Text style={styles.activeDetailText}>{spotName}</Text>
                </View>
                <View style={styles.activeDetailsRow}>
                  <Ionicons name="time" size={16} color="#64748B" />
                  <Text style={styles.activeDetailText}>Duration: {active.durationHours} Hours</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#F1F5F9', marginTop: 15 }]}
                  onPress={() => updateBookingStatus(active._id, 'Completed')}
                >
                  <Text style={[styles.acceptText, { color: '#3C467B' }]}>Mark as Completed</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, 
  headerContainer: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 25, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#DDE3F0', zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profilePic: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EBFA', marginRight: 12 }, 
  greetingText: { color: '#1E293B', fontSize: 18, fontWeight: 'bold' },
  subGreeting: { color: '#64748B', fontSize: 13, marginTop: 2 },
  
  iconButton: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E11D48', borderWidth: 2, borderColor: '#F1F5F9' },
  
  statsWrapper: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F5F7FA', marginHorizontal: 20, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 10, borderWidth: 1, borderColor: '#DDE3F0' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  divider: { width: 1, height: '100%', backgroundColor: '#DDE3F0' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  badge: { backgroundColor: '#E5EBFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#3C467B', fontSize: 12, fontWeight: 'bold' }, 
  emptyText: { color: '#94A3B8', fontStyle: 'italic', marginBottom: 20 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: '#DDE3F0' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  driverName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  requestTime: { fontSize: 13, color: '#64748B', marginTop: 4 },
  requestPrice: { fontSize: 18, fontWeight: '800', color: '#3C467B' }, 
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  declineBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE3F0', marginRight: 8 },
  declineText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  acceptBtn: { backgroundColor: '#3C467B', marginLeft: 8 }, 
  acceptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  activeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#C3D0F0', borderLeftWidth: 5, borderLeftColor: '#3C467B' }, 
  activeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBoxLive: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center' },
  activeDriverName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  activeLicensePlate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5EBFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3C467B', marginRight: 4 }, 
  liveText: { color: '#3C467B', fontSize: 10, fontWeight: 'bold' }, 
  activeDetailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  activeDetailText: { fontSize: 13, color: '#475569', marginLeft: 6 },

  // Notification Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', paddingTop: 90, paddingRight: 20 },
  notifDropdown: { backgroundColor: '#FFFFFF', width: 300, borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notifHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  notifEmpty: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginVertical: 15 },
  notifItem: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  notifText: { fontSize: 13, color: '#1E293B', fontWeight: '500', lineHeight: 18 }
});

export default HostDashboard;
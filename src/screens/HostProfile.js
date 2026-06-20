import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const MenuItem = ({ icon, title, color = "#1E293B", onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuText, { color }]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
  </TouchableOpacity>
);

const HostProfile = ({ navigation }) => {
  const [userData, setUserData] = useState({ name: 'Loading...', email: '', profilePic: null });

  useFocusEffect(
    useCallback(() => {
      const fetchUserProfile = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (!token) return;

          const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const data = await response.json();
          if (response.ok) {
            setUserData({ name: data.name, email: data.email, profilePic: data.profilePic || null });
          }
        } catch (error) {
          console.error('Error fetching host profile:', error);
          setUserData({ name: 'Host', email: 'host@example.com', profilePic: null });
        }
      };
      
      fetchUserProfile();
    }, [])
  );

  const getAvatarUrl = () => {
    if (userData.profilePic && userData.profilePic.length > 100) {
      if (userData.profilePic.startsWith('data:image')) {
        return userData.profilePic;
      }
      return `data:image/jpeg;base64,${userData.profilePic}`;
    }
    const safeName = userData.name !== 'Loading...' ? userData.name : 'Host';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=E5EBFA&color=3C467B&size=150`;
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            navigation.replace('Login'); 
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>Account Settings</Text>
        {/* FIX: Updated Label here */}
        <MenuItem 
          icon="wallet-outline" 
          title="Earnings Ledger" 
          onPress={() => navigation.navigate('Payments')} 
        />
        <MenuItem 
          icon="calendar-outline" 
          title="Booking History" 
          onPress={() => navigation.navigate('BookingHistory')} 
        />
        <MenuItem 
          icon="settings-outline" 
          title="Preferences" 
          onPress={() => navigation.navigate('HostPreferences')} 
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>Support</Text>
        <MenuItem 
          icon="help-circle-outline" 
          title="Help Center" 
          onPress={() => navigation.navigate('HelpCenter')} 
        />
        <MenuItem 
          icon="log-out-outline" 
          title="Log Out" 
          color="#EF4444" 
          onPress={handleLogout} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, 
  profileHeader: { alignItems: 'center', paddingVertical: 40, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' }, 
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 15, backgroundColor: '#E5EBFA' }, 
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  userEmail: { color: '#64748B', marginTop: 5 },
  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#DDE3F0' }, 
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { marginLeft: 15, fontSize: 16, fontWeight: '500' }
});

export default HostProfile;
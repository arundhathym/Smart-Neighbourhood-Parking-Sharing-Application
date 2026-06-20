import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Switch, SafeAreaView, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const ParkingSpaceDetails = ({ navigation }) => {
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMySpaces();
    }, [])
  );

  const fetchMySpaces = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const API_URL = `${API_BASE_URL}/spaces/me`;

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setSpaces(data);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSpace = (spaceId) => {
    Alert.alert(
      "Delete Spot",
      "Are you sure you want to permanently delete this parking spot?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${API_BASE_URL}/spaces/${spaceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert("Success", "Parking spot deleted.");
                fetchMySpaces(); 
              } else {
                Alert.alert("Error", "Failed to delete spot.");
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Network error.");
            }
          } 
        }
      ]
    );
  };

  const DynamicSpaceCard = ({ space }) => {
    const [isActive, setIsActive] = useState(space.status === 'Active');

    let iconName = 'warehouse';
    let vehicleLabel = 'Space';
    let rate = '0';

    if (space.vehicles?.car?.allowed) {
      iconName = 'car';
      vehicleLabel = 'Car / SUV';
      rate = space.vehicles.car.rate;
    } else if (space.vehicles?.bike?.allowed) {
      iconName = 'motorcycle';
      vehicleLabel = 'Motorcycle';
      rate = space.vehicles.bike.rate;
    } else if (space.vehicles?.bus?.allowed) {
      iconName = 'bus';
      vehicleLabel = 'Bus / Van';
      rate = space.vehicles.bus.rate;
    }

    const toggleStatus = async () => {
      const newStatus = !isActive;
      setIsActive(newStatus); 

      try {
        const token = await AsyncStorage.getItem('userToken');
        const API_URL = `${API_BASE_URL}/spaces/${space._id}/status`;

        const response = await fetch(API_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus ? 'Active' : 'Offline' })
        });

        if (!response.ok) {
          setIsActive(!newStatus);
          Alert.alert('Error', 'Failed to update status on the server.');
        }
      } catch (error) {
        console.error('Toggle Error:', error);
        setIsActive(!newStatus); 
        Alert.alert('Network error', 'Could not update status.');
      }
    };

    return (
      <View style={styles.spaceCard}>
        <View style={styles.spaceIconBox}>
          <FontAwesome5 name={iconName} size={20} color="#3C467B" />
        </View>
        <View style={styles.spaceInfo}>
          <Text style={styles.spaceTitle} numberOfLines={1}>{space.location}</Text>
          <Text style={styles.spaceSub}>{vehicleLabel} • ₹{rate}/hr</Text>
          <Text style={styles.spaceSub}>Min. {space.minHours} hours</Text>
        </View>
        
        {/* FIXED: Removed height: 100% and aligned items to center */}
        <View style={styles.actionColumn}>
          <View style={styles.toggleBox}>
            <Switch 
              value={isActive} 
              onValueChange={toggleStatus} 
              trackColor={{ true: '#3C467B', false: '#DDE3F0' }} 
            />
            <Text style={[styles.statusText, {color: isActive ? '#3C467B' : '#94A3B8'}]}>
              {isActive ? 'Active' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => handleDeleteSpace(space._id)} 
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Parking Spaces</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3C467B" style={{ marginTop: 50 }} />
        ) : spaces.length > 0 ? (
          spaces.map((space) => (
            <DynamicSpaceCard key={space._id} space={space} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="parking" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>You haven't listed any spaces yet.</Text>
            <Text style={styles.emptySubText}>Tap the + button to add your first driveway or spot.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddSpace')} 
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // FIXED: Adjusted flexbox properties so the card hugs the content tightly
  spaceCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#DDE3F0' 
  },
  spaceIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  spaceInfo: { flex: 1, paddingRight: 10 },
  spaceTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  spaceSub: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  
  // FIXED: Removed height constraint, aligns items to the right side
  actionColumn: { alignItems: 'flex-end', justifyContent: 'center' },
  toggleBox: { alignItems: 'center' },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  
  // FIXED: Adjusted padding and margin to fit nicely under the switch
  deleteBtn: { marginTop: 15, padding: 8, backgroundColor: '#FFF5F5', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3C467B', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#3C467B', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 15 },
  emptySubText: { fontSize: 13, color: '#64748B', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 }
});

export default ParkingSpaceDetails;
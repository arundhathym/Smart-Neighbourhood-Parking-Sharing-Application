import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // <-- Refreshes screen on visit

const SavedSpots = ({ navigation }) => {
  const [savedSpots, setSavedSpots] = useState([]);

  // Runs every time this screen is opened
  useFocusEffect(
    React.useCallback(() => {
      loadSavedSpots();
    }, [])
  );

  const loadSavedSpots = async () => {
    try {
      const storedSpots = await AsyncStorage.getItem('savedSpots');
      if (storedSpots) {
        setSavedSpots(JSON.parse(storedSpots));
      }
    } catch (e) {
      console.log('Failed to load saved spots.', e);
    }
  };

  const SavedCard = ({ spot }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      // Allows clicking a saved spot to go back to its details!
      onPress={() => navigation.navigate('SpotDetails', { spotData: spot })}
    >
      <Image source={{ uri: spot.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{spot.name}</Text>
          <Ionicons name="heart" size={20} color="#E11D48" />
        </View>
        
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color="#64748B" />
          <Text style={styles.cardAddress}>{spot.location}</Text>
        </View>

        <Text style={styles.cardPrice}>{spot.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Spots</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {savedSpots.length > 0 ? (
          savedSpots.map((spot, index) => (
            <SavedCard key={index} spot={spot} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyStateText}>You haven't saved any spots yet.</Text>
          </View>
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
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#DDE3F0' },
  cardImage: { width: 80, height: 80, borderRadius: 12 },
  cardContent: { flex: 1, marginLeft: 15, justifyContent: 'space-evenly' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#64748B', marginLeft: 4 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#3C467B' },
  
  // Empty State Styles
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyStateText: { color: '#64748B', fontSize: 15, marginTop: 15, fontWeight: '500' }
});

export default SavedSpots;
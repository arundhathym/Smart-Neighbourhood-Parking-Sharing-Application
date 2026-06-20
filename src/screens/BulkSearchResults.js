import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, StatusBar, Platform, ActivityIndicator 
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// NEW: Import the central config URL!
import { API_BASE_URL } from '../config';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 50;

const BulkSearchResults = ({ navigation, route }) => {
  const { searchCriteria } = route.params || {};
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBulkSpaces();
  }, []);

  const fetchBulkSpaces = async () => {
    try {
      // Pass the criteria to the backend to filter
      const { location, counts } = searchCriteria;
      
      // NEW: Using API_BASE_URL instead of the hardcoded IP
      const API_URL = `${API_BASE_URL}/spaces/bulk?city=${location}&cars=${counts.Car}&vans=${counts.Van}&buses=${counts.Bus}`;
      
      const response = await fetch(API_URL);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      console.error('Fetch Bulk Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={true} />

      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 10 }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Venues</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Searching for <Text style={{fontWeight: '800'}}>{searchCriteria.location}</Text>
        </Text>
        <Text style={styles.summarySub}>
          {searchCriteria.counts.Car} Cars • {searchCriteria.counts.Van} Vans • {searchCriteria.counts.Bus} Buses
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3C467B" style={{marginTop: 50}} />
        ) : results.length > 0 ? (
          results.map((spot) => (
            <TouchableOpacity 
              key={spot._id} 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SpotDetails', { spotData: spot })}
            >
              <Image source={{ uri: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1000' }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{spot.location.split(',')[0]}</Text>
                  <View style={styles.badge}>
                    <FontAwesome5 name="layer-group" size={10} color="#10B981" />
                    <Text style={styles.badgeText}>Bulk</Text>
                  </View>
                </View>
                
                <Text style={styles.cardDistance} numberOfLines={1}>{spot.location}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>From ${spot.vehicles?.car?.rate || 0}/hr</Text>
                  <View style={styles.actionBtn}>
                    <Text style={styles.actionText}>View</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="calendar-times" size={40} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No suitable commercial lots found.</Text>
            <Text style={styles.emptyStateSub}>Try adjusting your location or reducing the vehicle count.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  summaryBar: { backgroundColor: '#3C467B', padding: 15, paddingHorizontal: 20 },
  summaryText: { color: '#FFF', fontSize: 15 },
  summarySub: { color: '#94A3B8', fontSize: 13, marginTop: 4, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 50 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardImage: { width: '100%', height: 140 },
  cardContent: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#10B981', marginLeft: 4 },
  cardDistance: { color: '#64748B', fontSize: 14, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  cardPrice: { fontSize: 18, fontWeight: '800', color: '#3C467B' },
  actionBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  actionText: { color: '#0F172A', fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { color: '#0F172A', fontSize: 18, marginTop: 15, fontWeight: '800' },
  emptyStateSub: { color: '#64748B', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 30 }
});

export default BulkSearchResults;
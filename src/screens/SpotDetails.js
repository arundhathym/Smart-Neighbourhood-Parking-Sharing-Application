import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, StatusBar, Dimensions, Switch, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');

const SpotDetails = ({ navigation, route }) => {
  const data = route.params?.spotData || {};
  const minHours = data.minHours || 1;
  const maxHours = data.maxHours || 24; 
  const totalSpaces = data.totalSpaces || 1;
  const hasCarWash = data.hasCarWash === true; 
  const vehicles = data.vehicles || {};

  const [isSaved, setIsSaved] = useState(false);
  const [selectedHours, setSelectedHours] = useState(1);
  const [addCarWash, setAddCarWash] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  // Set initial available based on data passed, but we will refresh this instantly
  const initialBooked = data.requestCount || 0;
  const [currentAvailable, setCurrentAvailable] = useState(Math.max(0, totalSpaces - initialBooked));
  const [isBooking, setIsBooking] = useState(false);

  // Fetch real-time data exactly when the screen opens
  useFocusEffect(
    useCallback(() => {
      checkIfSaved();
      fetchRealTimeAvailability();
    }, [])
  );

  const fetchRealTimeAvailability = async () => {
    try {
      // Fetch nearby spaces to find the exact, current bookings for this spot
      const city = typeof data.location === 'string' ? data.location.split(',')[0].trim() : '';
      const response = await fetch(`${API_BASE_URL}/spaces/nearby?city=${encodeURIComponent(city)}`);
      
      if (response.ok) {
        const spots = await response.json();
        const liveSpot = spots.find(s => s._id === (data._id || data.id));
        
        if (liveSpot) {
           const bookedSpaces = liveSpot.requestCount || 0;
           setCurrentAvailable(Math.max(0, totalSpaces - bookedSpaces));
        }
      }
    } catch (error) {
      console.log("Could not refresh real-time availability", error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const savedSpots = await AsyncStorage.getItem('savedSpots');
      if (savedSpots) {
        const parsedSpots = JSON.parse(savedSpots);
        const exists = parsedSpots.some(spot => spot._id === data._id || spot.name === data.name);
        setIsSaved(exists);
      }
    } catch (e) {
      console.log('Failed to fetch saved spots.', e);
    }
  };

  const toggleSave = async () => {
    try {
      const savedSpots = await AsyncStorage.getItem('savedSpots');
      let parsedSpots = savedSpots ? JSON.parse(savedSpots) : [];

      if (isSaved) {
        parsedSpots = parsedSpots.filter(spot => spot.name !== data.name);
      } else {
        parsedSpots.push(data);
      }

      await AsyncStorage.setItem('savedSpots', JSON.stringify(parsedSpots));
      setIsSaved(!isSaved); 
    } catch (e) {
      console.log('Failed to save the spot.', e);
    }
  };

  const Facility = ({ icon, text, isFontAwesome }) => (
    <View style={styles.facilityBox}>
      <View style={styles.facilityIconCircle}>
        {isFontAwesome ? (
          <FontAwesome5 name={icon} size={20} color="#3C467B" />
        ) : (
          <Ionicons name={icon} size={22} color="#3C467B" />
        )}
      </View>
      <Text style={styles.facilityText}>{text}</Text>
    </View>
  );

  const renderFacilities = () => {
    const facilities = [];
    if (data.hasCctv || data.features?.includes('CCTV')) facilities.push({ icon: 'videocam-outline', text: 'CCTV' });
    if (data.isSecure || data.features?.includes('Security')) facilities.push({ icon: 'shield-checkmark-outline', text: 'Secure' });
    if (hasCarWash) facilities.push({ icon: 'water-outline', text: 'Car Wash' });
    if (vehicles?.car?.allowed) facilities.push({ icon: 'car-sport-outline', text: 'Cars' });
    if (vehicles?.bike?.allowed) facilities.push({ icon: 'bicycle-outline', text: 'Bikes' });
    if (vehicles?.bus?.allowed) facilities.push({ icon: 'bus-outline', text: 'Bus/Van' });

    if (facilities.length === 0) return <Text style={{ color: '#94A3B8', fontStyle: 'italic', paddingLeft: 5 }}>No specific facilities listed.</Text>;

    return facilities.slice(0, 4).map((fac, idx) => <Facility key={idx} icon={fac.icon} text={fac.text} />);
  };

  const handleBooking = () => {
    if (currentAvailable <= 0) {
      Alert.alert("Spot Full", "There are no available slots left for this parking space.");
      return;
    }

    Alert.alert(
      "Confirm Booking",
      `Book this spot for ${selectedHours} hour(s) and pay on arrival?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm Booking", onPress: submitBookingToDB }
      ]
    );
  };

  const submitBookingToDB = async () => {
    setIsBooking(true);
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert("Error", "You must be logged in to book a spot.");
        setIsBooking(false);
        return;
      }

      let hourlyRate = vehicles?.car?.rate
        ? Number(vehicles.car.rate)
        : (parseInt(String(data.price).replace(/[^0-9]/g, '')) || 0);
      
      const totalAmount = hourlyRate * selectedHours;
      const finalAmount = addCarWash ? totalAmount + 150 : totalAmount;
      const safeAmount = Math.round(finalAmount);

      setTimeout(() => {
        saveSuccessfulBooking(safeAmount, token); 
      }, 2000); 

    } catch (error) {
      console.error("Booking Error:", error);
      Alert.alert("Error", "System unavailable.");
      setIsBooking(false);
    }
  };

  const saveSuccessfulBooking = async (amount, token) => {
    try {
      const bookingData = {
        spaceId: data.id || data._id,
        hostId: data.hostId || null,
        vehicleType: 'Car',
        durationHours: selectedHours,
        totalAmount: amount,
        hasCarWash: addCarWash
      };

      const dbResponse = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (dbResponse.ok) {
        // Drop the available count by 1 instantly on the UI
        setCurrentAvailable(prev => prev - 1);
        Alert.alert("Success!", "Spot booked! Please pay at the facility.", [
          { text: "OK", onPress: () => navigation.navigate('UserBookingHistory') } 
        ]);
      } else {
        Alert.alert("Warning", "Booking could not be saved.");
      }
    } catch (error) {
      console.error("Save Booking Error:", error);
      Alert.alert("Error", "Could not save your booking.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: data.image || 'https://via.placeholder.com/400x300' }} style={styles.mainImage} />
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.gradientOverlay} />
          
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.favoriteBtn} onPress={toggleSave}>
              <Ionicons name={isSaved ? "heart" : "heart-outline"} size={24} color={isSaved ? "#E11D48" : "#1E293B"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: currentAvailable > 0 ? '#10B981' : '#E11D48' }]}>
            <Text style={styles.statusText}>{currentAvailable > 0 ? 'Available' : 'Full'}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{data.name || 'Parking Spot'}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{data.rating || 'New'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#3C467B" />
            <Text style={styles.locationText}>{data.location || 'Location pending'} • {data.distance || 'Near you'}</Text>
          </View>

          <View style={styles.slotsContainer}>
             <Ionicons name="car" size={20} color={currentAvailable > 0 ? '#10B981' : '#E11D48'} />
             <Text style={styles.slotsText}>
               <Text style={{fontWeight: 'bold', color: currentAvailable > 0 ? '#10B981' : '#E11D48'}}>
                 {currentAvailable}
               </Text> / {totalSpaces} Slots Available
             </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Facilities & Features</Text>
          <View style={styles.facilitiesRow}>
            {renderFacilities()}
          </View>

          <View style={styles.divider} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>How long will you park?</Text>
            <Text style={{ fontSize: 13, color: '#E11D48', fontWeight: 'bold' }}>
              {data.minHours ? `Min: ${data.minHours} hr | ` : ''}Max: {maxHours} hr
            </Text>
          </View>

          <View style={styles.hoursRow}>
            <TouchableOpacity 
              style={[styles.hourBtn, selectedHours <= 1 && { opacity: 0.4 }]}
              onPress={() => setSelectedHours(Math.max(1, selectedHours - 1))} disabled={selectedHours <= 1}
            >
              <Ionicons name="remove" size={24} color="#3C467B" />
            </TouchableOpacity>
            
            <Text style={styles.hourText}>{selectedHours} {selectedHours === 1 ? 'Hour' : 'Hours'}</Text>
            
            <TouchableOpacity 
              style={[styles.hourBtn, selectedHours >= maxHours && { opacity: 0.4 }]}
              onPress={() => setSelectedHours(Math.min(maxHours, selectedHours + 1))} disabled={selectedHours >= maxHours}
            >
              <Ionicons name="add" size={24} color="#3C467B" />
            </TouchableOpacity>
          </View>

          {hasCarWash && (
            <View style={styles.carWashRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="water" size={22} color="#3BA5E3" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.carWashTitle}>Add Car Wash</Text>
                  <Text style={styles.carWashSub}>Get your car cleaned while parked (+₹150)</Text>
                </View>
              </View>
              <Switch value={addCarWash} onValueChange={setAddCarWash} trackColor={{ false: "#DDE3F0", true: "#3C467B" }} thumbColor={"#FFF"} />
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Rate this Spot</Text>
          <View style={styles.ratingStarsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                <Ionicons name={star <= userRating ? "star" : "star-outline"} size={32} color="#F59E0B" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            ))}
          </View>
          {userRating > 0 && <Text style={styles.thanksText}>Thanks for rating {userRating} stars!</Text>}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total (est.)</Text>
          <Text style={styles.priceValue}>
            {data.price ? data.price.replace('$', '₹') : '₹0'} 
            <Text style={{fontSize: 14, color: '#64748B'}}> / {selectedHours} hr</Text>
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookButton, (currentAvailable <= 0 || isBooking) && { opacity: 0.7 }]} 
          onPress={handleBooking}
          disabled={currentAvailable <= 0 || isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.bookButtonText}>{currentAvailable > 0 ? 'Book & Pay on Arrival' : 'Sold Out'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  imageContainer: { width: width, height: 300, position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  gradientOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  topNav: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  favoriteBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  statusBadge: { position: 'absolute', bottom: -15, right: 25, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 4 },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  contentContainer: { padding: 25, paddingTop: 30 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#1E293B', flex: 1, marginRight: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#D97706', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { fontSize: 14, color: '#64748B', marginLeft: 6, fontWeight: '500' },
  slotsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#E5EBFA', padding: 12, borderRadius: 10 },
  slotsText: { marginLeft: 8, fontSize: 15, color: '#3C467B' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 10, borderRadius: 15, borderWidth: 1, borderColor: '#DDE3F0' },
  hourBtn: { width: 40, height: 40, backgroundColor: '#F5F7FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  hourText: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  carWashRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: '#FFF', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#DDE3F0' },
  carWashTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  carWashSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  ratingStarsContainer: { flexDirection: 'row', marginTop: 5 },
  thanksText: { marginTop: 10, color: '#10B981', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#DDE3F0', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  facilitiesRow: { flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 15 },
  facilityBox: { alignItems: 'center', minWidth: 60 },
  facilityIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  facilityText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', paddingHorizontal: 25, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#DDE3F0' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' },
  priceValue: { fontSize: 22, fontWeight: '900', color: '#3C467B', marginTop: 2 },
  bookButton: { backgroundColor: '#3C467B', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 16, elevation: 5 },
  bookButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});

export default SpotDetails;
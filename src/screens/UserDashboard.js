import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TextInput, ScrollView, 
  TouchableOpacity, Image, Dimensions, StatusBar, Platform, Animated, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 50;

const MenuItem = ({ icon, title, color = "#1E293B", onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuText, { color }]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
  </TouchableOpacity>
);

const UserHomeTab = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('Car');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentCity, setCurrentCity] = useState('Fetching location...');
  const [userCoords, setUserCoords] = useState(null); 
  const [allSpots, setAllSpots] = useState([]); 
  const [displayedSpots, setDisplayedSpots] = useState([]);
  
  const [userName, setUserName] = useState('Loading...');
  const [profilePic, setProfilePic] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // NEW: FILTER STATES
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'distance', 'price_low'
  const [filterFeatures, setFilterFeatures] = useState({
    cctv: false,
    security: false,
    carWash: false
  });

  const [demandInfo, setDemandInfo] = useState({
    zone: 'Detecting Zone...',
    primaryLevel: 0,
    secondaryLevel: 0,
    isSurge: false,
  });
  
  const scanAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchMyBookingsForNotifications();
      fetchAllActiveSpotsFromDB();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setUserName(data.name || 'User');
        setProfilePic(data.profilePic || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMyBookingsForNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/bookings/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const bookingsData = await response.json();
        
        const recentNotifs = bookingsData.slice(0, 10).map(b => {
          const spotName = b.spaceDetails?.name || b.spaceDetails?.location?.split(',')[0] || 'Parking Spot';
          let message = '';
          let type = 'neutral'; 

          if (b.status === 'Pending') {
            message = `⏳ Waiting for host to approve your booking at ${spotName}.`;
          } else if (b.status === 'Active' || b.status === 'Confirmed') {
            message = `✅ Approved! You are cleared to park at ${spotName}.`;
            type = 'success';
          } else if (b.status === 'Rejected') {
            message = `❌ Declined: The host rejected your booking at ${spotName}.`;
            type = 'error';
          } else if (b.status === 'Completed') {
            message = `🏁 Your parking session at ${spotName} is complete.`;
          }

          return { id: b._id, message, type, status: b.status };
        });

        setNotifications(prevNotifs => {
          if (recentNotifs.length > 0) {
            const isNewUpdate = prevNotifs.length === 0 || 
                                prevNotifs[0].id !== recentNotifs[0].id || 
                                prevNotifs[0].status !== recentNotifs[0].status;
            
            if (isNewUpdate) {
              setHasUnread(true);
            }
          }
          return recentNotifs;
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 140, duration: 3000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 3000, useNativeDriver: true })
      ])
    ).start();
  }, [scanAnim]);

  useEffect(() => {
    (async () => {
      let fetchedCity = 'Unknown Location';

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          
          setUserCoords({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });

          let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });

          if (reverseGeocode.length > 0) {
            fetchedCity = reverseGeocode[0].city || reverseGeocode[0].subregion || reverseGeocode[0].region || 'Unknown Location';
            
            let primaryDemand = (fetchedCity === 'Thiruvananthapuram' || fetchedCity === 'Chengannur') 
              ? Math.floor(Math.random() * 10) + 88 
              : Math.floor(Math.random() * 60) + 30;

            setDemandInfo({
              zone: `${fetchedCity} Zone`,
              primaryLevel: primaryDemand,
              secondaryLevel: Math.max(15, primaryDemand - 40),
              isSurge: primaryDemand >= 80,
            });
          }
        }
      } catch (error) {
        console.error('Location Error:', error);
      } finally {
        setCurrentCity(fetchedCity);
        fetchAllActiveSpotsFromDB();
      }
    })();
  }, []);

  const fetchAllActiveSpotsFromDB = async () => {
    try {
      const API_URL = `${API_BASE_URL}/spaces/nearby`;
      
      const response = await fetch(API_URL);
      const data = await response.json();

      if (response.ok && data.length > 0) {
        const formattedSpots = data.map(space => {
          let priceLabel = "₹0/hr";
          const allowedVehicles = []; 

          if (space.vehicles?.car?.allowed) {
            priceLabel = `₹${space.vehicles.car.rate}/hr`;
            allowedVehicles.push('Car', 'EV'); 
          }
          if (space.vehicles?.bike?.allowed) {
            if (priceLabel === "₹0/hr") priceLabel = `₹${space.vehicles.bike.rate}/hr`;
            allowedVehicles.push('Bike');
          }
          if (space.vehicles?.bus?.allowed) {
            if (priceLabel === "₹0/hr") priceLabel = `₹${space.vehicles.bus.rate}/hr`;
            allowedVehicles.push('Bus', 'Truck'); 
          }
          
          return {
            id: space._id,
            hostId: space.hostId, 
            name: space.name || space.location.split(',')[0] || 'Parking Spot', 
            location: space.location,
            distance: (Math.random() * 4 + 0.5).toFixed(1), 
            price: priceLabel,
            rating: '4.8', 
            status: space.status === 'Active' ? 'Available' : 'Full',
            image: space.image ? `data:image/jpeg;base64,${space.image}` : 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1000&auto=format&fit=crop',
            allowedVehicles, 
            minHours: space.minHours,
            totalSpaces: space.totalSpaces,
            hasCarWash: space.hasCarWash || false,
            hasCctv: space.hasCctv || false,
            isSecure: space.isSecure || false,
            vehicles: space.vehicles,
            requestCount: space.requestCount || 0 
          };
        });
        setAllSpots(formattedSpots);
      } else {
        setAllSpots([]); 
      }
    } catch (error) {
      console.error('DB Fetch Error:', error);
      setAllSpots([]); 
    }
  };

  // UPDATED: Filter logic now respects the filter modal selections
  useEffect(() => {
    let filtered = allSpots; 

    // 1. Vehicle Category
    filtered = filtered.filter(spot => spot.allowedVehicles && spot.allowedVehicles.includes(activeCategory));

    // 2. Search Query vs Location
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(spot => 
        spot.name.toLowerCase().includes(lowerCaseQuery) || 
        spot.location.toLowerCase().includes(lowerCaseQuery)
      );
    } else {
      if (currentCity !== 'Fetching location...' && currentCity !== 'Unknown Location') {
        filtered = filtered.filter(spot => spot.location.toLowerCase().includes(currentCity.toLowerCase()));
      }
    }

    // 3. Feature Filters (from the new modal)
    if (filterFeatures.carWash) filtered = filtered.filter(spot => spot.hasCarWash);
    if (filterFeatures.cctv) filtered = filtered.filter(spot => spot.hasCctv);
    if (filterFeatures.security) filtered = filtered.filter(spot => spot.isSecure);

    // 4. Sort Options (from the new modal)
    if (sortBy === 'distance') {
      filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
        const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
        return priceA - priceB;
      });
    }

    setDisplayedSpots([...filtered]); // Spread creates a new array reference to force re-render
  }, [searchQuery, activeCategory, allSpots, currentCity, filterFeatures, sortBy]);

  const getHeatColor = (level) => {
    if (level >= 80) return '#E11D48';
    if (level >= 60) return '#F59E0B';
    return '#3C467B';
  };

  const primaryColor = getHeatColor(demandInfo.primaryLevel);
  const secondaryColor = getHeatColor(demandInfo.secondaryLevel);

  const navigateToHeatmap = () => {
    if (currentCity && currentCity !== 'Fetching location...') {
      navigation.navigate('HeatmapDetail', { cityName: currentCity });
    } else {
      Alert.alert("Location Error", "Please wait while we fetch your location.");
    }
  };

  // Helper component for filter chips
  const FilterChip = ({ label, active, onPress }) => (
    <TouchableOpacity 
      style={[styles.filterChip, active && styles.filterChipActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* NOTIFICATION MODAL */}
      <Modal visible={showNotifModal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.notifDropdown}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifHeaderTitle}>Updates</Text>
              <Ionicons name="close" size={20} color="#64748B" onPress={() => setShowNotifModal(false)} />
            </View>
            
            {notifications.length === 0 ? (
              <Text style={styles.notifEmpty}>No booking updates yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                {notifications.map((n, index) => {
                  let borderColor = '#CBD5E1';
                  if (n.type === 'success') borderColor = '#10B981';
                  if (n.type === 'error') borderColor = '#E11D48';

                  return (
                    <View key={`${n.id}-${index}`} style={[styles.notifItem, { borderLeftColor: borderColor }]}>
                      <Text style={styles.notifText}>{n.message}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* NEW: FILTER SETTINGS MODAL */}
      <Modal visible={showFilterModal} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.filterModalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterSheet}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Spots</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterRow}>
              <FilterChip label="Recommended" active={sortBy === 'recommended'} onPress={() => setSortBy('recommended')} />
              <FilterChip label="Closest to me" active={sortBy === 'distance'} onPress={() => setSortBy('distance')} />
              <FilterChip label="Price: Low to High" active={sortBy === 'price_low'} onPress={() => setSortBy('price_low')} />
            </View>

            <Text style={styles.filterSectionTitle}>Amenities</Text>
            <View style={styles.filterRow}>
              <FilterChip 
                label="Car Wash" 
                active={filterFeatures.carWash} 
                onPress={() => setFilterFeatures(prev => ({...prev, carWash: !prev.carWash}))} 
              />
              <FilterChip 
                label="CCTV" 
                active={filterFeatures.cctv} 
                onPress={() => setFilterFeatures(prev => ({...prev, cctv: !prev.cctv}))} 
              />
              <FilterChip 
                label="Secure Parking" 
                active={filterFeatures.security} 
                onPress={() => setFilterFeatures(prev => ({...prev, security: !prev.security}))} 
              />
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.headerContainer, { paddingTop: STATUSBAR_HEIGHT + 10 }]}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageBorder}>
              <Image 
                source={{ uri: profilePic ? `data:image/jpeg;base64,${profilePic}` : 'https://i.pravatar.cc/150?img=32' }} 
                style={styles.profilePic} 
              />
            </View>
            <View>
              <Text style={styles.greetingText}>Hello, {userName}!</Text>
              <View style={styles.locationRow}>
                {currentCity === 'Fetching location...' ? (
                  <ActivityIndicator size="small" color="#3C467B" style={{marginRight: 4, transform: [{scale: 0.6}]}}/>
                ) : (
                  <Ionicons name="location" size={12} color="#3C467B" style={{marginRight: 4}} />
                )}
                <Text style={styles.subGreeting}>{currentCity}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => {
              setShowNotifModal(true);
              setHasUnread(false);
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            {hasUnread && <View style={styles.notificationDot} />}
          </TouchableOpacity>

        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{ marginLeft: 15 }} />
          <TextInput 
            placeholder="Search city, airport, or area" 
            style={styles.searchInput} 
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 10 }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
          
          {/* UPDATED: Filter Button triggers the modal */}
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="tune-variant" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {searchQuery.length === 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Demand Heatmap</Text>
              <View style={styles.liveBadge}>
                <View style={styles.blinkingDot} />
                <Text style={styles.liveText}>LIVE UPDATES</Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={navigateToHeatmap} style={styles.heatmapCard}>
              <View style={styles.mapBackground}>
                <View style={styles.gridOverlay}>
                  {[...Array(8)].map((_, i) => <View key={`v-${i}`} style={[styles.gridLineV, { left: i * (width / 8) }]} />)}
                  {[...Array(5)].map((_, i) => <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 40 }]} />)}
                </View>

                {demandInfo.primaryLevel > 0 && (
                  <View style={[styles.heatWrapper, { top: 10, right: 30 }]}>
                    <View style={[styles.heatGlow, { backgroundColor: primaryColor, opacity: 0.15, transform: [{ scale: 2.5 }] }]} />
                    <View style={[styles.heatGlow, { backgroundColor: primaryColor, opacity: 0.3, transform: [{ scale: 1.8 }] }]} />
                    <View style={[styles.heatCore, { backgroundColor: primaryColor }]}>
                      <Text style={styles.heatText}>{demandInfo.primaryLevel}%</Text>
                    </View>
                  </View>
                )}

                {demandInfo.secondaryLevel > 0 && (
                  <View style={[styles.heatWrapper, { bottom: 80, left: 40 }]}>
                    <View style={[styles.heatGlow, { backgroundColor: secondaryColor, opacity: 0.1, transform: [{ scale: 2.2 }] }]} />
                    <View style={[styles.heatGlow, { backgroundColor: secondaryColor, opacity: 0.2, transform: [{ scale: 1.5 }] }]} />
                    <View style={[styles.heatCore, { backgroundColor: secondaryColor }]}>
                      <Text style={styles.heatText}>{demandInfo.secondaryLevel}%</Text>
                    </View>
                  </View>
                )}

                <Animated.View style={[styles.scannerLine, { transform: [{ translateY: scanAnim }] }]}>
                  <LinearGradient colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']} style={{ flex: 1 }} />
                </Animated.View>

                <View style={styles.heatmapFooter}>
                  <View>
                    <Text style={styles.heatmapTitle}>{demandInfo.zone}</Text>
                    <Text style={[styles.heatmapSub, { color: demandInfo.isSurge ? '#E11D48' : '#64748B' }]}>
                      {demandInfo.isSurge ? 'Surge pricing active • Tap to view' : 'Normal demand • Tap to view'}
                    </Text>
                  </View>
                  <View style={styles.heatmapArrow}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bulkBookingCard} onPress={() => navigation.navigate('BulkBooking')} activeOpacity={0.8}>
              <View style={styles.bulkIconWrapper}><FontAwesome5 name="layer-group" size={18} color="#3C467B" /></View>
              <View style={styles.bulkContent}>
                <Text style={styles.bulkTitle}>Bulk Booking</Text>
                <Text style={styles.bulkDesc}>Reserve slots for corporate events.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 15 }]}>Vehicle Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {['Car', 'Bike', 'Bus', 'Truck', 'EV'].map((item) => (
                <TouchableOpacity key={item} style={[styles.categoryChip, activeCategory === item && styles.activeCategoryChip]} onPress={() => setActiveCategory(item)}>
                  <Text style={[styles.categoryText, activeCategory === item && styles.activeCategoryText]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery.length > 0 ? `Search Results` : "Nearby Available"}
          </Text>
          {searchQuery.length === 0 && displayedSpots.length > 0 && (
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          )}
        </View>
        
        {displayedSpots.length > 0 ? (
          displayedSpots.map((spot) => (
            <ParkingCard key={spot.id} spot={spot} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyStateText}>
              {searchQuery.length > 0 
                ? "No parking spots found for this search." 
                : `No ${activeCategory} spots available near you.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const UserProfileTab = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ name: 'Loading...', email: 'Loading...', profilePic: null });

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
          console.error('Error fetching user for Profile:', error);
          setUserData({ name: 'User', email: 'user@example.com', profilePic: null });
        }
      };
      fetchUserProfile();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.profileContainer}>
      <View style={[styles.profileHeaderTab, { paddingTop: STATUSBAR_HEIGHT + 20 }]}>
        <Image 
          source={{ uri: userData.profilePic ? `data:image/jpeg;base64,${userData.profilePic}` : 'https://i.pravatar.cc/150?img=32' }} 
          style={styles.profileAvatar} 
        />
        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileEmail}>{userData.email}</Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>My Account</Text>
        <MenuItem icon="person-outline" title="Personal Details" onPress={() => navigation.navigate('PersonalDetails')} />
        <MenuItem icon="bookmark-outline" title="Saved Spots" onPress={() => navigation.navigate('SavedSpots')} />
        <MenuItem icon="calendar-outline" title="My Bookings" onPress={() => navigation.navigate('UserBookingHistory')} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>Support & Options</Text>
        <MenuItem icon="help-circle-outline" title="Help Center" onPress={() => navigation.navigate('HelpCenter')} />
        <MenuItem icon="log-out-outline" title="Log Out" color="#EF4444" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
};

const Tab = createBottomTabNavigator();

const UserDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3C467B', 
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DDE3F0' },
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === 'Explore' ? 'search-outline' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={UserHomeTab} />
      <Tab.Screen name="Profile" component={UserProfileTab} />
    </Tab.Navigator>
  );
};

const ParkingCard = ({ spot }) => {
  const navigation = useNavigation();
  const isAvailable = spot.status === 'Available';

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('SpotDetails', { spotData: spot })}
    >
      <Image source={{ uri: spot.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{spot.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.ratingText}>{spot.rating}</Text>
          </View>
        </View>
        
        <View style={styles.distanceRow}>
          <Ionicons name="location" size={12} color="#94A3B8" />
          <Text style={styles.cardDistance} numberOfLines={1}>{spot.location} • {spot.distance} km</Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.cardPrice}>{spot.price}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: isAvailable ? '#ECFDF5' : '#FFF7ED' }]}>
            <Text style={[styles.statusText, { color: isAvailable ? '#10B981' : '#F59E0B' }]}>{spot.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingHorizontal: 20, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileImageBorder: { padding: 2, borderRadius: 25, borderWidth: 2, borderColor: '#E5EBFA' },
  profilePic: { width: 44, height: 44, borderRadius: 22 },
  greetingText: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginLeft: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, marginTop: 2 },
  subGreeting: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  iconButton: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E11D48', borderWidth: 2, borderColor: '#F1F5F9' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, height: 56, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  filterButton: { backgroundColor: '#3C467B', height: 44, width: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginRight: 6 },
  scrollContent: { paddingTop: 25, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  seeAllText: { color: '#3C467B', fontSize: 14, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5EBFA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  blinkingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3C467B', marginRight: 6 },
  liveText: { color: '#3C467B', fontSize: 10, fontWeight: '800' },
  heatmapCard: { height: 220, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: '#E2E8F0', marginBottom: 25, borderWidth: 1, borderColor: '#CBD5E1' },
  mapBackground: { flex: 1, position: 'relative' },
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: '#CBD5E1' },
  gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#CBD5E1' },
  heatWrapper: { position: 'absolute', width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  heatGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  heatCore: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  heatText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  scannerLine: { position: 'absolute', width: '100%', height: 40, zIndex: 1 },
  heatmapFooter: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  heatmapTitle: { fontWeight: '800', fontSize: 15, color: '#0F172A' },
  heatmapSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  heatmapArrow: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#3C467B', justifyContent: 'center', alignItems: 'center' },
  bulkBookingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0' },
  bulkIconWrapper: { width: 42, height: 42, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bulkContent: { flex: 1, marginLeft: 15 },
  bulkTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  bulkDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  categoryScroll: { paddingHorizontal: 20, paddingBottom: 25 },
  categoryChip: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  activeCategoryChip: { backgroundColor: '#3C467B', borderColor: '#3C467B' },
  categoryText: { color: '#64748B', fontWeight: '700', fontSize: 14 },
  activeCategoryText: { color: '#FFFFFF' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardImage: { width: 90, height: 90, borderRadius: 14 },
  cardContent: { flex: 1, marginLeft: 16, justifyContent: 'space-between', overflow: 'hidden' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#D97706', marginLeft: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardDistance: { color: '#64748B', fontSize: 13, marginLeft: 4, flexShrink: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  priceLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#3C467B' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyStateText: { color: '#64748B', fontSize: 15, marginTop: 10, fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  
  profileContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  profileHeaderTab: { alignItems: 'center', paddingBottom: 30, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  profileAvatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 15, backgroundColor: '#E5EBFA' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  profileEmail: { color: '#64748B', marginTop: 5 },
  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#DDE3F0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },

  // Notification Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', paddingTop: STATUSBAR_HEIGHT + 70, paddingRight: 20 },
  notifDropdown: { backgroundColor: '#FFFFFF', width: 300, borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notifHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  notifEmpty: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginVertical: 15 },
  notifItem: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4 },
  notifText: { fontSize: 13, color: '#1E293B', fontWeight: '500', lineHeight: 18 },

  // NEW: Filter Modal Styles
  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  filterSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 15, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#DDE3F0', backgroundColor: '#F8FAFC' },
  filterChipActive: { backgroundColor: '#3C467B', borderColor: '#3C467B' },
  filterChipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  filterChipTextActive: { color: '#FFFFFF' },
  applyBtn: { backgroundColor: '#3C467B', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 30, marginBottom: 10 },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});

export default UserDashboard;
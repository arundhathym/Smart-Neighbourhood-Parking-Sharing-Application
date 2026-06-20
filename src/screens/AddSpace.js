import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, ScrollView, 
  TouchableOpacity, SafeAreaView, Switch, Platform, StatusBar, ActivityIndicator, Image 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // <-- NEW IMPORT

import { API_BASE_URL } from '../config';

const AddSpace = ({ navigation }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [minHours, setMinHours] = useState('2');
  const [hasCarWash, setHasCarWash] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: State for the parking spot image
  const [spotImage, setSpotImage] = useState(null);

  const [isBulk, setIsBulk] = useState(false);
  const [totalSpaces, setTotalSpaces] = useState('1'); 

  const [allowCar, setAllowCar] = useState(true);
  const [carRate, setCarRate] = useState('5');
  const [carCapacity, setCarCapacity] = useState('10'); 
  
  const [allowBike, setAllowBike] = useState(false);
  const [bikeRate, setBikeRate] = useState('2');
  const [bikeCapacity, setBikeCapacity] = useState('20'); 

  const [allowBus, setAllowBus] = useState(false);
  const [busRate, setBusRate] = useState('12');
  const [busCapacity, setBusCapacity] = useState('5'); 

  const getMinEarnings = (rate) => {
    const total = parseFloat(rate || 0) * parseFloat(minHours || 0);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  };

  // NEW: Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // Perfect aspect ratio for parking spots
      quality: 0.3,   // Keeps the string small for the database
      base64: true,
    });

    if (!result.canceled) {
      setSpotImage(result.assets[0].base64);
    }
  };

  const handlePublish = async () => {
    if (!name.trim()) { alert("Please enter a spot name."); return; }
    if (!location.trim()) { alert("Please enter the address."); return; }
    if (!spotImage) { alert("Please upload a photo of your parking spot."); return; } // Validation added

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        alert("Authentication error. Please log in again.");
        setIsLoading(false);
        return;
      }

      let finalTotalSpaces = parseInt(totalSpaces) || 1;
      if (isBulk) {
        finalTotalSpaces = 0;
        if (allowCar) finalTotalSpaces += parseInt(carCapacity) || 0;
        if (allowBike) finalTotalSpaces += parseInt(bikeCapacity) || 0;
        if (allowBus) finalTotalSpaces += parseInt(busCapacity) || 0;
      }

      const payload = {
        name,
        location,
        image: spotImage, // NEW: Send the image to the DB
        isBulkSpace: isBulk,
        totalSpaces: finalTotalSpaces,
        minHours: parseInt(minHours) || 1,
        hasCarWash,
        vehicles: {
          car: { allowed: allowCar, rate: parseFloat(carRate) || 0, capacity: isBulk ? (parseInt(carCapacity) || 0) : finalTotalSpaces },
          bike: { allowed: allowBike, rate: parseFloat(bikeRate) || 0, capacity: isBulk ? (parseInt(bikeCapacity) || 0) : finalTotalSpaces },
          bus: { allowed: allowBus, rate: parseFloat(busRate) || 0, capacity: isBulk ? (parseInt(busCapacity) || 0) : finalTotalSpaces }
        }
      };

      const API_URL = `${API_BASE_URL}/spaces`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Success! Your parking space is now live.");
        navigation.goBack(); 
      } else {
        alert(data.error || "Failed to publish listing.");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Space</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* NEW: IMAGE UPLOAD UI */}
        <Text style={styles.sectionTitle}>Add a Photo</Text>
        <TouchableOpacity style={styles.imageUploadCard} onPress={pickImage} activeOpacity={0.8}>
          {spotImage ? (
            <Image 
              source={{ uri: `data:image/jpeg;base64,${spotImage}` }} 
              style={styles.uploadedImage} 
            />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#9BA4B5" />
              <Text style={styles.uploadText}>Tap to upload a photo</Text>
              <Text style={styles.uploadSubText}>Show drivers what your spot looks like</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>1. Location & Property Type</Text>
        <View style={styles.card}>
          
          <Text style={styles.label}>Parking Spot Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="business-outline" size={20} color="#9BA4B5" style={styles.icon} />
            <TextInput style={styles.input} placeholder="e.g. Downtown Secure" placeholderTextColor="#9BA4B5" value={name} onChangeText={setName} />
          </View>
          <View style={styles.divider} />

          <Text style={styles.label}>Full Address</Text>
          <View style={styles.inputBox}>
            <Ionicons name="location-outline" size={20} color="#9BA4B5" style={styles.icon} />
            <TextInput style={styles.input} placeholder="e.g. 123 Maple St" placeholderTextColor="#9BA4B5" value={location} onChangeText={setLocation} />
          </View>

          <View style={styles.divider} />

          <View style={styles.amenityRow}>
            <View style={{flex: 1}}>
              <Text style={styles.amenityTitle}>Bulk / Commercial Lot</Text>
              <Text style={styles.amenitySub}>For hosting multiple vehicles.</Text>
            </View>
            <Switch value={isBulk} onValueChange={setIsBulk} trackColor={{ true: '#4A90E2' }} />
          </View>

          {!isBulk && (
            <View style={{ marginTop: 15 }}>
              <Text style={styles.label}>Total Spots Available</Text>
              <View style={styles.inputBox}>
                <Ionicons name="grid-outline" size={20} color="#9BA4B5" style={styles.icon} />
                <TextInput style={styles.input} placeholder="2" keyboardType="numeric" placeholderTextColor="#9BA4B5" value={totalSpaces} onChangeText={setTotalSpaces} />
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>2. Vehicles & {isBulk ? 'Capacities' : 'Rates'}</Text>
        <View style={styles.card}>
          
          <View style={styles.vehicleContainer}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleLeft}>
                <Switch value={allowCar} onValueChange={setAllowCar} trackColor={{ true: '#4A90E2' }} />
                <FontAwesome5 name="car" size={18} color={allowCar ? '#1E293B' : '#9BA4B5'} style={{marginLeft: 10, width: 25}} />
                <Text style={[styles.vehicleName, !allowCar && {color: '#9BA4B5'}]}>Car / SUV</Text>
              </View>
              {allowCar && !isBulk && (
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={carRate} onChangeText={setCarRate} /><Text style={styles.perHour}>/hr</Text></View>
              )}
            </View>
            {allowCar && isBulk && (
              <View style={styles.bulkDetailsRow}>
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={carRate} onChangeText={setCarRate} /><Text style={styles.perHour}>/hr</Text></View>
                <View style={styles.capacityBox}><Ionicons name="grid-outline" size={14} color="#64748B" style={{marginRight: 4}} /><TextInput style={styles.rateInput} keyboardType="numeric" placeholder="Qty" value={carCapacity} onChangeText={setCarCapacity} /><Text style={styles.perHour}>spots</Text></View>
              </View>
            )}
          </View>
          <View style={styles.divider} />

          <View style={styles.vehicleContainer}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleLeft}>
                <Switch value={allowBike} onValueChange={setAllowBike} trackColor={{ true: '#4A90E2' }} />
                <FontAwesome5 name="motorcycle" size={18} color={allowBike ? '#1E293B' : '#9BA4B5'} style={{marginLeft: 10, width: 25}} />
                <Text style={[styles.vehicleName, !allowBike && {color: '#9BA4B5'}]}>Motorcycle</Text>
              </View>
              {allowBike && !isBulk && (
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={bikeRate} onChangeText={setBikeRate} /><Text style={styles.perHour}>/hr</Text></View>
              )}
            </View>
            {allowBike && isBulk && (
              <View style={styles.bulkDetailsRow}>
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={bikeRate} onChangeText={setBikeRate} /><Text style={styles.perHour}>/hr</Text></View>
                <View style={styles.capacityBox}><Ionicons name="grid-outline" size={14} color="#64748B" style={{marginRight: 4}} /><TextInput style={styles.rateInput} keyboardType="numeric" placeholder="Qty" value={bikeCapacity} onChangeText={setBikeCapacity} /><Text style={styles.perHour}>spots</Text></View>
              </View>
            )}
          </View>
          <View style={styles.divider} />

          <View style={styles.vehicleContainer}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleLeft}>
                <Switch value={allowBus} onValueChange={setAllowBus} trackColor={{ true: '#4A90E2' }} />
                <FontAwesome5 name="bus" size={18} color={allowBus ? '#1E293B' : '#9BA4B5'} style={{marginLeft: 10, width: 25}} />
                <Text style={[styles.vehicleName, !allowBus && {color: '#9BA4B5'}]}>Bus / Van</Text>
              </View>
              {allowBus && !isBulk && (
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={busRate} onChangeText={setBusRate} /><Text style={styles.perHour}>/hr</Text></View>
              )}
            </View>
            {allowBus && isBulk && (
              <View style={styles.bulkDetailsRow}>
                <View style={styles.rateBox}><Text style={styles.currency}>₹</Text><TextInput style={styles.rateInput} keyboardType="numeric" value={busRate} onChangeText={setBusRate} /><Text style={styles.perHour}>/hr</Text></View>
                <View style={styles.capacityBox}><Ionicons name="grid-outline" size={14} color="#64748B" style={{marginRight: 4}} /><TextInput style={styles.rateInput} keyboardType="numeric" placeholder="Qty" value={busCapacity} onChangeText={setBusCapacity} /><Text style={styles.perHour}>spots</Text></View>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>3. Rules & Amenities</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Minimum Parking Duration (Hours)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="time-outline" size={20} color="#9BA4B5" style={styles.icon} />
            <TextInput style={styles.input} keyboardType="numeric" value={minHours} onChangeText={setMinHours} />
          </View>
          {allowCar && minHours ? (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#4A90E2" />
              <Text style={styles.infoText}>Minimum earning per Car: <Text style={{fontWeight: 'bold'}}>₹{getMinEarnings(carRate)}</Text></Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.amenityRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <MaterialCommunityIcons name="car-wash" size={24} color="#4A90E2" />
              <View style={{marginLeft: 12}}><Text style={styles.amenityTitle}>Offer Car Wash</Text><Text style={styles.amenitySub}>(+₹150)</Text></View>
            </View>
            <Switch value={hasCarWash} onValueChange={setHasCarWash} trackColor={{ true: '#4A90E2' }} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>Publish Listing</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 20, paddingBottom: 100 },
  
  // NEW: Image Upload Styles
  imageUploadCard: { backgroundColor: '#F1F5F9', borderRadius: 16, height: 180, marginBottom: 20, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 10 },
  uploadSubText: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10, marginTop: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  subText: { fontSize: 13, color: '#64748B', marginBottom: 15 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#1E293B', fontSize: 15 },
  vehicleContainer: { paddingVertical: 5 },
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleLeft: { flexDirection: 'row', alignItems: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  bulkDetailsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  rateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, height: 40, width: 90 },
  capacityBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, height: 40, width: 100, marginLeft: 10 },
  currency: { color: '#64748B', fontWeight: 'bold', marginRight: 2 },
  rateInput: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  perHour: { color: '#64748B', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, marginBottom: 15 },
  infoText: { color: '#1E293B', fontSize: 13, marginLeft: 8 },
  amenityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  amenityTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  amenitySub: { fontSize: 12, color: '#64748B', marginTop: 2, paddingRight: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  publishBtn: { backgroundColor: '#4A90E2', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  publishText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default AddSpace;
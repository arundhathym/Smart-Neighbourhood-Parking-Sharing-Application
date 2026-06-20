import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, ScrollView, 
  TouchableOpacity, StatusBar, Switch, Platform 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 50;

const BulkBooking = ({ navigation }) => {
  // State for search criteria
  const [location, setLocation] = useState('');
  const [eventName, setEventName] = useState('');
  const [counts, setCounts] = useState({ Car: 5, Van: 0, Bus: 0 });
  const [isValet, setIsValet] = useState(false);

  // NEW: State for Date and Time Pickers
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const prices = { Car: 8, Van: 10, Bus: 15 };

  const updateCount = (type, delta) => {
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  // Date and Time handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Formatters for display
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const totalSlots = counts.Car + counts.Van + counts.Bus;
  const basePrice = (counts.Car * prices.Car) + (counts.Van * prices.Van) + (counts.Bus * prices.Bus);
  const valetPrice = isValet ? totalSlots * 5 : 0;
  const totalPrice = basePrice + valetPrice;

  const handleSearch = () => {
    if (!location.trim()) {
      alert("Please enter a location or city.");
      return;
    }
    // Navigate to the results screen and pass the search criteria including the real date and time
    navigation.navigate('BulkSearchResults', {
      searchCriteria: {
        location,
        eventName,
        date: formattedDate,
        time: formattedTime,
        counts,
        isValet,
        estimatedTotal: totalPrice
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 10 }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bulk Reservation</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* LOCATION INPUT */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location / City (Required)</Text>
          <View style={styles.inputWithIcon}>
             <Ionicons name="location-outline" size={20} color="#3C467B" />
             <TextInput 
                style={[styles.inputText, {flex: 1, padding: 0, margin: 0}]} 
                placeholder="e.g. Thiruvananthapuram" 
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
             />
          </View>
        </View>

        {/* EVENT NAME */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Event Name (Optional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Annual Corp Meeting" 
            placeholderTextColor="#94A3B8"
            value={eventName}
            onChangeText={setEventName}
          />
        </View>

        {/* FUNCTIONAL DATE AND TIME PICKERS */}
        <View style={styles.row}>
           <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon} 
                activeOpacity={0.7} 
                onPress={() => setShowDatePicker(true)}
              >
                 <Ionicons name="calendar-outline" size={20} color="#3C467B" />
                 <Text style={styles.inputText}>{formattedDate}</Text>
              </TouchableOpacity>
           </View>
           
           <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon} 
                activeOpacity={0.7} 
                onPress={() => setShowTimePicker(true)}
              >
                 <Ionicons name="time-outline" size={20} color="#3C467B" />
                 <Text style={styles.inputText}>{formattedTime}</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* The Native Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()} // Prevents booking in the past
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Vehicle Requirements</Text>
          <Text style={styles.slotTotalText}>{totalSlots} Slots</Text>
        </View>

        {['Car', 'Van', 'Bus'].map((type) => (
          <View key={type} style={styles.counterCard}>
             <View style={styles.counterInfo}>
                <View style={styles.vehicleIconBox}>
                   <FontAwesome5 
                     name={type === 'Car' ? 'car' : type === 'Bus' ? 'bus' : 'shuttle-van'} 
                     size={16} 
                     color="#3C467B" 
                   />
                </View>
                <View>
                   <Text style={styles.counterTitle}>{type}s</Text>
                   <Text style={styles.counterSub}>₹{prices[type]} per slot</Text>
                </View>
             </View>
             <View style={styles.counterControls}>
                <TouchableOpacity 
                  onPress={() => updateCount(type, -1)}
                  style={styles.counterBtn}
                >
                   <MaterialIcons name="remove" size={20} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.countValue}>{counts[type]}</Text>
                <TouchableOpacity 
                  onPress={() => updateCount(type, 1)}
                  style={[styles.counterBtn, { backgroundColor: '#3C467B' }]}
                >
                   <MaterialIcons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
             </View>
          </View>
        ))}

        <View style={styles.toggleRow}>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconBox}>
                 <FontAwesome5 name="user-tie" size={16} color="#3C467B" />
              </View>
              <View>
                 <Text style={styles.toggleTitle}>Include Valet Service</Text>
                 <Text style={styles.toggleSub}>+₹5 per vehicle</Text>
              </View>
           </View>
           <Switch 
             value={isValet} 
             onValueChange={setIsValet} 
             trackColor={{ false: "#E2E8F0", true: "#3C467B" }}
             thumbColor={"#FFFFFF"}
           />
        </View>

      </ScrollView>

      <View style={styles.footer}>
         <View>
            <Text style={styles.totalLabel}>Estimated Budget</Text>
            <Text style={styles.totalPrice}>₹{totalPrice}.00</Text>
         </View>
         <TouchableOpacity 
           style={[styles.bookBtn, totalSlots === 0 && { opacity: 0.5 }]} 
           activeOpacity={0.8}
           disabled={totalSlots === 0}
           onPress={handleSearch}
         >
            <Text style={styles.bookBtnText}>Search Spaces</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#FFFFFF',
    paddingBottom: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    zIndex: 10,
  },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  content: { padding: 20, paddingTop: 30, paddingBottom: 140 },
  
  formGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, height: 56, borderRadius: 16, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '500' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputText: { marginLeft: 12, fontSize: 15, color: '#0F172A', fontWeight: '600' },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  slotTotalText: { fontSize: 14, fontWeight: '700', color: '#3C467B', backgroundColor: '#E5EBFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  
  counterCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#FFFFFF', padding: 12, borderRadius: 20, marginBottom: 12, 
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 
  },
  counterInfo: { flexDirection: 'row', alignItems: 'center' },
  vehicleIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  counterTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  counterSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  counterControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4 },
  counterBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#FFFFFF' },
  countValue: { width: 30, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#0F172A' },

  toggleRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 20, marginTop: 15,
    borderWidth: 1, borderColor: '#E2E8F0' 
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  toggleTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  toggleSub: { fontSize: 13, color: '#3C467B', fontWeight: '700', marginTop: 2 },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderTopWidth: 1, borderTopColor: '#DDE3F0',
    shadowColor: '#1E293B', shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 
  },
  totalLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 2 },
  totalPrice: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  bookBtn: { 
    backgroundColor: '#3C467B', flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 20, height: 56, borderRadius: 16 
  },
  bookBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
});

export default BulkBooking;
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Switch, ScrollView, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HostPreferences = ({ navigation }) => {
  const [pushNotif, setPushNotif] = useState(true);
  const [sharePhone, setSharePhone] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('hostPreferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setPushNotif(parsed.pushNotif ?? true);
        setSharePhone(parsed.sharePhone ?? true);
      }
    } catch (error) {
      console.error("Failed to load preferences", error);
    }
  };

  const savePreferences = async (newPrefs) => {
    try {
      await AsyncStorage.setItem('hostPreferences', JSON.stringify(newPrefs));
    } catch (error) {
      console.error("Failed to save preferences", error);
    }
  };

  const handleTogglePush = (value) => {
    setPushNotif(value);
    savePreferences({ pushNotif: value, sharePhone });
  };

  const handleTogglePhone = (value) => {
    setSharePhone(value);
    savePreferences({ pushNotif, sharePhone: value });
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Account",
      "Are you sure you want to deactivate your host account? This will hide your parking spaces from the map.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Deactivate", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            navigation.replace('Login');
          } 
        }
      ]
    );
  };

  const PreferenceRow = ({ icon, title, description, value, onValueChange }) => (
    <View style={styles.prefRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#3C467B" />
      </View>
      <View style={styles.prefTextContainer}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefDesc}>{description}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ true: '#3C467B', false: '#DDE3F0' }} 
        thumbColor={"#FFFFFF"}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.sectionTitle}>Privacy & Contact</Text>
        <PreferenceRow 
          icon="call-outline" 
          title="Share Phone Number" 
          description="Allow approved drivers to call you for directions since they pay on arrival." 
          value={sharePhone} 
          onValueChange={handleTogglePhone} 
        />

        <Text style={styles.sectionTitle}>Notifications</Text>
        <PreferenceRow 
          icon="notifications-outline" 
          title="Push Notifications" 
          description="Get alerts on your phone for new booking requests." 
          value={pushNotif} 
          onValueChange={handleTogglePush} 
        />

        <View style={styles.dangerZone}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeactivate}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Deactivate Host Account</Text>
          </TouchableOpacity>
        </View>
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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, marginTop: 15, marginLeft: 4 },
  prefRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#DDE3F0' },
  iconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  prefTextContainer: { flex: 1, paddingRight: 10 },
  prefTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  prefDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  
  dangerZone: { marginTop: 20 },
  deleteBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 }
});

export default HostPreferences;
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const PersonalDetails = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const API_URL = `${API_BASE_URL}/users/me`;

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Pre-fill the state with the actual data from the database
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } else {
        console.error("Failed to load user:", data.error);
      }
    } catch (error) {
      console.error('Network error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (isSaving) return; 
    
    setIsSaving(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const API_URL = `${API_BASE_URL}/users/update`;

      const response = await fetch(API_URL, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your profile has been updated!");
        navigation.goBack(); 
      } else {
        Alert.alert("Error", data.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Network Error", "Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#3C467B" style={{ marginTop: 50 }} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none"
              placeholder="Enter your email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              placeholder="Enter your phone number"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFF', height: 55, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#DDE3F0' },
  saveBtn: { backgroundColor: '#3C467B', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#3C467B', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default PersonalDetails;
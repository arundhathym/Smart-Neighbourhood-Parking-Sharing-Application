import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // <-- NEW IMPORT

import { API_BASE_URL } from '../config';

const Register = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); 
  
  // NEW: State for Profile Picture (Base64 String)
  const [profilePic, setProfilePic] = useState(null); 
  
  const [errors, setErrors] = useState({});

  // NEW: Function to open gallery and pick an image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forces a square crop
      quality: 0.3, // Keeps file size small for the database
      base64: true, // Converts image to a text string!
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].base64);
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!fullName.trim()) { newErrors.fullName = "Full name is required"; valid = false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { newErrors.email = "Email is required"; valid = false; } 
    else if (!emailRegex.test(email)) { newErrors.email = "Please enter a valid email"; valid = false; }

    const phoneRegex = /^\d{10}$/;
    if (!phone) { newErrors.phone = "Phone number is required"; valid = false; } 
    else if (!phoneRegex.test(phone)) { newErrors.phone = "Must be exactly 10 digits"; valid = false; }

    if (!license.trim()) { newErrors.license = "Driving License No. is required"; valid = false; }

    if (!password) { newErrors.password = "Password is required"; valid = false; } 
    else if (password.length < 6) { newErrors.password = "Min. 6 characters"; valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        const API_URL = `${API_BASE_URL}/auth/register`; 
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            license,
            password,
            role,
            profilePic // NEW: Sending the image string to backend
          }),
        });

        const data = await response.json();

        if (response.ok) {
          await AsyncStorage.setItem('userToken', data.token);
          alert('Registration Successful!');
          
          if (role === 'host') {
            navigation.replace('HostTabs');
          } else {
            navigation.replace('UserDashboard');
          }
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (error) {
        console.error(error);
        alert('Network Error: Make sure your backend server is running and the IP address is correct.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our smart parking community</Text>
          </View>

          <View style={styles.form}>

            {/* NEW: PROFILE PICTURE UPLOADER UI */}
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn} activeOpacity={0.8}>
                {profilePic ? (
                  <Image 
                    source={{ uri: `data:image/jpeg;base64,${profilePic}` }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="camera-outline" size={32} color="#9BA4B5" />
                    <Text style={styles.addPicText}>Add Photo</Text>
                  </View>
                )}
                
                {/* Small edit icon badge */}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>I want to...</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]} 
                onPress={() => setRole('user')}
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={18} color={role === 'user' ? '#4A90E2' : '#64748B'} style={{marginRight: 6}} />
                <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>Find Parking</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleBtn, role === 'host' && styles.roleBtnActive]} 
                onPress={() => setRole('host')}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={18} color={role === 'host' ? '#4A90E2' : '#64748B'} style={{marginRight: 6}} />
                <Text style={[styles.roleText, role === 'host' && styles.roleTextActive]}>Host a Spot</Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputBox, errors.fullName && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#9BA4B5" style={styles.icon} />
              <TextInput 
                style={styles.input} placeholder="John Doe" placeholderTextColor="#9BA4B5"
                value={fullName} onChangeText={(text) => { setFullName(text); setErrors({...errors, fullName: null}); }}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputBox, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#9BA4B5" style={styles.icon} />
              <TextInput 
                style={styles.input} placeholder="john@example.com" placeholderTextColor="#9BA4B5"
                keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={(text) => { setEmail(text); setErrors({...errors, email: null}); }}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputBox, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#9BA4B5" style={styles.icon} />
              <TextInput 
                style={styles.input} placeholder="10-digit mobile number" placeholderTextColor="#9BA4B5"
                keyboardType="numeric" maxLength={10}
                value={phone} onChangeText={(text) => { setPhone(text); setErrors({...errors, phone: null}); }}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* License */}
            <Text style={styles.label}>{role === 'host' ? 'ID / License No. (Required)' : 'Driving License No. (Required)'}</Text>
            <View style={[styles.inputBox, errors.license && styles.inputError]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#9BA4B5" style={styles.icon} />
              <TextInput 
                style={styles.input} placeholder="e.g. D1234567" placeholderTextColor="#9BA4B5"
                autoCapitalize="characters"
                value={license} onChangeText={(text) => { setLicense(text); setErrors({...errors, license: null}); }}
              />
            </View>
            {errors.license && <Text style={styles.errorText}>{errors.license}</Text>}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputBox, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9BA4B5" style={styles.icon} />
              <TextInput 
                style={styles.input} placeholder="Min. 6 characters" placeholderTextColor="#9BA4B5"
                secureTextEntry 
                value={password} onChangeText={(text) => { setPassword(text); setErrors({...errors, password: null}); }}
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>Sign Up & Verify</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 40 },
  backBtn: { marginTop: 20, marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B' },
  form: { marginBottom: 20 },
  
  // NEW: IMAGE PICKER STYLES
  imagePickerContainer: { alignItems: 'center', marginBottom: 25 },
  imagePickerBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  addPicText: { fontSize: 12, color: '#9BA4B5', marginTop: 4, fontWeight: '600' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4A90E2', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F8FAFC' },

  roleContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  roleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  roleTextActive: { color: '#1E293B' },

  label: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 5, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#E2E8F0' },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#1E293B', fontSize: 16 },
  errorText: { color: '#FF3B30', fontSize: 12, marginBottom: 15, marginLeft: 5, marginTop: 2 },
  registerBtn: { backgroundColor: '#4A90E2', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15, shadowColor: '#4A90E2', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  registerBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  footerText: { color: '#64748B', fontSize: 15 },
  loginLink: { color: '#4A90E2', fontSize: 15, fontWeight: 'bold' }
});

export default Register;
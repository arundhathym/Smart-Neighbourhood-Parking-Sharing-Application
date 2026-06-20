import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, StatusBar, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the central config URL!
import { API_BASE_URL } from '../config';

// ADDED "route" to the props to catch the role from the previous screen
const Login = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Capture the role selected on the RoleSelectionScreen (e.g., 'user' or 'host')
  const expectedRole = route?.params?.role;

  const validate = () => {
    let valid = true;
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        const API_URL = `${API_BASE_URL}/auth/login`;

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // ==========================================
          // THE NEW GATEKEEPER CHECK
          // ==========================================
          if (expectedRole && data.role !== expectedRole) {
            Alert.alert(
              "Access Denied", 
              `You selected to log in as a ${expectedRole === 'user' ? 'Driver' : 'Host'}, but this account is registered as a ${data.role}. Please go back and select the correct role.`
            );
            return; // Stop the login process right here. Do NOT save the token.
          }
          // ==========================================

          await AsyncStorage.setItem('userToken', data.token); 
          
          // Dynamic Routing based on the role stored in MongoDB
          if (data.role === 'host') {
            navigation.replace('HostTabs');
          } else {
            navigation.replace('UserDashboard');
          }
        } else {
          Alert.alert("Login Failed", data.error || 'Invalid Credentials');
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Network Error", "Make sure your backend server is running and the IP address is correct.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="parking" size={35} color="#3C467B" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {expectedRole === 'host' ? 'Log in to manage your spaces' : 'Log in to find parking'}
          </Text>
        </View>

        <View style={styles.form}>
          
          {/* Email Input */}
          <View style={[styles.inputBox, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors({...errors, email: null}); }}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Input */}
          <View style={[styles.inputBox, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({...errors, password: null}); }}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, 
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 50 },
  iconCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 25, 
    backgroundColor: '#E5EBFA', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C3D0F0'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  form: { marginBottom: 30 },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 12, 
    paddingHorizontal: 15, 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#DDE3F0' 
  },
  inputError: { borderColor: '#FDA4AF', backgroundColor: '#FFF1F2' },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#1E293B', fontSize: 16, fontWeight: '500' },
  errorText: { color: '#E11D48', fontSize: 12, marginBottom: 15, marginLeft: 5, marginTop: -5 },
  loginBtn: { 
    backgroundColor: '#3C467B', 
    height: 60, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#3C467B', 
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 4 
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 15 },
  registerLink: { color: '#3C467B', fontSize: 15, fontWeight: 'bold' }
});

export default Login;
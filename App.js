// 1. THIS IMPORT MUST BE AT THE VERY TOP
import 'react-native-gesture-handler'; 

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// --- NEW IMPORT: Role Selection ---
import RoleSelectionScreen from './src/screens/RoleSelectionScreen'; // <-- Make sure the path is correct

// Core Screens
import Login from './src/screens/Login';
import Register from './src/screens/Register';

// User Screens
import UserDashboard from './src/screens/UserDashboard';
import HeatmapDetail from './src/screens/HeatmapDetail';
import BulkBooking from './src/screens/BulkBooking';
import PersonalDetails from './src/screens/PersonalDetails'; 
//import MyVehicles from './src/screens/MyVehicles';           
import SavedSpots from './src/screens/SavedSpots';           
import HelpCenter from './src/screens/HelpCenter';
import UserBookingHistory from './src/screens/UserBookingHistory';
// Host Screens
import AddSpace from './src/screens/AddSpace';
import ParkingSpaceDetails from './src/screens/ParkingSpaceDetails';
import HostProfile from './src/screens/HostProfile';
import HostDashboard from './src/screens/HostDashboard';
import Payments from './src/screens/Payments';
import BookingHistory from './src/screens/BookingHistory';
import HostPreferences from './src/screens/HostPreferences';
import RequestDetails from './src/screens/RequestDetails';
import SpotDetails from './src/screens/SpotDetails';
import BulkSearchResults from './src/screens/BulkSearchResults';
import UserBookingDetails from './src/screens/UserBookingDetails';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Host Tab Navigator ---
function HostTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3C467B', 
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 10, 
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 1, 
          borderTopColor: '#DDE3F0' 
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'grid-outline';
          else if (route.name === 'My Spaces') iconName = 'car-sport-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HostDashboard} />
      <Tab.Screen name="My Spaces" component={ParkingSpaceDetails} />
      <Tab.Screen name="Profile" component={HostProfile} />
    </Tab.Navigator>
  );
}

// --- Main App Navigator ---
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        // CHANGED: This makes the Role Selection screen the very first screen!
        initialRouteName="RoleSelection"
        screenOptions={{
          headerShown: false 
        }}
      >
        {/* --- FRONT DOOR --- */}
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

        {/* --- CORE AUTH --- */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* User Flow */}
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="HeatmapDetail" component={HeatmapDetail} />
        <Stack.Screen name="BulkBooking" component={BulkBooking} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} />
      {/*  <Stack.Screen name="MyVehicles" component={MyVehicles} />*/}
        <Stack.Screen name="SavedSpots" component={SavedSpots} />
        <Stack.Screen name="HelpCenter" component={HelpCenter} />
        <Stack.Screen name="UserBookingHistory" component={UserBookingHistory} />
        <Stack.Screen name="UserBookingDetails" component={UserBookingDetails} />

        {/* Host Flow */}
        <Stack.Screen name="HostTabs" component={HostTabs} /> 
        <Stack.Screen name="AddSpace" component={AddSpace} />
        <Stack.Screen name="Payments" component={Payments} />
        <Stack.Screen name="BookingHistory" component={BookingHistory} />
        <Stack.Screen name="HostPreferences" component={HostPreferences} />
        <Stack.Screen name="RequestDetails" component={RequestDetails} />
        <Stack.Screen name="SpotDetails" component={SpotDetails} />
        <Stack.Screen name="BulkSearchResults" component={BulkSearchResults} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
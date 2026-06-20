import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {

  // Handlers for navigation. Update the string to match your exact route names!
  const handleUserSelect = () => {
    console.log("Navigating to User Flow...");
    navigation.navigate('Login', { role: 'user' }); 
  };

  const handleHostSelect = () => {
    console.log("Navigating to Host Flow...");
    navigation.navigate('Login', { role: 'host' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="car-sport" size={40} color="#FFF" />
        </View>
        <Text style={styles.welcomeText}>Welcome to ParkIt</Text>
        <Text style={styles.subText}>How would you like to use the app today?</Text>
      </View>

      {/* SELECTION CARDS */}
      <View style={styles.cardsContainer}>
        
        {/* USER / DRIVER CARD */}
        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handleUserSelect}>
          <LinearGradient colors={['#3C467B', '#2A325A']} style={styles.cardGradient}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="search-location" size={32} color="#3C467B" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Find Parking</Text>
              <Text style={styles.cardDescription}>
                Search, book, and pay for parking spots instantly.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* HOST / OWNER CARD */}
        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handleHostSelect}>
          <View style={[styles.cardGradient, styles.hostCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
              <FontAwesome5 name="warehouse" size={26} color="#FFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: '#1E293B' }]}>Host a Spot</Text>
              <Text style={[styles.cardDescription, { color: '#64748B' }]}>
                List your empty driveway or garage and start earning.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#1E293B" />
          </View>
        </TouchableOpacity>

      </View>

      {/* BOTTOM FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
        </Text>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C467B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3C467B',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    height: 140,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  hostCard: {
    backgroundColor: '#FFF',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#DDE3F0',
    lineHeight: 18,
    paddingRight: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#3C467B',
    fontWeight: 'bold',
  }
});

export default RoleSelectionScreen;
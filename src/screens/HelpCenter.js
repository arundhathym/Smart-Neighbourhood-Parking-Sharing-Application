import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  ScrollView, Linking, LayoutAnimation, Platform, UIManager, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HelpCenter = ({ navigation }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      question: "How does 'Pay on Arrival' work?",
      answer: "When a driver arrives at the parking spot, they pay the host directly via cash or UPI. Once payment is received, the host marks the booking as 'Completed' in their dashboard."
    },
    {
      id: 2,
      question: "How do I list my parking space?",
      answer: "If you are logged in as a Host, simply navigate to your Dashboard and click 'Add Space'. Fill in the location, vehicle types allowed, and pricing to make it active on the map."
    },
    {
      id: 3,
      question: "What if a driver doesn't show up?",
      answer: "Hosts have full control over their pending and active queues. If a driver fails to arrive within a reasonable time, the host can manually mark the request as 'Rejected' or 'Cancelled' to free up the spot."
    },
    {
      id: 4,
      question: "How do I contact my Host for directions?",
      answer: "Once your booking is approved by the host, go to the 'My Bookings' tab. You will see a 'Contact Host' button that allows you to call them directly for specific parking instructions."
    }
  ];

  // Instantly filter FAQs based on the search query
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEmailSupport = () => {
    // Replace this email with a real one you set up for the project
    Linking.openURL('mailto:smartparkingproject@gmail.com?subject=App Support Request');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Contact Support Section */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactIconBg}>
            <Ionicons name="headset" size={28} color="#3C467B" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactTitle}>Need direct help?</Text>
            <Text style={styles.contactDesc}>Our support team is available 24/7 to resolve disputes or answer questions.</Text>
          </View>
          <TouchableOpacity style={styles.emailBtn} onPress={handleEmailSupport}>
            <Text style={styles.emailBtnText}>Email Us</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Search Bar */}
        <View style={styles.searchHeaderRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Frequently Asked Questions</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{ marginLeft: 12 }} />
          <TextInput 
            placeholder="Search for answers..." 
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
        </View>
        
        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <TouchableOpacity 
                key={faq.id} 
                style={[styles.faqCard, isExpanded && styles.faqCardExpanded]} 
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, isExpanded && { color: '#3C467B' }]}>
                    {faq.question}
                  </Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={isExpanded ? "#3C467B" : "#94A3B8"} 
                  />
                </View>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.footerSpace} />
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
  
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, marginLeft: 4, marginTop: 10 },
  
  contactCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#DDE3F0', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  contactIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E5EBFA', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  contactTextContainer: { alignItems: 'center', marginBottom: 20 },
  contactTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  contactDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  emailBtn: { backgroundColor: '#3C467B', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' },
  emailBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  searchHeaderRow: { marginBottom: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#DDE3F0', marginBottom: 20 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: '#1E293B' },
  noResultsText: { textAlign: 'center', color: '#64748B', marginTop: 10, fontStyle: 'italic' },

  faqCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DDE3F0' },
  faqCardExpanded: { borderColor: '#C3D0F0', backgroundColor: '#F8FAFC' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B', paddingRight: 10 },
  faqAnswer: { fontSize: 14, color: '#64748B', marginTop: 12, lineHeight: 22 },
  
  footerSpace: { height: 40 }
});

export default HelpCenter;
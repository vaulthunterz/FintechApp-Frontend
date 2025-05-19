import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import InvestmentSettingsDrawer from '../components/investment/InvestmentSettingsDrawer';
import { Ionicons } from '@expo/vector-icons';

const InvestmentDashboard = () => {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [fundDetails, setFundDetails] = useState<any>(null);
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Use the latest API for investment profile status from the correct backend URL
        const status = await api.checkQuestionnaireStatus();
        setProfile(status.profile);
        setQuestionnaire(status.data);
        setAnalytics(status.analytics);
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load investment profile' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  // Helper to safely get profile/questionnaire values with fallback
  const getProfileValue = (value: any, fallback: string = '-') => {
    if (value === null || value === undefined || value === '' || value === '-') return fallback;
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : fallback;
    return value;
  };

  // Merge questionnaire and profile for display, prioritizing questionnaire data
  const mergedProfile = questionnaire
    ? { ...(profile || {}), ...questionnaire }
    : (profile || {});

  // List of fields to show from questionnaire/profile
  const fieldsToShow = [
    { label: 'Annual Income', key: 'annual_income_range' },
    { label: 'Monthly Savings', key: 'monthly_savings_range' },
    { label: 'Emergency Fund (months)', key: 'emergency_fund_months' },
    { label: 'Debt Situation', key: 'debt_situation' },
    { label: 'Primary Goal', key: 'primary_goal' },
    { label: 'Investment Timeframe', key: 'investment_timeframe' },
    { label: 'Monthly Investment', key: 'monthly_investment' },
    { label: 'Market Drop Reaction', key: 'market_drop_reaction' },
    { label: 'Investment Preference', key: 'investment_preference' },
    { label: 'Loss Tolerance', key: 'loss_tolerance' },
    { label: 'Investment Knowledge', key: 'investment_knowledge' },
    { label: 'Experience (years)', key: 'investment_experience_years' },
    { label: 'Previous Investments', key: 'previous_investments' },
    { label: 'Preferred Investment Types', key: 'preferred_investment_types' },
    { label: 'Ethical Preferences', key: 'ethical_preferences' },
    { label: 'Sector Preferences', key: 'sector_preferences' },
    { label: 'Financial Dependents', key: 'financial_dependents' },
    { label: 'Income Stability', key: 'income_stability' },
    { label: 'Major Expenses Planned', key: 'major_expenses_planned' },
  ];

  // Helper to fetch fund details from backend
  const fetchFundDetails = async (fundId: string) => {
    setFundLoading(true);
    try {
      // Replace with your actual API call for fund details
      const details = await api.getMarketFundDetails(fundId);
      setFundDetails(details);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load fund details' });
      setFundDetails(null);
    } finally {
      setFundLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <InvestmentSettingsDrawer
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onQuestionnaire={() => { setSettingsVisible(false); router.push('/screens/investment-questionnaire'); }}
        onViewProfile={() => { setSettingsVisible(false); Toast.show({ type: 'info', text1: 'Investment Profile', text2: 'You are already viewing your profile.' }); }}
        onViewRecommendations={() => { setSettingsVisible(false); router.push('/screens/investment-recommendations'); }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
        {/* Top Bar with Settings */}
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Investment Dashboard</Text>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {/* Investment Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: 22, marginBottom: 16 }]}>Your Investment Profile</Text>
            <TouchableOpacity onPress={() => {
              setLoading(true);
              const fetchProfile = async () => {
                try {
                  const status = await api.checkQuestionnaireStatus();
                  setProfile(status.profile);
                  setQuestionnaire(status.data);
                  setAnalytics(status.analytics);
                } catch (e) {
                  Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to refresh investment profile' });
                } finally {
                  setLoading(false);
                }
              };
              fetchProfile();
            }} style={{ padding: 6, borderRadius: 20, backgroundColor: colors.primary }}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {Object.keys(mergedProfile).length > 0 ? (
            <>
              {fieldsToShow.map((field) => {
                const value = getProfileValue(mergedProfile[field.key]);
                if (value === '-' || value === 'None' || value === 'none' || value === null || value === undefined) return null;
                // If this is a fund field, make it clickable
                if (field.key === 'preferred_investment_types' && Array.isArray(mergedProfile[field.key])) {
                  return mergedProfile[field.key].map((fund: any, idx: number) => (
                    <TouchableOpacity key={fund.id || idx} onPress={() => {
                      setSelectedFund(fund);
                      fetchFundDetails(fund.id);
                    }} style={styles.profileRow}>
                      <Text style={styles.profileLabel}>{fund.name || 'Market Fund'}:</Text>
                      <Text style={styles.profileValue}>{fund.short_desc || '-'}</Text>
                    </TouchableOpacity>
                  ));
                }
                return (
                  <View style={styles.profileRow} key={field.key}>
                    <Text style={styles.profileLabel}>{field.label}:</Text>
                    <Text style={styles.profileValue}>{value}</Text>
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={{ color: colors.textSecondary || '#888' }}>No investment profile found. Please complete the questionnaire.</Text>
          )}
        </View>
        {/* Profile Features Card */}
        {analytics && (
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Features</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Risk Score:</Text><Text style={styles.detailValue}>{analytics.risk_score}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Investment Style:</Text><Text style={styles.detailValue}>{analytics.investment_style}</Text></View>
          </View>
        )}
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.push('/screens/investment-recommendations')}>
          <Text style={styles.buttonText}>View Recommendations</Text>
        </TouchableOpacity>
        {/* Fund Details Modal/Card */}
        {selectedFund && (
          <View style={[styles.card, { backgroundColor: colors.card, position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10 }]}> 
            <TouchableOpacity onPress={() => { setSelectedFund(null); setFundDetails(null); }} style={{ alignSelf: 'flex-end', padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            {fundLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : fundDetails ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{fundDetails.name}</Text>
                <Text style={{ marginBottom: 8 }}>{fundDetails.description || 'No description available.'}</Text>
                {fundDetails.webpage && (
                  <TouchableOpacity onPress={() => Linking.openURL(fundDetails.webpage)}>
                    <Text style={{ color: colors.primary, textDecorationLine: 'underline', marginBottom: 8 }}>Visit Fund Webpage</Text>
                  </TouchableOpacity>
                )}
                <Text>Rates: {fundDetails.rates || '-'}</Text>
                {/* Add more fields as needed */}
              </>
            ) : (
              <Text style={{ color: colors.textSecondary }}>No details found for this fund.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  screenTitle: { fontSize: 22, fontWeight: 'bold' },
  settingsButton: { padding: 6, borderRadius: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 20, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 16, color: '#888', flex: 1 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#007AFF', flex: 1, textAlign: 'right' },
  button: { padding: 16, borderRadius: 10, alignItems: 'center', margin: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  profileLabel: { fontSize: 16, color: '#333', flex: 1 },
  profileValue: { fontSize: 16, fontWeight: '600', color: '#007AFF', flex: 1, textAlign: 'right' },
});

export default InvestmentDashboard;

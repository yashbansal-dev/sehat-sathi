import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Suppress all developer warning popups
LogBox.ignoreAllLogs(true);

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { BottomNavBar, TabKey } from './src/components/BottomNavBar';
import { LanguageToggle } from './src/components/LanguageToggle';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { mobileApi } from './src/services/api';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [openUploadDirectly, setOpenUploadDirectly] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  // Poll pending reviews count
  useEffect(() => {
    if (user) {
      mobileApi.getUncertainties()
        .then(data => setPendingReviewsCount(data.filter(u => !u.resolved).length))
        .catch(() => {});
    }
  }, [user, currentTab]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingTitle}>Sehat Sathi AI</Text>
        <Text style={styles.loadingSubtitle}>The Two-Minute Doctor</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="dark" />
      {/* Top Header with App Brand and Language Toggle */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.topBarBrand}>Sehat Sathi</Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI</Text>
          </View>
        </View>
        <LanguageToggle />
      </View>

      <View style={styles.screenContainer}>
        {currentTab === 'home' && (
          <HomeScreen
            onNavigate={(tab) => {
              setCurrentTab(tab);
              setOpenUploadDirectly(false);
            }}
            onOpenUpload={() => {
              setCurrentTab('documents');
              setOpenUploadDirectly(true);
            }}
          />
        )}

        {currentTab === 'timeline' && <TimelineScreen />}

        {currentTab === 'documents' && (
          <DocumentsScreen initialOpenUpload={openUploadDirectly} />
        )}

        {currentTab === 'trends' && <TrendsScreen />}

        {currentTab === 'profile' && <ProfileScreen />}
      </View>

      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setOpenUploadDirectly(false);
        }}
        pendingReviewsCount={pendingReviewsCount}
      />
    </View>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 2,
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  aiTag: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  screenContainer: {
    flex: 1,
  },
});

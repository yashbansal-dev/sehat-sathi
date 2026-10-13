import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../context/LanguageContext';

export type TabKey = 'home' | 'timeline' | 'documents' | 'trends' | 'profile';

interface BottomNavBarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingReviewsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewsCount = 0
}) => {
  const { t } = useLanguage();

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: number }[] = [
    { key: 'home', label: t('tab_home'), icon: currentTab === 'home' ? 'home' : 'home-outline' },
    { key: 'timeline', label: t('tab_history'), icon: currentTab === 'timeline' ? 'time' : 'time-outline' },
    { key: 'documents', label: t('tab_documents'), icon: currentTab === 'documents' ? 'document-text' : 'document-text-outline' },
    { key: 'trends', label: t('tab_trends'), icon: currentTab === 'trends' ? 'trending-up' : 'trending-up-outline' },
    { 
      key: 'profile', 
      label: t('tab_profile'), 
      icon: currentTab === 'profile' ? 'person' : 'person-outline',
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? '#0D9488' : '#64748B'}
              />
              {tab.badge && tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#0D9488',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 16,
    height: 2.5,
    backgroundColor: '#0D9488',
    borderRadius: 2,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

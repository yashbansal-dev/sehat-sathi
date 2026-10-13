import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={toggleLanguage} 
      activeOpacity={0.8}
    >
      <Ionicons name="globe-outline" size={14} color="#0D9488" style={styles.icon} />
      <View style={styles.badgeWrapper}>
        <Text style={[styles.langText, language === 'en' && styles.activeLang]}>
          EN
        </Text>
        <Text style={styles.divider}>|</Text>
        <Text style={[styles.langText, language === 'hi' && styles.activeLang]}>
          हिंदी
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: 2,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeLang: {
    color: '#0F766E',
    fontWeight: '800',
  },
  divider: {
    fontSize: 11,
    color: '#CBD5E1',
  },
});

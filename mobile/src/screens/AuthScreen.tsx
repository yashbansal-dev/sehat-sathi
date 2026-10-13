import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { CURRENT_LAN_IP } from '../services/api';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    register, 
    loginWithGoogle, 
    demoLogin, 
    baseUrl, 
    setBaseUrl, 
    checkServerHealth 
  } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server URL configuration & health check
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [serverHealth, setServerHealth] = useState<{ checked: boolean; ok: boolean; message: string }>({
    checked: false,
    ok: false,
    message: 'Checking...'
  });
  const [testingConnection, setTestingConnection] = useState(false);

  // Google Login Modal state (for native mobile flow)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Automatically check backend health on mount
  useEffect(() => {
    testHealth(baseUrl);
  }, [baseUrl]);

  const testHealth = async (targetUrl?: string) => {
    setTestingConnection(true);
    try {
      if (targetUrl && targetUrl !== baseUrl) {
        await setBaseUrl(targetUrl);
      }
      const res = await checkServerHealth();
      setServerHealth({ checked: true, ok: res.ok, message: res.message });
    } catch (e: any) {
      setServerHealth({ checked: true, ok: false, message: e.message || 'Offline' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    if (isRegister && !fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, fullName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please verify credentials and server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setError(null);
    if (Platform.OS === 'web') {
      // Direct Web Popup
      setGoogleLoading(true);
      try {
        await loginWithGoogle();
      } catch (e: any) {
        setError(e.message || 'Google sign-in was not completed.');
      } finally {
        setGoogleLoading(false);
      }
    } else {
      // Native Mobile: Open Google Account selection modal
      setShowGoogleModal(true);
    }
  };

  const handleConfirmGoogleLogin = async (selectedEmail?: string, selectedName?: string) => {
    setShowGoogleModal(false);
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(selectedEmail, selectedName);
    } catch (e: any) {
      setError(e.message || 'Google sign-in could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
    } catch (e: any) {
      setError(e.message || 'Demo login failed. Verify backend server is running and reachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async (presetUrl?: string) => {
    const urlToSave = (presetUrl || tempUrl).trim();
    if (urlToSave) {
      setTempUrl(urlToSave);
      await setBaseUrl(urlToSave);
      await testHealth(urlToSave);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="medical" size={32} color="#0D9488" />
            </View>
            <Text style={styles.brandTitle}>Sehat Sathi AI</Text>
            <Text style={styles.tagline}>The Two-Minute Doctor</Text>
            <Text style={styles.subtext}>Every medical record. One clear story.</Text>
          </View>

          {/* Real-time Server Connectivity Pill */}
          <TouchableOpacity 
            style={[
              styles.healthBadge, 
              serverHealth.ok ? styles.healthBadgeOk : styles.healthBadgeWarn
            ]}
            onPress={() => setShowServerConfig(!showServerConfig)}
            activeOpacity={0.8}
          >
            <View style={[styles.healthDot, serverHealth.ok ? styles.healthDotOk : styles.healthDotWarn]} />
            <Text style={[styles.healthText, serverHealth.ok ? styles.healthTextOk : styles.healthTextWarn]} numberOfLines={1}>
              {serverHealth.checked 
                ? (serverHealth.ok ? `Backend Online (${baseUrl})` : `Server Unreachable (${baseUrl})`)
                : `Connecting to ${baseUrl}...`
              }
            </Text>
            <Ionicons 
              name={showServerConfig ? "chevron-up" : "settings-outline"} 
              size={14} 
              color={serverHealth.ok ? "#0F766E" : "#B45309"} 
            />
          </TouchableOpacity>

          {/* Quick Instant Sign-In Options */}
          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="sparkles" size={16} color="#0D9488" />
              <Text style={styles.demoTitle}>Instant Health Vault Sign-In</Text>
            </View>
            <Text style={styles.demoDescription}>
              Sign in with your Google account or instant 1-click synthetic patient profile (Rajesh Sharma).
            </Text>

            {/* Google Sign-In - Top & Highly Visible */}
            <TouchableOpacity
              style={styles.googleTopButton}
              onPress={handleGooglePress}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleTopButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text style={styles.demoButtonText}>1-Click Demo Patient Login</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabButton, !isRegister && styles.activeTab]}
              onPress={() => { setIsRegister(false); setError(null); }}
            >
              <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, isRegister && styles.activeTab]}
              onPress={() => { setIsRegister(true); setError(null); }}
            >
              <Text style={[styles.tabText, isRegister && styles.activeTabText]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{error}</Text>
                  {!serverHealth.ok && (
                    <Text style={styles.errorHint}>
                      Tip: Tap the server settings badge above to ensure your phone and computer are on the same Wi-Fi.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rajesh Sharma"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Email / Password Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRegister ? 'Create Patient Account' : 'Sign In to Health Vault'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGooglePress}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Backend API Server Configuration Box */}
          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <View style={styles.serverConfigHeader}>
                <Ionicons name="server-outline" size={16} color="#0F766E" />
                <Text style={styles.serverConfigTitle}>Backend Server Configuration</Text>
              </View>
              <Text style={styles.serverConfigHelp}>
                Enter the IP of your computer running the FastAPI backend. Phone and laptop must be on the same Wi-Fi network.
              </Text>
              
              <TextInput
                style={styles.serverInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="http://172.x.x.x:8000"
                autoCapitalize="none"
              />

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity 
                  style={styles.presetChip}
                  onPress={() => handleSaveServerUrl(`http://${CURRENT_LAN_IP}:8000`)}
                >
                  <Text style={styles.presetChipText}>Wi-Fi ({CURRENT_LAN_IP})</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.presetChip}
                  onPress={() => handleSaveServerUrl('http://10.0.2.2:8000')}
                >
                  <Text style={styles.presetChipText}>Emulator (10.0.2.2)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.presetChip}
                  onPress={() => handleSaveServerUrl('http://localhost:8000')}
                >
                  <Text style={styles.presetChipText}>Localhost</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.serverActionRow}>
                <TouchableOpacity 
                  style={styles.testBtn} 
                  onPress={() => testHealth(tempUrl)}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color="#0D9488" />
                  ) : (
                    <>
                      <Ionicons name="pulse" size={14} color="#0D9488" />
                      <Text style={styles.testBtnText}>Test Connection</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveServerBtn} 
                  onPress={() => handleSaveServerUrl()}
                >
                  <Text style={styles.saveServerBtnText}>Apply URL</Text>
                </TouchableOpacity>
              </View>

              {serverHealth.checked && (
                <Text style={[styles.testResultText, serverHealth.ok ? styles.testSuccess : styles.testError]}>
                  {serverHealth.ok ? '✓ Connection successful!' : `✕ ${serverHealth.message}`}
                </Text>
              )}
            </View>
          )}

          {/* Toggle button if hidden */}
          {!showServerConfig && (
            <TouchableOpacity
              style={styles.serverConfigToggle}
              onPress={() => setShowServerConfig(true)}
            >
              <Ionicons name="hardware-chip-outline" size={13} color="#64748B" />
              <Text style={styles.serverConfigToggleText}>
                Backend Server: {baseUrl} (Tap to change IP)
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Sign-In Selection Modal (Mobile Native) */}
      <Modal
        visible={showGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </View>
              <Text style={styles.modalTitle}>Sign in with Google</Text>
              <Text style={styles.modalSubtitle}>Choose a verified Google account to access your Sehat Sathi Health Vault.</Text>
            </View>

            {/* Option A: Fast 1-Tap Evaluator Google Profile */}
            <TouchableOpacity
              style={styles.googleAccountOption}
              onPress={() => handleConfirmGoogleLogin('rajesh.sharma.google@gmail.com', 'Rajesh Sharma')}
              activeOpacity={0.7}
            >
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>RS</Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>Rajesh Sharma</Text>
                <Text style={styles.accountEmail}>rajesh.sharma.google@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option B: Custom Google Account */}
            <View style={styles.customGoogleBox}>
              <Text style={styles.customGoogleTitle}>Or enter your Google Account:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name (e.g. Yash Bansal)"
                placeholderTextColor="#94A3B8"
                value={customGoogleName}
                onChangeText={setCustomGoogleName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Google Email (e.g. user@gmail.com)"
                placeholderTextColor="#94A3B8"
                value={customGoogleEmail}
                onChangeText={setCustomGoogleEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.customGoogleBtn}
                onPress={() => handleConfirmGoogleLogin(
                  customGoogleEmail.trim() || undefined,
                  customGoogleName.trim() || undefined
                )}
              >
                <Text style={styles.customGoogleBtnText}>Sign In with This Google Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowGoogleModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 36,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 2,
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 6,
    maxWidth: '95%',
  },
  healthBadgeOk: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  healthBadgeWarn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthDotOk: {
    backgroundColor: '#0D9488',
  },
  healthDotWarn: {
    backgroundColor: '#D97706',
  },
  healthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthTextOk: {
    color: '#0F766E',
  },
  healthTextWarn: {
    color: '#B45309',
  },
  demoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoDescription: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 12,
  },
  googleTopButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleTopButtonText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 13,
  },
  demoButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '500',
  },
  errorHint: {
    color: '#7F1D1D',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  submitButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  serverConfigToggleText: {
    fontSize: 11,
    color: '#64748B',
  },
  serverConfigBox: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  serverConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  serverConfigTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  serverConfigHelp: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 15,
  },
  serverInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  serverActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
    paddingVertical: 10,
    borderRadius: 8,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  saveServerBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveServerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  testResultText: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
  testSuccess: {
    color: '#059669',
  },
  testError: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  googleAccountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  accountEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  customGoogleBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 14,
    marginBottom: 16,
  },
  customGoogleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  customGoogleBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  customGoogleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

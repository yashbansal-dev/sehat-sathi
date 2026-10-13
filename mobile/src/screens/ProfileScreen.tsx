import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationService } from '../services/notifications';
import { mobileApi } from '../services/api';
import { UncertaintyRecord, ShareToken, ClinicalBriefing } from '../types';

export const ProfileScreen: React.FC = () => {
  const { user, logout, baseUrl, setBaseUrl } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uncertainties, setUncertainties] = useState<UncertaintyRecord[]>([]);
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([]);
  const [briefing, setBriefing] = useState<ClinicalBriefing | null>(null);

  // Sharing Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [creatingShare, setCreatingShare] = useState(false);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);

  // Emergency Health Pass Modal State
  const [healthPassModalVisible, setHealthPassModalVisible] = useState(false);

  // Uncertainty Resolution Modal State
  const [activeUncertainty, setActiveUncertainty] = useState<UncertaintyRecord | null>(null);
  const [resolvedValue, setResolvedValue] = useState('');

  // Server URL Configuration Modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(baseUrl);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [uncertData, tokenData, briefData] = await Promise.all([
        mobileApi.getUncertainties().catch(() => []),
        mobileApi.getShareTokens().catch(() => []),
        mobileApi.getBriefing().catch(() => null),
      ]);
      setUncertainties(uncertData);
      setShareTokens(tokenData);
      setBriefing(briefData);
    } catch (e) {
      console.warn('Failed to load profile data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleCreateShare = async () => {
    if (!doctorName.trim()) {
      Alert.alert('Required', 'Please enter physician or clinic name.');
      return;
    }
    setCreatingShare(true);
    try {
      const res = await mobileApi.createShareToken(
        `Consultation with ${doctorName.trim()}`,
        doctorName.trim(),
        durationHours
      );
      setCreatedShareUrl(`${baseUrl}/doctor-portal/${res.token}`);
      loadProfileData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create share token');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleRevokeShare = async (token: ShareToken) => {
    Alert.alert(
      'Revoke Doctor Access',
      `Are you sure you want to revoke access for ${token.doctor_name_or_purpose || 'this doctor'}? Any subsequent requests will be immediately blocked with HTTP 410.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.revokeShareToken(token.id);
              Alert.alert('Revoked', 'Access has been permanently revoked.');
              loadProfileData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to revoke token');
            }
          }
        }
      ]
    );
  };

  const handleResolveUncertainty = async () => {
    if (!activeUncertainty) return;
    try {
      await mobileApi.resolveUncertainty(
        activeUncertainty.id,
        resolvedValue || activeUncertainty.detected_value || 'Confirmed'
      );
      Alert.alert('Verified', 'Field updated and verified with audit trail.');
      setActiveUncertainty(null);
      loadProfileData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to resolve field');
    }
  };

  const pendingUncertainties = uncertainties.filter(u => !u.resolved);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Profile Demographics Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.full_name ? user.full_name.charAt(0) : 'P'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name || 'Patient'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.profileTagRow}>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>Patient Health Vault</Text>
              </View>
              <View style={styles.bloodTag}>
                <Text style={styles.bloodTagText}>B+ Positive</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Health Pass Quick Access */}
        <TouchableOpacity
          style={styles.emergencyPassCard}
          onPress={() => setHealthPassModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.passIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color="#0D9488" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.passTitle}>Emergency Health Pass</Text>
            <Text style={styles.passSubtitle}>Critical allergies, chronic diagnoses & triage pass</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#0D9488" />
        </TouchableOpacity>

        {/* Verification Center (Conflicts & OCR Uncertainties) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkbox" size={18} color="#0D9488" />
            <Text style={styles.sectionTitle}>Verification & Audit Center</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Sehat Sathi flags low-confidence OCR text and conflicting records (e.g. clinic Penicillin allergy vs. hospital admission record) for patient validation.
          </Text>

          {pendingUncertainties.length === 0 ? (
            <View style={styles.allVerifiedBox}>
              <Ionicons name="checkmark-done-circle" size={20} color="#16A34A" />
              <Text style={styles.allVerifiedText}>All medical entities are verified. Zero conflicts detected.</Text>
            </View>
          ) : (
            pendingUncertainties.map((u) => (
              <View key={u.id} style={styles.uncertaintyItem}>
                <View style={styles.uHeader}>
                  <Text style={styles.uField}>{u.entity_type.toUpperCase()} • {u.field_name}</Text>
                  <View style={styles.uFlagBadge}>
                    <Text style={styles.uFlagText}>Needs Review</Text>
                  </View>
                </View>
                <Text style={styles.uReason}>{u.reason}</Text>
                {u.detected_value ? (
                  <Text style={styles.uDetected}>Detected: "{u.detected_value}"</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    setActiveUncertainty(u);
                    setResolvedValue(u.detected_value || '');
                  }}
                >
                  <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.reviewBtnText}>Confirm or Correct</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Patient-Controlled Sharing Center */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionHeader}>
              <Ionicons name="share-social" size={18} color="#0D9488" />
              <Text style={styles.sectionTitle}>Doctor Sharing Center</Text>
            </View>
            <TouchableOpacity
              style={styles.createShareButton}
              onPress={() => {
                setCreatedShareUrl(null);
                setShareModalVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createShareButtonText}>New Share Link</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionDesc}>
            Generate time-limited links for physicians. Doctors see the 2-minute clinical briefing without creating an account. Revoke access instantly anytime.
          </Text>

          {/* Real-time Notification Demo Trigger */}
          <TouchableOpacity
            style={styles.simulateNotificationBtn}
            onPress={async () => {
              await notificationService.sendDoctorAccessNotification(
                'Dr. Arvind Verma, MD',
                'Emergency Cardiology Clinic'
              );
              Alert.alert('Alert Triggered', 'Push alert sent: Dr. Arvind Verma is viewing your clinical records.');
            }}
          >
            <Ionicons name="notifications" size={14} color="#0D9488" />
            <Text style={styles.simulateNotificationText}>Test Doctor Access Push Alert</Text>
          </TouchableOpacity>

          {shareTokens.length === 0 ? (
            <View style={styles.emptyShareBox}>
              <Text style={styles.emptyShareText}>No active sharing links generated yet.</Text>
            </View>
          ) : (
            shareTokens.map((token) => {
              const isExpired = new Date(token.expires_at) < new Date();
              const isBlocked = token.is_revoked || isExpired;

              return (
                <View key={token.id} style={[styles.tokenCard, isBlocked && styles.tokenCardInactive]}>
                  <View style={styles.tokenTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tokenTitle}>{token.title}</Text>
                      <Text style={styles.tokenDoctor}>Doctor: {token.doctor_name_or_purpose || 'Consultation'}</Text>
                    </View>
                    <View style={[styles.tokenBadge, { backgroundColor: isBlocked ? '#F1F5F9' : '#DCFCE7' }]}>
                      <Text style={[styles.tokenBadgeText, { color: isBlocked ? '#64748B' : '#16A34A' }]}>
                        {token.is_revoked ? 'REVOKED (410)' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.tokenExpires}>
                    Valid until: {new Date(token.expires_at).toLocaleString()}
                  </Text>

                  {!isBlocked && (
                    <View style={styles.tokenActions}>
                      <TouchableOpacity
                        style={styles.revokeButton}
                        onPress={() => handleRevokeShare(token)}
                      >
                        <Ionicons name="lock-closed" size={14} color="#DC2626" />
                        <Text style={styles.revokeButtonText}>Revoke Access (Instant 410 Block)</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Backend API Configuration & Logout */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setServerModalVisible(true)}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="hardware-chip-outline" size={20} color="#64748B" />
              <View>
                <Text style={styles.settingsRowTitle}>Backend API Host</Text>
                <Text style={styles.settingsRowSubtitle}>{baseUrl}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Log Out from Sehat Sathi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Emergency Health Pass Modal */}
      <Modal
        visible={healthPassModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHealthPassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.passHeaderTag}>SEHAT SATHI CLINICAL PASS</Text>
                <Text style={styles.modalTitle}>{user?.full_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setHealthPassModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.healthPassBanner}>
                <Ionicons name="alert-circle" size={22} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.criticalAlertTitle}>DOCUMENTED DRUG ALLERGY</Text>
                  <Text style={styles.criticalAlertText}>
                    Penicillin (Urticarial cutaneous rash in 2018). Avoid beta-lactam antibiotics.
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age / Gender:</Text>
                <Text style={styles.detailValue}>54 Yrs / Male</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group:</Text>
                <Text style={styles.detailValue}>B+ Positive</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Emergency Contact:</Text>
                <Text style={styles.detailValue}>Anjali Sharma (+91 98765 43210)</Text>
              </View>

              <Text style={styles.subSectionTitle}>Active Chronic Conditions</Text>
              <View style={styles.conditionsPills}>
                <View style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>Essential Hypertension (Grade 1)</Text>
                </View>
                <View style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>Type 2 Diabetes Mellitus (HbA1c 7.8%)</Text>
                </View>
                <View style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>Dyslipidemia</Text>
                </View>
              </View>

              <Text style={styles.subSectionTitle}>Current Active Medications</Text>
              <View style={styles.medsBox}>
                <Text style={styles.medItem}>• Tab Telmisartan 40 mg OD (Morning)</Text>
                <Text style={styles.medItem}>• Tab Metformin SR 500 mg BD (With meals)</Text>
                <Text style={styles.medItem}>• Tab Atorvastatin 20 mg HS (Bedtime)</Text>
                <Text style={styles.medItem}>• Tab Amlodipine 5 mg OD (Evening added post-discharge)</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setHealthPassModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close Emergency Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Generate Doctor Share Link</Text>
                <Text style={styles.modalSubtitle}>Zero-trust, patient-revocable clinical access token</Text>
              </View>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {createdShareUrl ? (
              <View style={styles.createdShareBox}>
                <Ionicons name="checkmark-circle" size={44} color="#0D9488" />
                <Text style={styles.createdShareTitle}>Doctor Share Link Generated</Text>
                <Text style={styles.createdShareDesc}>
                  Share this link with your physician. They will see your 2-minute clinical summary without needing an account:
                </Text>
                <View style={styles.urlBox}>
                  <Text style={styles.urlText} selectable>{createdShareUrl}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShareModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={styles.inputGroupLabel}>Physician or Clinic Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Dr. Arvind Verma (Cardiology)"
                  placeholderTextColor="#94A3B8"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />

                <Text style={styles.inputGroupLabel}>Authorization Expiry Duration</Text>
                <View style={styles.durationRow}>
                  {[12, 24, 48, 72].map(hrs => (
                    <TouchableOpacity
                      key={hrs}
                      style={[styles.durationChip, durationHours === hrs && styles.activeDurationChip]}
                      onPress={() => setDurationHours(hrs)}
                    >
                      <Text style={[styles.durationChipText, durationHours === hrs && styles.activeDurationChipText]}>
                        {hrs} Hours
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleCreateShare}
                  disabled={creatingShare}
                >
                  {creatingShare ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate Secure Access Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Uncertainty Resolution Modal */}
      {activeUncertainty && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveUncertainty(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Resolve Medical Uncertainty</Text>
                  <Text style={styles.modalSubtitle}>Patient confirmation for audit compliance</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveUncertainty(null)}>
                  <Ionicons name="close-circle" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputGroupLabel}>Flag Reason:</Text>
                <Text style={styles.uReasonBox}>{activeUncertainty.reason}</Text>

                <Text style={styles.inputGroupLabel}>Confirmed Value:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={resolvedValue}
                  onChangeText={setResolvedValue}
                  placeholder="Enter or edit verified clinical value"
                />

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleResolveUncertainty}
                >
                  <Text style={styles.generateButtonText}>Save & Verify Field</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Server URL Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backend API Host Configuration</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.serverConfigHelp}>
                Enter the FastAPI server URL. If testing on a physical mobile phone, enter your computer's Wi-Fi IP (e.g. http://192.168.1.15:8000).
              </Text>
              <TextInput
                style={styles.modalInput}
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.generateButton}
                onPress={async () => {
                  await setBaseUrl(serverUrlInput.trim());
                  setServerModalVisible(false);
                  loadProfileData();
                }}
              >
                <Text style={styles.generateButtonText}>Save & Reconnect</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  roleTag: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  bloodTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  emergencyPassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 20,
  },
  passIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  passSubtitle: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },
  allVerifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  allVerifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  uncertaintyItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  uHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  uField: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  uFlagBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  uFlagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uReason: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
    marginBottom: 4,
  },
  uDetected: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#92400E',
    marginBottom: 8,
  },
  reviewBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  createShareButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  createShareButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyShareBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyShareText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tokenCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  tokenCardInactive: {
    opacity: 0.6,
  },
  tokenTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  tokenTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tokenDoctor: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tokenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokenBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  tokenExpires: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tokenActions: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  revokeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingsRowSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 16,
  },
  passHeaderTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 16,
  },
  healthPassBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  criticalAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  criticalAlertText: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
  },
  conditionsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  conditionChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  medsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  medItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  activeDurationChip: {
    backgroundColor: '#0D9488',
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeDurationChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  createdShareBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  createdShareTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  createdShareDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 16,
  },
  urlBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  urlText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    textAlign: 'center',
  },
  uReasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    color: '#78350F',
    fontSize: 11,
    marginBottom: 12,
  },
  serverConfigHelp: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  modalCloseButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  simulateNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 6,
  },
  simulateNotificationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
});

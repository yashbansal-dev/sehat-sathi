import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationService, PillReminder } from '../services/notifications';
import { mobileApi } from '../services/api';
import { MedicalTimelineEvent, LabResultRecord, UncertaintyRecord, ShareToken } from '../types';

interface HomeScreenProps {
  onNavigate: (tab: 'home' | 'timeline' | 'documents' | 'trends' | 'profile') => void;
  onOpenUpload: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenUpload }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<MedicalTimelineEvent[]>([]);
  const [latestLabs, setLatestLabs] = useState<any[]>([]);
  const [pendingUncertainties, setPendingUncertainties] = useState<UncertaintyRecord[]>([]);
  const [activeShares, setActiveShares] = useState<ShareToken[]>([]);
  const [pills, setPills] = useState<PillReminder[]>([]);
  const [pillAlertMsg, setPillAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    notificationService.getPills().then(setPills);
  }, []);

  const handleTogglePill = async (pillId: string) => {
    const updated = await notificationService.togglePillStatus(pillId);
    setPills(updated);
  };

  const handleTestPillAlert = async (pill: PillReminder) => {
    await notificationService.sendPillReminderNotification(pill);
    setPillAlertMsg(`🔔 Reminder notification sent for ${pill.name}`);
    setTimeout(() => setPillAlertMsg(null), 3500);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, timelineData, trendsData, uncertData, tokensData] = await Promise.all([
        mobileApi.getTimelineStats().catch(() => null),
        mobileApi.getTimeline().catch(() => []),
        mobileApi.getLabTrends().catch(() => ({})),
        mobileApi.getUncertainties().catch(() => []),
        mobileApi.getShareTokens().catch(() => []),
      ]);

      setStats(statsData);
      setRecentEvents(timelineData.slice(0, 3));
      setPendingUncertainties(uncertData.filter((u: UncertaintyRecord) => !u.resolved));
      setActiveShares(tokensData.filter((t: ShareToken) => !t.is_revoked && new Date(t.expires_at) > new Date()));

      // Extract latest lab metrics
      const labList: any[] = [];
      if (trendsData && typeof trendsData === 'object') {
        Object.entries(trendsData).forEach(([metricKey, m]: [string, any]) => {
          const points = Array.isArray(m) ? m : (m?.records || []);
          if (points && points.length > 0) {
            const latest = points[points.length - 1];
            labList.push({
              name: metricKey,
              value: latest.value !== undefined ? latest.value : (latest.raw_value || ''),
              date: latest.date || 'Recorded',
              unit: latest.unit || m?.unit || '',
              abnormal: Boolean(latest.is_abnormal),
              range: latest.reference_range || m?.reference_range || ''
            });
          }
        });
      }
      setLatestLabs(labList.slice(0, 4));
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading health summary...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Welcome Greeting Header */}
        <View style={styles.greetingHeader}>
          <View>
            <Text style={styles.welcomeSubtitle}>{t('welcome_prefix')},</Text>
            <Text style={styles.patientName}>{user?.full_name || 'Patient'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => onNavigate('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={18} color="#0D9488" />
            <Text style={styles.profileBadgeText}>Health Pass</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Alert Banner (if pending reviews) */}
        {pendingUncertainties.length > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => onNavigate('profile')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconWrapper}>
              <Ionicons name="alert" size={20} color="#B45309" />
            </View>
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>
                {pendingUncertainties.length} Item{pendingUncertainties.length > 1 ? 's' : ''} Awaiting Patient Review
              </Text>
              <Text style={styles.alertDesc}>
                OCR detected conflicting or uncertain medical values (e.g. penicillin allergy vs. hospital admission record).
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#92400E" />
          </TouchableOpacity>
        )}

        {/* Vital Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('documents')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#F0FDFA' }]}>
              <Ionicons name="document-text" size={20} color="#0D9488" />
            </View>
            <Text style={styles.statValue}>{stats?.total_documents || 0}</Text>
            <Text style={styles.statLabel}>{t('stat_documents')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('timeline')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats?.total_events || recentEvents.length}</Text>
            <Text style={styles.statLabel}>{t('stat_events')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('trends')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="trending-up" size={20} color="#DB2777" />
            </View>
            <Text style={styles.statValue}>{latestLabs.length}</Text>
            <Text style={styles.statLabel}>{t('tab_trends')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="share-social" size={20} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{activeShares.length}</Text>
            <Text style={styles.statLabel}>{t('active_tokens')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={onOpenUpload}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>{t('upload_doc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => onNavigate('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={18} color="#0F766E" />
            <Text style={styles.secondaryActionText}>{t('action_share_sub')}</Text>
          </TouchableOpacity>
        </View>

        {/* 1-Click Send Prescription to Doctor Banner */}
        <TouchableOpacity
          style={styles.oneClickHomeBanner}
          onPress={() => onNavigate('documents')}
          activeOpacity={0.85}
        >
          <View style={styles.oneClickHomeIcon}>
            <Ionicons name="flash" size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.oneClickHomeTitle}>{t('upload_and_send_1click')}</Text>
            <Text style={styles.oneClickHomeSub}>Upload Rx & instantly send 48-hour secure clinical link to doctor in 1 tap</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B45309" />
        </TouchableOpacity>

        {/* Medicine Schedule & Pill Tracker Section */}
        <View style={styles.pillCard}>
          <View style={styles.pillCardHeader}>
            <View style={styles.pillTitleRow}>
              <Ionicons name="medkit" size={20} color="#0D9488" />
              <Text style={styles.pillCardTitle}>{t('pill_tracker_title')}</Text>
            </View>
            <Text style={styles.pillCardSub}>{t('pill_tracker_sub')}</Text>
          </View>

          {pillAlertMsg && (
            <View style={styles.pillAlertPill}>
              <Ionicons name="notifications" size={14} color="#047857" />
              <Text style={styles.pillAlertPillText}>{pillAlertMsg}</Text>
            </View>
          )}

          <View style={styles.pillList}>
            {pills.map((pill) => (
              <View key={pill.id} style={[styles.pillItem, pill.taken && styles.pillItemTaken]}>
                <View style={styles.pillInfo}>
                  <View style={styles.pillNameRow}>
                    <Text style={[styles.pillName, pill.taken && styles.pillNameTaken]}>
                      {pill.name}
                    </Text>
                    <View style={styles.dosageBadge}>
                      <Text style={styles.dosageText}>{pill.dosage}</Text>
                    </View>
                  </View>
                  <Text style={styles.pillContext}>{pill.mealContext}</Text>
                  <Text style={styles.pillPurpose}>• {pill.purpose}</Text>
                </View>

                <View style={styles.pillActionCol}>
                  <TouchableOpacity
                    style={[styles.takeBtn, pill.taken ? styles.takeBtnTaken : styles.takeBtnPending]}
                    onPress={() => handleTogglePill(pill.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={pill.taken ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={pill.taken ? "#FFFFFF" : "#0F766E"} 
                    />
                    <Text style={[styles.takeBtnText, pill.taken ? styles.takeBtnTextTaken : styles.takeBtnTextPending]}>
                      {pill.taken ? t('taken') : t('mark_taken')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bellBtn}
                    onPress={() => handleTestPillAlert(pill)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="notifications-outline" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Latest Biomarkers Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="analytics" size={18} color="#0D9488" />
            <Text style={styles.sectionTitle}>Latest Lab Trajectories</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('trends')}>
            <Text style={styles.seeAllText}>View Trends &rarr;</Text>
          </TouchableOpacity>
        </View>

        {latestLabs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No laboratory measurements extracted yet.</Text>
          </View>
        ) : (
          <View style={styles.labsGrid}>
            {latestLabs.map((lab, idx) => (
              <View key={idx} style={styles.labCard}>
                <View style={styles.labHeader}>
                  <Text style={styles.labName} numberOfLines={1}>{lab.name}</Text>
                  {lab.abnormal && (
                    <View style={styles.abnormalBadge}>
                      <Text style={styles.abnormalText}>Flagged</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.labValue}>
                  {lab.value} <Text style={styles.labUnit}>{lab.unit}</Text>
                </Text>
                <Text style={styles.labDate}>Recorded: {lab.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Health History Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time" size={18} color="#0D9488" />
            <Text style={styles.sectionTitle}>Recent Health Encounters</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('timeline')}>
            <Text style={styles.seeAllText}>Full History &rarr;</Text>
          </TouchableOpacity>
        </View>

        {recentEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medical events recorded. Upload a prescription or report to start.</Text>
          </View>
        ) : (
          recentEvents.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={styles.eventCard}
              onPress={() => onNavigate('timeline')}
              activeOpacity={0.7}
            >
              <View style={styles.eventLeft}>
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDateText}>{ev.event_date}</Text>
                </View>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventTitle}>{ev.title}</Text>
                <Text style={styles.eventFacility}>{ev.facility_or_doctor || 'Medical Encounter'}</Text>
                {ev.description ? (
                  <Text style={styles.eventDesc} numberOfLines={2}>{ev.description}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Two-Minute Doctor Signature Value Banner */}
        <View style={styles.twoMinuteBanner}>
          <Ionicons name="medical-outline" size={24} color="#0D9488" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.twoMinuteTitle}>The Two-Minute Doctor Briefing</Text>
            <Text style={styles.twoMinuteText}>
              All prescriptions and test reports are synthesized into a verified 2-minute clinical digest. Doctors see the complete story with zero guesswork.
            </Text>
          </View>
        </View>

      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  alertIconWrapper: {
    marginRight: 10,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#0D9488',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700',
  },
  oneClickHomeBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  oneClickHomeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneClickHomeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  oneClickHomeSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  labsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  labCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  abnormalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  abnormalText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B91C1C',
  },
  labValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  labUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  labDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventLeft: {
    marginRight: 12,
  },
  eventDateBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventDateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  eventRight: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  eventFacility: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  twoMinuteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 10,
  },
  twoMinuteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 2,
  },
  twoMinuteText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  pillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pillCardHeader: {
    marginBottom: 12,
  },
  pillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pillCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  pillAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 6,
  },
  pillAlertPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  pillList: {
    gap: 10,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillItemTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pillInfo: {
    flex: 1,
    marginRight: 10,
  },
  pillNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pillName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillNameTaken: {
    color: '#15803D',
  },
  dosageBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dosageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  pillContext: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '500',
    marginBottom: 2,
  },
  pillPurpose: {
    fontSize: 10,
    color: '#64748B',
  },
  pillActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  takeBtnPending: {
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  takeBtnTaken: {
    backgroundColor: '#10B981',
  },
  takeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  takeBtnTextPending: {
    color: '#0F766E',
  },
  takeBtnTextTaken: {
    color: '#FFFFFF',
  },
  bellBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});

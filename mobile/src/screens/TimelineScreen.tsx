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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../services/api';
import { MedicalTimelineEvent } from '../types';

export const TimelineScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<MedicalTimelineEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activeEvent, setActiveEvent] = useState<MedicalTimelineEvent | null>(null);

  const filters = ['All', 'Visit', 'Prescription', 'Lab Test', 'Discharge', 'Diagnosis'];

  useEffect(() => {
    loadTimeline();
  }, [selectedFilter]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getTimeline(selectedFilter === 'All' ? undefined : selectedFilter);
      setEvents(data);
    } catch (e) {
      console.warn('Failed to load timeline:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTimeline();
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prescription':
        return 'medkit';
      case 'lab test':
      case 'lab':
        return 'flask';
      case 'discharge':
        return 'business';
      case 'visit':
        return 'calendar';
      case 'diagnosis':
        return 'pulse';
      default:
        return 'fitness';
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prescription':
        return '#0D9488';
      case 'lab test':
      case 'lab':
        return '#2563EB';
      case 'discharge':
        return '#7C3AED';
      case 'diagnosis':
        return '#DC2626';
      default:
        return '#0F766E';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>My Living Health History</Text>
          <Text style={styles.screenSubtitle}>Chronological record of every consultation, prescription & test</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, selectedFilter === f && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedFilter === f && styles.activeFilterChipText]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading living history...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="time-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No timeline events found</Text>
          <Text style={styles.emptySubtitle}>Upload a medical document to generate your health history</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
        >
          {events.map((ev, idx) => {
            const iconName = getEventIcon(ev.event_type);
            const color = getEventColor(ev.event_type);
            const isLast = idx === events.length - 1;

            return (
              <View key={ev.id} style={styles.timelineRow}>
                {/* Timeline Axis */}
                <View style={styles.axisColumn}>
                  <View style={[styles.axisDot, { backgroundColor: color }]}>
                    <Ionicons name={iconName as any} size={14} color="#FFFFFF" />
                  </View>
                  {!isLast && <View style={styles.axisLine} />}
                </View>

                {/* Event Card */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setActiveEvent(ev)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateText}>{ev.event_date}</Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
                      <Text style={[styles.typeText, { color }]}>{ev.event_type}</Text>
                    </View>
                  </View>

                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  
                  {ev.facility_or_doctor && (
                    <View style={styles.facilityRow}>
                      <Ionicons name="location-outline" size={13} color="#64748B" />
                      <Text style={styles.facilityText}>{ev.facility_or_doctor}</Text>
                    </View>
                  )}

                  {ev.description ? (
                    <Text style={styles.descText} numberOfLines={3}>{ev.description}</Text>
                  ) : null}

                  {ev.source_snippet ? (
                    <View style={styles.snippetBox}>
                      <Ionicons name="document-text-outline" size={12} color="#0D9488" />
                      <Text style={styles.snippetText} numberOfLines={1}>
                        Provenance: "{ev.source_snippet}"
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View style={styles.verificationBadge}>
                      <Ionicons
                        name={ev.verification_status === 'verified' ? 'checkmark-circle' : 'information-circle'}
                        size={12}
                        color={ev.verification_status === 'verified' ? '#059669' : '#D97706'}
                      />
                      <Text style={[styles.verificationText, { color: ev.verification_status === 'verified' ? '#059669' : '#D97706' }]}>
                        {ev.verification_status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.viewDetailsText}>Tap to inspect &rarr;</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Event Details Modal */}
      {activeEvent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalType}>{activeEvent.event_type}</Text>
                  <Text style={styles.modalTitle}>{activeEvent.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveEvent(null)}>
                  <Ionicons name="close-circle" size={26} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Date Recorded:</Text>
                  <Text style={styles.modalValue}>{activeEvent.event_date}</Text>
                </View>

                {activeEvent.facility_or_doctor && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Doctor / Center:</Text>
                    <Text style={styles.modalValue}>{activeEvent.facility_or_doctor}</Text>
                  </View>
                )}

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Audit Verification:</Text>
                  <Text style={styles.modalValue}>{activeEvent.verification_status}</Text>
                </View>

                {activeEvent.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>Extracted Medical Summary</Text>
                    <Text style={styles.modalSectionText}>{activeEvent.description}</Text>
                  </View>
                )}

                {activeEvent.source_snippet && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>Original Source Evidence</Text>
                    <View style={styles.snippetCallout}>
                      <Text style={styles.snippetCalloutText}>{activeEvent.source_snippet}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setActiveEvent(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close Inspector</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeFilterChip: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  axisColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  axisDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  axisLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  facilityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  descText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 8,
  },
  snippetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  snippetText: {
    fontSize: 10,
    color: '#0F766E',
    fontStyle: 'italic',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 9,
    fontWeight: '700',
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '600',
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
    maxHeight: '80%',
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
  modalType: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSection: {
    marginTop: 14,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalSectionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  snippetCallout: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
    padding: 10,
    borderRadius: 8,
  },
  snippetCalloutText: {
    fontSize: 11,
    color: '#0F766E',
    fontStyle: 'italic',
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
});

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
import { mobileApi } from '../services/api';

export const TrendsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendsData, setTrendsData] = useState<Record<string, any>>({});
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getLabTrends();
      setTrendsData(data);
      const keys = Object.keys(data);
      if (keys.length > 0 && !selectedMetric) {
        setSelectedMetric(keys[0]);
      }
    } catch (e) {
      console.warn('Failed to load lab trends:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrends();
  };

  const metrics = Object.entries(trendsData || {});

  const getPoints = (item: any): any[] => {
    if (!item) return [];
    if (Array.isArray(item)) return item;
    if (Array.isArray(item.records)) return item.records;
    return [];
  };

  const getTestName = (key: string, item: any): string => {
    return item?.test_name || key;
  };

  const getUnit = (item: any): string => {
    const points = getPoints(item);
    return item?.unit || points[0]?.unit || '';
  };

  const getRefRange = (item: any): string => {
    const points = getPoints(item);
    return item?.reference_range || points[0]?.reference_range || 'Standard range';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Laboratory Trends & Trajectories</Text>
        <Text style={styles.screenSubtitle}>
          Longitudinal comparison of biomarkers across visits, labs and hospital admissions
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading clinical trajectories...</Text>
        </View>
      ) : metrics.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="analytics-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No biomarker data available</Text>
          <Text style={styles.emptySubtitle}>Upload lab reports or prescriptions to generate trends</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
        >
          {/* Clinical Context Notice */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle" size={18} color="#0D9488" />
            <Text style={styles.noticeText}>
              Values are extracted directly from authenticated clinical reports. Normal biological ranges are shown for reference.
            </Text>
          </View>

          {/* Metric Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricPickerScroll}>
            {metrics.map(([key, item]) => {
              const isSelected = selectedMetric === key;
              const testTitle = getTestName(key, item);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.metricChip, isSelected && styles.activeMetricChip]}
                  onPress={() => setSelectedMetric(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.metricChipText, isSelected && styles.activeMetricChipText]}>
                    {testTitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Metric Detailed Trajectory View */}
          {selectedMetric && trendsData[selectedMetric] && (() => {
            const activeItem = trendsData[selectedMetric];
            const activePoints = getPoints(activeItem);
            const activeTestName = getTestName(selectedMetric, activeItem);
            const activeUnit = getUnit(activeItem);
            const activeRefRange = getRefRange(activeItem);

            return (
              <View style={styles.activeChartCard}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.chartTitle}>{activeTestName}</Text>
                    <Text style={styles.chartRefRange}>
                      Standard Reference Range: {activeRefRange} {activeUnit}
                    </Text>
                  </View>
                </View>

                {/* Trajectory Timeline List */}
                <View style={styles.recordsList}>
                  {activePoints.map((rec: any, idx: number) => {
                    const isAbnormal = Boolean(rec.is_abnormal);
                    const isLatest = idx === activePoints.length - 1;
                    const displayValue = rec.raw_value !== undefined ? rec.raw_value : (rec.value !== undefined ? rec.value : '—');
                    return (
                      <View key={idx} style={styles.recordItem}>
                        <View style={styles.recordLeft}>
                          <View style={[styles.recIndicator, isAbnormal ? styles.abnormalIndicator : styles.normalIndicator]} />
                          <View>
                            <Text style={styles.recDate}>{rec.date || 'Recorded'}</Text>
                            {isLatest && <Text style={styles.latestTag}>Latest Finding</Text>}
                          </View>
                        </View>
                        <View style={styles.recordRight}>
                          <Text style={[styles.recValue, isAbnormal && styles.abnormalText]}>
                            {displayValue}
                          </Text>
                          <Text style={styles.recUnit}>{rec.unit || activeUnit}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* All Biomarkers Summary Grid */}
          <Text style={styles.sectionHeaderTitle}>All Monitored Biomarkers</Text>
          <View style={styles.summaryGrid}>
            {metrics.map(([key, item]) => {
              const points = getPoints(item);
              const testTitle = getTestName(key, item);
              const unit = getUnit(item);
              const refRange = getRefRange(item);
              const latestRec = points.length > 0 ? points[points.length - 1] : null;
              const firstRec = points.length > 0 ? points[0] : null;
              const hasDiff = points.length > 1;

              const latestVal = latestRec ? (latestRec.raw_value !== undefined ? latestRec.raw_value : latestRec.value) : '—';
              const firstVal = firstRec ? (firstRec.raw_value !== undefined ? firstRec.raw_value : firstRec.value) : '—';

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.summaryCard}
                  onPress={() => setSelectedMetric(key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle} numberOfLines={1}>{testTitle}</Text>
                    {latestRec?.is_abnormal ? (
                      <View style={styles.warningBadge}>
                        <Text style={styles.warningBadgeText}>Elevated</Text>
                      </View>
                    ) : (
                      <View style={styles.normalBadge}>
                        <Text style={styles.normalBadgeText}>Normal</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.summaryValue}>
                    {latestVal}{' '}
                    <Text style={styles.summaryUnit}>{unit}</Text>
                  </Text>

                  {hasDiff && (
                    <Text style={styles.summaryTrendDiff}>
                      Trajectory: {firstVal} ({firstRec?.date || 'Start'}) &rarr; {latestVal} ({latestRec?.date || 'Recent'})
                    </Text>
                  )}

                  <Text style={styles.summaryRefText}>Ref: {refRange}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0F766E',
    lineHeight: 15,
  },
  metricPickerScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  metricChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeMetricChip: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  metricChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeMetricChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeChartCard: {
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
  chartHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartRefRange: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recordsList: {
    gap: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  normalIndicator: {
    backgroundColor: '#10B981',
  },
  abnormalIndicator: {
    backgroundColor: '#EF4444',
  },
  recDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  latestTag: {
    fontSize: 9,
    color: '#0D9488',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  abnormalText: {
    color: '#DC2626',
  },
  recUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  summaryGrid: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  warningBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B91C1C',
  },
  normalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  normalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  summaryTrendDiff: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryRefText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});

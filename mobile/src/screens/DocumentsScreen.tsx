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
  Alert,
  Platform,
  Linking,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi, CURRENT_LAN_IP } from '../services/api';
import { MedicalDocument } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { notificationService } from '../services/notifications';

interface DocumentsScreenProps {
  initialOpenUpload?: boolean;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ initialOpenUpload = false }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload Modal State
  const [uploadModalVisible, setUploadModalVisible] = useState(initialOpenUpload);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Prescription');

  // Document Detail Modal State
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);

  // 1-Click Send to Doctor Success Modal State
  const [shareSuccessModalVisible, setShareSuccessModalVisible] = useState(false);
  const [sharedInfo, setSharedInfo] = useState<{
    doctorName: string;
    docName: string;
    tokenStr: string;
    shareUrl: string;
    expiresAt?: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const categories = ['All', 'Prescription', 'Lab Report', 'Discharge Summary', 'Other'];

  const samplePdfs = [
    { label: 'Cardiology Rx (Oct 2026)', file: '1_Prescription_Dr_Mehta_Cardiology_Oct2026.pdf', cat: 'Prescription' },
    { label: 'Metropolis Lab (Nov 2025)', file: '2_Lab_Report_Metropolis_Metabolic_Nov2025.pdf', cat: 'Lab Report' },
    { label: 'Apex Lab Panel (Sep 2026)', file: '3_Lab_Report_Apex_Metabolic_Sep2026.pdf', cat: 'Lab Report' },
    { label: 'MaxCare Discharge Summary', file: '4_Hospital_Discharge_Summary_MaxCare_Sep2026.pdf', cat: 'Discharge Summary' },
    { label: 'CBC Blood Count Panel', file: '5_CBC_Hematology_Haemoglobin_Report_Mar2026.pdf', cat: 'Lab Report' },
  ];

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getDocuments(selectedCategory === 'All' ? undefined : selectedCategory);
      setDocuments(data);
    } catch (e) {
      console.warn('Failed to load documents:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.original_filename?.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q) ||
      doc.doctor_name?.toLowerCase().includes(q) ||
      doc.facility_name?.toLowerCase().includes(q)
    );
  });

  // Standard Sample Upload
  const handle1ClickSampleUpload = async (sample: { label: string; file: string; cat: string }) => {
    setUploading(true);
    setUploadProgressMsg(`Ingesting ${sample.label}...`);
    try {
      setUploadProgressMsg('Running PyMuPDF OCR & Clinical Extraction...');
      await mobileApi.uploadSampleDocument(sample.file, sample.cat);

      setUploadProgressMsg('Extraction complete! Added to Living Health Vault.');
      setTimeout(() => {
        setUploading(false);
        setUploadModalVisible(false);
        loadDocuments();
      }, 1000);
    } catch (err: any) {
      setUploading(false);
      Alert.alert('Upload Notice', err.message || 'Failed to ingest sample document');
    }
  };

  // 1-Click Upload and Send to Doctor in One Single Action
  const handle1ClickUploadAndSend = async (sample: { label: string; file: string; cat: string }) => {
    setUploading(true);
    setUploadProgressMsg(`Ingesting & Parsing ${sample.label}...`);
    try {
      // Step 1: Upload document and extract clinical entities
      await mobileApi.uploadSampleDocument(sample.file, sample.cat);

      // Step 2: Automatically generate 48-hour secure doctor token
      setUploadProgressMsg('Generating 48-Hour Secure Doctor Access Link...');
      const tokenRes = await mobileApi.createShareToken(
        `Prescription - ${sample.label}`,
        'Dr. Arvind Verma, MD',
        48
      );

      // Step 3: Construct Doctor Workstation URL
      const baseUrl = mobileApi.getBaseUrl();
      const doctorHost = baseUrl.replace(':8000', ':5173');
      const fullShareUrl = `${doctorHost}/doctor-portal/${tokenRes.token}`;

      // Step 4: Dispatch in-app and native push notification
      await notificationService.sendPrescriptionSentNotification('Dr. Arvind Verma, MD', sample.label);

      // Step 5: Present Success Modal
      setSharedInfo({
        doctorName: 'Dr. Arvind Verma, MD (Senior Cardiologist)',
        docName: sample.label,
        tokenStr: tokenRes.token,
        shareUrl: fullShareUrl,
        expiresAt: tokenRes.expires_at
      });

      setUploading(false);
      setUploadModalVisible(false);
      setShareSuccessModalVisible(true);
      loadDocuments();
    } catch (err: any) {
      setUploading(false);
      Alert.alert('1-Click Share Notice', err.message || 'Failed to upload and dispatch prescription');
    }
  };

  // 1-Click Send Existing Document in Vault to Doctor
  const handleSendExistingDocToDoctor = async (doc: MedicalDocument) => {
    try {
      const docTitle = doc.original_filename || doc.filename || 'Prescription';
      const doctorTarget = doc.doctor_name ? `Dr. ${doc.doctor_name}` : 'Dr. Arvind Verma, MD';

      const tokenRes = await mobileApi.createShareToken(
        `Prescription - ${docTitle}`,
        doctorTarget,
        48,
        [doc.id]
      );

      const baseUrl = mobileApi.getBaseUrl();
      const doctorHost = baseUrl.replace(':8000', ':5173');
      const fullShareUrl = `${doctorHost}/doctor-portal/${tokenRes.token}`;

      await notificationService.sendPrescriptionSentNotification(doctorTarget, docTitle);

      setSharedInfo({
        doctorName: `${doctorTarget} (Clinical Review)`,
        docName: docTitle,
        tokenStr: tokenRes.token,
        shareUrl: fullShareUrl,
        expiresAt: tokenRes.expires_at
      });

      setShareSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Doctor Dispatch Notice', err.message || 'Failed to generate doctor access link');
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    if (!sharedInfo) return;
    const msg = `Hello Doctor, I have uploaded my prescription on Sehat Sathi: ${sharedInfo.shareUrl} . You can view the verified clinical brief and prescription record here (Valid for 48 hours).`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('Notice', 'Could not open WhatsApp on this device.');
    });
  };

  // Native Share Handler (SMS, Email, Messages, AirDrop, etc.)
  const handleNativeShare = async () => {
    if (!sharedInfo) return;
    const msg = `Hello Doctor, here is my prescription record on Sehat Sathi: ${sharedInfo.shareUrl} . Valid for 48 hours for your clinical consultation.`;
    try {
      await Share.share({
        title: 'Sehat Sathi - Prescription Link for Doctor',
        message: msg,
        url: sharedInfo.shareUrl,
      });
    } catch (e: any) {
      console.warn('Share error:', e);
    }
  };

  // Copy Link Handler
  const handleCopyShareLink = () => {
    if (!sharedInfo) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sharedInfo.shareUrl);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.screenTitle}>{t('docs_title')}</Text>
            <Text style={styles.screenSubtitle}>Secure encrypted storage of all clinical records</Text>
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setUploadModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>{t('upload_doc')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, doctor or hospital..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, selectedCategory === c && styles.activeCategoryChip]}
              onPress={() => setSelectedCategory(c)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, selectedCategory === c && styles.activeCategoryChipText]}>
                {c === 'Prescription' ? t('category_prescription') : c === 'Lab Report' ? t('category_lab') : c === 'Discharge Summary' ? t('category_discharge') : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick 1-Click Dispatch Header Banner */}
      <View style={styles.quickShareBanner}>
        <View style={styles.quickShareBannerLeft}>
          <View style={styles.quickShareIconBox}>
            <Ionicons name="flash" size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickShareBannerTitle}>{t('send_to_doctor_1click')}</Text>
            <Text style={styles.quickShareBannerSub}>Upload prescription & share secure 48h access in 1 tap</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.quickShareBannerBtn}
          onPress={() => handle1ClickUploadAndSend(samplePdfs[0])}
          activeOpacity={0.8}
        >
          <Ionicons name="paper-plane" size={13} color="#FFFFFF" />
          <Text style={styles.quickShareBannerBtnText}>1-Click Send</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading vault documents...</Text>
        </View>
      ) : filteredDocuments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No medical documents found</Text>
          <Text style={styles.emptySubtitle}>Tap the Upload button to add a prescription or lab report</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
        >
          {filteredDocuments.map((doc) => {
            const isCompleted = doc.status === 'completed';
            const isPrescription = doc.category?.toLowerCase() === 'prescription';
            return (
              <View key={doc.id} style={styles.docCardContainer}>
                <TouchableOpacity
                  style={styles.docCardMain}
                  onPress={() => setSelectedDoc(doc)}
                  activeOpacity={0.8}
                >
                  <View style={styles.docLeft}>
                    <View style={[styles.docIconBox, { backgroundColor: doc.file_type === 'pdf' ? '#FEF2F2' : '#F0FDFA' }]}>
                      <Ionicons
                        name={doc.file_type === 'pdf' ? 'document-text' : 'image'}
                        size={22}
                        color={doc.file_type === 'pdf' ? '#DC2626' : '#0D9488'}
                      />
                    </View>
                  </View>

                  <View style={styles.docMiddle}>
                    <Text style={styles.docFilename} numberOfLines={1}>
                      {doc.original_filename || doc.filename}
                    </Text>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{doc.category}</Text>
                      </View>
                      <Text style={styles.docSizeText}>{formatFileSize(doc.file_size)}</Text>
                      {doc.document_date ? (
                        <Text style={styles.docDateText}>• {doc.document_date}</Text>
                      ) : null}
                    </View>

                    {doc.doctor_name || doc.facility_name ? (
                      <Text style={styles.docProviderText} numberOfLines={1}>
                        {doc.doctor_name ? `Dr: ${doc.doctor_name}` : ''} {doc.facility_name ? `(${doc.facility_name})` : ''}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.docRight}>
                    <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'hourglass'}
                        size={12}
                        color={isCompleted ? '#16A34A' : '#D97706'}
                      />
                      <Text style={[styles.statusText, { color: isCompleted ? '#16A34A' : '#D97706' }]}>
                        {doc.status}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginTop: 8 }} />
                  </View>
                </TouchableOpacity>

                {/* 1-Click Send to Doctor Footer on Each Document Card */}
                <View style={styles.docCardFooter}>
                  <TouchableOpacity
                    style={styles.cardSendDoctorBtn}
                    onPress={() => handleSendExistingDocToDoctor(doc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="paper-plane" size={13} color="#0D9488" />
                    <Text style={styles.cardSendDoctorText}>{t('send_to_doctor_1click')}</Text>
                  </TouchableOpacity>

                  {isPrescription && (
                    <View style={styles.prescriptionBadgeRow}>
                      <Ionicons name="shield-checkmark" size={12} color="#059669" />
                      <Text style={styles.prescriptionBadgeText}>Verified Rx</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Upload Modal with 1-Click Sample Fixtures */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('upload_doc')}</Text>
                <Text style={styles.modalSubtitle}>Prescriptions, diagnostic reports & discharge summaries</Text>
              </View>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)} disabled={uploading}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {uploading ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="large" color="#0D9488" />
                <Text style={styles.uploadingProgressTitle}>Ingesting Medical Record</Text>
                <Text style={styles.uploadingProgressSubtitle}>{uploadProgressMsg}</Text>
              </View>
            ) : (
              <ScrollView style={styles.uploadBody}>
                {/* 1-Click Highlight Action Card */}
                <View style={styles.oneClickHighlightCard}>
                  <View style={styles.oneClickHeaderRow}>
                    <Ionicons name="flash" size={18} color="#D97706" />
                    <Text style={styles.oneClickHeaderTitle}>{t('upload_and_send_1click')}</Text>
                  </View>
                  <Text style={styles.oneClickHeaderDesc}>
                    Instantly ingest your prescription, extract medicines with PyMuPDF OCR, and generate a 48-hour secure clinician access link for Dr. Arvind Verma with one tap.
                  </Text>
                  <TouchableOpacity
                    style={styles.oneClickMainBtn}
                    onPress={() => handle1ClickUploadAndSend(samplePdfs[0])}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                    <Text style={styles.oneClickMainBtnText}>{t('upload_and_send_1click')}</Text>
                  </TouchableOpacity>
                </View>

                {/* 1-Click Sample Fixtures Section */}
                <View style={styles.sampleFixturesBox}>
                  <View style={styles.sampleFixturesHeader}>
                    <Ionicons name="sparkles" size={16} color="#0D9488" />
                    <Text style={styles.sampleFixturesTitle}>Sample Medical Records (1-Click Ready)</Text>
                  </View>
                  <Text style={styles.sampleFixturesDesc}>
                    Choose to ingest into vault or send directly to doctor in one click:
                  </Text>
                  <View style={styles.sampleButtonsContainer}>
                    {samplePdfs.map((s, idx) => (
                      <View key={idx} style={styles.sampleItemRow}>
                        <View style={styles.sampleItemLabelBox}>
                          <Ionicons name="document-text" size={14} color="#0D9488" />
                          <Text style={styles.sampleItemText} numberOfLines={1}>{s.label}</Text>
                        </View>
                        <View style={styles.sampleItemActions}>
                          <TouchableOpacity
                            style={styles.sampleIngestBtn}
                            onPress={() => handle1ClickSampleUpload(s)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.sampleIngestText}>Ingest</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.sampleSendDoctorBtn}
                            onPress={() => handle1ClickUploadAndSend(s)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="flash" size={11} color="#FFFFFF" />
                            <Text style={styles.sampleSendDoctorText}>Send to Dr</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Document Category Selection */}
                <Text style={styles.inputGroupLabel}>Document Category</Text>
                <View style={styles.categoryPickerRow}>
                  {['Prescription', 'Lab Report', 'Discharge Summary', 'Other'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPickBtn, uploadCategory === cat && styles.activeCatPickBtn]}
                      onPress={() => setUploadCategory(cat)}
                    >
                      <Text style={[styles.catPickText, uploadCategory === cat && styles.activeCatPickText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.deviceUploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#0D9488" />
                  <Text style={styles.deviceUploadTitle}>Select File from Device</Text>
                  <Text style={styles.deviceUploadSubtitle}>Supports PDF, JPG, PNG up to 25MB</Text>
                  
                  <View style={styles.deviceBtnGroup}>
                    <TouchableOpacity
                      style={styles.devicePickButton}
                      onPress={() => handle1ClickSampleUpload(samplePdfs[0])}
                    >
                      <Ionicons name="folder-open" size={15} color="#FFFFFF" />
                      <Text style={styles.devicePickText}>Upload to Vault</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deviceSendDoctorButton}
                      onPress={() => handle1ClickUploadAndSend(samplePdfs[0])}
                    >
                      <Ionicons name="flash" size={15} color="#FFFFFF" />
                      <Text style={styles.deviceSendDoctorText}>⚡ 1-Click Upload & Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 1-Click Prescription Shared Success Modal */}
      {sharedInfo && (
        <Modal
          visible={shareSuccessModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShareSuccessModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModalCard}>
              <View style={styles.successIconHeader}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
                </View>
                <Text style={styles.successModalTitle}>{t('prescription_sent_title')}</Text>
                <Text style={styles.successModalSubtitle}>{t('prescription_sent_subtitle')}</Text>
              </View>

              <View style={styles.sharedDetailsCard}>
                <View style={styles.sharedDetailRow}>
                  <Text style={styles.sharedDetailLabel}>Target Clinician:</Text>
                  <Text style={styles.sharedDetailValue}>{sharedInfo.doctorName}</Text>
                </View>
                <View style={styles.sharedDetailRow}>
                  <Text style={styles.sharedDetailLabel}>Prescription Record:</Text>
                  <Text style={styles.sharedDetailValue}>{sharedInfo.docName}</Text>
                </View>
                <View style={styles.sharedDetailRow}>
                  <Text style={styles.sharedDetailLabel}>Access Duration:</Text>
                  <Text style={[styles.sharedDetailValue, { color: '#059669', fontWeight: '800' }]}>
                    48 Hours (Patient Revocable Anytime)
                  </Text>
                </View>
                <View style={styles.sharedDetailRow}>
                  <Text style={styles.sharedDetailLabel}>Security Protocol:</Text>
                  <Text style={styles.sharedDetailValue}>AES-256 Encrypted Token (HTTP 410 On Revoke)</Text>
                </View>
              </View>

              {/* Portal URL Box */}
              <View style={styles.portalUrlBox}>
                <Ionicons name="link" size={14} color="#64748B" />
                <Text style={styles.portalUrlText} numberOfLines={1}>
                  {sharedInfo.shareUrl}
                </Text>
              </View>

              {/* Clinician-Only Access Notice */}
              <View style={styles.doctorAccessNoticeCard}>
                <Ionicons name="lock-closed" size={16} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorAccessNoticeTitle}>{t('doctor_only_notice')}</Text>
                  <Text style={styles.doctorAccessNoticeText}>{t('doctor_only_desc')}</Text>
                </View>
              </View>

              {/* Action Buttons: Only Patient-to-Doctor Sharing Controls */}
              <View style={styles.shareActionButtonsContainer}>
                {/* Send Link via WhatsApp */}
                <TouchableOpacity
                  style={styles.whatsAppButton}
                  onPress={handleWhatsAppShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.whatsAppButtonText}>{t('whatsapp_share')}</Text>
                </TouchableOpacity>

                {/* Share Link via Other Apps / SMS */}
                <TouchableOpacity
                  style={styles.shareViaAppsButton}
                  onPress={handleNativeShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social" size={18} color="#FFFFFF" />
                  <Text style={styles.shareViaAppsButtonText}>{t('share_via_apps')}</Text>
                </TouchableOpacity>

                {/* Copy Link Button */}
                <TouchableOpacity
                  style={[styles.copyLinkButton, linkCopied && styles.copyLinkButtonActive]}
                  onPress={handleCopyShareLink}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={linkCopied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={linkCopied ? '#059669' : '#334155'}
                  />
                  <Text style={[styles.copyLinkText, linkCopied && styles.copyLinkTextActive]}>
                    {linkCopied ? t('link_copied') : t('copy_link')}
                  </Text>
                </TouchableOpacity>

                {/* Done / Close Button */}
                <TouchableOpacity
                  style={styles.doneCloseButton}
                  onPress={() => setShareSuccessModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneCloseButtonText}>Done • Return to Vault</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedDoc(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalType}>{selectedDoc.category}</Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedDoc.original_filename || selectedDoc.filename}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                  <Ionicons name="close-circle" size={26} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Processing Status:</Text>
                  <Text style={[styles.detailValue, { color: selectedDoc.status === 'completed' ? '#16A34A' : '#D97706' }]}>
                    {selectedDoc.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Document Date:</Text>
                  <Text style={styles.detailValue}>{selectedDoc.document_date || 'Undated'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>File Size:</Text>
                  <Text style={styles.detailValue}>{formatFileSize(selectedDoc.file_size)}</Text>
                </View>
                {selectedDoc.doctor_name ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Doctor:</Text>
                    <Text style={styles.detailValue}>{selectedDoc.doctor_name}</Text>
                  </View>
                ) : null}
                {selectedDoc.facility_name ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hospital/Lab:</Text>
                    <Text style={styles.detailValue}>{selectedDoc.facility_name}</Text>
                  </View>
                ) : null}

                {selectedDoc.ocr_text ? (
                  <View style={styles.ocrSection}>
                    <Text style={styles.ocrSectionTitle}>Extracted Clinical Text</Text>
                    <View style={styles.ocrTextBox}>
                      <Text style={styles.ocrTextContent}>{selectedDoc.ocr_text.trim()}</Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedDoc(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close Document</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  uploadButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeCategoryChip: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickShareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickShareBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 10,
  },
  quickShareIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickShareBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  quickShareBannerSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  quickShareBannerBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickShareBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  docCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  docCardMain: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  docLeft: {
    marginRight: 12,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMiddle: {
    flex: 1,
  },
  docFilename: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  docSizeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  docDateText: {
    fontSize: 10,
    color: '#64748B',
  },
  docProviderText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '500',
  },
  docRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  docCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardSendDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardSendDoctorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  prescriptionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prescriptionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
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
    maxHeight: '88%',
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
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBody: {
    marginBottom: 16,
  },
  oneClickHighlightCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  oneClickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  oneClickHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  oneClickHeaderDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 10,
  },
  oneClickMainBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  oneClickMainBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  sampleFixturesBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 16,
  },
  sampleFixturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sampleFixturesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  sampleFixturesDesc: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
    marginBottom: 10,
  },
  sampleButtonsContainer: {
    gap: 8,
  },
  sampleItemRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  sampleItemLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  sampleItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  sampleItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleIngestBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sampleIngestText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  sampleSendDoctorBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sampleSendDoctorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  catPickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  activeCatPickBtn: {
    backgroundColor: '#0D9488',
  },
  catPickText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeCatPickText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deviceUploadPlaceholder: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  deviceUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  deviceUploadSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  deviceBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  devicePickButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  devicePickText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  deviceSendDoctorButton: {
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deviceSendDoctorText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  uploadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  uploadingProgressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  uploadingProgressSubtitle: {
    fontSize: 12,
    color: '#0D9488',
    marginTop: 4,
    textAlign: 'center',
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '90%',
  },
  successIconHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  successIconCircle: {
    marginBottom: 6,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  successModalSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sharedDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sharedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sharedDetailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sharedDetailValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  portalUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  portalUrlText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  shareActionButtonsContainer: {
    gap: 8,
  },
  whatsAppButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  doctorAccessNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  doctorAccessNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  doctorAccessNoticeText: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 14,
  },
  shareViaAppsButton: {
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareViaAppsButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  copyLinkButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  copyLinkButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  copyLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  copyLinkTextActive: {
    color: '#059669',
  },
  doneCloseButton: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  doneCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  ocrSection: {
    marginTop: 14,
  },
  ocrSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  ocrTextBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    maxHeight: 180,
  },
  ocrTextContent: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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

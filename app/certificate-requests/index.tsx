import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { CertificateService } from '@/src/services/certificate-service';
import {
  CertificateClaimVoucherModal,
  CertificateClaimVoucherCard,
  ClaimVoucherData,
} from '@/src/components/CertificateClaimVoucherModal';

export interface CertificateType {
  id: string;
  name: string;
  badge: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  description: string;
  purpose: string;
  requirements: string[];
  processingTime: string;
  fee: string;
}

export const AVAILABLE_CERTIFICATES: CertificateType[] = [
  {
    id: 'brgy-cert',
    name: 'Barangay Certificate',
    badge: 'STANDARD',
    iconName: 'doc.text.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    description: 'Official certification issued by the Barangay verifying your identity and bona fide status as a local constituent.',
    purpose: 'Local employment, school enrollment, utility connection, government assistance, and general proof of identity.',
    requirements: ['1 Valid Government ID', 'Proof of Address (Utility Bill/Lease)', 'Active Voter / Resident Record'],
    processingTime: '1 to 2 Business Days (Same-day Digital PDF)',
    fee: '₱50.00 (Standard Document Fee)',
  },
  {
    id: 'cert-residency',
    name: 'Certificate of Residency',
    badge: 'RESIDENCY',
    iconName: 'house.fill',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    description: 'Certifies continuous physical residency in your specific Caloocan Barangay and household address.',
    purpose: 'Bank account opening, postal ID application, scholarship validation, court affidavits, and legal transactions.',
    requirements: ['1 Valid ID with Address', 'Barangay Record of Residency / Lease Contract'],
    processingTime: '1 Business Day (Instant Digital Verification)',
    fee: '₱50.00',
  },
  {
    id: 'cert-indigency',
    name: 'Certificate of Indigency',
    badge: 'FREE AID',
    iconName: 'heart.text.square.fill',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    description: 'Certifies low-income or underprivileged family status for qualifying social, educational, and medical subsidies.',
    purpose: 'DSWD AICS financial aid, PhilHealth indigent tier, hospital charity discount, and scholarship tuition exemptions.',
    requirements: ['Certificate of No Income / BIR Tax Exemption', 'Barangay Social Case Study Assessment', 'Valid ID'],
    processingTime: 'Same-day Priority Processing',
    fee: 'FREE (Statutory 100% Fee Waiver)',
  },
  {
    id: 'brgy-clearance',
    name: 'Barangay Clearance',
    badge: 'SECURITY',
    iconName: 'checkmark.shield.fill',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    description: 'Certifies that the applicant possesses no derogatory records or unresolved complaints on the Barangay blotter.',
    purpose: 'Local job requirements, PNP / NBI clearance cross-reference, business permit registration, and loan applications.',
    requirements: ['Barangay Blotter Records Clearance Check', '2 Valid Identification IDs', 'Recent 1x1 Photo'],
    processingTime: '1 to 2 Business Days',
    fee: '₱75.00',
  },
  {
    id: 'cert-good-moral',
    name: 'Certificate of Good Moral Character',
    badge: 'LEGAL',
    iconName: 'star.circle.fill',
    iconBg: '#FFEDD5',
    iconColor: '#EA580C',
    description: 'Attests to good community standing, exemplary neighborhood conduct, and absence of civil infractions.',
    purpose: 'Academic graduation honors, civil service examinations, employment vetting, and legal credentials.',
    requirements: ['Constituent in Good Standing Record', 'Voter Certification or Barangay Blotter Certificate'],
    processingTime: '2 Business Days',
    fee: '₱50.00',
  },
  {
    id: 'cert-jobseeker',
    name: 'First-Time Jobseeker Certificate',
    badge: 'RA 11261',
    iconName: 'briefcase.fill',
    iconBg: '#CCFBF1',
    iconColor: '#0D9488',
    description: 'Issued pursuant to RA 11261 (First Time Jobseekers Act) granting fee exemptions for government credentials.',
    purpose: 'Police Clearance, NBI Clearance, Barangay Clearance, Medical Certification, and initial job recruitment.',
    requirements: ['Barangay Oath of Undertaking for First Time Jobseeker', 'Proof of Graduation / Enrollment Termination', 'Valid ID'],
    processingTime: 'Same-Day Fast Track',
    fee: 'FREE (Pursuant to Republic Act 11261)',
  },
  {
    id: 'business-clearance',
    name: 'Business Clearance / Permit to Operate',
    badge: 'COMMERCIAL',
    iconName: 'building.2.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    description: 'Barangay clearance endorsing business operations within commercial, residential, or mixed-use zones.',
    purpose: 'City Hall Business Bureau Permit, DTI Registration, Sanitary Inspection, and BIR Form 1901/1903.',
    requirements: ['DTI / SEC Certificate of Registration', 'Contract of Lease / Proof of Property Ownership', 'Zoning Clearance'],
    processingTime: '2 to 3 Business Days',
    fee: '₱100.00 – ₱500.00',
  },
];

export const PURPOSE_OPTIONS = [
  'Employment (Local / Abroad)',
  'Scholarship & Educational Assistance',
  'Medical / Hospital / DSWD Assistance',
  'Bank Account Opening / Financial Loan',
  'Business Permit & Commercial Clearances',
  'Legal & Court Transactions (PAO / Affidavit)',
  'Driver’s License / Passport / NBI Application',
  'Other Personal Purposes',
];

export const CERTIFICATE_STATUS_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Request logged into registry' },
  { id: 'under_review', label: 'Under Review', desc: 'Barangay clerk evaluating records' },
  { id: 'processing', label: 'Processing', desc: 'Document generated with QR security seal' },
  { id: 'ready_release', label: 'Ready for Release', desc: 'Digital PDF available / Physical card ready' },
  { id: 'completed', label: 'Completed', desc: 'Document claimed & recorded' },
] as const;

export default function CertificateRequestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode } = useTheme();

  // Active Tab: 'apply' vs 'status'
  const [activeTab, setActiveTab] = useState<'apply' | 'status'>(
    (params.tab as any) === 'status' || (params.tab as any) === 'my_requests' ? 'status' : 'apply'
  );
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Under Review' | 'Ready for Release' | 'Completed'>('All');
  const [expandedReqId, setExpandedReqId] = useState<string | number | null>(null);

  // Digital Claim Voucher Modal State
  const [activeVoucher, setActiveVoucher] = useState<ClaimVoucherData | null>(null);

  // Wizard Steps: 1 = Choose Document, 2 = Fill Details, 3 = Review Request, 4 = Post-Submit Tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected Certificate
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null);

  // Application Form Fields
  const [applicantName, setApplicantName] = useState('Danny Espelita Jr');
  const [streetAddress, setStreetAddress] = useState('Block 12 Lot 5, Sampaguita St.');
  const [barangay, setBarangay] = useState('Barangay 171 (Bagumbong)');
  const [phone, setPhone] = useState('09171234567');
  const [email, setEmail] = useState('danny.resident@caloocan.ph');

  const [selectedPurpose, setSelectedPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [purposeDetails, setPurposeDetails] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string; uri?: string }[]>([
    { id: 'f-1', name: 'philsys_valid_id.pdf', size: '1.1 MB' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission Result State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    certificateName: string;
    requestStatus: string;
    submissionDate: string;
    processingUpdates: string;
    releaseDownloadInfo: {
      digitalDownload: string;
      pickupLocation: string;
      validity: string;
    };
  } | null>(null);

  // Sync route query parameters
  useEffect(() => {
    if (params.tab === 'status' || params.tab === 'my_requests') {
      setActiveTab('status');
    }
  }, [params.tab]);

  // Load Citizen profile & past requests
  const loadCitizen = async () => {
    try {
      const session = AuthService.getCurrentUser();
      if (session.user) {
        const u = session.user;
        setApplicantName(`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Danny Espelita Jr');
        setEmail(u.email || 'danny.resident@caloocan.ph');
        setPhone(u.mobile_number || '09171234567');
      }

      const res = await ProfileService.getProfile(session.email || undefined, session.citizen_user_id || undefined);
      if (res.status === 'success' && res.data) {
        const d = res.data;
        if (d.fullName) setApplicantName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        if (d.barangay) setBarangay(d.barangay);
        if (d.address) setStreetAddress(d.address);
      }
    } catch (err) {
      console.warn('Citizen data fetch error:', err);
    }
  };

  // Fetch submitted requests from database
  const loadMyRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const session = AuthService.getCurrentUser();
      const list = await CertificateService.getCertificateRequests(
        session.citizen_user_id || undefined,
        session.email || undefined
      );
      if (Array.isArray(list)) {
        setMyRequests(list);
      }
    } catch (err) {
      console.warn('Error fetching certificate requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadCitizen();
    loadMyRequests();
  }, [loadMyRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCitizen(), loadMyRequests()]);
    setRefreshing(false);
  }, [loadMyRequests]);

  const handleSelectCertificate = (cert: CertificateType) => {
    setSelectedCert(cert);
    setCurrentStep(2);
  };

  const handlePickDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow file access to attach supporting documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}`,
            name: asset.fileName || `supporting_doc_${prev.length + 1}.jpg`,
            size: `${Math.round((asset.fileSize || 1024 * 600) / 1024)} KB`,
            uri: asset.uri,
          },
        ]);
      }
    } catch (err) {
      console.warn('File picker error:', err);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleProceedToReview = () => {
    if (!applicantName.trim()) {
      Alert.alert('Required Field', 'Please enter applicant name.');
      return;
    }
    if (!streetAddress.trim() || !barangay.trim()) {
      Alert.alert('Required Field', 'Please enter your current address and barangay.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please provide a valid contact mobile number.');
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmitRequest = async () => {
    if (!selectedCert) return;

    setIsSubmitting(true);

    try {
      const session = AuthService.getCurrentUser();
      const res = await CertificateService.submitCertificateRequest({
        applicant_name: applicantName.trim(),
        street_address: streetAddress.trim(),
        barangay: barangay.trim(),
        contact_number: phone.trim(),
        email: email.trim(),
        certificate_type: selectedCert.name,
        purpose: selectedPurpose,
        purpose_details: purposeDetails.trim(),
        additional_notes: additionalNotes.trim(),
        citizen_user_id: session.citizen_user_id || undefined,
        uploaded_documents: uploadedFiles.map((f) => ({
          name: f.name,
          size: f.size,
          uri: f.uri,
        })),
        encoded_by: 'Citizen Mobile App',
      });

      if (res && res.data) {
        setSubmittedData({
          referenceNumber: res.data.reference_no,
          certificateName: res.data.certificate_type,
          requestStatus: `Submitted (${res.data.status})`,
          submissionDate: res.data.submission_date,
          processingUpdates:
            'Your certificate request has been transmitted directly to your Barangay Records & Civil Registry desk in CIVentral. Record validation has commenced.',
          releaseDownloadInfo: {
            digitalDownload: 'Digital e-Certificate with official cryptographic QR seal will be downloadable in the app once approved.',
            pickupLocation: res.data.pickup_location,
            validity: 'Valid for 6 Months from date of issuance',
          },
        });

        // Refresh requests queue
        await loadMyRequests();
        setCurrentStep(4);
      }
    } catch (err) {
      console.warn('Certificate submit error:', err);
      Alert.alert('Submission Error', 'Could not submit certificate request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedCert(null);
    setCurrentStep(1);
    setSubmittedData(null);
  };

  const handleOpenClaimVoucher = (req: any) => {
    const isIndigency = (req.certificate_type || '').toLowerCase().includes('indigency');
    const s = (req.status || 'Pending').toLowerCase();
    let normStatus = 'Under Review';
    if (s.includes('release') || s.includes('ready') || s.includes('print')) {
      normStatus = 'Ready for Release';
    } else if (s.includes('complet') || s.includes('claim')) {
      normStatus = 'Completed';
    }

    setActiveVoucher({
      referenceNumber: req.reference_no || `CAL-DOC-${req.request_id}`,
      certificateName: req.certificate_type || 'Barangay Certificate',
      applicantName: req.applicant_name || req.citizen_name || applicantName,
      barangay: req.barangay || barangay || 'Barangay 171',
      status: normStatus,
      submissionDate: req.created_at ? req.created_at.split(' ')[0] : (req.submission_date || 'Recent'),
      pickupLocation: req.pickup_location || `${req.barangay || barangay} Hall - Clearance & Records Counter`,
      estimatedTurnaround: isIndigency ? 'Same-Day Fast Track' : '1 to 2 Business Days',
      feeAmount: req.fee_amount ? `₱${req.fee_amount}` : (isIndigency ? '₱0.00' : '₱50.00'),
      paymentStatus: req.payment_status || (normStatus === 'Completed' || normStatus === 'Ready for Release' ? 'Paid' : (isIndigency ? 'Waived' : 'Pending')),
      validityPeriod: 'Valid for 6 Months from date of issuance',
      purpose: req.purpose || selectedPurpose,
    });
  };

  // Filter requests based on chip selection
  const filteredRequests = myRequests.filter((req) => {
    if (statusFilter === 'All') return true;
    const s = (req.status || '').toLowerCase();
    if (statusFilter === 'Under Review') {
      return s.includes('pend') || s.includes('review');
    }
    if (statusFilter === 'Ready for Release') {
      return s.includes('ready') || s.includes('approved') || s.includes('print');
    }
    if (statusFilter === 'Completed') {
      return s.includes('release') || s.includes('complet') || s.includes('claim');
    }
    return true;
  });

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#0B132B' : '#F8FAFC' },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#38BDF8' : '#2563EB'}
            colors={['#2563EB']}
          />
        }
      >
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeTab === 'status') {
              setActiveTab('apply');
            } else if (currentStep === 2) {
              setCurrentStep(1);
            } else if (currentStep === 3) {
              setCurrentStep(2);
            } else {
              router.back();
            }
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="chevron.left"
            size={16}
            color={isDarkMode ? '#38BDF8' : '#2563EB'}
          />
          <Text style={[styles.backText, isDarkMode && { color: '#38BDF8' }]}>
            {activeTab === 'status'
              ? 'Back to Certificate Services'
              : currentStep === 1
              ? 'Back to Services Directory'
              : currentStep === 2
              ? 'Change Selected Certificate'
              : 'Edit Application Details'}
          </Text>
        </TouchableOpacity>

        {/* ═══ TOP SEGMENTED SWITCHER: APPLY vs STATUS CHECK ═══ */}
        <View style={[styles.tabSegmentContainer, isDarkMode && styles.tabSegmentContainerDark]}>
          <TouchableOpacity
            style={[styles.tabSegmentButton, activeTab === 'apply' && styles.tabSegmentButtonActive]}
            onPress={() => setActiveTab('apply')}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="doc.text.fill"
              size={15}
              color={activeTab === 'apply' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
            />
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'apply' && styles.tabSegmentTextActive,
                isDarkMode && activeTab !== 'apply' && { color: '#94A3B8' },
              ]}
            >
              Request Certificate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegmentButton, activeTab === 'status' && styles.tabSegmentButtonActive]}
            onPress={() => {
              setActiveTab('status');
              loadMyRequests();
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="list.bullet.rectangle.fill"
              size={15}
              color={activeTab === 'status' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
            />
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'status' && styles.tabSegmentTextActive,
                isDarkMode && activeTab !== 'status' && { color: '#94A3B8' },
              ]}
            >
              Status Check {myRequests.length > 0 ? `(${myRequests.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 1: STATUS CHECK & MY CERTIFICATE REQUESTS               */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'status' && (
          <View style={styles.myRequestsSection}>
            {/* Banner Header */}
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <IconSymbol name="list.bullet.rectangle.fill" size={24} color="#0284C7" />
                </View>
                <Badge label="STATUS & CLAIMS" variant="info" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Certificate Requests & Status Tracker
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Track real-time evaluation, verification status, and claim vouchers for your submitted documents.
              </Text>
            </View>

            {/* Quick Status Filter Chips */}
            <View style={styles.filterChipRow}>
              {(['All', 'Under Review', 'Ready for Release', 'Completed'] as const).map((tab) => {
                const isActive = statusFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setStatusFilter(tab)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      isActive && isDarkMode && { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                        isDarkMode && !isActive && { color: '#94A3B8' },
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Loading Indicator */}
            {isLoadingRequests && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#0284C7" />
                <Text style={[styles.loadingText, isDarkMode && { color: '#94A3B8' }]}>
                  Checking latest certificate status from registry...
                </Text>
              </View>
            )}

            {/* Empty State */}
            {!isLoadingRequests && filteredRequests.length === 0 && (
              <View
                style={[
                  styles.emptyRequestsBox,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                ]}
              >
                <IconSymbol name="doc.plaintext.fill" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                <Text style={[styles.emptyRequestsTitle, isDarkMode && { color: '#F8FAFC' }]}>
                  No Certificate Requests Found
                </Text>
                <Text style={[styles.emptyRequestsDesc, isDarkMode && { color: '#94A3B8' }]}>
                  {statusFilter === 'All'
                    ? "You haven't requested any certificates or clearances yet. Tap below to start your application."
                    : `No certificate requests found under the "${statusFilter}" status filter.`}
                </Text>
                <TouchableOpacity
                  style={styles.requestNowBtn}
                  onPress={() => setActiveTab('apply')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.requestNowBtnText}>Request a Certificate Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Request Cards List */}
            {!isLoadingRequests && filteredRequests.length > 0 && (
              <View style={{ gap: 14 }}>
                {filteredRequests.map((req, idx) => {
                  const s = (req.status || '').toLowerCase();
                  const isReady = s.includes('ready') || s.includes('approved') || s.includes('print');
                  const isDone = s.includes('complet') || s.includes('release') || s.includes('claim');
                  const isRejected = s.includes('reject');

                  let badgeLabel = 'UNDER REVIEW';
                  let badgeVariant: any = 'warning';
                  if (isRejected) {
                    badgeLabel = 'REJECTED';
                    badgeVariant = 'error';
                  } else if (isDone) {
                    badgeLabel = 'RELEASED / COMPLETED';
                    badgeVariant = 'info';
                  } else if (isReady) {
                    badgeLabel = 'READY FOR RELEASE';
                    badgeVariant = 'success';
                  }

                  const reqIdKey = req.reference_no || req.request_id || idx;
                  const isExpanded = expandedReqId === reqIdKey;

                  return (
                    <View
                      key={reqIdKey}
                      style={[
                        styles.requestCard,
                        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      ]}
                    >
                      {/* Card Header */}
                      <View style={styles.requestCardHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={styles.requestRefText}>Ref: {req.reference_no || `CAL-DOC-${req.request_id}`}</Text>
                            <Text style={[styles.requestDateSmall, isDarkMode && { color: '#64748B' }]}>
                              • {req.created_at ? req.created_at.split(' ')[0] : (req.submission_date || 'Recent')}
                            </Text>
                          </View>
                          <Text style={[styles.requestTitleText, isDarkMode && { color: '#F8FAFC' }]}>
                            {req.certificate_type}
                          </Text>
                        </View>
                        <Badge label={badgeLabel} variant={badgeVariant} />
                      </View>

                      {/* Card Meta Details */}
                      <View style={[styles.requestCardMeta, isDarkMode && { backgroundColor: '#152238' }]}>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Applicant:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]}>
                            {req.applicant_name || req.citizen_name || applicantName}
                          </Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Barangay / Pickup:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]}>
                            {req.pickup_location || `${req.barangay || 'Barangay 171'} Hall Counter`}
                          </Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Purpose:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={1}>
                            {req.purpose || 'Official Registry Filing'}
                          </Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Document Fee:</Text>
                          <Text
                            style={[
                              styles.requestMetaValue,
                              {
                                color: (req.fee_amount === '0.00' || (req.certificate_type || '').includes('Indigency'))
                                  ? '#10B981'
                                  : '#0284C7',
                                fontWeight: '800',
                              },
                            ]}
                          >
                            {(req.fee_amount === '0.00' || (req.certificate_type || '').includes('Indigency'))
                              ? 'FREE (Indigency Waived)'
                              : `₱${req.fee_amount || '50.00'}`}
                          </Text>
                        </View>
                      </View>

                      {/* Ready for Release Notice Banner */}
                      {isReady && (
                        <View style={styles.readyReleaseBanner}>
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#059669" />
                          <Text style={styles.readyReleaseBannerText}>
                            Your certificate is verified & approved! Show your digital claim voucher at the Barangay counter for immediate release.
                          </Text>
                        </View>
                      )}

                      {/* Expandable Lifecycle Tracker */}
                      {isExpanded && (
                        <View style={styles.expandedTimelineSection}>
                          <Text style={[styles.timelineMiniTitle, isDarkMode && { color: '#CBD5E1' }]}>
                            Lifecycle Progression Tracking:
                          </Text>
                          <View style={styles.timelineList}>
                            {CERTIFICATE_STATUS_STAGES.map((stage, sIdx) => {
                              const isStepDone = isDone || (isReady && sIdx <= 3) || (!isDone && !isReady && sIdx <= 1);
                              const isStepCurrent =
                                (!isDone && !isReady && sIdx === 1) ||
                                (isReady && sIdx === 3) ||
                                (isDone && sIdx === 4);

                              return (
                                <View key={stage.id} style={styles.timelineRow}>
                                  <View style={styles.timelineMarkerCol}>
                                    <View
                                      style={[
                                        styles.timelineDot,
                                        isStepDone && styles.timelineDotDone,
                                        isStepCurrent && styles.timelineDotCurrent,
                                      ]}
                                    >
                                      {isStepCurrent ? <View style={styles.currentInnerDot} /> : null}
                                    </View>
                                    {sIdx < CERTIFICATE_STATUS_STAGES.length - 1 && (
                                      <View
                                        style={[
                                          styles.timelineTrack,
                                          isStepDone && styles.timelineTrackDone,
                                        ]}
                                      />
                                    )}
                                  </View>
                                  <View style={styles.timelineContentCol}>
                                    <Text
                                      style={[
                                        styles.timelineStageTitle,
                                        isStepCurrent && styles.timelineStageTitleCurrent,
                                        isDarkMode && { color: '#F8FAFC' },
                                      ]}
                                    >
                                      {stage.label}
                                    </Text>
                                    <Text style={[styles.timelineStageDesc, isDarkMode && { color: '#94A3B8' }]}>
                                      {stage.desc}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Card Action Buttons */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.cardVoucherBtn}
                          onPress={() => handleOpenClaimVoucher(req)}
                          activeOpacity={0.85}
                        >
                          <IconSymbol name="barcode.viewfinder" size={15} color="#FFFFFF" />
                          <Text style={styles.cardVoucherBtnText}>View Claim Voucher</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.cardExpandBtn, isDarkMode && { borderColor: '#3A506B', backgroundColor: '#152238' }]}
                          onPress={() => setExpandedReqId(isExpanded ? null : reqIdKey)}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            name={isExpanded ? 'chevron.up' : 'chevron.down'}
                            size={14}
                            color={isDarkMode ? '#38BDF8' : '#0284C7'}
                          />
                          <Text style={[styles.cardExpandBtnText, isDarkMode && { color: '#38BDF8' }]}>
                            {isExpanded ? 'Hide' : 'Tracker'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 2: REQUEST CERTIFICATE APPLICATION WIZARD                */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'apply' && currentStep === 1 && (
          <>
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <IconSymbol name="doc.text.fill" size={24} color="#0284C7" />
                </View>
                <Badge label="E-CLEARANCE & PERMITS" variant="info" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Certificate & Document Requests
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Request official Barangay clearances, residency certifications, indigency certificates, and official civic documents online.
              </Text>
            </View>

            <Text style={[styles.sectionHeading, isDarkMode && { color: '#F8FAFC' }]}>
              Choose the Document You Need:
            </Text>

            <View style={styles.certList}>
              {AVAILABLE_CERTIFICATES.map((cert) => (
                <TouchableOpacity
                  key={cert.id}
                  style={[
                    styles.certCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  ]}
                  onPress={() => handleSelectCertificate(cert)}
                  activeOpacity={0.85}
                >
                  <View style={styles.certCardHeader}>
                    <View style={[styles.certIconCircle, { backgroundColor: isDarkMode ? '#152238' : cert.iconBg }]}>
                      <IconSymbol name={cert.iconName as any} size={22} color={isDarkMode ? '#38BDF8' : cert.iconColor} />
                    </View>
                    <Badge label={cert.badge} variant="info" />
                  </View>

                  <Text style={[styles.certCardTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {cert.name}
                  </Text>
                  <Text style={[styles.certCardDesc, isDarkMode && { color: '#CBD5E1' }]}>
                    {cert.description}
                  </Text>

                  <View style={styles.certCardMetaRow}>
                    <View style={styles.metaPill}>
                      <IconSymbol name="clock.fill" size={12} color="#0284C7" />
                      <Text style={styles.metaPillText}>{cert.processingTime.split('(')[0].trim()}</Text>
                    </View>
                    <Text style={[styles.feePillText, isDarkMode && { color: '#38BDF8' }]}>
                      {cert.fee.split('(')[0].trim()}
                    </Text>
                  </View>

                  <View style={styles.cardSelectPrompt}>
                    <Text style={styles.selectPromptText}>Apply for Document</Text>
                    <IconSymbol name="chevron.right" size={13} color="#0284C7" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── STEP 2: CERTIFICATE DETAILS & APPLICATION FORM ── */}
        {activeTab === 'apply' && currentStep === 2 && selectedCert && (
          <>
            {/* Selected Certificate Info Card */}
            <View
              style={[
                styles.certOverviewCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: selectedCert.iconBg }]}>
                  <IconSymbol name={selectedCert.iconName as any} size={22} color={selectedCert.iconColor} />
                </View>
                <Badge label={selectedCert.badge} variant="info" />
              </View>

              <Text style={[styles.certCardTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {selectedCert.name}
              </Text>
              <Text style={[styles.certOverviewDesc, isDarkMode && { color: '#94A3B8' }]}>
                {selectedCert.description}
              </Text>

              <View style={styles.divider} />

              <Text style={[styles.miniHeading, isDarkMode && { color: '#CBD5E1' }]}>
                Document Requirements:
              </Text>
              {selectedCert.requirements.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <IconSymbol name="checkmark.circle.fill" size={14} color="#0284C7" />
                  <Text style={[styles.bulletText, isDarkMode && { color: '#94A3B8' }]}>{r}</Text>
                </View>
              ))}

              <View style={styles.summaryBar}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Processing Time</Text>
                  <Text style={styles.summaryVal}>{selectedCert.processingTime.split('(')[0].trim()}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Application Fee</Text>
                  <Text style={[styles.summaryVal, { color: selectedCert.fee.includes('FREE') ? '#10B981' : '#0284C7' }]}>
                    {selectedCert.fee.split('(')[0].trim()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Application Input Form */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.formTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Constituent Applicant Details
              </Text>

              {/* 1. Demographics */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Full Legal Name *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={applicantName}
                  onChangeText={setApplicantName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Residential Street Address *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Barangay *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={barangay}
                  onChangeText={setBarangay}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Mobile Phone *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Email Address
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* 2. Purpose of Request */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Purpose of Request *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.purposePillsScroll}>
                  {PURPOSE_OPTIONS.map((p) => {
                    const isSelected = selectedPurpose === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.purposePill,
                          isSelected && styles.purposePillActive,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                          isSelected && isDarkMode && { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                        ]}
                        onPress={() => setSelectedPurpose(p)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.purposePillText,
                            isSelected && styles.purposePillTextActive,
                            isDarkMode && { color: isSelected ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Specific Purpose Details / Company / School / Institution
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="e.g. For employment onboarding at ABC Corp / Caloocan City College"
                  placeholderTextColor="#94A3B8"
                  value={purposeDetails}
                  onChangeText={setPurposeDetails}
                />
              </View>

              {/* 3. Additional Information */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Additional Information / Special Notes
                </Text>
                <TextInput
                  style={[
                    styles.textInputArea,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="Specify any remarks, urgent request justifications, or representative pickup authorization..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                />
              </View>

              {/* 4. Supporting Documents */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Supporting Documents
                </Text>

                {uploadedFiles.map((file) => (
                  <View
                    key={file.id}
                    style={[
                      styles.fileItem,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                  >
                    <IconSymbol name="doc.fill" size={16} color="#0284C7" />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={[styles.fileName, isDarkMode && { color: '#F8FAFC' }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>{file.size}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFile(file.id)}>
                      <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    isDarkMode && { borderColor: '#0284C7', backgroundColor: '#152238' },
                  ]}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                  <Text style={[styles.uploadBtnText, isDarkMode && { color: '#38BDF8' }]}>
                    Attach Supporting Document / Valid ID
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Continue to Review Button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleProceedToReview}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>Review Certificate Application</Text>
                <IconSymbol name="arrow.right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── STEP 3: APPLICATION REVIEW & VERIFICATION ── */}
        {activeTab === 'apply' && currentStep === 3 && selectedCert && (
          <View
            style={[
              styles.reviewCard,
              isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
            ]}
          >
            <View style={styles.reviewHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <IconSymbol name="checkmark.seal.fill" size={24} color="#0284C7" />
              </View>
              <Text style={[styles.reviewTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Review & Confirm Details
              </Text>
              <Text style={[styles.reviewSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                Please confirm all statements and personal demographics before sending to your Barangay Civil Registry desk.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>DOCUMENT REQUESTED</Text>
              <Text style={[styles.reviewValPrimary, isDarkMode && { color: '#F8FAFC' }]}>
                {selectedCert.name}
              </Text>
              <Text style={[styles.reviewValSecondary, isDarkMode && { color: '#94A3B8' }]}>
                Fee: {selectedCert.fee.split('(')[0].trim()} • Processing: {selectedCert.processingTime.split('(')[0].trim()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>APPLICANT & JURISDICTION</Text>
              <View style={styles.reviewGrid}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Legal Name:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{applicantName}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Address:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{streetAddress}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Barangay:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{barangay}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Contact Number:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{phone}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Email:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>TRANSACTION DETAILS</Text>
              <View style={styles.reviewGrid}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Purpose:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{selectedPurpose}</Text>
                </View>
                {purposeDetails ? (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Institution / Details:</Text>
                    <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{purposeDetails}</Text>
                  </View>
                ) : null}
                {additionalNotes ? (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Notes:</Text>
                    <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{additionalNotes}</Text>
                  </View>
                ) : null}
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Documents Attached:</Text>
                  <Text style={[styles.reviewVal, isDarkMode && { color: '#F8FAFC' }]}>{uploadedFiles.length} file(s)</Text>
                </View>
              </View>
            </View>

            <View style={[styles.attestationBox, isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' }]}>
              <IconSymbol name="shield.lefthalf.filled" size={18} color="#0284C7" />
              <Text style={[styles.attestationText, isDarkMode && { color: '#CBD5E1' }]}>
                By transmitting this request, I swear under penalty of perjury that all information provided is true, correct, and belongs to my verified resident record.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.backStepBtnText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitFinalBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={15} color="#FFFFFF" />
                    <Text style={styles.submitFinalBtnText}>Transmit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 4: POST-SUBMISSION STATUS & DIGITAL CLAIM VOUCHER ── */}
        {activeTab === 'apply' && currentStep === 4 && submittedData && (
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.circle.fill" size={48} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Request Transmitted Successfully!
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your document request is being processed by the Barangay & City Registry.
            </Text>

            {/* Official Digital Claim Voucher Card */}
            <CertificateClaimVoucherCard
              voucherData={{
                referenceNumber: submittedData.referenceNumber,
                certificateName: submittedData.certificateName,
                applicantName: applicantName,
                barangay: barangay,
                status: 'Submitted',
                submissionDate: submittedData.submissionDate,
                pickupLocation: submittedData.releaseDownloadInfo.pickupLocation,
                estimatedTurnaround: selectedCert?.processingTime || '1 to 2 Business Days',
                feeAmount: selectedCert?.fee || '₱50.00',
                paymentStatus: selectedCert?.fee?.includes('FREE') ? 'Waived' : 'Pending',
                validityPeriod: submittedData.releaseDownloadInfo.validity,
                purpose: selectedPurpose,
              }}
            />

            {/* Actions */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.viewStatusBtn}
                onPress={() => {
                  setActiveTab('status');
                  loadMyRequests();
                }}
                activeOpacity={0.88}
              >
                <IconSymbol name="list.bullet.rectangle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.viewStatusBtnText}>Track Status in My Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>Request Another Certificate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.replace('/(tabs)/services' as any)}
                activeOpacity={0.88}
              >
                <Text style={styles.doneBtnText}>Back to Services Directory</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Global Interactive Digital Claim Voucher Modal */}
      <CertificateClaimVoucherModal
        visible={!!activeVoucher}
        voucherData={activeVoucher}
        onClose={() => setActiveVoucher(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  /* Tab Segmented Control */
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabSegmentContainerDark: {
    backgroundColor: '#152238',
    borderColor: '#3A506B',
  },
  tabSegmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabSegmentButtonActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  /* My Requests View */
  myRequestsSection: {
    width: '100%',
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyRequestsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyRequestsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyRequestsDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  requestNowBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  requestNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestRefText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.3,
  },
  requestDateSmall: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  requestTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  requestCardMeta: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  requestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestMetaLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  requestMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '65%',
    textAlign: 'right',
  },
  readyReleaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  readyReleaseBannerText: {
    fontSize: 11.5,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  expandedTimelineSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineMiniTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  cardVoucherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  cardVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  cardExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  cardExpandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  viewStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4C81',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  viewStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  /* Header & Form Styles */
  headerBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  serviceExplanation: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  certList: {
    gap: 12,
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  certCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  certIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  certCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  certCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  feePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  cardSelectPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  selectPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  certOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  certOverviewDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  miniHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  inputSublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  purposePillsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  purposePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposePillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  purposePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  purposePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  fileSize: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    marginTop: 4,
  },
  uploadBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    alignItems: 'center',
    textAlign: 'center',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  reviewSection: {
    marginVertical: 4,
  },
  reviewSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reviewValPrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewValSecondary: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  reviewGrid: {
    gap: 6,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewLabel: {
    fontSize: 12,
    color: '#64748B',
    width: '40%',
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: '58%',
    textAlign: 'right',
  },
  attestationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginVertical: 14,
  },
  attestationText: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backStepBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitFinalBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  submitFinalBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  postSubmitContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    marginBottom: 10,
  },
  postSubmitTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  postSubmitSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  anotherBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  anotherBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#0284C7',
    fontSize: 13.5,
    fontWeight: '800',
  },
  /* Timeline Elements */
  timelineList: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    width: 22,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#10B981',
  },
  timelineDotCurrent: {
    backgroundColor: '#0284C7',
  },
  currentInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timelineTrack: {
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineTrackDone: {
    backgroundColor: '#10B981',
  },
  timelineContentCol: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineStageTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineStageTitleCurrent: {
    color: '#0284C7',
    fontWeight: '800',
  },
  timelineStageDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});

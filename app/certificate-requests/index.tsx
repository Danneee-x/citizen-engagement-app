import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { CertificateService } from '@/src/services/certificate-service';

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
    description: 'Attestation of financial distress or low-income household status for obtaining government aid and medical grants.',
    purpose: 'Hospital bill discounts, PCSO/DSWD medical assistance, legal aid (PAO), and tuition assistance.',
    requirements: ['Valid ID or Barangay Endorsement', 'Assessment by Barangay Social Welfare Desk'],
    processingTime: 'Same-Day Fast Track',
    fee: 'FREE of Charge (Mandated by Law)',
  },
  {
    id: 'brgy-clearance',
    name: 'Barangay Clearance',
    badge: 'CLEARANCE',
    iconName: 'checkmark.seal.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    description: 'Clearance certifying the applicant has no pending derogatory record, blotter cases, or local ordinances violations.',
    purpose: 'Employment pre-requisite, business permit compliance, NBI clearance, gun licensing, and foreign travel.',
    requirements: ['Valid Primary ID', 'Community Tax Certificate (Cedula)', 'No Pending Blotter Record'],
    processingTime: '1 to 2 Business Days',
    fee: '₱75.00',
  },
  {
    id: 'other-cert',
    name: 'Other Available Certificates',
    badge: 'SPECIAL',
    iconName: 'doc.plaintext.fill',
    iconBg: '#F3E8FF',
    iconColor: '#7E22CE',
    description: 'Specialized barangay certifications including Good Moral Character, Solo Parent Endorsement, and Business Closure/Relocation.',
    purpose: 'Specialized legal, academic, commercial, and socio-economic support programs.',
    requirements: ['Valid Primary ID', 'Specific Supporting Documents based on requested certification'],
    processingTime: '2 to 3 Business Days',
    fee: '₱50.00 – ₱100.00',
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
  const { isDarkMode } = useTheme();

  // Active Tab: 'apply' vs 'my_requests'
  const [activeTab, setActiveTab] = useState<'apply' | 'my_requests'>('apply');
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Wizard Steps: 1 = Choose Document, 2 = Fill Details, 3 = Review Request, 4 = Post-Submit Tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected Certificate
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null);

  // Application Form Fields
  const [applicantName, setApplicantName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [occupation, setOccupation] = useState('');

  const [selectedPurpose, setSelectedPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);
  const [purposeDetails, setPurposeDetails] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string; uri?: string }[]>([]);

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

  // Load Citizen profile & verified demographics
  useEffect(() => {
    async function loadCitizen() {
      try {
        const session = AuthService.getCurrentUser();
        if (session.user) {
          const u = session.user;
          setApplicantName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
          setEmail(u.email || '');
          setPhone(u.mobile_number || '');
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

        // Prefill from verified citizen table / database
        try {
          const verifRes = await ProfileService.getVerificationStatus(
            session.citizen_user_id || undefined,
            session.email || undefined
          );
          if (verifRes?.data) {
            const vd = verifRes.data;
            if (vd.first_name && vd.last_name) {
              const full = `${vd.first_name} ${vd.middle_name ? vd.middle_name + ' ' : ''}${vd.last_name}${vd.suffix ? ' ' + vd.suffix : ''}`.trim();
              setApplicantName(full);
            }
            if (vd.birth_date) setBirthDate(vd.birth_date);
            if (vd.civil_status) setCivilStatus(vd.civil_status);
            if (vd.occupation) setOccupation(vd.occupation);
            if (vd.barangay) setBarangay(vd.barangay);
            if (vd.street_address) setStreetAddress(vd.street_address);
            if (vd.phone) setPhone(vd.phone);
          }
        } catch (ve) {
          console.warn('Verification status prefill notice:', ve);
        }

        // Load past certificate requests for My Requests tab
        try {
          const pastRequests = await CertificateService.getCertificateRequests(
            session.citizen_user_id || undefined,
            session.email || undefined
          );
          if (pastRequests && Array.isArray(pastRequests)) {
            setMyRequests(pastRequests);
          }
        } catch (re) {
          console.warn('Certificate requests load notice:', re);
        }
      } catch (err) {
        console.warn('Citizen data fetch error:', err);
      }
    }
    loadCitizen();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const session = AuthService.getCurrentUser();
    CertificateService.getCertificateRequests(
      session.citizen_user_id || undefined,
      session.email || undefined
    ).then((data) => {
      if (data && Array.isArray(data)) setMyRequests(data);
    }).finally(() => setRefreshing(false));
  }, []);

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
        allowsEditing: false,
        quality: 0.5,
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

        // Prepend to myRequests
        const newReq = {
          request_id: res.data.request_id || Date.now(),
          reference_no: res.data.reference_no,
          certificate_type: res.data.certificate_type,
          applicant_name: res.data.applicant_name,
          barangay: res.data.barangay,
          status: res.data.status || 'Pending',
          fee_amount: res.data.fee_amount || '50.00',
          payment_status: res.data.payment_status || 'Pending',
          submission_date: res.data.submission_date,
          pickup_location: res.data.pickup_location,
        };
        setMyRequests((prev) => [newReq, ...prev]);

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
            if (activeTab === 'my_requests') {
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
            {activeTab === 'my_requests'
              ? 'Back to Certificates'
              : currentStep === 1
              ? 'Back'
              : currentStep === 2
              ? 'Change Selected Certificate'
              : 'Edit Application Details'}
          </Text>
        </TouchableOpacity>

        {/* TOP SEGMENTED TOGGLE SWITCH */}
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
            style={[styles.tabSegmentButton, activeTab === 'my_requests' && styles.tabSegmentButtonActive]}
            onPress={() => setActiveTab('my_requests')}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="list.bullet.rectangle.fill"
              size={15}
              color={activeTab === 'my_requests' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
            />
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'my_requests' && styles.tabSegmentTextActive,
                isDarkMode && activeTab !== 'my_requests' && { color: '#94A3B8' },
              ]}
            >
              My Requests {myRequests.length > 0 ? `(${myRequests.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'my_requests' ? (
          <View style={styles.myRequestsSection}>
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
                My Certificate Requests
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Track real-time evaluation, verification status, and claim instructions for your submitted documents.
              </Text>
            </View>

            {myRequests.length === 0 ? (
              <View style={[styles.emptyRequestsBox, isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' }]}>
                <IconSymbol name="doc.plaintext.fill" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                <Text style={[styles.emptyRequestsTitle, isDarkMode && { color: '#F8FAFC' }]}>
                  No Certificate Requests Yet
                </Text>
                <Text style={[styles.emptyRequestsDesc, isDarkMode && { color: '#94A3B8' }]}>
                  You haven't requested any certificates or barangay clearances yet. Select a document above to submit your request.
                </Text>
                <TouchableOpacity
                  style={styles.requestNowBtn}
                  onPress={() => setActiveTab('apply')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.requestNowBtnText}>Request a Certificate Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {myRequests.map((req, idx) => {
                  const s = (req.status || '').toLowerCase();
                  const isReady = s.includes('ready') || s.includes('print');
                  const isDone = s.includes('complet') || s.includes('claim');

                  let badgeLabel = 'IN REVIEW';
                  let badgeVariant: any = 'warning';
                  if (isReady) {
                    badgeLabel = 'READY FOR RELEASE';
                    badgeVariant = 'success';
                  } else if (isDone) {
                    badgeLabel = 'COMPLETED';
                    badgeVariant = 'info';
                  }

                  return (
                    <View
                      key={req.reference_no || idx}
                      style={[
                        styles.requestCard,
                        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      ]}
                    >
                      <View style={styles.requestCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.requestRefText}>Ref: {req.reference_no}</Text>
                          <Text style={[styles.requestTitleText, isDarkMode && { color: '#F8FAFC' }]}>
                            {req.certificate_type}
                          </Text>
                        </View>
                        <Badge label={badgeLabel} variant={badgeVariant} />
                      </View>

                      <View style={[styles.requestCardMeta, isDarkMode && { backgroundColor: '#152238' }]}>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Applicant:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]}>{req.applicant_name}</Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Barangay / Pickup:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]}>{req.pickup_location || req.barangay}</Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Date Submitted:</Text>
                          <Text style={[styles.requestMetaValue, isDarkMode && { color: '#CBD5E1' }]}>{req.submission_date}</Text>
                        </View>
                        <View style={styles.requestMetaRow}>
                          <Text style={[styles.requestMetaLabel, isDarkMode && { color: '#94A3B8' }]}>Fee Amount:</Text>
                          <Text style={[styles.requestMetaValue, { color: req.fee_amount === '0.00' ? '#10B981' : '#0284C7', fontWeight: '800' }]}>
                            {req.fee_amount === '0.00' ? 'FREE (Indigency Waived)' : `₱${req.fee_amount}`}
                          </Text>
                        </View>
                      </View>

                      {isReady && (
                        <View style={styles.readyReleaseBanner}>
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#059669" />
                          <Text style={styles.readyReleaseBannerText}>
                            Your certificate is verified and ready for pickup or release at the Barangay counter.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── STEP 1: CHOOSE DOCUMENT ── */}
            {currentStep === 1 && (
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
        {currentStep === 2 && selectedCert && (
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
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {selectedCert.name}
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#CBD5E1' }]}>
                {selectedCert.description}
              </Text>

              <View style={styles.divider} />

              <View style={styles.infoSpecGrid}>
                <View style={styles.infoSpecItem}>
                  <Text style={styles.infoSpecLabel}>Purpose & Use Cases:</Text>
                  <Text style={[styles.infoSpecVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {selectedCert.purpose}
                  </Text>
                </View>

                <View style={styles.infoSpecItem}>
                  <Text style={styles.infoSpecLabel}>Standard Requirements:</Text>
                  {selectedCert.requirements.map((req, idx) => (
                    <Text key={idx} style={[styles.infoSpecBullet, isDarkMode && { color: '#CBD5E1' }]}>
                      • {req}
                    </Text>
                  ))}
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.infoSpecItem, { flex: 1 }]}>
                    <Text style={styles.infoSpecLabel}>Processing Time:</Text>
                    <Text style={[styles.infoSpecVal, { color: '#0284C7', fontWeight: '800' }, isDarkMode && { color: '#38BDF8' }]}>
                      {selectedCert.processingTime}
                    </Text>
                  </View>

                  <View style={[styles.infoSpecItem, { flex: 1 }]}>
                    <Text style={styles.infoSpecLabel}>Applicable Fee:</Text>
                    <Text style={[styles.infoSpecVal, { color: '#16A34A', fontWeight: '800' }]}>
                      {selectedCert.fee}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Application Form */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Application Form
              </Text>

              {/* 1. Applicant Information */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Applicant Full Name *
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
                  Current Residential Address *
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
                    Date of Birth
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Civil Status
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={civilStatus}
                    onChangeText={setCivilStatus}
                    placeholder="e.g. Single / Married"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Occupation / Employment
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={occupation}
                  onChangeText={setOccupation}
                  placeholder="e.g. Employee / Self-Employed"
                  placeholderTextColor="#94A3B8"
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

                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                  ]}
                  onPress={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownButtonText, isDarkMode && { color: '#F8FAFC' }]}>
                    {selectedPurpose}
                  </Text>
                  <IconSymbol
                    name={isPurposeDropdownOpen ? "chevron.up" : "chevron.down"}
                    size={16}
                    color={isDarkMode ? '#38BDF8' : '#2563EB'}
                  />
                </TouchableOpacity>

                {isPurposeDropdownOpen && (
                  <View style={[styles.dropdownList, isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' }]}>
                    {PURPOSE_OPTIONS.map((p) => {
                      const isSelected = selectedPurpose === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            isDarkMode && isSelected && { backgroundColor: '#1E293B' },
                          ]}
                          onPress={() => {
                            setSelectedPurpose(p);
                            setIsPurposeDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                              isDarkMode && { color: isSelected ? '#38BDF8' : '#CBD5E1' },
                            ]}
                          >
                            {p}
                          </Text>
                          {isSelected && (
                            <IconSymbol name="checkmark" size={15} color="#0284C7" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
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

                {uploadedFiles.length > 0 && (
                  <View style={styles.filesList}>
                    {uploadedFiles.map((f) => (
                      <View
                        key={f.id}
                        style={[
                          styles.fileItem,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                        ]}
                      >
                        <IconSymbol name="doc.fill" size={16} color="#0284C7" />
                        <Text style={[styles.fileName, isDarkMode && { color: '#F8FAFC' }]} numberOfLines={1}>
                          {f.name} ({f.size})
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveFile(f.id)}>
                          <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadTrigger,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                  ]}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                  <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                    Attach Additional Document (PDF/JPG)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* NEXT: REVIEW REQUEST */}
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleProceedToReview}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionText}>Review Request</Text>
                <IconSymbol name="arrow.right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── STEP 3: REVIEW REQUEST ── */}
        {currentStep === 3 && selectedCert && (
          <View style={styles.reviewContainer}>
            <View
              style={[
                styles.reviewCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.reviewHeaderRow}>
                <IconSymbol name="checkmark.circle.fill" size={22} color="#0284C7" />
                <Text style={[styles.reviewHeading, isDarkMode && { color: '#F8FAFC' }]}>
                  Review Document Request
                </Text>
              </View>
              <Text style={[styles.reviewSub, isDarkMode && { color: '#94A3B8' }]}>
                Please confirm the accuracy of your request details before submitting.
              </Text>

              <View style={styles.divider} />

              <View style={styles.reviewSummaryBlock}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Requested Document:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#38BDF8' }]}>
                    {selectedCert.name}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Applicant Name:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {applicantName}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Address & Barangay:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {streetAddress}, {barangay}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Contact Number:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {phone}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Purpose of Request:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {selectedPurpose} {purposeDetails ? `(${purposeDetails})` : ''}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Attached Documents:</Text>
                  <Text style={[styles.summaryVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {uploadedFiles.length} file(s) attached
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Processing Fee:</Text>
                  <Text style={[styles.summaryVal, { color: '#16A34A', fontWeight: '800' }]}>
                    {selectedCert.fee}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 4: AFTER SUBMISSION TRACKING ── */}
        {currentStep === 4 && submittedData && (
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Request Submitted Successfully
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your document request is being processed by the Barangay & City Registry.
            </Text>

            {/* Reference Number & Status Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Reference Number</Text>
                <Badge label="IN REVIEW" variant="warning" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Document Type:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.certificateName}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submission Date:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.submissionDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Request Status:</Text>
                <Text style={[styles.metaVal, { color: '#D97706', fontWeight: '800' }]}>
                  {submittedData.requestStatus}
                </Text>
              </View>
            </View>

            {/* Processing Updates Card */}
            <View
              style={[
                styles.updateCard,
                isDarkMode && { backgroundColor: '#152238', borderColor: '#0284C7' },
              ]}
            >
              <View style={styles.updateHeaderRow}>
                <IconSymbol name="bell.fill" size={16} color="#0284C7" />
                <Text style={[styles.updateHeading, isDarkMode && { color: '#38BDF8' }]}>
                  Processing Updates
                </Text>
              </View>
              <Text style={[styles.updateText, isDarkMode && { color: '#CBD5E1' }]}>
                {submittedData.processingUpdates}
              </Text>
            </View>

            {/* Release & Download Information Card */}
            <View
              style={[
                styles.claimCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.updateHeaderRow}>
                <IconSymbol name="arrow.down.doc.fill" size={16} color="#10B981" />
                <Text style={[styles.updateHeading, { color: '#10B981' }]}>
                  Release & Download Information
                </Text>
              </View>

              <View style={styles.claimGrid}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Digital Download:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.releaseDownloadInfo.digitalDownload}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Physical Pickup:</Text>
                  <Text style={[styles.claimVal, { color: '#0284C7', fontWeight: '700' }, isDarkMode && { color: '#38BDF8' }]}>
                    {submittedData.releaseDownloadInfo.pickupLocation}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Validity Period:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#CBD5E1' }]}>
                    {submittedData.releaseDownloadInfo.validity}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Progression Timeline */}
            <View
              style={[
                styles.timelineCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.timelineHeading, isDarkMode && { color: '#F8FAFC' }]}>
                Document Lifecycle Tracking
              </Text>
              <Text style={[styles.timelineSubheading, isDarkMode && { color: '#94A3B8' }]}>
                Submitted → Under Review → Processing → Ready for Release → Completed
              </Text>

              <View style={styles.timelineList}>
                {CERTIFICATE_STATUS_STAGES.map((stage, idx) => {
                  const isDone = idx === 0;
                  const isCurrent = idx === 1;
                  return (
                    <View key={stage.id} style={styles.timelineRow}>
                      <View style={styles.timelineMarkerCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone && styles.timelineDotDone,
                            isCurrent && styles.timelineDotCurrent,
                          ]}
                        >
                          {isDone ? (
                            <IconSymbol name="checkmark" size={11} color="#FFFFFF" />
                          ) : isCurrent ? (
                            <View style={styles.currentInnerDot} />
                          ) : null}
                        </View>
                        {idx < CERTIFICATE_STATUS_STAGES.length - 1 && (
                          <View
                            style={[
                              styles.timelineTrack,
                              isDone && styles.timelineTrackDone,
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.timelineContentCol}>
                        <Text
                          style={[
                            styles.stageTitle,
                            (isDone || isCurrent) && styles.stageTitleActive,
                            isDarkMode && { color: isDone || isCurrent ? '#F8FAFC' : '#64748B' },
                          ]}
                        >
                          {stage.label}
                          {isDone && ' ✓'}
                          {isCurrent && ' (In Progress)'}
                        </Text>
                        <Text style={[styles.stageDesc, isDarkMode && { color: '#94A3B8' }]}>
                          {stage.desc}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.viewStatusBtn}
                onPress={() => {
                  setActiveTab('my_requests');
                  setCurrentStep(1);
                  setSubmittedData(null);
                }}
                activeOpacity={0.88}
              >
                <IconSymbol name="list.bullet.rectangle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.viewStatusBtnText}>View in My Requests</Text>
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
                onPress={() => router.back()}
                activeOpacity={0.88}
              >
                <Text style={styles.doneBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  certCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  certIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  certCardDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  certCardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0284C7',
  },
  feePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  cardSelectPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  selectPromptText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },

  /* Step 2 Overview */
  certOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoSpecGrid: {
    gap: 10,
  },
  infoSpecItem: {
    marginBottom: 2,
  },
  infoSpecLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  infoSpecVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 18,
  },
  infoSpecBullet: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputSublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 75,
    textAlignVertical: 'top',
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  purposePillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  purposePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  purposePillTextActive: {
    color: '#FFFFFF',
  },
  filesList: {
    gap: 8,
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  fileName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  uploadTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  uploadTriggerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  primaryActionBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },

  /* Review Screen */
  reviewContainer: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewSub: {
    fontSize: 12.5,
    color: '#64748B',
  },
  reviewSummaryBlock: {
    gap: 10,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
    width: '40%',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    width: '58%',
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Post-Submit Result */
  postSubmitContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  postSubmitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  postSubmitSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  refCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  refTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  refCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  refCardNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  refDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  updateCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  updateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  updateHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  updateText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  claimCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  claimGrid: {
    gap: 8,
    marginTop: 6,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    width: '40%',
  },
  claimVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    width: '58%',
    textAlign: 'right',
  },
  timelineCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  timelineSubheading: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 15,
  },
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
    flex: 1,
    minHeight: 22,
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
  stageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 1,
  },
  stageTitleActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  stageDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
  },
  anotherBtn: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  anotherBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
  /* Dropdown Styles */
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  /* My Requests View */
  myRequestsSection: {
    width: '100%',
  },
  emptyRequestsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyRequestsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyRequestsDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  requestNowBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  requestNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 2,
  },
  requestTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  requestCardMeta: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  requestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestMetaLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  requestMetaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '65%',
    textAlign: 'right',
  },
  readyReleaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  readyReleaseBannerText: {
    fontSize: 11.5,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
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
});

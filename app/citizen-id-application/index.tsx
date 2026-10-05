import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol, IconSymbolName } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService, API_BASE_URL } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { IdIssuanceService, IdApplicationRecord } from '@/src/services/id-issuance-service';

export interface IdCategoryOption {
  id: string;
  name: string;
  fullTitle: string;
  badgeLabel: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'neutral' | 'danger';
  icon: IconSymbolName;
  iconBg: string;
  iconColor: string;
  issuingBureau: string;
  description: string;
  keyBenefits: string[];
  primaryDocName: string;
  primaryDocDesc: string;
  supportDocName: string;
  supportDocDesc: string;
  claimOffice: string;
  estimatedTurnaround: string;
  refPrefix: string;
}

export const ID_CATEGORIES: IdCategoryOption[] = [
  {
    id: 'citizen_id',
    name: 'Citizen ID',
    fullTitle: 'Caloocan Citizen Unified ID Card',
    badgeLabel: 'CITY-WIDE RESIDENT',
    badgeVariant: 'info',
    icon: 'creditcard.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    issuingBureau: 'Caloocan Civil Registry & Identity Management Bureau',
    description: 'Official unified resident card providing digital & physical identity across all Caloocan City government offices, public health programs, and welfare portals.',
    keyBenefits: [
      'Universal access to Caloocan City e-services & public health',
      'Priority access to municipal livelihood programs and city fairs',
      'Unified cryptographic QR credential for streamlined City Hall processing',
    ],
    primaryDocName: 'Valid Identification Document',
    primaryDocDesc: 'PhilSys National ID, UMID, Driver License, Passport, or PSA Birth Certificate',
    supportDocName: 'Proof of Caloocan Address',
    supportDocDesc: 'Barangay Certificate of Residency, Utility Bill, or Lease Contract',
    claimOffice: 'Caloocan Main City Hall / Extension - Civil Registry Release Window 6',
    estimatedTurnaround: '3 to 5 Business Days',
    refPrefix: 'CAL-CIT',
  },
  {
    id: 'barangay_id',
    name: 'Barangay ID',
    fullTitle: 'Barangay Resident Identification Card',
    badgeLabel: 'LOCAL BARANGAY',
    badgeVariant: 'neutral',
    icon: 'house.fill',
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    issuingBureau: 'Respective Barangay Executive Office & Secretariat',
    description: 'Community-level official identification proving active residency in your local barangay. Essential for barangay clearances, community dispute filing, and local aid distribution.',
    keyBenefits: [
      'Official proof of residency for transactions within your local barangay',
      'Expedited issuance of Barangay Clearance & Certificate of Indigency',
      'Priority inclusion in local community aid and calamity relief distributions',
    ],
    primaryDocName: 'Proof of Identity / Birth Document',
    primaryDocDesc: 'PSA Birth Certificate or any existing Government/School/Company ID',
    supportDocName: 'Proof of Barangay Residency (Min 6 Months)',
    supportDocDesc: 'Barangay Clearance Stub, Utility Bill under applicant name, or Landlord Certification',
    claimOffice: 'Local Barangay Hall - Administrative Records Desk',
    estimatedTurnaround: '1 to 2 Business Days',
    refPrefix: 'CAL-BRGY',
  },
  {
    id: 'solo_parent_id',
    name: 'Solo Parent ID',
    fullTitle: 'Solo Parent Welfare Identification Card (RA 11861)',
    badgeLabel: 'WELFARE & SUBSIDY',
    badgeVariant: 'warning',
    icon: 'person.2.fill',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    issuingBureau: 'City Social Welfare & Development Office (CSWDO) - Solo Parent Welfare Desk',
    description: 'Special welfare card granted under the Expanded Solo Parents Welfare Act (RA 11861), providing comprehensive social assistance, financial subsidies, leave benefits, and discounts.',
    keyBenefits: [
      'Monthly cash subsidy (Php 1,000 for minimum-wage & low-income solo parents)',
      '10% discount and VAT exemption on baby milk, food, diapers & prescribed medicines',
      '7 days paid parental leave from work & prioritization in educational scholarships',
    ],
    primaryDocName: "Dependent Child's PSA Birth Certificate(s)",
    primaryDocDesc: 'PSA Birth Certificate of child/children below 22 years old under your sole parental care',
    supportDocName: 'Barangay Solo Parent Certificate & Affidavit',
    supportDocDesc: 'Barangay Solo Parent Certification and Affidavit of Solo Parenthood / Custody',
    claimOffice: 'Caloocan CSWDO Office - Solo Parent Welfare Section (City Hall Complex)',
    estimatedTurnaround: '5 to 7 Business Days',
    refPrefix: 'CAL-SP',
  },
  {
    id: 'pwd_id',
    name: 'PWD ID',
    fullTitle: 'Persons with Disability Card (Republic Act 10754)',
    badgeLabel: 'DISABILITY PRIVILEGE',
    badgeVariant: 'info',
    icon: 'figure.roll',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    issuingBureau: 'Persons with Disability Affairs Office (PDAO)',
    description: 'Official PWD Identification Card issued pursuant to RA 10754 and RA 7277, granting essential discounts, healthcare privileges, and tax exemptions for persons with disabilities.',
    keyBenefits: [
      '20% discount & VAT exemption on medicines, hospitalization & doctor consultations',
      '20% discount on land/air/sea transport, food dining, groceries, and hotel lodging',
      'Dedicated express lanes in all government agencies and private commercial counters',
    ],
    primaryDocName: 'Clinical Medical Certificate / Disability Assessment',
    primaryDocDesc: 'Official medical certificate or clinical assessment form signed by a licensed physician with license number',
    supportDocName: 'Proof of Caloocan Residency & Identity',
    supportDocDesc: 'Barangay Residency Certificate & Valid ID / PSA Birth Certificate',
    claimOffice: 'Persons with Disability Affairs Office (PDAO) Counter - City Hall Ground Floor',
    estimatedTurnaround: '3 to 5 Business Days',
    refPrefix: 'CAL-PWD',
  },
  {
    id: 'senior_citizen_id',
    name: 'Senior Citizen ID',
    fullTitle: 'OSCA Senior Citizen Card (Republic Act 9994)',
    badgeLabel: 'AGE 60+ BENEFIT',
    badgeVariant: 'success',
    icon: 'star.fill',
    iconBg: '#FCE7F3',
    iconColor: '#BE185D',
    issuingBureau: 'Office of Senior Citizens Affairs (OSCA)',
    description: 'Official OSCA identification card for Caloocan residents aged 60 years and above, entitling seniors to statutory discounts, medical care, free cinema passes, and social pensions.',
    keyBenefits: [
      '20% discount & VAT exemption on medicines, basic groceries, transport & dining',
      'Free admission to all movie cinemas within Caloocan City on designated weekdays',
      'Automatic PhilHealth coverage, free vaccines & annual social pension programs',
    ],
    primaryDocName: 'Proof of Age 60+ (Birth Certificate or Valid ID)',
    primaryDocDesc: 'PSA Birth Certificate, Valid Philippine Passport, or Voter Certification confirming age 60 or above',
    supportDocName: 'Barangay Certificate of Residency',
    supportDocDesc: 'Barangay Certificate certifying at least 6 months continuous residence in Caloocan',
    claimOffice: 'Office of Senior Citizens Affairs (OSCA) Main Building - Caloocan City Complex',
    estimatedTurnaround: '2 to 4 Business Days',
    refPrefix: 'CAL-SR',
  },
];

export const APPLICATION_TYPES = [
  { id: 'New Application', label: 'New Application', desc: 'First time applicant for this identification card' },
  { id: 'Renewal', label: 'Renewal', desc: 'Renew an expiring or expired identification card' },
  { id: 'Replacement', label: 'Replacement', desc: 'Replace lost, damaged, stolen, or updated ID card' },
] as const;

export const REPLACEMENT_REASONS = [
  { id: 'Lost', label: 'Lost', desc: 'Affidavit of Loss required upon claiming' },
  { id: 'Damaged', label: 'Damaged', desc: 'Surrender damaged ID upon release' },
  { id: 'Stolen', label: 'Stolen', desc: 'Police blotter or incident report required' },
  { id: 'Personal information correction', label: 'Personal information correction', desc: 'Supporting civil registry document required' },
] as const;

export const PWD_DISABILITY_TYPES = [
  'Orthopedic / Mobility Disability',
  'Visual / Low Vision',
  'Hearing / Speech Impairment',
  'Psychosocial / Mental Health Condition',
  'Intellectual / Learning Disability',
  'Chronic Illness / Cancer / Rare Disease',
] as const;

export const SOLO_PARENT_CATEGORIES = [
  'Unmarried Mother / Father with Custody',
  'Widow / Widower',
  'Abandoned by Spouse (>6 Months)',
  'Spouse Incarcerated / Sentenced',
  'Legal Separation / Nullity of Marriage',
  'Guardian / Relative Caring for Abandoned Child',
] as const;

export const RESIDENCY_YEARS = [
  'Less than 1 year',
  '1 - 2 years',
  '3 - 5 years',
  '6 - 10 years',
  '10+ years',
  'Since Birth',
] as const;

export const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-', 'Unknown'] as const;

export const CITIZEN_ID_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Application filed online' },
  { id: 'under_review', label: 'Document Review', desc: 'Issuing bureau evaluating documents' },
  { id: 'processing', label: 'Processing & Verification', desc: 'Registry clearance & credential coding' },
  { id: 'ready_release', label: 'Ready for Release', desc: 'Available at designated release desk' },
  { id: 'completed', label: 'Completed', desc: 'ID Card claimed & activated' },
] as const;

export const detectDistrictFromBarangay = (bgy: string): string => {
  if (!bgy) return 'District 1';
  const match = bgy.match(/(?:Barangay|Brgy\.?)\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 131) return 'District 2';
    if (num >= 132 && num <= 177) return 'District 1';
    if (num >= 178) return 'District 3';
  }
  return 'District 1';
};

export const getCategoryForApp = (catId: string): IdCategoryOption => {
  return ID_CATEGORIES.find((c) => c.id === catId) || ID_CATEGORIES[0];
};

export const getIdStageIndex = (status: string): number => {
  const s = (status || '').toLowerCase();
  if (s.includes('rejected')) return -1;
  if (s.includes('claim')) return 4;
  if (s.includes('ready')) return 3;
  if (s.includes('approv') || s.includes('process')) return 2;
  if (s.includes('under review') || s.includes('evaluat')) return 1;
  return 0;
};

export const getStatusBadgeInfo = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('reject')) {
    return { label: 'REJECTED', variant: 'danger' as const, color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' };
  }
  if (s.includes('claim')) {
    return { label: 'CLAIMED', variant: 'neutral' as const, color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' };
  }
  if (s.includes('ready')) {
    return { label: 'READY FOR RELEASE', variant: 'info' as const, color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' };
  }
  if (s.includes('approv')) {
    return { label: 'APPROVED', variant: 'success' as const, color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' };
  }
  if (s.includes('under review')) {
    return { label: 'UNDER REVIEW', variant: 'info' as const, color: '#0284C7', bg: '#E0F2FE', border: '#7DD3FC' };
  }
  return { label: 'PENDING REVIEW', variant: 'warning' as const, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
};

export default function IdIssuanceApplicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; tab?: string }>();
  const { isDarkMode } = useTheme();

  // Tab Navigation: 'apply' (Apply for ID) or 'status' (My Applications & Status)
  const [activeTab, setActiveTab] = useState<'apply' | 'status'>((params.tab as any) === 'status' ? 'status' : 'apply');

  // Selected ID Category State (null = show Selection list; string = open that ID application form)
  const [selectedId, setSelectedId] = useState<string | null>(params.id || null);

  // Live Applications tracking state
  const [applications, setApplications] = useState<IdApplicationRecord[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  // Application Type State
  const [appType, setAppType] = useState<string>(APPLICATION_TYPES[0].id);
  const [replacementReason, setReplacementReason] = useState<string>(REPLACEMENT_REASONS[0].id);
  const [replacementDetails, setReplacementDetails] = useState('');
  const [oldIdNumber, setOldIdNumber] = useState('');

  // Citizen Information State
  /**
   * Sanitizes personal names and text fields (first, middle, last name, suffix, civil status, etc.)
   * Strictly blocks all numbers (0-9) and special characters (!@#$%^&* etc.).
   * Allows only alphabetic letters (including Filipino / Spanish characters like ñ, Ñ),
   * spaces, and standard name punctuation (period, hyphen, apostrophe).
   */
  const sanitizePersonalName = (val: string): string => {
    return val.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s\.\-']/g, '');
  };

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Single');

  // ID-Specific Custom Fields State
  // PWD specific
  const [disabilityType, setDisabilityType] = useState<string>(PWD_DISABILITY_TYPES[0]);
  const [physicianName, setPhysicianName] = useState('');
  const [physicianLicense, setPhysicianLicense] = useState('');
  // Solo Parent specific
  const [soloParentCategory, setSoloParentCategory] = useState<string>(SOLO_PARENT_CATEGORIES[0]);
  const [dependentCount, setDependentCount] = useState('1');
  const [childrenDetails, setChildrenDetails] = useState('');
  // Senior Citizen specific
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bloodType, setBloodType] = useState<string>('O+');
  const [isPensioner, setIsPensioner] = useState('Yes (SSS / GSIS)');
  // Barangay ID specific
  const [residencyLength, setResidencyLength] = useState<string>(RESIDENCY_YEARS[2]);
  const [purokZone, setPurokZone] = useState('');
  const [housingStatus, setHousingStatus] = useState('Homeowner');
  // Citizen ID specific
  const [occupation, setOccupation] = useState('');
  const [philsysNumber, setPhilsysNumber] = useState('');

  // Address & Barangay State
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [district, setDistrict] = useState<string>('District 1');

  // Contact Information State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Requirements Upload State
  const [idDocFile, setIdDocFile] = useState<{ name: string; size: string } | null>(null);
  const [supportDocFile, setSupportDocFile] = useState<{ name: string; size: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<{ name: string; size: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    idCategory: IdCategoryOption;
    applicationStatus: string;
    submissionDate: string;
    applicationType: string;
    processingUpdates: string;
    releaseClaimInfo: {
      claimCenter: string;
      estimatedDays: string;
      claimRequirements: string;
    };
  } | null>(null);

  const activeCategory = ID_CATEGORIES.find((c) => c.id === selectedId) || null;

  // Fetch applications for status tracking
  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const session = AuthService.getCurrentUser();
      const list = await IdIssuanceService.getMyApplications(
        session?.citizen_user_id || session?.user?.citizen_user_id,
        session?.email || session?.user?.email
      );
      setApplications(list);
    } catch (err) {
      console.warn('Failed to fetch ID applications:', err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchApplications();
  }, []);

  // Sync route query parameters
  useEffect(() => {
    if (params.tab === 'status') {
      setActiveTab('status');
    } else if (params.id) {
      setActiveTab('apply');
    }
  }, [params.tab, params.id]);

  // Auto-select if passed in query param
  useEffect(() => {
    if (params.id && ID_CATEGORIES.some((c) => c.id === params.id)) {
      setSelectedId(params.id);
    }
  }, [params.id]);

  // Pre-load Citizen details
  useEffect(() => {
    async function loadCitizen() {
      try {
        const session = AuthService.getCurrentUser();
        if (session.user) {
          const u = session.user;
          if (u.first_name) setFirstName(sanitizePersonalName(u.first_name));
          if (u.middle_name) setMiddleName(sanitizePersonalName(u.middle_name));
          if (u.last_name) setLastName(sanitizePersonalName(u.last_name));
          if (u.suffix) setSuffix(sanitizePersonalName(u.suffix));
          if (u.email) setEmail(u.email);
          if (u.mobile_number) setPhone(u.mobile_number);
        }

        const res = await ProfileService.getProfile(session.email || undefined, session.citizen_user_id || undefined);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          if (d.birthDate) setBirthDate(d.birthDate);
          if (d.civilStatus) setCivilStatus(sanitizePersonalName(d.civilStatus));
          if (d.barangay) {
            setBarangay(d.barangay);
            setDistrict(detectDistrictFromBarangay(d.barangay));
          }
          if ((d as any).district) {
            setDistrict((d as any).district);
          }
          if (d.address) setStreetAddress(d.address);
        }
      } catch (err) {
        console.warn('Citizen data fetch error:', err);
      }
    }
    loadCitizen();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchApplications().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const handlePickDocument = async (type: 'id' | 'support' | 'photo') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow file access to attach documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const doc = {
          name: asset.fileName || `${type}_document_${Date.now()}.jpg`,
          size: `${Math.round((asset.fileSize || 1024 * 500) / 1024)} KB`,
        };

        if (type === 'id') setIdDocFile(doc);
        if (type === 'support') setSupportDocFile(doc);
        if (type === 'photo') setPhotoFile(doc);
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  const handleSubmitApplication = async () => {
    if (!activeCategory) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your complete legal name.');
      return;
    }
    const invalidPattern = /[0-9!@#$%^&*()_+=\[\]{};:"\\|<>/?`~]/;
    if (invalidPattern.test(firstName) || invalidPattern.test(lastName) || invalidPattern.test(middleName) || invalidPattern.test(suffix)) {
      Alert.alert('Invalid Name', 'Personal information (names) cannot contain numbers or special characters.');
      return;
    }
    if (!streetAddress.trim() || !barangay.trim()) {
      Alert.alert('Required Field', 'Please provide your current Caloocan street address and barangay.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please provide a valid mobile contact number.');
      return;
    }
    if (!idDocFile) {
      Alert.alert('Missing Requirement', `Please upload your ${activeCategory.primaryDocName}.`);
      return;
    }
    if (!photoFile) {
      Alert.alert('Missing Requirement', 'Please upload your 2x2 ID photo with a white background.');
      return;
    }

    setIsSubmitting(true);

    const ref = `${activeCategory.refPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr =
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let dynamicClaimReqs = '';
    if (appType === 'Replacement') {
      dynamicClaimReqs = 'Present 1 valid government ID, notarized Affidavit of Loss / damaged ID card surrender stub, and this digital QR voucher.';
    } else if (activeCategory.id === 'pwd_id') {
      dynamicClaimReqs = 'Bring 1 valid government ID, original signed Clinical Medical Certificate, and this digital claim voucher.';
    } else if (activeCategory.id === 'solo_parent_id') {
      dynamicClaimReqs = "Bring original/PSA copies of your dependent child's birth certificate, Barangay Solo Parent certification, and this voucher.";
    } else if (activeCategory.id === 'senior_citizen_id') {
      dynamicClaimReqs = 'Bring original PSA Birth Certificate or valid passport proving age 60+, Barangay Residency Certificate, and this voucher.';
    } else if (activeCategory.id === 'barangay_id') {
      dynamicClaimReqs = 'Present proof of barangay residency (lease/utility bill), any valid ID, and claim voucher at your Barangay Hall.';
    } else {
      dynamicClaimReqs = 'Present 1 original valid primary ID document and this digital claim voucher barcode upon claiming.';
    }

    // Live backend transmission to citizen-backend
    const candidateEndpoints = [
      'http://localhost/citizen-backend/api/citizen/submit-id-application.php',
      'http://localhost/citizen-information-and-engagement-final-try/api/citizen/submit-id-application.php',
      `${API_BASE_URL}/submit-id-application.php`,
    ];

    const session = AuthService.getCurrentUser();
    const currentUserId = session.citizen_user_id || session.user?.citizen_user_id || null;

    const payload = {
      reference_no: ref,
      id_category: activeCategory.id,
      id_title: activeCategory.fullTitle,
      application_type: appType,
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      suffix: suffix.trim(),
      gender,
      birthdate: birthDate,
      civil_status: civilStatus,
      contact_number: phone.trim(),
      email: email.trim(),
      street_address: streetAddress.trim(),
      barangay: barangay.trim(),
      district: district || detectDistrictFromBarangay(barangay),
      resident_since: residencyLength || '2015',
      issuing_bureau: activeCategory.issuingBureau,
      primary_doc_name: idDocFile?.name || activeCategory.primaryDocName,
      claim_office: activeCategory.claimOffice,
      estimated_turnaround: activeCategory.estimatedTurnaround,
      citizen_user_id: currentUserId,
    };

    try {
      await IdIssuanceService.submitApplication(payload);
    } catch (err) {
      console.warn('ID Application live submission error:', err);
    }

    setIsSubmitting(false);

    // Refresh application status list
    fetchApplications();

    setSubmittedData({
      referenceNumber: ref,
      idCategory: activeCategory,
      applicationStatus: 'Submitted (Pending Document Review)',
      submissionDate: dateStr,
      applicationType: appType,
      processingUpdates: `Your ${activeCategory.name} application has been successfully transmitted to the ${activeCategory.issuingBureau}. Verification officers will evaluate submitted credentials prior to physical/digital card production.`,
      releaseClaimInfo: {
        claimCenter: activeCategory.claimOffice,
        estimatedDays: activeCategory.estimatedTurnaround,
        claimRequirements: dynamicClaimReqs,
      },
    });
  };

  const handleReset = () => {
    setSubmittedData(null);
    setSelectedId(null);
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
        {/* POST-SUBMISSION RESULTS VIEW */}
        {submittedData ? (
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              {submittedData.idCategory.name} Application Filed
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your {submittedData.idCategory.fullTitle} application has been received and logged for official evaluation.
            </Text>

            {/* Reference & Application Meta Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Official Application Reference</Text>
                <Badge label="IN REVIEW" variant="warning" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ID Applied For:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.idCategory.fullTitle}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Issuing Bureau:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.idCategory.issuingBureau}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Application Type:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.applicationType}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submission Date:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.submissionDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Application Status:</Text>
                <Text style={[styles.metaVal, { color: '#D97706', fontWeight: '800' }]}>
                  {submittedData.applicationStatus}
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
                  Processing Instructions & Next Steps
                </Text>
              </View>
              <Text style={[styles.updateText, isDarkMode && { color: '#CBD5E1' }]}>
                {submittedData.processingUpdates}
              </Text>
            </View>

            {/* Release & Claim Information Card */}
            <View
              style={[
                styles.claimCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.updateHeaderRow}>
                <IconSymbol name="building.2.fill" size={16} color="#10B981" />
                <Text style={[styles.updateHeading, { color: '#10B981' }]}>
                  Designated Release Counter & Pick-up
                </Text>
              </View>

              <View style={styles.claimGrid}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Designated Claim Center:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.releaseClaimInfo.claimCenter}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Estimated Turnaround:</Text>
                  <Text style={[styles.claimVal, { color: '#0284C7', fontWeight: '800' }, isDarkMode && { color: '#38BDF8' }]}>
                    {submittedData.releaseClaimInfo.estimatedDays}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Claim Requirements:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#CBD5E1' }]}>
                    {submittedData.releaseClaimInfo.claimRequirements}
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
                Application Lifecycle Tracking
              </Text>
              <Text style={[styles.timelineSubheading, isDarkMode && { color: '#94A3B8' }]}>
                Submitted → Document Review → Verification → Ready for Release → Completed
              </Text>

              <View style={styles.timelineList}>
                {CITIZEN_ID_STAGES.map((stage, idx) => {
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
                        {idx < CITIZEN_ID_STAGES.length - 1 && (
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
                  setSubmittedData(null);
                  setSelectedId(null);
                  setActiveTab('status');
                }}
                activeOpacity={0.88}
              >
                <IconSymbol name="list.bullet.rectangle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.viewStatusBtnText}>View in Application Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>Apply for Another ID</Text>
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
        ) : (
          <>
            {/* Top Back Navigation to Services Directory */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="chevron.left"
                size={16}
                color={isDarkMode ? '#38BDF8' : '#2563EB'}
              />
              <Text
                style={[
                  styles.backText,
                  isDarkMode && { color: '#38BDF8' },
                ]}
              >
                Back to Services Directory
              </Text>
            </TouchableOpacity>

            {/* Segmented Toggle Switch: Apply for ID | Application Status */}
            <View
              style={[
                styles.tabSegmentContainer,
                isDarkMode && styles.tabSegmentContainerDark,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabSegmentButton,
                  activeTab === 'apply' && styles.tabSegmentButtonActive,
                ]}
                onPress={() => setActiveTab('apply')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="plus.circle.fill"
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
                  Apply for ID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSegmentButton,
                  activeTab === 'status' && styles.tabSegmentButtonActive,
                ]}
                onPress={() => setActiveTab('status')}
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
                  Application Status {applications.length > 0 ? `(${applications.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: APPLY FOR ID */}
            {activeTab === 'apply' && (
              <>
                {!activeCategory ? (
                  <>
                    {/* Header Banner */}
                    <View
                      style={[
                        styles.headerBannerCard,
                        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      ]}
                    >
                      <View style={styles.bannerTopRow}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                          <IconSymbol name="creditcard.fill" size={24} color="#4338CA" />
                        </View>
                        <Badge label="OFFICIAL ID ISSUANCE" variant="info" />
                      </View>
                      <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                        ID Issuance Services
                      </Text>
                      <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                        Choose the official government identification card you wish to apply for. Click any card below to open the dedicated application form and submit your credentials.
                      </Text>
                    </View>

                    {/* Featured Live Status Tracker Card */}
                    <View
                      style={[
                        styles.featuredTrackerCard,
                        isDarkMode && styles.featuredTrackerCardDark,
                      ]}
                    >
                      <View style={styles.featuredTrackerTop}>
                        <View style={[styles.trackerIconCircle, { backgroundColor: '#EDE9FE' }]}>
                          <IconSymbol name="list.bullet.rectangle.fill" size={20} color="#7C3AED" />
                        </View>
                        <Badge
                          label={applications.length > 0 ? `${applications.length} FILED` : 'LIVE TRACKER'}
                          variant={applications.length > 0 ? 'success' : 'info'}
                        />
                      </View>
                      <Text style={[styles.featuredTrackerTitle, isDarkMode && { color: '#F8FAFC' }]}>
                        My ID Applications & Status
                      </Text>
                      <Text style={[styles.featuredTrackerDesc, isDarkMode && { color: '#94A3B8' }]}>
                        Track real-time progress, document reviews & claim voucher schedules on your submitted ID applications.
                      </Text>
                      <TouchableOpacity
                        style={styles.featuredTrackerAction}
                        onPress={() => setActiveTab('status')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.featuredTrackerActionText}>
                          Open Application Status &gt;
                        </Text>
                      </TouchableOpacity>
                    </View>

            {/* List of 5 ID Cards to Choose from */}
            <View style={styles.selectionCardsContainer}>
              {ID_CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.idSelectionCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  ]}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.85}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.idIconBoxLarge, { backgroundColor: item.iconBg }]}>
                      <IconSymbol name={item.icon} size={24} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleWithBadgeRow}>
                        <Text style={[styles.cardIdTitle, isDarkMode && { color: '#F8FAFC' }]}>
                          {item.name}
                        </Text>
                        <Badge label={item.badgeLabel} variant={item.badgeVariant} />
                      </View>
                      <Text style={[styles.cardIdSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                        {item.fullTitle}
                      </Text>
                    </View>
                  </View>

                  {/* Card Description */}
                  <Text style={[styles.cardIdDescription, isDarkMode && { color: '#CBD5E1' }]}>
                    {item.description}
                  </Text>

                  {/* Bureau & Turnaround Pills */}
                  <View style={styles.pillsRow}>
                    <View
                      style={[
                        styles.infoPill,
                        isDarkMode && { backgroundColor: '#152238' },
                      ]}
                    >
                      <IconSymbol name="building.2.fill" size={13} color="#64748B" />
                      <Text
                        style={[styles.infoPillText, isDarkMode && { color: '#94A3B8' }]}
                        numberOfLines={1}
                      >
                        {item.issuingBureau}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.infoPill,
                        isDarkMode && { backgroundColor: '#152238' },
                      ]}
                    >
                      <IconSymbol name="clock.fill" size={13} color="#0284C7" />
                      <Text
                        style={[styles.infoPillText, { color: '#0284C7', fontWeight: '700' }, isDarkMode && { color: '#38BDF8' }]}
                      >
                        {item.estimatedTurnaround}
                      </Text>
                    </View>
                  </View>

                  {/* Key Benefits Preview */}
                  <View
                    style={[
                      styles.cardBenefitsBox,
                      isDarkMode && { backgroundColor: '#152238' },
                    ]}
                  >
                    <Text style={[styles.cardBenefitsTitle, isDarkMode && { color: '#93C5FD' }]}>
                      Key Benefits & Entitlements:
                    </Text>
                    {item.keyBenefits.slice(0, 2).map((benefit, bIdx) => (
                      <View key={bIdx} style={styles.miniBenefitRow}>
                        <IconSymbol name="checkmark" size={11} color="#10B981" />
                        <Text style={[styles.miniBenefitText, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={1}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Apply Action Button */}
                  <View style={styles.cardActionFooter}>
                    <Text style={[styles.applyButtonText, isDarkMode && { color: '#38BDF8' }]}>
                      Apply for {item.name}
                    </Text>
                    <IconSymbol
                      name="chevron.right"
                      size={15}
                      color={isDarkMode ? '#38BDF8' : '#2563EB'}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED APPLICATION FORM FOR THE CHOSEN ID                      */
          /* ========================================================================= */
          <>
            {/* Top Navigation: Switch to a different ID */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedId(null)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="chevron.left"
                size={16}
                color={isDarkMode ? '#38BDF8' : '#2563EB'}
              />
              <Text
                style={[
                  styles.backText,
                  isDarkMode && { color: '#38BDF8' },
                ]}
              >
                Choose a Different ID
              </Text>
            </TouchableOpacity>

            {/* Hero Banner for the Chosen ID */}
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: activeCategory.iconBg }]}>
                  <IconSymbol name={activeCategory.icon} size={24} color={activeCategory.iconColor} />
                </View>
                <Badge label={activeCategory.badgeLabel} variant={activeCategory.badgeVariant} />
              </View>

              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {activeCategory.name} Application
              </Text>

              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                {activeCategory.fullTitle} • {activeCategory.issuingBureau}
              </Text>

              {/* Statutory Benefits Highlights */}
              <View
                style={[
                  styles.activeIdHighlightBox,
                  { marginTop: 14, marginBottom: 0 },
                  isDarkMode && { backgroundColor: '#152542', borderColor: '#2563EB' },
                ]}
              >
                <View style={styles.highlightHeaderRow}>
                  <IconSymbol name="checkmark.seal.fill" size={17} color="#2563EB" />
                  <Text style={[styles.highlightHeading, isDarkMode && { color: '#60A5FA' }]}>
                    Legal Benefits & Entitlements
                  </Text>
                </View>
                <View style={styles.benefitsList}>
                  {activeCategory.keyBenefits.map((benefit, bIdx) => (
                    <View key={bIdx} style={styles.benefitBulletRow}>
                      <IconSymbol name="checkmark" size={12} color="#10B981" />
                      <Text style={[styles.benefitBulletText, isDarkMode && { color: '#E2E8F0' }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Application Form Card */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* SECTION 1: APPLICATION TYPE */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Application Type *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Indicate if this is your first application, renewal, or replacement
                  </Text>
                </View>
              </View>

              <View style={styles.appTypeGrid}>
                {APPLICATION_TYPES.map((t) => {
                  const isSelected = appType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.appTypeCard,
                        isSelected && styles.appTypeCardSelected,
                        isDarkMode && {
                          backgroundColor: '#152238',
                          borderColor: isSelected ? '#0284C7' : '#3A506B',
                        },
                      ]}
                      onPress={() => setAppType(t.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text
                          style={[
                            styles.appTypeLabel,
                            isSelected && styles.appTypeLabelSelected,
                            isDarkMode && { color: isSelected ? '#38BDF8' : '#F8FAFC' },
                          ]}
                        >
                          {t.label}
                        </Text>
                      </View>
                      <Text style={[styles.appTypeDesc, isDarkMode && { color: '#94A3B8' }]}>
                        {t.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* REPLACEMENT SPECIFIC SECTION */}
              {appType === 'Replacement' && (
                <View
                  style={[
                    styles.replacementBox,
                    isDarkMode && { backgroundColor: '#1E293B', borderColor: '#F59E0B' },
                  ]}
                >
                  <View style={styles.replacementHeader}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#D97706" />
                    <Text style={styles.replacementHeading}>Reason for Replacement *</Text>
                  </View>

                  <View style={styles.reasonsList}>
                    {REPLACEMENT_REASONS.map((r) => {
                      const isChosen = replacementReason === r.id;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={[
                            styles.reasonOption,
                            isChosen && styles.reasonOptionChosen,
                            isDarkMode && { backgroundColor: isChosen ? '#2A3B5C' : '#152238', borderColor: '#3A506B' },
                          ]}
                          onPress={() => setReplacementReason(r.id)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.radioCircleSmall,
                              isChosen && styles.radioCircleSelected,
                            ]}
                          >
                            {isChosen && <View style={styles.radioInnerSmall} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.reasonLabel,
                                isChosen && { color: '#0284C7', fontWeight: '800' },
                                isDarkMode && { color: isChosen ? '#38BDF8' : '#F8FAFC' },
                              ]}
                            >
                              {r.label}
                            </Text>
                            <Text style={[styles.reasonSub, isDarkMode && { color: '#94A3B8' }]}>
                              {r.desc}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Previous {activeCategory.name} Number (If Known)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder={`e.g. ${activeCategory.refPrefix}-2023-4512`}
                      placeholderTextColor="#94A3B8"
                      value={oldIdNumber}
                      onChangeText={setOldIdNumber}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Details / Circumstance of Replacement (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder="e.g. Lost wallet during commute / card damaged"
                      placeholderTextColor="#94A3B8"
                      value={replacementDetails}
                      onChangeText={setReplacementDetails}
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION 2: CITIZEN PERSONAL INFORMATION */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Applicant Personal Information *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Legal identity as registered in Civil Registry / Philippine Statistics Authority
                  </Text>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    First Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={firstName}
                    onChangeText={(val) => setFirstName(sanitizePersonalName(val))}
                    placeholder="First Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Middle Name
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={middleName}
                    onChangeText={(val) => setMiddleName(sanitizePersonalName(val))}
                    placeholder="Middle Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Last Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={lastName}
                    onChangeText={(val) => setLastName(sanitizePersonalName(val))}
                    placeholder="Last Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { width: 85 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Suffix
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={suffix}
                    onChangeText={(val) => setSuffix(sanitizePersonalName(val))}
                    placeholder="Jr/III"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Date of Birth (YYYY-MM-DD) *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="1998-05-15"
                    placeholderTextColor="#94A3B8"
                  />
                  {activeCategory.id === 'senior_citizen_id' && (
                    <Text style={styles.helperTipText}>
                      Notice: OSCA requires applicant to be at least 60 years of age.
                    </Text>
                  )}
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
                    onChangeText={(val) => setCivilStatus(sanitizePersonalName(val))}
                    placeholder="Single / Married"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Sex / Gender *
                </Text>
                <View style={styles.chipsContainer}>
                  {['Male', 'Female'].map((g) => {
                    const isSel = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.chipItem,
                          isSel && styles.chipItemSelected,
                          isDarkMode && {
                            backgroundColor: isSel ? '#2563EB' : '#152238',
                            borderColor: isSel ? '#60A5FA' : '#3A506B',
                          },
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSel && styles.chipTextSelected,
                            isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 3: SPECIFIC INFO FOR THIS CHOSEN ID */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Specific {activeCategory.name} Details *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Required qualifications and records for {activeCategory.issuingBureau}
                  </Text>
                </View>
              </View>

              {/* PWD ID Specific Fields */}
              {activeCategory.id === 'pwd_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Type of Disability / Impairment *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {PWD_DISABILITY_TYPES.map((type) => {
                      const isSel = disabilityType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#2563EB' : '#152238',
                              borderColor: isSel ? '#60A5FA' : '#3A506B',
                            },
                          ]}
                          onPress={() => setDisabilityType(type)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Attending Licensed Physician or Hospital/Clinic Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={physicianName}
                      onChangeText={(val) => setPhysicianName(sanitizePersonalName(val))}
                      placeholder="e.g. Dr. Maria Santos, MD (Caloocan City Medical Center)"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Physician PRC License Number (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={physicianLicense}
                      onChangeText={setPhysicianLicense}
                      placeholder="e.g. PRC Lic. No. 0123456"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              {/* Solo Parent ID Specific Fields */}
              {activeCategory.id === 'solo_parent_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Solo Parent Eligibility Category *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {SOLO_PARENT_CATEGORIES.map((cat) => {
                      const isSel = soloParentCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#D97706' : '#152238',
                              borderColor: isSel ? '#FBBF24' : '#3A506B',
                            },
                          ]}
                          onPress={() => setSoloParentCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Number of Dependent Children under 22 Years Old *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={dependentCount}
                      onChangeText={setDependentCount}
                      keyboardType="numeric"
                      placeholder="e.g. 1"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Names & Ages of Children (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={childrenDetails}
                      onChangeText={setChildrenDetails}
                      placeholder="e.g. Marco Espelita (Age 6), Bea Espelita (Age 3)"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              {/* Senior Citizen ID Specific Fields */}
              {activeCategory.id === 'senior_citizen_id' && (
                <View style={styles.dynamicBox}>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1.2 }]}>
                      <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                        Emergency Contact Person *
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                        ]}
                        value={emergencyContactName}
                        onChangeText={(val) => setEmergencyContactName(sanitizePersonalName(val))}
                        placeholder="Full Name (Next of Kin)"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                        Emergency Mobile *
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                        ]}
                        value={emergencyContactPhone}
                        onChangeText={setEmergencyContactPhone}
                        placeholder="09XXXXXXXXX"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Blood Type (Printed on OSCA Emergency Medical Record)
                  </Text>
                  <View style={styles.chipsContainer}>
                    {BLOOD_TYPES.map((bt) => {
                      const isSel = bloodType === bt;
                      return (
                        <TouchableOpacity
                          key={bt}
                          style={[
                            styles.chipItemSmall,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#BE185D' : '#152238',
                              borderColor: isSel ? '#F472B6' : '#3A506B',
                            },
                          ]}
                          onPress={() => setBloodType(bt)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {bt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Pension Status
                  </Text>
                  <View style={styles.chipsContainer}>
                    {['Yes (SSS / GSIS)', 'Indigent / Social Pensioner', 'Non-Pensioner'].map((ps) => {
                      const isSel = isPensioner === ps;
                      return (
                        <TouchableOpacity
                          key={ps}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#BE185D' : '#152238',
                              borderColor: isSel ? '#F472B6' : '#3A506B',
                            },
                          ]}
                          onPress={() => setIsPensioner(ps)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {ps}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Barangay ID Specific Fields */}
              {activeCategory.id === 'barangay_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Length of Continuous Residency in this Barangay *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {RESIDENCY_YEARS.map((ry) => {
                      const isSel = residencyLength === ry;
                      return (
                        <TouchableOpacity
                          key={ry}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#15803D' : '#152238',
                              borderColor: isSel ? '#4ADE80' : '#3A506B',
                            },
                          ]}
                          onPress={() => setResidencyLength(ry)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {ry}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Purok / Sitio / Zone (If Applicable)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={purokZone}
                      onChangeText={setPurokZone}
                      placeholder="e.g. Purok 4, Zone 12"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Living Arrangement / Housing Status
                  </Text>
                  <View style={styles.chipsContainer}>
                    {['Homeowner', 'Tenant / Renter', 'Living with Relatives'].map((hs) => {
                      const isSel = housingStatus === hs;
                      return (
                        <TouchableOpacity
                          key={hs}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#15803D' : '#152238',
                              borderColor: isSel ? '#4ADE80' : '#3A506B',
                            },
                          ]}
                          onPress={() => setHousingStatus(hs)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {hs}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Citizen ID Specific Fields */}
              {activeCategory.id === 'citizen_id' && (
                <View style={styles.dynamicBox}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      PhilSys Card Number / PCN (If already registered)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={philsysNumber}
                      onChangeText={setPhilsysNumber}
                      placeholder="e.g. 1234-5678-9012-3456"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Occupation / Employment Classification
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={occupation}
                      onChangeText={setOccupation}
                      placeholder="e.g. Private Employee, Self-Employed, Student"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION 4: ADDRESS & BARANGAY */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Current Address & Barangay *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Registered address in Caloocan City
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Current Street Address *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="e.g. House No., Street, Subdivision"
                  placeholderTextColor="#94A3B8"
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
                  onChangeText={(text) => {
                    setBarangay(text);
                    const autoD = detectDistrictFromBarangay(text);
                    if (autoD) setDistrict(autoD);
                  }}
                  placeholder="e.g. Barangay 171 (Bagumbong)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Caloocan Legislative District *
                </Text>
                <View style={styles.chipsContainer}>
                  {['District 1', 'District 2', 'District 3'].map((d) => {
                    const isSel = district === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.chipItem,
                          isSel && styles.chipItemSelected,
                          isDarkMode && {
                            backgroundColor: isSel ? '#1D4ED8' : '#152238',
                            borderColor: isSel ? '#60A5FA' : '#3A506B',
                          },
                        ]}
                        onPress={() => setDistrict(d)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSel && styles.chipTextSelected,
                            isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 5: CONTACT INFORMATION */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>5</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Contact Information *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Notifications and release notifications will be dispatched here
                  </Text>
                </View>
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
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Email Address *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 6: REQUIREMENTS UPLOAD */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>6</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {activeCategory.name} Document Requirements *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Upload clear photo copies or PDF files for bureau document evaluation
                  </Text>
                </View>
              </View>

              {/* Requirement 1: Primary Document */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    1. {activeCategory.primaryDocName} *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  {activeCategory.primaryDocDesc}
                </Text>

                {idDocFile ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="doc.text.fill" size={18} color="#0284C7" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {idDocFile.name} ({idDocFile.size})
                    </Text>
                    <TouchableOpacity onPress={() => setIdDocFile(null)}>
                      <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('id')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                    <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                      Upload {activeCategory.primaryDocName} (PDF/JPG)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 2: Supporting Document */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    2. {activeCategory.supportDocName}
                  </Text>
                  <Text style={[styles.reqBadge, { backgroundColor: '#F1F5F9', color: '#64748B' }]}>
                    Recommended
                  </Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  {activeCategory.supportDocDesc}
                </Text>

                {supportDocFile ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="doc.text.fill" size={18} color="#0284C7" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {supportDocFile.name} ({supportDocFile.size})
                    </Text>
                    <TouchableOpacity onPress={() => setSupportDocFile(null)}>
                      <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('support')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                    <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                      Upload Supporting Document (Optional/Recommended)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 3: 2x2 Photo */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    3. 2x2 Formal ID Photo *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  Clear formal front-facing portrait with plain white background
                </Text>

                {photoFile ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="photo.fill" size={18} color="#10B981" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {photoFile.name} ({photoFile.size})
                    </Text>
                    <TouchableOpacity onPress={() => setPhotoFile(null)}>
                      <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('photo')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="camera.fill" size={18} color="#10B981" />
                    <Text style={[styles.uploadTriggerText, { color: '#059669' }, isDarkMode && { color: '#34D399' }]}>
                      Upload 2x2 ID Photo (JPG/PNG)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* SUBMIT APPLICATION BUTTON */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitApplication}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Submit {activeCategory.name} Application
                    </Text>
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </>
    )}

    {/* TAB 2: APPLICATION STATUS */}
    {activeTab === 'status' && (
      <View style={styles.statusSectionContainer}>
        {/* Header Banner */}
        <View
          style={[
            styles.headerBannerCard,
            isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
          ]}
        >
          <View style={styles.bannerTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="creditcard.fill" size={24} color="#7C3AED" />
            </View>
            <Badge label="STATUS TRACKER" variant="info" />
          </View>
          <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
            My ID Applications & Status
          </Text>
          <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
            Track real-time verification progress, document evaluation, approval status, and claim voucher schedules for all your municipal identity card requests.
          </Text>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: `All (${applications.length})` },
            {
              id: 'IN_REVIEW',
              label: `In Review (${applications.filter((a) => a.status === 'Pending Review' || a.status === 'Under Review').length})`,
            },
            {
              id: 'READY',
              label: `Ready / Approved (${applications.filter((a) => a.status === 'Approved' || a.status === 'Ready for Release').length})`,
            },
            {
              id: 'CLAIMED',
              label: `Claimed (${applications.filter((a) => a.status === 'Claimed').length})`,
            },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                  isDarkMode && { backgroundColor: isActive ? '#0284C7' : '#152238', borderColor: '#3A506B' },
                ]}
                onPress={() => setStatusFilter(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                    isDarkMode && !isActive && { color: '#94A3B8' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Applications List or Empty State */}
        {isLoadingApplications ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, isDarkMode && { color: '#94A3B8' }]}>
              Loading your official ID applications from City Central...
            </Text>
          </View>
        ) : applications.filter((app) => {
            if (statusFilter === 'ALL') return true;
            if (statusFilter === 'IN_REVIEW') return app.status === 'Pending Review' || app.status === 'Under Review';
            if (statusFilter === 'READY') return app.status === 'Approved' || app.status === 'Ready for Release';
            if (statusFilter === 'CLAIMED') return app.status === 'Claimed';
            return true;
          }).length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="creditcard.fill" size={32} color="#7C3AED" />
            </View>
            <Text style={[styles.emptyStateTitle, isDarkMode && { color: '#F8FAFC' }]}>
              No Applications Found
            </Text>
            <Text style={[styles.emptyStateDesc, isDarkMode && { color: '#94A3B8' }]}>
              {statusFilter === 'ALL'
                ? "You haven't filed any ID applications yet. Choose an ID card to start your application."
                : `No ID applications matching the "${statusFilter}" filter were found.`}
            </Text>
            <TouchableOpacity
              style={styles.applyNowBtn}
              onPress={() => {
                setSelectedId(null);
                setActiveTab('apply');
              }}
              activeOpacity={0.85}
            >
              <IconSymbol name="plus.circle.fill" size={16} color="#FFFFFF" />
              <Text style={styles.applyNowBtnText}>Apply for an ID Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.applicationsListContainer}>
            {applications
              .filter((app) => {
                if (statusFilter === 'ALL') return true;
                if (statusFilter === 'IN_REVIEW') return app.status === 'Pending Review' || app.status === 'Under Review';
                if (statusFilter === 'READY') return app.status === 'Approved' || app.status === 'Ready for Release';
                if (statusFilter === 'CLAIMED') return app.status === 'Claimed';
                return true;
              })
              .map((app) => {
                const catMeta = getCategoryForApp(app.id_category);
                const stageIdx = getIdStageIndex(app.status);
                const badgeInfo = getStatusBadgeInfo(app.status);
                const isExpanded = expandedAppId === app.id;
                const isRejected = (app.status || '').toLowerCase().includes('reject');

                return (
                  <View
                    key={app.id || app.reference_no}
                    style={[
                      styles.appCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {/* Card Top Row */}
                    <View style={styles.appCardHeader}>
                      <View style={[styles.appIconCircle, { backgroundColor: catMeta.iconBg }]}>
                        <IconSymbol name={catMeta.icon} size={22} color={catMeta.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.appTitleBadgeRow}>
                          <Text style={[styles.appCategoryName, isDarkMode && { color: '#F8FAFC' }]}>
                            {catMeta.name}
                          </Text>
                          <View
                            style={[
                              styles.statusPillBadge,
                              { backgroundColor: badgeInfo.bg, borderColor: badgeInfo.border },
                            ]}
                          >
                            <Text style={[styles.statusPillText, { color: badgeInfo.color }]}>
                              {badgeInfo.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.appFullTitle, isDarkMode && { color: '#94A3B8' }]} numberOfLines={1}>
                          {app.id_title || catMeta.fullTitle}
                        </Text>
                      </View>
                    </View>

                    {/* Reference Number & Type Chips */}
                    <View style={[styles.refRowBar, isDarkMode && { backgroundColor: '#152238' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.refRowLabel}>REFERENCE CODE</Text>
                        <Text style={[styles.refRowCode, isDarkMode && { color: '#38BDF8' }]}>
                          {app.reference_no}
                        </Text>
                      </View>
                      <View style={styles.typeBadgeContainer}>
                        <Text style={[styles.typeBadgeText, isDarkMode && { color: '#94A3B8' }]}>
                          {app.application_type || 'New Application'}
                        </Text>
                      </View>
                    </View>

                    {/* Meta Details Grid */}
                    <View style={styles.appMetaGrid}>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Applicant</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]} numberOfLines={1}>
                          {app.first_name} {app.middle_name ? `${app.middle_name.charAt(0)}. ` : ''}{app.last_name} {app.suffix || ''}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Date Filed</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]}>
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </Text>
                      </View>
                      <View style={[styles.appMetaItem, { width: '100%' }]}>
                        <Text style={styles.appMetaLabel}>Claim Office</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={2}>
                          {app.claim_office || catMeta.claimOffice}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Turnaround</Text>
                        <Text style={[styles.appMetaValue, { color: '#0284C7', fontWeight: '700' }, isDarkMode && { color: '#38BDF8' }]}>
                          {app.estimated_turnaround || catMeta.estimatedTurnaround}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Barangay</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]}>
                          {app.barangay ? `Brgy ${app.barangay}` : 'City Wide'}
                        </Text>
                      </View>
                    </View>

                    {/* Rejection Notice if applicable */}
                    {isRejected && (
                      <View style={styles.rejectionCard}>
                        <View style={styles.rejectionHeader}>
                          <IconSymbol name="exclamationmark.octagon.fill" size={16} color="#DC2626" />
                          <Text style={styles.rejectionTitle}>Application Disapproved</Text>
                        </View>
                        <Text style={styles.rejectionBody}>
                          {app.rejection_reason || app.review_notes || 'Credentials did not satisfy official requirements. Please verify documents and re-apply.'}
                        </Text>
                      </View>
                    )}

                    {/* 5-Stage Stepper Tracker */}
                    {!isRejected && (
                      <View style={[styles.stepperContainer, isDarkMode && { backgroundColor: '#152238' }]}>
                        <Text style={[styles.stepperHeaderTitle, isDarkMode && { color: '#93C5FD' }]}>
                          Application Progression
                        </Text>
                        <View style={styles.stepperTrackRow}>
                          {CITIZEN_ID_STAGES.map((stg, sIdx) => {
                            const isDone = sIdx <= stageIdx;
                            const isCurrent = sIdx === stageIdx;
                            return (
                              <View key={stg.id} style={styles.stepItemCol}>
                                <View style={styles.stepDotLineContainer}>
                                  {sIdx > 0 && (
                                    <View
                                      style={[
                                        styles.stepLineBefore,
                                        sIdx <= stageIdx && styles.stepLineActive,
                                      ]}
                                    />
                                  )}
                                  <View
                                    style={[
                                      styles.stepDot,
                                      isDone && styles.stepDotDone,
                                      isCurrent && styles.stepDotCurrent,
                                    ]}
                                  >
                                    {isDone && !isCurrent ? (
                                      <IconSymbol name="checkmark" size={10} color="#FFFFFF" />
                                    ) : isCurrent ? (
                                      <View style={styles.stepDotCurrentInner} />
                                    ) : (
                                      <Text style={styles.stepDotNumber}>{sIdx + 1}</Text>
                                    )}
                                  </View>
                                  {sIdx < CITIZEN_ID_STAGES.length - 1 && (
                                    <View
                                      style={[
                                        styles.stepLineAfter,
                                        sIdx < stageIdx && styles.stepLineActive,
                                      ]}
                                    />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.stepItemLabel,
                                    isCurrent && styles.stepItemLabelCurrent,
                                    isDarkMode && { color: isCurrent ? '#38BDF8' : isDone ? '#94A3B8' : '#475569' },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {stg.label}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Expandable Claim Voucher / Details Drawer */}
                    {isExpanded && (
                      <View
                        style={[
                          styles.voucherDrawer,
                          isDarkMode && { backgroundColor: '#131D31', borderColor: '#3A506B' },
                        ]}
                      >
                        {/* Digital Claim Voucher Barcode Mockup */}
                        <View style={styles.voucherCodeCard}>
                          <Text style={styles.voucherCardHeader}>DIGITAL CLAIM VOUCHER</Text>
                          <Text style={styles.voucherBigRef}>{app.reference_no}</Text>
                          <View style={styles.mockBarcodeContainer}>
                            <View style={styles.mockBarcodeLines} />
                            <Text style={styles.mockBarcodeText}>||| | |||| | ||| |||| | || | |||| ||</Text>
                          </View>
                          <Text style={styles.voucherHintText}>
                            Present this reference code or digital voucher at the release desk.
                          </Text>
                        </View>

                        {/* Claim Requirements Checklist */}
                        <View style={styles.voucherReqsSection}>
                          <Text style={[styles.voucherReqsTitle, isDarkMode && { color: '#F8FAFC' }]}>
                            Documents to Bring Upon Claiming:
                          </Text>
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              1 Valid Government-issued Photo ID (original)
                            </Text>
                          </View>
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              Original supporting proof ({catMeta.supportDocName || 'Proof of Residency'})
                            </Text>
                          </View>
                          {catMeta.id === 'pwd_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                Original signed Clinical Medical Certificate
                              </Text>
                            </View>
                          )}
                          {catMeta.id === 'solo_parent_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                PSA Birth Certificate(s) of dependent child/children
                              </Text>
                            </View>
                          )}
                          {catMeta.id === 'senior_citizen_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                PSA Birth Certificate or proof of age 60+
                              </Text>
                            </View>
                          )}
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              This digital claim voucher or printed receipt
                            </Text>
                          </View>
                        </View>

                        {/* Release Desk Notice */}
                        <View style={[styles.releaseDeskBox, isDarkMode && { backgroundColor: '#1A2942' }]}>
                          <IconSymbol name="building.2.fill" size={16} color="#0284C7" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.releaseDeskTitle, isDarkMode && { color: '#93C5FD' }]}>
                              Designated Pick-up Desk:
                            </Text>
                            <Text style={[styles.releaseDeskText, isDarkMode && { color: '#E2E8F0' }]}>
                              {app.claim_office || catMeta.claimOffice}
                            </Text>
                          </View>
                        </View>

                        {app.review_notes && (
                          <View style={styles.reviewNotesBox}>
                            <Text style={styles.reviewNotesLabel}>Bureau Officer Notes:</Text>
                            <Text style={styles.reviewNotesText}>{app.review_notes}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Toggle Accordion Button */}
                    <TouchableOpacity
                      style={[
                        styles.drawerToggleBtn,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                      ]}
                      onPress={() => setExpandedAppId(isExpanded ? null : app.id)}
                      activeOpacity={0.8}
                    >
                      <IconSymbol
                        name={isExpanded ? 'chevron.up' : 'chevron.down'}
                        size={14}
                        color={isDarkMode ? '#38BDF8' : '#0284C7'}
                      />
                      <Text style={[styles.drawerToggleBtnText, isDarkMode && { color: '#38BDF8' }]}>
                        {isExpanded ? 'Hide Claim Voucher & Details' : 'View Claim Voucher & Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}
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
    fontSize: 21,
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

  /* Selection View Cards */
  selectionCardsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  idSelectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  idIconBoxLarge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardIdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardIdSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  cardIdDescription: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
  },
  infoPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardBenefitsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 5,
  },
  cardBenefitsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  miniBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBenefitText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  applyButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Dedicated Form View Styles */
  formCard: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Active ID Highlights */
  activeIdHighlightBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  highlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  highlightHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  benefitsList: {
    gap: 6,
    marginTop: 4,
  },
  benefitBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitBulletText: {
    fontSize: 11.5,
    color: '#1E293B',
    flex: 1,
    lineHeight: 16,
  },

  /* Chips */
  dynamicBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipItemSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipItemSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperTipText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 4,
    fontWeight: '600',
  },

  /* Application Types */
  appTypeGrid: {
    gap: 10,
    marginBottom: 10,
  },
  appTypeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  appTypeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563EB',
  },
  appTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  appTypeLabelSelected: {
    color: '#2563EB',
  },
  appTypeDesc: {
    fontSize: 12,
    color: '#64748B',
    paddingLeft: 26,
  },

  /* Replacement Box */
  replacementBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  replacementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  replacementHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reasonsList: {
    gap: 8,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonOptionChosen: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  reasonLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  reasonSub: {
    fontSize: 11,
    color: '#64748B',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  /* Form Inputs */
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
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

  /* Document Requirements */
  reqBlock: {
    marginBottom: 14,
  },
  reqLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  reqLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reqBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reqSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
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
  docAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  docAttachedName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Post Submission Result */
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
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    width: '40%',
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    width: '58%',
    textAlign: 'right',
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
    width: '42%',
  },
  claimVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    width: '56%',
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

  /* VIEW STATUS BTN IN SUCCESS SCREEN */
  viewStatusBtn: {
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  viewStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* SEGMENTED TOGGLE SWITCH */
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* FEATURED STATUS TRACKER CARD */
  featuredTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredTrackerCardDark: {
    backgroundColor: '#1C2541',
    borderColor: '#3A506B',
  },
  featuredTrackerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTrackerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  featuredTrackerDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 14,
  },
  featuredTrackerAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  featuredTrackerActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },

  /* APPLICATION STATUS SECTION */
  statusSectionContainer: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* EMPTY & LOADING STATES */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  applyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  applyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* APPLICATION CARDS LIST */
  applicationsListContainer: {
    gap: 14,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  appIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitleBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  appCategoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  appFullTitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },

  /* REF ROW BAR */
  refRowBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  refRowLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  refRowCode: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0284C7',
  },
  typeBadgeContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* META GRID */
  appMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  appMetaItem: {
    width: '47%',
  },
  appMetaLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 1,
  },
  appMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* REJECTION CARD */
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rejectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  rejectionBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#991B1B',
  },

  /* STEPPER TRACKER */
  stepperContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stepperHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItemCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepDotLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepLineBefore: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepLineAfter: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#10B981',
  },
  stepDotCurrent: {
    backgroundColor: '#0284C7',
  },
  stepDotCurrentInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepDotNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  stepItemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  stepItemLabelCurrent: {
    color: '#0284C7',
    fontWeight: '800',
  },

  /* EXPANDABLE VOUCHER DRAWER */
  voucherDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  voucherCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  voucherCardHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 4,
  },
  voucherBigRef: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mockBarcodeContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  mockBarcodeLines: {
    height: 2,
    width: 140,
    backgroundColor: '#0F172A',
    marginBottom: 2,
  },
  mockBarcodeText: {
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
    fontWeight: '900',
  },
  voucherHintText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  voucherReqsSection: {
    gap: 6,
    marginBottom: 12,
  },
  voucherReqsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reqCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqCheckText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  releaseDeskBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'flex-start',
  },
  releaseDeskTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 1,
  },
  releaseDeskText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  reviewNotesBox: {
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewNotesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewNotesText: {
    fontSize: 11,
    color: '#92400E',
  },
  drawerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  drawerToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});

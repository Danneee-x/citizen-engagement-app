import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { LocalCitizenTable } from '@/src/services/local-citizen-table';
import { styles } from '../styles/VerifyCitizenScreen.styles';

export interface CaloocanDistrict {
  id: string;
  name: string;
  shortName: string;
  areaDescription: string;
  barangayCount: number;
  barangays: string[];
}

export const CALOOCAN_DISTRICTS: CaloocanDistrict[] = [
  {
    id: 'district-1',
    name: 'District 1 (North Caloocan - West)',
    shortName: 'District 1',
    areaDescription: 'Bagong Silang, Bagumbong, Deparo, Llano, 167-177, etc.',
    barangayCount: 59,
    barangays: [
      1, 2, 3, 4, 77, 78, 79, 80, 81, 82, 83, 84, 85,
      132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
      151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
      170, 171, 172, 173, 174, 175, 176, 177,
    ].map((num) => `Barangay ${num}`),
  },
  {
    id: 'district-2',
    name: 'District 2 (South Caloocan)',
    shortName: 'District 2',
    areaDescription: 'Grace Park, Monumento, Maypajo, Sangandaan, 5-76 & 86-131',
    barangayCount: 118,
    barangays: [
      ...Array.from({ length: 72 }, (_, i) => i + 5), // 5 to 76
      ...Array.from({ length: 46 }, (_, i) => i + 86), // 86 to 131
    ].map((num) => `Barangay ${num}`),
  },
  {
    id: 'district-3',
    name: 'District 3 (North Caloocan - East)',
    shortName: 'District 3',
    areaDescription: 'Camarin, Amparo, Tala, Bankers Village (Brgy 178 - 188)',
    barangayCount: 11,
    barangays: [
      178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188,
    ].map((num) => `Barangay ${num}`),
  },
];

const VALID_ID_TYPES = [
  'PhilSys National ID',
  "Driver's License",
  'UMID',
  'Passport',
  "Voter's ID / Certificate",
  'Barangay ID',
  'Postal ID',
  'Student ID',
];

const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Divorced / Annulled',
  'Common-Law / Live-In',
];
const SEX_OPTIONS = ['Male', 'Female'];

const EMPLOYMENT_STATUS_OPTIONS = [
  'Employed (Private Sector)',
  'Employed (Government / Public)',
  'Self-Employed / Freelancer',
  'Business Owner / Entrepreneur',
  'Unemployed / Job Seeker',
  'Student',
  'Retired / Senior Citizen',
  'OFW (Overseas Filipino Worker)',
  'Homemaker / Houseparent',
];

const OCCUPATION_OPTIONS = [
  'Government / Public Servant',
  'Corporate / Office Employee',
  'Healthcare / Medical Professional',
  'Teacher / Professor / Educator',
  'IT / Tech / BPO Professional',
  'Driver / Transport Operator',
  'Retail / Sales / Merchant',
  'Skilled Trade / Construction / Technical',
  'Service Industry / Hospitality',
  'Student / Non-Working',
  'Others',
];

const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  'Elementary Undergraduate',
  'Elementary Graduate',
  'High School / Junior High Graduate',
  'Senior High School Graduate',
  'Vocational / Technical Course',
  'College Undergraduate',
  'College / Bachelor’s Degree Graduate',
  'Postgraduate (Master’s / Doctorate)',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEAR_OPTIONS = Array.from({ length: 97 }, (_, i) => 2026 - i);

export function VerifyCitizenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 20) + 12;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Personal Details State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [sex, setSex] = useState(SEX_OPTIONS[0]);
  const [placeOfBirth, setPlaceOfBirth] = useState('Caloocan City');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [civilStatus, setCivilStatus] = useState(CIVIL_STATUS_OPTIONS[0]);
  const [isCivilStatusDropdownOpen, setIsCivilStatusDropdownOpen] = useState(false);

  // Birthdate Dropdown Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(1998);
  const [calMonth, setCalMonth] = useState(4); // May (0-indexed)
  const [calDay, setCalDay] = useState(15);
  const [isCalMonthDropdownOpen, setIsCalMonthDropdownOpen] = useState(false);
  const [isCalYearDropdownOpen, setIsCalYearDropdownOpen] = useState(false);

  // Demographic Information State (Dropdowns - initially empty to require user selection)
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [isEmploymentDropdownOpen, setIsEmploymentDropdownOpen] = useState(false);

  const [occupation, setOccupation] = useState('');
  const [isOccupationDropdownOpen, setIsOccupationDropdownOpen] = useState(false);

  const [educationalAttainment, setEducationalAttainment] = useState('');
  const [isEducationDropdownOpen, setIsEducationDropdownOpen] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Auto-fetch Citizen basic info from registered account & database
  useEffect(() => {
    async function loadCitizenData() {
      try {
        const currentUser = AuthService.getCurrentUser();

        // 1. Pre-fill from active auth session if present
        if (currentUser && currentUser.user) {
          const u = currentUser.user;
          if (u.first_name) setFirstName(u.first_name);
          if (u.middle_name) setMiddleName(u.middle_name);
          if (u.last_name) setLastName(u.last_name);
          if (u.suffix) setSuffix(u.suffix);
          setIsPrefilled(true);
        }

        // 2. Fetch fresh profile details from DB via ProfileService
        if (currentUser.email || currentUser.citizen_user_id || currentUser.phone) {
          const res = await ProfileService.getProfile(
            currentUser.email || undefined,
            currentUser.citizen_user_id || undefined,
            currentUser.phone || undefined
          );

          if (res.status === 'success' && res.data) {
            const p = res.data;
            if (p.first_name) setFirstName(p.first_name);
            if (p.middle_name) setMiddleName(p.middle_name);
            if (p.last_name) setLastName(p.last_name);
            if (p.suffix) setSuffix(p.suffix);
            if (p.birthDate) setBirthDate(p.birthDate);
            if (p.civilStatus && CIVIL_STATUS_OPTIONS.includes(p.civilStatus)) {
              setCivilStatus(p.civilStatus);
            }
            if (p.barangay) setBarangay(p.barangay);
            if (p.address) setStreetAddress(p.address);
            setIsPrefilled(true);
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch citizen registration info:', err);
      }
    }

    loadCitizenData();
  }, []);

  // STEP 2: Residency State (Caloocan District & Cascading Barangay)
  const [selectedDistrictId, setSelectedDistrictId] = useState(CALOOCAN_DISTRICTS[0].id);
  const activeDistrict = useMemo(
    () => CALOOCAN_DISTRICTS.find((d) => d.id === selectedDistrictId) || CALOOCAN_DISTRICTS[0],
    [selectedDistrictId]
  );
  const [barangay, setBarangay] = useState(activeDistrict.barangays[0]);
  const [isBarangayPickerVisible, setIsBarangayPickerVisible] = useState(false);
  const [barangaySearchQuery, setBarangaySearchQuery] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [yearsResident, setYearsResident] = useState('');

  // STEP 3: Valid ID & Liveness State
  const [selectedIdType, setSelectedIdType] = useState(VALID_ID_TYPES[0]);
  const [isIdTypeDropdownOpen, setIsIdTypeDropdownOpen] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [hasUploadedId, setHasUploadedId] = useState(false);
  const [hasLivenessCheck, setHasLivenessCheck] = useState(false);
  const [idImageUri, setIdImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);

  // Photo Source Picker Modal State (Camera vs Gallery)
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'id' | 'selfie'>('id');

  const handleOpenPhotoPicker = (target: 'id' | 'selfie') => {
    setPhotoPickerTarget(target);
    setIsPhotoPickerVisible(true);
  };

  const handleTakePhoto = async () => {
    setIsPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Camera access is required to capture your photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (photoPickerTarget === 'id') {
          setIdImageUri(uri);
          setHasUploadedId(true);
        } else {
          setSelfieImageUri(uri);
          setHasLivenessCheck(true);
        }
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setErrorMessage('Failed to launch camera.');
    }
  };

  const handlePickFromGallery = async () => {
    setIsPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Photo gallery access is required to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (photoPickerTarget === 'id') {
          setIdImageUri(uri);
          setHasUploadedId(true);
        } else {
          setSelfieImageUri(uri);
          setHasLivenessCheck(true);
        }
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
      setErrorMessage('Failed to open photo gallery.');
    }
  };

  const handleRemovePhoto = (target: 'id' | 'selfie') => {
    if (target === 'id') {
      setIdImageUri(null);
      setHasUploadedId(false);
    } else {
      setSelfieImageUri(null);
      setHasLivenessCheck(false);
    }
  };

  // Filtered Barangays based on search in modal
  const filteredBarangays = useMemo(() => {
    const query = barangaySearchQuery.trim().toLowerCase();
    if (!query) return activeDistrict.barangays;
    return activeDistrict.barangays.filter((b) => b.toLowerCase().includes(query));
  }, [activeDistrict, barangaySearchQuery]);

  // Handle District switch & cascade to first barangay in district
  const handleSelectDistrict = (district: CaloocanDistrict) => {
    setSelectedDistrictId(district.id);
    setBarangay(district.barangays[0]);
    setBarangaySearchQuery('');
  };

  // Days in selected calendar month
  const daysInCalMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(calYear, calMonth, 1).getDay();
  }, [calYear, calMonth]);

  const handleSelectDay = (day: number) => {
    setCalDay(day);
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setBirthDate(`${calYear}-${mm}-${dd}`);
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const dmBg = isDarkMode ? '#0B132B' : '#F8FAFC';
  const dmCard = isDarkMode ? '#1C2541' : '#FFFFFF';
  const dmBorder = isDarkMode ? '#3A506B' : '#E2E8F0';
  const dmText = isDarkMode ? '#FFFFFF' : '#0F172A';
  const dmInputBg = isDarkMode ? '#152238' : '#F8FAFC';
  const dmInputText = isDarkMode ? '#F1F5F9' : '#0F172A';

  const handleNextStep1 = () => {
    setErrorMessage(null);
    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }
    if (!birthDate.trim()) {
      setErrorMessage('Date of birth is required (e.g. YYYY-MM-DD).');
      return;
    }
    if (!placeOfBirth.trim()) {
      setErrorMessage('Place of birth is required.');
      return;
    }
    if (!employmentStatus) {
      setErrorMessage('Please select your Employment Status under Demographic Information.');
      return;
    }
    if (!occupation) {
      setErrorMessage('Please select your Occupation under Demographic Information.');
      return;
    }
    if (!educationalAttainment) {
      setErrorMessage('Please select your Educational Attainment under Demographic Information.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setErrorMessage(null);
    if (!streetAddress.trim()) {
      setErrorMessage('Street address is required.');
      return;
    }
    if (!yearsResident.trim()) {
      setErrorMessage('Years of residency is required.');
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmitVerification = async () => {
    setErrorMessage(null);
    if (!idNumber.trim()) {
      setErrorMessage('Government ID number is required.');
      return;
    }
    if (!hasUploadedId) {
      setErrorMessage('Please capture or upload a copy of your valid ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      const userId = currentUser.citizen_user_id || 1001;

      // Update citizen verification details in local store & active session
      LocalCitizenTable.update(userId, {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        suffix: suffix.trim() || null,
        registry_completed: 1,
        birth_date: birthDate,
        place_of_birth: placeOfBirth.trim(),
        civil_status: civilStatus,
        district: activeDistrict.shortName,
        barangay,
        street_address: streetAddress.trim(),
        years_resident: yearsResident.trim(),
        employment_status: employmentStatus,
        occupation,
        educational_attainment: educationalAttainment,
        valid_id_type: selectedIdType,
        valid_id_number: idNumber.trim(),
      });
    } catch (err) {
      console.warn('Citizen Registry verification error:', err);
    } finally {
      setIsSubmitting(false);
      setCurrentStep(4);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: dmBg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Navigation */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButton, isDarkMode && { backgroundColor: '#1C2541' }]}
              onPress={() => router.replace('/(tabs)' as any)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Back to Dashboard"
            >
              <IconSymbol name="chevron.left" size={20} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: dmText }]}>Verify Citizenship</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>

          {/* Banner */}
          {currentStep < 4 && (
            <View
              style={[
                styles.bannerCard,
                { backgroundColor: isDarkMode ? '#0284C7' : '#176B87' },
              ]}
            >
              <View style={styles.bannerIconWrapper}>
                <IconSymbol name="checkmark.seal.fill" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.bannerTextWrapper}>
                <Text style={styles.bannerTitle}>Official Citizen Verification</Text>
                <Text style={styles.bannerSubtitle}>
                  Verify your Caloocan City citizen account to access civic services and clearances.
                </Text>
              </View>
            </View>
          )}

          {/* Step Indicators */}
          {currentStep < 4 && (
            <View style={styles.stepIndicatorRow}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 1 && styles.stepCircleActive,
                    currentStep > 1 && styles.stepCircleCompleted,
                  ]}
                >
                  {currentStep > 1 ? (
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === 1 && styles.stepNumberActive]}>
                      1
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                  Personal
                </Text>
              </View>

              <View
                style={[
                  styles.stepConnector,
                  currentStep >= 2 && styles.stepConnectorActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 2 && styles.stepCircleActive,
                    currentStep > 2 && styles.stepCircleCompleted,
                  ]}
                >
                  {currentStep > 2 ? (
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === 2 && styles.stepNumberActive]}>
                      2
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                  Residency
                </Text>
              </View>

              <View
                style={[
                  styles.stepConnector,
                  currentStep >= 3 && styles.stepConnectorActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 3 && styles.stepCircleActive,
                  ]}
                >
                  <Text style={[styles.stepNumber, currentStep === 3 && styles.stepNumberActive]}>
                    3
                  </Text>
                </View>
                <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>
                  Valid ID
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Personal Information</Text>

              {/* Pre-filled Account Info Badge */}
              {isPrefilled && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#152E52' : '#E0F2FE',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#0369A1' : '#BAE6FD',
                  }}
                >
                  <IconSymbol name="checkmark.circle.fill" size={15} color="#0284C7" />
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '600',
                      color: isDarkMode ? '#7DD3FC' : '#0369A1',
                      flex: 1,
                    }}
                  >
                    Details pre-filled from your registered citizen account
                  </Text>
                </View>
              )}

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  First Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Juan"
                  placeholderTextColor="#94A3B8"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              {/* Middle Name & Suffix */}
              <View style={styles.rowInputs}>
                <View style={[styles.rowItem, styles.inputGroup]}>
                  <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                    Middle Name
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                    placeholder="e.g. Santos"
                    placeholderTextColor="#94A3B8"
                    value={middleName}
                    onChangeText={setMiddleName}
                  />
                </View>
                <View style={[styles.rowItem, styles.inputGroup]}>
                  <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                    Suffix
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                    placeholder="Jr., III (opt.)"
                    placeholderTextColor="#94A3B8"
                    value={suffix}
                    onChangeText={setSuffix}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Last Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Dela Cruz"
                  placeholderTextColor="#94A3B8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Sex Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Sex
                </Text>
                <View style={styles.selectionGrid}>
                  {SEX_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chipItem,
                        sex === item && styles.chipItemActive,
                        isDarkMode && { backgroundColor: sex === item ? '#0369A1' : '#152238', borderColor: dmBorder },
                      ]}
                      onPress={() => setSex(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sex === item && styles.chipTextActive,
                          isDarkMode && { color: sex === item ? '#FFFFFF' : '#CBD5E1' },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Place of Birth */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Place of Birth
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Caloocan City / Manila"
                  placeholderTextColor="#94A3B8"
                  value={placeOfBirth}
                  onChangeText={setPlaceOfBirth}
                />
              </View>

              {/* Date of Birth Dropdown Calendar */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Date of Birth
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCalendarOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isCalendarOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => setIsCalendarOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconSymbol
                      name="calendar"
                      size={18}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.dropdownValueText, { color: dmText }]}>
                      {birthDate || 'Select Date of Birth'}
                    </Text>
                  </View>
                  <IconSymbol
                    name={isCalendarOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCalendarOpen && (
                  <View
                    style={[
                      styles.calendarCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {/* Calendar Month & Year Dropdown Selectors */}
                    <View style={styles.calendarSelectorsRow}>
                      {/* Previous Month */}
                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#152238' }]}
                        onPress={handlePrevMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.left" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>

                      {/* Month Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalMonthDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalMonthDropdownOpen ? '#0369A1' : '#152238', borderColor: dmBorder },
                        ]}
                        onPress={() => {
                          setIsCalMonthDropdownOpen((prev) => !prev);
                          setIsCalYearDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, { color: dmText }]}>
                          {MONTH_NAMES[calMonth]}
                        </Text>
                        <IconSymbol
                          name={isCalMonthDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={16}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      {/* Year Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalYearDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalYearDropdownOpen ? '#0369A1' : '#152238', borderColor: dmBorder },
                        ]}
                        onPress={() => {
                          setIsCalYearDropdownOpen((prev) => !prev);
                          setIsCalMonthDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, { color: dmText }]}>
                          {calYear}
                        </Text>
                        <IconSymbol
                          name={isCalYearDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={16}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      {/* Next Month */}
                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#152238' }]}
                        onPress={handleNextMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>
                    </View>

                    {/* Expandable Month Selection Grid */}
                    {isCalMonthDropdownOpen && (
                      <View
                        style={[
                          styles.calendarMonthGrid,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                        ]}
                      >
                        {MONTH_NAMES.map((mName, mIdx) => {
                          const isSelected = calMonth === mIdx;
                          return (
                            <TouchableOpacity
                              key={mName}
                              style={[
                                styles.calendarMonthGridCell,
                                isSelected && styles.calendarMonthGridCellActive,
                                isDarkMode && !isSelected && { backgroundColor: '#1C2541', borderColor: dmBorder },
                              ]}
                              onPress={() => {
                                setCalMonth(mIdx);
                                setIsCalMonthDropdownOpen(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarMonthGridText,
                                  isSelected && styles.calendarMonthGridTextActive,
                                  isDarkMode && !isSelected && { color: '#E2E8F0' },
                                ]}
                              >
                                {mName.slice(0, 3)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Expandable Year Selection Scrollable List */}
                    {isCalYearDropdownOpen && (
                      <ScrollView
                        style={[
                          styles.calendarYearDropdownContainer,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                        ]}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {YEAR_OPTIONS.map((yr) => {
                          const isSelected = calYear === yr;
                          return (
                            <TouchableOpacity
                              key={yr}
                              style={[
                                styles.calendarYearOption,
                                isSelected && styles.calendarYearOptionActive,
                                isDarkMode && !isSelected && { borderBottomColor: '#1C2541' },
                              ]}
                              onPress={() => {
                                setCalYear(yr);
                                setIsCalYearDropdownOpen(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarYearOptionText,
                                  isSelected && styles.calendarYearOptionTextActive,
                                  isDarkMode && !isSelected && { color: '#E2E8F0' },
                                ]}
                              >
                                {yr}
                              </Text>
                              {isSelected && (
                                <IconSymbol
                                  name="checkmark.circle.fill"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}

                    {/* Weekday Column Headers */}
                    <View style={[styles.calendarWeekRow, isDarkMode && { borderBottomColor: '#152238' }]}>
                      {WEEK_DAYS.map((wd, idx) => (
                        <Text key={idx} style={[styles.calendarWeekLabel, isDarkMode && { color: '#64748B' }]}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.calendarDaysGrid}>
                      {/* Empty padding cells for start of month */}
                      {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.calendarDayCell} />
                      ))}

                      {/* Day Number Cells */}
                      {Array.from({ length: daysInCalMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const mm = String(calMonth + 1).padStart(2, '0');
                        const dd = String(dayNum).padStart(2, '0');
                        const isSelected = birthDate === `${calYear}-${mm}-${dd}`;

                        return (
                          <TouchableOpacity
                            key={`day-${dayNum}`}
                            style={[
                              styles.calendarDayCell,
                              isSelected && styles.calendarDayCellActive,
                            ]}
                            onPress={() => handleSelectDay(dayNum)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isDarkMode && { color: '#F1F5F9' },
                                isSelected && styles.calendarDayTextActive,
                              ]}
                            >
                              {dayNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Civil Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Civil Status
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCivilStatusDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isCivilStatusDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsCivilStatusDropdownOpen((prev) => !prev);
                    setIsCalendarOpen(false);
                    setIsEmploymentDropdownOpen(false);
                    setIsOccupationDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {civilStatus}
                  </Text>
                  <IconSymbol
                    name={isCivilStatusDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCivilStatusDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {CIVIL_STATUS_OPTIONS.map((status) => {
                      const isSelected = civilStatus === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#2B3958' },
                            isDarkMode && isSelected && { backgroundColor: '#152E52' },
                          ]}
                          onPress={() => {
                            setCivilStatus(status);
                            setIsCivilStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#38BDF8' : '#E2E8F0' },
                            ]}
                          >
                            {status}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#38BDF8' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* SECTION HEADER: DEMOGRAPHIC INFORMATION */}
              <View style={{ marginTop: 18, marginBottom: 12, borderTopWidth: 1, borderTopColor: dmBorder, paddingTop: 16 }}>
                <Text style={[styles.cardTitle, { color: dmText, marginBottom: 4 }]}>
                  Demographic Information
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  City census and socioeconomic profile details
                </Text>
              </View>

              {/* 1. Employment Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Employment Status
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isEmploymentDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isEmploymentDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsEmploymentDropdownOpen((prev) => !prev);
                    setIsOccupationDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: employmentStatus ? dmText : '#94A3B8' },
                    ]}
                  >
                    {employmentStatus || 'Select Employment Status'}
                  </Text>
                  <IconSymbol
                    name={isEmploymentDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isEmploymentDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {EMPLOYMENT_STATUS_OPTIONS.map((item) => {
                      const isSelected = employmentStatus === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setEmploymentStatus(item);
                            setIsEmploymentDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 2. Occupation Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Occupation / Field of Work
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isOccupationDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isOccupationDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsOccupationDropdownOpen((prev) => !prev);
                    setIsEmploymentDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: occupation ? dmText : '#94A3B8' },
                    ]}
                  >
                    {occupation || 'Select Occupation / Field of Work'}
                  </Text>
                  <IconSymbol
                    name={isOccupationDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isOccupationDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {OCCUPATION_OPTIONS.map((item) => {
                      const isSelected = occupation === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setOccupation(item);
                            setIsOccupationDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 3. Educational Attainment Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Educational Attainment
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isEducationDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isEducationDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsEducationDropdownOpen((prev) => !prev);
                    setIsEmploymentDropdownOpen(false);
                    setIsOccupationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: educationalAttainment ? dmText : '#94A3B8' },
                    ]}
                  >
                    {educationalAttainment || 'Select Educational Attainment'}
                  </Text>
                  <IconSymbol
                    name={isEducationDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isEducationDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {EDUCATIONAL_ATTAINMENT_OPTIONS.map((item) => {
                      const isSelected = educationalAttainment === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setEducationalAttainment(item);
                            setIsEducationDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextStep1}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next: Residency</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: Barangay & Residency */}
          {currentStep === 2 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Caloocan Residency & District</Text>

              {/* Caloocan District Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Select Caloocan Legislative District
                </Text>
                <View style={styles.districtCardGrid}>
                  {CALOOCAN_DISTRICTS.map((district) => {
                    const isSelected = selectedDistrictId === district.id;
                    return (
                      <TouchableOpacity
                        key={district.id}
                        style={[
                          styles.districtCard,
                          isSelected && styles.districtCardActive,
                          isDarkMode && {
                            backgroundColor: isSelected ? '#0369A1' : '#152238',
                            borderColor: isSelected ? '#38BDF8' : dmBorder,
                          },
                        ]}
                        onPress={() => handleSelectDistrict(district)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.districtCardHeader}>
                          <Text
                            style={[
                              styles.districtCardTitle,
                              isSelected && styles.districtCardTitleActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#F1F5F9' },
                            ]}
                          >
                            {district.name}
                          </Text>
                          <View
                            style={[
                              styles.districtBadge,
                              isSelected && styles.districtBadgeActive,
                              isDarkMode && !isSelected && { backgroundColor: '#334155' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.districtBadgeText,
                                isSelected && styles.districtBadgeTextActive,
                                isDarkMode && !isSelected && { color: '#94A3B8' },
                              ]}
                            >
                              {district.barangayCount} Barangays
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.districtCardDesc,
                            isDarkMode && { color: isSelected ? '#E0F2FE' : '#94A3B8' },
                          ]}
                        >
                          {district.areaDescription}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Barangay Dropdown Trigger (Filtered by selected district) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Barangay (in {activeDistrict.shortName})
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: dmInputBg, borderColor: dmBorder },
                  ]}
                  onPress={() => setIsBarangayPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {barangay}
                  </Text>
                  <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
                <Text style={[styles.dropdownHintText, isDarkMode && { color: '#94A3B8' }]}>
                  Tap to search and select from {activeDistrict.barangayCount} barangays in {activeDistrict.shortName}
                </Text>
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Street Address / House No.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Block 4 Lot 12 Sampaguita St."
                  placeholderTextColor="#94A3B8"
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                />
              </View>

              {/* Years of Residency */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Years of Residency in Caloocan City
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. 5"
                  placeholderTextColor="#94A3B8"
                  value={yearsResident}
                  onChangeText={setYearsResident}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextStep2}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next: Valid ID</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Valid ID & Document Verification */}
          {currentStep === 3 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Government ID Verification</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Select Primary Valid ID
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isIdTypeDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isIdTypeDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => setIsIdTypeDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {selectedIdType}
                  </Text>
                  <IconSymbol
                    name={isIdTypeDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isIdTypeDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {VALID_ID_TYPES.map((idType) => {
                      const isSelected = selectedIdType === idType;
                      return (
                        <TouchableOpacity
                          key={idType}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setSelectedIdType(idType);
                            setIsIdTypeDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {idType}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  {selectedIdType} Number
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder={`Enter ${selectedIdType} number`}
                  placeholderTextColor="#94A3B8"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>

              {/* Valid ID Photo Upload or Camera Capture */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Upload Front of ID Card
                </Text>
                
                {idImageUri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <Image source={{ uri: idImageUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>ID Photo Attached</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('id')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('id')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                    ]}
                    onPress={() => handleOpenPhotoPicker('id')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      name="person.text.rectangle.fill"
                      size={34}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.uploadTitle, { color: dmText }]}>
                      Tap to Upload or Capture ID
                    </Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                      Choose camera photo or upload from photo gallery
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Liveness & Face Verification */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Liveness & Face Verification
                </Text>

                {selfieImageUri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <Image source={{ uri: selfieImageUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>Selfie Verified</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('selfie')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('selfie')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                    ]}
                    onPress={() => handleOpenPhotoPicker('selfie')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      name="sparkles"
                      size={34}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.uploadTitle, { color: dmText }]}>
                      Perform Quick Facial Match
                    </Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                      Take a selfie to match with your government ID
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                  onPress={() => setCurrentStep(2)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmitVerification}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Submit Verification</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Success / Confirmation Screen */}
          {currentStep === 4 && (
            <View
              style={[
                styles.card,
                styles.successContainer,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <View style={styles.successIconBadge}>
                <IconSymbol name="checkmark.seal.fill" size={44} color="#10B981" />
              </View>

              <Text style={[styles.successTitle, { color: dmText }]}>
                Verification Submitted!
              </Text>
              <Text style={[styles.successMessage, isDarkMode && { color: '#CBD5E1' }]}>
                Your citizen credentials for <Text style={{ fontWeight: '700' }}>{firstName} {lastName}</Text> have been securely submitted to the Caloocan City Civil & Barangay Registry.
              </Text>

              <View
                style={[
                  styles.infoBox,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#0369A1' },
                ]}
              >
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Sex:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{sex}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Place of Birth:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{placeOfBirth}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Employment:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{employmentStatus}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Occupation:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{occupation}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Education:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{educationalAttainment}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>District:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{activeDistrict.shortName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Barangay:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{barangay}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Document Type:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{selectedIdType}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Estimated Review:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>15 - 30 minutes</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { width: '100%' }]}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL: Search & Select Barangay from Active District */}
      <Modal
        visible={isBarangayPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBarangayPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && { backgroundColor: '#1C2541' }]}>
            <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#3A506B' }]}>
              <View>
                <Text style={[styles.modalTitle, { color: dmText }]}>
                  Select Barangay
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  {activeDistrict.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsBarangayPickerVisible(false);
                  setBarangaySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="cross.case.fill" size={20} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Search Input in Modal */}
            <View style={[styles.modalSearchBox, isDarkMode && { backgroundColor: '#152238' }]}>
              <IconSymbol name="magnifyingglass" size={18} color="#94A3B8" />
              <TextInput
                style={[styles.modalSearchInput, { color: dmText }]}
                placeholder="Search barangay number..."
                placeholderTextColor="#94A3B8"
                value={barangaySearchQuery}
                onChangeText={setBarangaySearchQuery}
                keyboardType="numeric"
                autoFocus={false}
              />
            </View>

            {/* List of filtered Barangays */}
            <FlatList
              data={filteredBarangays}
              keyExtractor={(item) => item}
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  No barangay found matching "{barangaySearchQuery}" in {activeDistrict.shortName}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = barangay === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalListItem,
                      isSelected && styles.modalListItemActive,
                      isDarkMode && { borderBottomColor: '#152238' },
                      isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                    ]}
                    onPress={() => {
                      setBarangay(item);
                      setIsBarangayPickerVisible(false);
                      setBarangaySearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalListItemText,
                        isSelected && styles.modalListItemTextActive,
                        isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <IconSymbol name="checkmark.circle.fill" size={18} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Photo Source Picker Modal (Camera vs Photo Library) */}
      <Modal
        visible={isPhotoPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPhotoPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={[styles.pickerModalContent, isDarkMode && { backgroundColor: '#1C2541' }]}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, isDarkMode && { color: '#FFFFFF' }]}>
                {photoPickerTarget === 'id' ? 'Attach Valid ID Photo' : 'Facial Liveness Selfie'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsPhotoPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.pickerModalSubtitle, isDarkMode && { color: '#94A3B8' }]}>
              {photoPickerTarget === 'id'
                ? 'Select how you want to upload your government-issued ID'
                : 'Take a clear selfie to match your registered face biometrics'}
            </Text>

            <View style={styles.pickerOptionsList}>
              {/* Option 1: Take Photo with Camera */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionBtn,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                ]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, isDarkMode && { backgroundColor: '#0369A1' }]}>
                  <IconSymbol name="camera.fill" size={22} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionLabel, isDarkMode && { color: '#FFFFFF' }]}>
                    Take Photo with Camera
                  </Text>
                  <Text style={[styles.pickerOptionDesc, isDarkMode && { color: '#94A3B8' }]}>
                    Use your device camera to take a new picture
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
              </TouchableOpacity>

              {/* Option 2: Upload from Photo Gallery */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionBtn,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                ]}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, isDarkMode && { backgroundColor: '#0369A1' }]}>
                  <IconSymbol name="photo.fill" size={22} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionLabel, isDarkMode && { color: '#FFFFFF' }]}>
                    Choose from Photo Gallery
                  </Text>
                  <Text style={[styles.pickerOptionDesc, isDarkMode && { color: '#94A3B8' }]}>
                    Select an existing photo from your albums
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.pickerCancelBtn, isDarkMode && { backgroundColor: '#152238' }]}
              onPress={() => setIsPhotoPickerVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.pickerCancelText, isDarkMode && { color: '#CBD5E1' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

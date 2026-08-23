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

export const APPLICATION_TYPES = [
  { id: 'New Application', label: 'New Application', desc: 'First time applicant for Caloocan Citizen ID' },
  { id: 'Renewal', label: 'Renewal', desc: 'Renew an expiring or expired Citizen ID' },
  { id: 'Replacement', label: 'Replacement', desc: 'Replace lost, damaged, stolen, or updated ID' },
] as const;

export const REPLACEMENT_REASONS = [
  { id: 'Lost', label: 'Lost', desc: 'Affidavit of Loss required upon claiming' },
  { id: 'Damaged', label: 'Damaged', desc: 'Surrender damaged ID upon release' },
  { id: 'Stolen', label: 'Stolen', desc: 'Police blotter or theft incident report' },
  { id: 'Personal information correction', label: 'Personal information correction', desc: 'Supporting civil registry document required' },
] as const;

export const CITIZEN_ID_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Application filed online' },
  { id: 'under_review', label: 'Under Review', desc: 'Civil registry evaluating documents' },
  { id: 'processing', label: 'Processing', desc: 'Card printing & cryptographic chip coding' },
  { id: 'ready_release', label: 'Ready for Release', desc: 'Available at designated City Hall counter' },
  { id: 'completed', label: 'Completed', desc: 'Citizen ID claimed & activated' },
] as const;

export default function CitizenIdApplicationScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Application Type State
  const [appType, setAppType] = useState<string>(APPLICATION_TYPES[0].id);
  const [replacementReason, setReplacementReason] = useState<string>(REPLACEMENT_REASONS[0].id);
  const [replacementDetails, setReplacementDetails] = useState('');
  const [oldIdNumber, setOldIdNumber] = useState('');

  // Citizen Information State
  const [firstName, setFirstName] = useState('Danny');
  const [middleName, setMiddleName] = useState('Toledano');
  const [lastName, setLastName] = useState('Espelita');
  const [suffix, setSuffix] = useState('Jr');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Single');

  // Address & Barangay State
  const [streetAddress, setStreetAddress] = useState('Block 12 Lot 5, Sampaguita St.');
  const [barangay, setBarangay] = useState('Barangay 171 (Bagumbong)');

  // Contact Information State
  const [phone, setPhone] = useState('09171234567');
  const [email, setEmail] = useState('danny.resident@caloocan.ph');

  // Requirements Upload State
  const [idDocFile, setIdDocFile] = useState<{ name: string; size: string } | null>({
    name: 'philsys_national_id.pdf',
    size: '1.2 MB',
  });
  const [supportDocFile, setSupportDocFile] = useState<{ name: string; size: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<{ name: string; size: string } | null>({
    name: '2x2_formal_id_photo.jpg',
    size: '420 KB',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
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

  // Pre-load Citizen details
  useEffect(() => {
    async function loadCitizen() {
      try {
        const session = AuthService.getCurrentUser();
        if (session.user) {
          const u = session.user;
          if (u.first_name) setFirstName(u.first_name);
          if (u.middle_name) setMiddleName(u.middle_name);
          if (u.last_name) setLastName(u.last_name);
          if (u.suffix) setSuffix(u.suffix);
          if (u.email) setEmail(u.email);
          if (u.mobile_number) setPhone(u.mobile_number);
        }

        const res = await ProfileService.getProfile(session.email || undefined, session.citizen_user_id || undefined);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          if (d.birthDate) setBirthDate(d.birthDate);
          if (d.civilStatus) setCivilStatus(d.civilStatus);
          if (d.barangay) setBarangay(d.barangay);
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
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
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

  const handleSubmitApplication = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your complete legal name.');
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
      Alert.alert('Missing Requirement', 'Please upload a copy of your valid identification document.');
      return;
    }
    if (!photoFile) {
      Alert.alert('Missing Requirement', 'Please upload your 2x2 ID photo.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const ref = `CAL-ID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      setSubmittedData({
        referenceNumber: ref,
        applicationStatus: 'Submitted (Pending Review)',
        submissionDate: dateStr,
        applicationType: appType,
        processingUpdates:
          'Your Citizen ID application has been forwarded to the Caloocan City Civil Registry & Identity Management Bureau. Digital credentials will be issued upon clearance.',
        releaseClaimInfo: {
          claimCenter:
            barangay.includes('District 1') || barangay.includes('Bagumbong') || barangay.includes('Bagong Silang')
              ? 'Caloocan City Hall Extension (North) - Citizen Card Counter 2'
              : 'Caloocan Main City Hall Complex (South) - Civil Registry Release Window 6',
          estimatedDays: '3 to 5 Business Days',
          claimRequirements:
            appType === 'Replacement'
              ? 'Present 1 primary valid ID, proof of fee payment, and Affidavit of Loss / Damaged ID surrender stub.'
              : 'Present 1 original valid ID document and this digital claim voucher barcode.',
        },
      });
    }, 900);
  };

  const handleReset = () => {
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

        {!submittedData ? (
          <>
            {/* 1. SERVICE TITLE & SHORT EXPLANATION BANNER */}
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
                <Badge label="IDENTITY & PASS" variant="info" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Citizen ID Application
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Apply for an official Caloocan City Digital & Physical Citizen ID Card to unlock municipal benefits, priority healthcare, and social welfare grants.
              </Text>
            </View>

            {/* 2. MAIN APPLICATION FORM */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* SECTION: ID APPLICATION TYPE */}
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                1. ID Application Type
              </Text>
              <View style={styles.appTypeGrid}>
                {APPLICATION_TYPES.map((t) => {
                  const isSelected = appType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.appTypeCard,
                        isSelected && styles.appTypeCardSelected,
                        isDarkMode && { backgroundColor: '#152238', borderColor: isSelected ? '#0284C7' : '#3A506B' },
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
                      Previous Citizen ID Number (If Known)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder="e.g. CAL-ID-2023-4512"
                      placeholderTextColor="#94A3B8"
                      value={oldIdNumber}
                      onChangeText={setOldIdNumber}
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION: CITIZEN INFORMATION */}
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                2. Citizen Information
              </Text>

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
                    onChangeText={setFirstName}
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
                    onChangeText={setMiddleName}
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
                    onChangeText={setLastName}
                  />
                </View>

                <View style={[styles.inputGroup, { width: 80 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Suffix
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={suffix}
                    onChangeText={setSuffix}
                  />
                </View>
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
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION: ADDRESS & BARANGAY */}
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                3. Current Address & Barangay
              </Text>

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
                  onChangeText={setBarangay}
                  placeholder="e.g. Barangay 171 (Bagumbong)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.divider} />

              {/* SECTION: CONTACT INFORMATION */}
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                4. Contact Information
              </Text>

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
                    Email Address *
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

              {/* SECTION: REQUIREMENTS UPLOAD */}
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                5. Requirements Upload
              </Text>

              {/* Requirement 1: Valid ID Document */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    Valid Identification Document *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  Govt ID, PSA Birth Certificate, Passport, UMID, or Voter's Certificate
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
                      Upload Identification Document (PDF/JPG)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 2: Supporting Documents */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    Supporting Documents (If Required)
                  </Text>
                  <Text style={[styles.reqBadge, { backgroundColor: '#F1F5F9', color: '#64748B' }]}>
                    Optional
                  </Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  Barangay Certificate of Residency, Utility Bill, or Affidavit of Loss
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
                      Upload Supporting Document (Optional)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 3: 2x2 Photo */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    2x2 ID Photo *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  Clear formal front-facing portrait with white background
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
                      Upload 2x2 Photo (JPG/PNG)
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
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* 3. POST-SUBMISSION RESULTS VIEW */
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Application Filed Successfully
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your Citizen ID application is now being processed by Caloocan Civil Registry.
            </Text>

            {/* Reference & Application Meta Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Application / Reference Number</Text>
                <Badge label="IN REVIEW" variant="warning" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

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
                  Processing Updates
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
                  Release & Claim Information
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

            {/* Citizen ID Status Progression Timeline */}
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
                Submitted → Under Review → Processing → Ready for Release → Completed
              </Text>

              <View style={styles.timelineList}>
                {CITIZEN_ID_STAGES.map((stage, idx) => {
                  const isDone = idx === 0; // Submitted is done
                  const isCurrent = idx === 1; // Under Review is active
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
                style={styles.anotherBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>File Another Application</Text>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
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
    width: '45%',
  },
  claimVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    width: '53%',
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
});

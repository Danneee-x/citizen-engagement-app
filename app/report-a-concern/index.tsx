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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';

export const CONCERN_CATEGORIES = [
  'Road & Infrastructure',
  'Garbage & Waste',
  'Flooding & Drainage',
  'Streetlights',
  'Public Safety',
  'Environment',
  'Government Service',
  'Other',
] as const;

export const CONCERN_TIMELINE_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Concern filed into system' },
  { id: 'ai_analyzed', label: 'AI Analyzed', desc: 'Processed by Gemini AI' },
  { id: 'routed', label: 'Automatically Routed', desc: 'Dispatched to department' },
  { id: 'under_review', label: 'Under Review', desc: 'Assigned to action officer' },
  { id: 'in_progress', label: 'In Progress', desc: 'Field unit deployed' },
  { id: 'resolved', label: 'Resolved', desc: 'Issue resolved with evidence' },
  { id: 'closed', label: 'Closed', desc: 'Citizen feedback recorded' },
] as const;

export default function ReportConcernScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Form Fields
  const [selectedCategory, setSelectedCategory] = useState<string>(CONCERN_CATEGORIES[0]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [barangay, setBarangay] = useState('Barangay 171 (Bagumbong)');
  const [isGpsPinned, setIsGpsPinned] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<string | null>(null);

  // Contact Info
  const [contactName, setContactName] = useState('Danny Espelita Jr');
  const [contactPhone, setContactPhone] = useState('09171234567');
  const [contactEmail, setContactEmail] = useState('danny.resident@caloocan.ph');

  // File / Photo Uploads
  const [photos, setPhotos] = useState<{ id: string; name: string; size: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission Result State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    submissionDate: string;
    currentStatus: string;
    detectedCategory: string;
    priority: string;
    similarConcerns: string;
    recommendedDepartment: string;
    confidenceScore: string;
  } | null>(null);

  // Pre-load Citizen details
  useEffect(() => {
    async function loadCitizen() {
      try {
        const session = AuthService.getCurrentUser();
        if (session.user) {
          const u = session.user;
          setContactName(`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Danny Espelita Jr');
          setContactEmail(u.email || 'danny.resident@caloocan.ph');
          setContactPhone(u.mobile_number || '09171234567');
        }

        const res = await ProfileService.getProfile(session.email || undefined, session.citizen_user_id || undefined);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          if (d.fullName) setContactName(d.fullName);
          if (d.phone) setContactPhone(d.phone);
          if (d.email) setContactEmail(d.email);
          if (d.barangay) setBarangay(d.barangay);
          if (d.address) setLocation(d.address);
        }
      } catch (err) {
        console.warn('Citizen profile fetch error:', err);
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

  const handleToggleGps = () => {
    if (!isGpsPinned) {
      setIsGpsPinned(true);
      setGpsCoords('14.7565° N, 121.0437° E (Caloocan North)');
    } else {
      setIsGpsPinned(false);
      setGpsCoords(null);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow photo gallery access to upload attachments.');
        return;
      }

      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotos((prev) => [
          ...prev,
          {
            id: `p-${Date.now()}`,
            name: asset.fileName || `evidence_photo_${prev.length + 1}.jpg`,
            size: `${Math.round((asset.fileSize || 1024 * 650) / 1024)} KB`,
          },
        ]);
      }
    } catch (err) {
      console.warn('Picker error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmitConcern = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your concern.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a detailed description.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please provide the location of the concern.');
      return;
    }

    setIsSubmitting(true);

    // AI routing & analysis simulation
    setTimeout(() => {
      setIsSubmitting(false);

      const ref = `CAL-REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      const textCombo = (title + ' ' + description + ' ' + selectedCategory).toLowerCase();
      let detectedCategory = selectedCategory;
      let priority = 'Medium';
      let recommendedDepartment = 'Caloocan Public Assistance Bureau';
      let confidenceScore = '95% - Gemini AI Multi-Modal Engine';
      let similarConcerns = '2 similar concerns detected nearby';

      if (
        textCombo.includes('garbage') ||
        textCombo.includes('waste') ||
        textCombo.includes('trash') ||
        textCombo.includes('dump') ||
        selectedCategory === 'Garbage & Waste'
      ) {
        detectedCategory = 'Garbage & Waste Management';
        priority = 'Medium';
        recommendedDepartment = 'Environmental / Waste Management Department';
        confidenceScore = '97% - Gemini AI Multi-Modal Engine';
        similarConcerns = '2 similar concerns found within 250m';
      } else if (
        textCombo.includes('road') ||
        textCombo.includes('pothole') ||
        textCombo.includes('bridge') ||
        textCombo.includes('crack') ||
        selectedCategory === 'Road & Infrastructure'
      ) {
        detectedCategory = 'Road & Infrastructure Repairs';
        priority = 'High';
        recommendedDepartment = 'City Engineering & Public Works Office';
        confidenceScore = '98% - Gemini AI Multi-Modal Engine';
        similarConcerns = '1 duplicate report merged';
      } else if (
        textCombo.includes('flood') ||
        textCombo.includes('drain') ||
        textCombo.includes('canal') ||
        textCombo.includes('waterlog') ||
        selectedCategory === 'Flooding & Drainage'
      ) {
        detectedCategory = 'Flooding & Drainage Maintenance';
        priority = 'High';
        recommendedDepartment = 'Caloocan Flood Control & Drainage Bureau';
        confidenceScore = '96% - Gemini AI Multi-Modal Engine';
        similarConcerns = '3 related flood tickets detected';
      } else if (
        textCombo.includes('light') ||
        textCombo.includes('dark') ||
        textCombo.includes('lamp') ||
        textCombo.includes('post') ||
        selectedCategory === 'Streetlights'
      ) {
        detectedCategory = 'Streetlighting & Public Electrical';
        priority = 'Medium';
        recommendedDepartment = 'Public Safety Electrical Division';
        confidenceScore = '94% - Gemini AI Multi-Modal Engine';
        similarConcerns = 'No duplicate reports found';
      } else if (
        textCombo.includes('safety') ||
        textCombo.includes('police') ||
        textCombo.includes('hazard') ||
        textCombo.includes('theft') ||
        selectedCategory === 'Public Safety'
      ) {
        detectedCategory = 'Public Safety & Peace Order';
        priority = 'Urgent';
        recommendedDepartment = 'Caloocan Public Safety & Police Bureau (CPTMD)';
        confidenceScore = '99% - Gemini AI Multi-Modal Engine';
        similarConcerns = 'Immediate dispatch alert generated';
      } else if (
        textCombo.includes('tree') ||
        textCombo.includes('smoke') ||
        textCombo.includes('pollution') ||
        selectedCategory === 'Environment'
      ) {
        detectedCategory = 'Environmental Protection & Natural Resources';
        priority = 'Medium';
        recommendedDepartment = 'City Environment & Natural Resources Office';
        confidenceScore = '93% - Gemini AI Multi-Modal Engine';
        similarConcerns = '1 related environmental ticket';
      }

      setSubmittedData({
        referenceNumber: ref,
        submissionDate: dateStr,
        currentStatus: 'AI Analyzed & Automatically Routed',
        detectedCategory,
        priority,
        similarConcerns,
        recommendedDepartment,
        confidenceScore,
      });
    }, 850);
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setPhotos([]);
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
                <View style={styles.iconCircle}>
                  <IconSymbol name="megaphone.fill" size={24} color="#DC2626" />
                </View>
                <Badge label="REPORT & GRIEVANCE" variant="danger" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Report a Concern
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Submit complaints, community issues, service concerns, and public safety reports directly to the appropriate Caloocan City government office.
              </Text>
            </View>

            {/* 2. CONCERN FORM CARD */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* Concern Category */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Concern Category *
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCategoryDropdownOpen && styles.dropdownTriggerActive,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                  ]}
                  onPress={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, isDarkMode && { color: '#F8FAFC' }]}>
                    {selectedCategory}
                  </Text>
                  <IconSymbol
                    name={isCategoryDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={16}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                  >
                    {CONCERN_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.dropdownOption,
                          selectedCategory === cat && styles.dropdownOptionActive,
                          isDarkMode && { borderBottomColor: '#2B3958' },
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedCategory === cat && styles.dropdownOptionTextActive,
                            isDarkMode && { color: selectedCategory === cat ? '#38BDF8' : '#E2E8F0' },
                          ]}
                        >
                          {cat}
                        </Text>
                        {selectedCategory === cat && (
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#DC2626" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Concern Title */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Concern Title *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="e.g. Uncollected garbage along Camarin Road"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Detailed Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Detailed Description *
                </Text>
                <TextInput
                  style={[
                    styles.textInputArea,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="Describe the issue in detail, how long it has been occurring, landmarks, and any hazards..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Location of the Concern */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Location of the Concern *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="e.g. Corner of Sampaguita St. and Camarin Road"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Barangay */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Barangay *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="e.g. Barangay 171 (Bagumbong)"
                  placeholderTextColor="#94A3B8"
                  value={barangay}
                  onChangeText={setBarangay}
                />
              </View>

              {/* Optional GPS / Location Pin */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  GPS / Location Pin (Optional)
                </Text>
                <TouchableOpacity
                  style={[
                    styles.gpsButton,
                    isGpsPinned && styles.gpsButtonActive,
                    isDarkMode && {
                      backgroundColor: isGpsPinned ? '#0C4A6E' : '#152238',
                      borderColor: '#3A506B',
                    },
                  ]}
                  onPress={handleToggleGps}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    name="location.fill"
                    size={18}
                    color={isGpsPinned ? '#38BDF8' : '#0284C7'}
                  />
                  <Text
                    style={[
                      styles.gpsButtonText,
                      isGpsPinned && { color: '#38BDF8', fontWeight: '800' },
                      isDarkMode && !isGpsPinned && { color: '#CBD5E1' },
                    ]}
                  >
                    {isGpsPinned ? `Pinned: ${gpsCoords}` : 'Pin Current GPS Coordinates'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Upload Photos or Supporting Files */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Upload Photos or Supporting Files
                </Text>

                {photos.length > 0 && (
                  <View style={styles.photosList}>
                    {photos.map((p) => (
                      <View
                        key={p.id}
                        style={[
                          styles.photoItem,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                        ]}
                      >
                        <IconSymbol name="photo.fill" size={16} color="#0284C7" />
                        <Text
                          style={[styles.photoName, isDarkMode && { color: '#F8FAFC' }]}
                          numberOfLines={1}
                        >
                          {p.name} ({p.size})
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemovePhoto(p.id)}
                          style={styles.removeBtn}
                        >
                          <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                  ]}
                  onPress={handlePickPhoto}
                  disabled={isUploading}
                  activeOpacity={0.8}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <>
                      <IconSymbol name="camera.fill" size={20} color="#DC2626" />
                      <Text
                        style={[styles.uploadBoxText, isDarkMode && { color: '#F8FAFC' }]}
                      >
                        Attach Photo Evidence or Supporting Documents
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Contact Information */}
              <View style={styles.divider} />
              <Text style={[styles.sectionHeading, isDarkMode && { color: '#F8FAFC' }]}>
                Contact Information
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Citizen Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={contactName}
                  onChangeText={setContactName}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Mobile Number
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={contactPhone}
                    onChangeText={setContactPhone}
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
                    value={contactEmail}
                    onChangeText={setContactEmail}
                  />
                </View>
              </View>

              {/* Submit Concern Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitConcern}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Concern</Text>
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
              Concern Successfully Filed
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your report has been logged and queued for automatic city routing.
            </Text>

            {/* Reference & Status Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Reference Number</Text>
                <Badge label="ACTIVE" variant="info" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submission Date:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.submissionDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Current Status:</Text>
                <Text style={[styles.metaVal, { color: '#10B981', fontWeight: '800' }]}>
                  {submittedData.currentStatus}
                </Text>
              </View>
            </View>

            {/* Gemini AI Analysis Card */}
            <View
              style={[
                styles.aiCard,
                isDarkMode && { backgroundColor: '#152238', borderColor: '#0284C7' },
              ]}
            >
              <View style={styles.aiHeaderRow}>
                <View style={styles.aiBadge}>
                  <IconSymbol name="sparkles" size={14} color="#0284C7" />
                  <Text style={styles.aiBadgeText}>Gemini AI Analysis</Text>
                </View>
                <Text style={styles.aiScoreText}>Score: 96%</Text>
              </View>

              <View style={styles.aiGrid}>
                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Detected Category:</Text>
                  <Text style={[styles.aiValue, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.detectedCategory}
                  </Text>
                </View>

                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Priority / Urgency:</Text>
                  <Text style={[styles.aiValue, { color: '#DC2626', fontWeight: '800' }]}>
                    {submittedData.priority} Priority
                  </Text>
                </View>

                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Similar Concerns Detected:</Text>
                  <Text style={[styles.aiValue, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.similarConcerns}
                  </Text>
                </View>

                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Recommended Department:</Text>
                  <Text
                    style={[
                      styles.aiValue,
                      { color: '#0284C7', fontWeight: '800' },
                      isDarkMode && { color: '#38BDF8' },
                    ]}
                  >
                    {submittedData.recommendedDepartment}
                  </Text>
                </View>

                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>AI Confidence Score:</Text>
                  <Text style={[styles.aiValue, { color: '#10B981', fontWeight: '700' }]}>
                    {submittedData.confidenceScore}
                  </Text>
                </View>
              </View>
            </View>

            {/* Concern Lifecycle Progression Timeline */}
            <View
              style={[
                styles.timelineCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.timelineHeading, isDarkMode && { color: '#F8FAFC' }]}>
                Concern Tracking Timeline
              </Text>
              <Text style={[styles.timelineSubheading, isDarkMode && { color: '#94A3B8' }]}>
                Submitted → AI Analyzed → Automatically Routed → Under Review → In Progress → Resolved → Closed
              </Text>

              <View style={styles.timelineList}>
                {CONCERN_TIMELINE_STAGES.map((stage, idx) => {
                  const isDone = idx <= 1; // Submitted & AI Analyzed are complete
                  const isCurrent = idx === 2; // Automatically Routed is active
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
                        {idx < CONCERN_TIMELINE_STAGES.length - 1 && (
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
                          {isCurrent && ' (Active)'}
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
                onPress={handleResetForm}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>File Another Concern</Text>
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
    backgroundColor: '#FEE2E2',
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
  inputGroup: {
    marginBottom: 14,
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0F172A',
  },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  dropdownValueText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionActive: {
    backgroundColor: '#FEE2E2',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  gpsButtonActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  gpsButtonText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
    flex: 1,
  },
  photosList: {
    gap: 8,
    marginBottom: 10,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  photoName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  removeBtn: {
    padding: 6,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#DC2626',
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

  /* Post submission styles */
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
  aiCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  aiScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  aiGrid: {
    gap: 8,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  aiLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    width: '45%',
  },
  aiValue: {
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

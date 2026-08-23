import React, { useState } from 'react';
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

export const MUNICIPAL_SERVICES = [
  'Education & Scholarship Portal',
  'Citizen ID Application',
  'Certificate & Document Requests',
  'Report a Concern / Grievance',
  'Business Permit & Licensing (BPLO)',
  'Real Property Tax (RPT)',
  'Health & Medical Clinic Services',
  'Social Welfare & Relief Aid',
  'Zoning & Housing Clearance',
  'Transport & Mobility Services',
  'Public Facilities & Reservations',
  'General City Hall & Customer Assistance',
  'Other Municipal Service',
];

export const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function CommunityFeedbackScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Form State
  const [selectedService, setSelectedService] = useState(MUNICIPAL_SERVICES[0]);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Star Ratings (1-5)
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);

  // Comments / Suggestions
  const [comments, setComments] = useState('');

  // Optional Attachment
  const [attachment, setAttachment] = useState<{ name: string; size: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission Result State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    submissionDate: string;
    serviceName: string;
    overallRating: number;
  } | null>(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handlePickAttachment = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow media library access to upload attachments.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          name: asset.fileName || `feedback_proof_${Date.now()}.jpg`,
          size: `${Math.round((asset.fileSize || 1024 * 500) / 1024)} KB`,
        });
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  const handleSubmitFeedback = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const ref = `CAL-FDB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      setSubmittedData({
        referenceNumber: ref,
        submissionDate: dateStr,
        serviceName: selectedService,
        overallRating,
      });
    }, 850);
  };

  const handleResetForm = () => {
    setComments('');
    setReferenceNumber('');
    setAttachment(null);
    setOverallRating(5);
    setQualityRating(5);
    setStaffRating(5);
    setSubmittedData(null);
  };

  const renderStarRating = (
    value: number,
    onChange: (val: number) => void,
    title: string,
    showLabel: boolean = true
  ) => (
    <View style={styles.starRatingBlock}>
      <Text style={[styles.starRatingLabel, isDarkMode && { color: '#F8FAFC' }]}>
        {title}
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = value >= star;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              style={styles.starBtn}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="star.fill"
                size={34}
                color={isFilled ? '#F59E0B' : isDarkMode ? '#334155' : '#CBD5E1'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {showLabel && (
        <Text style={[styles.ratingWordText, isDarkMode && { color: '#38BDF8' }]}>
          {value} Star{value > 1 ? 's' : ''} ({RATING_LABELS[value]})
        </Text>
      )}
    </View>
  );

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
          <Text style={[styles.backText, isDarkMode && { color: '#38BDF8' }]}>
            Back to Services Directory
          </Text>
        </TouchableOpacity>

        {!submittedData ? (
          <>
            {/* 1. HEADER BANNER */}
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <IconSymbol name="star.bubble.fill" size={24} color="#D97706" />
                </View>
                <Badge label="CITIZEN SATISFACTION" variant="warning" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Community Feedback
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Help us improve public service delivery. Share your experience, rate municipal transactions, and provide suggestions for Caloocan City offices.
              </Text>
            </View>

            {/* 2. FEEDBACK FORM */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* Field 1: Service Being Reviewed */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Service Being Reviewed *
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isServiceDropdownOpen && styles.dropdownTriggerActive,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                  ]}
                  onPress={() => setIsServiceDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, isDarkMode && { color: '#F8FAFC' }]}>
                    {selectedService}
                  </Text>
                  <IconSymbol
                    name={isServiceDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={16}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isServiceDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                  >
                    {MUNICIPAL_SERVICES.map((srv) => (
                      <TouchableOpacity
                        key={srv}
                        style={[
                          styles.dropdownOption,
                          selectedService === srv && styles.dropdownOptionActive,
                          isDarkMode && { borderBottomColor: '#2B3958' },
                        ]}
                        onPress={() => {
                          setSelectedService(srv);
                          setIsServiceDropdownOpen(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedService === srv && styles.dropdownOptionTextActive,
                            isDarkMode && { color: selectedService === srv ? '#38BDF8' : '#E2E8F0' },
                          ]}
                        >
                          {srv}
                        </Text>
                        {selectedService === srv && (
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#0284C7" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Field 2: Transaction / Reference Number (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Transaction / Reference Number (If Applicable)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="e.g. CAL-DOC-2026-9214 or Official Receipt No."
                  placeholderTextColor="#94A3B8"
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                />
              </View>

              <View style={styles.divider} />

              {/* Field 3: Overall Satisfaction Rating */}
              {renderStarRating(
                overallRating,
                setOverallRating,
                'How satisfied are you with this service?'
              )}

              <View style={styles.divider} />

              {/* Field 4: Service Quality Rating */}
              {renderStarRating(
                qualityRating,
                setQualityRating,
                'Service Quality & Processing Speed:'
              )}

              <View style={styles.divider} />

              {/* Field 5: Staff / Service Experience */}
              {renderStarRating(
                staffRating,
                setStaffRating,
                'Staff Courtesy, Helpfulness & Professionalism:'
              )}

              <View style={styles.divider} />

              {/* Field 6: Comments or Suggestions */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  What can we improve? (Comments or suggestions)
                </Text>
                <TextInput
                  style={[
                    styles.textInputArea,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  placeholder="Share what went well or what specific improvements you would like to see..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={comments}
                  onChangeText={setComments}
                />
              </View>

              {/* Field 7: Optional Attachment */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                  Supporting Attachment (Optional)
                </Text>

                {attachment ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="photo.fill" size={18} color="#0284C7" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {attachment.name} ({attachment.size})
                    </Text>
                    <TouchableOpacity onPress={() => setAttachment(null)}>
                      <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={handlePickAttachment}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="camera.fill" size={18} color="#0284C7" />
                    <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                      Upload Photo / Receipt Proof (Optional)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Feedback Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitFeedback}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* 3. POST SUBMISSION CONFIRMATION */
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Feedback Submitted!
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Thank you for sharing your feedback. Your ratings help us enhance municipal services across Caloocan City.
            </Text>

            {/* Receipt Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Feedback Reference Number</Text>
                <Badge label="LOGGED" variant="success" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Reviewed Service:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.serviceName}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submission Date:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.submissionDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Overall Rating Given:</Text>
                <Text style={[styles.metaVal, { color: '#F59E0B', fontWeight: '800' }]}>
                  {submittedData.overallRating} / 5 Stars ★
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={handleResetForm}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>Submit Another Feedback</Text>
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
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
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
    minHeight: 90,
    textAlignVertical: 'top',
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
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
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
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  starRatingBlock: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  starRatingLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  starBtn: {
    padding: 4,
  },
  ratingWordText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
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
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Post submit confirmation */
  postSubmitContainer: {
    alignItems: 'center',
    paddingTop: 12,
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
    lineHeight: 18,
  },
  refCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
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
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
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

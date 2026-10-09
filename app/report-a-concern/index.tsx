import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { LocalCitizenTable } from '@/src/services/local-citizen-table';
import { ProfileService } from '@/src/services/profile-service';
import { ConcernService } from '@/src/services/concern-service';

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

export interface DepartmentUpdate {
  id: string;
  timestamp: string;
  department: string;
  message: string;
  officerName?: string;
}

export interface CitizenReport {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  dateSubmitted: string;
  currentStatus: 'Submitted' | 'AI Analyzed' | 'Automatically Routed' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
  lastUpdate: string;
  description: string;
  barangay: string;
  address: string;
  gpsCoords?: string;
  priority?: string;
  assignedDepartment: string;
  aiDetectedCategory?: string;
  aiConfidenceScore?: string;
  aiReason?: string;
  photoEvidenceUrl?: string;
  resolutionNotes?: string;
  attachments: { name: string; size: string; type: string; uri?: string }[];
  departmentUpdates: DepartmentUpdate[];
  ratingFeedback?: {
    stars: number;
    comment: string;
    submittedDate: string;
  };
}

export const CONCERN_TIMELINE_STAGES = [
  { id: 'submitted', stage: 'Submitted', label: 'Submitted', desc: 'Concern filed into central system' },
  { id: 'ai_analyzed', stage: 'AI Analyzed', label: 'AI Analyzed', desc: 'Processed by Gemini AI Engine' },
  { id: 'routed', stage: 'Automatically Routed', label: 'Automatically Routed', desc: 'Dispatched to responsible city bureau' },
  { id: 'under_review', stage: 'Under Review', label: 'Under Review', desc: 'Technical officer assigned for site review' },
  { id: 'in_progress', stage: 'In Progress', label: 'In Progress', desc: 'Field crew deployed for inspection/repair' },
  { id: 'resolved', stage: 'Resolved', label: 'Resolved', desc: 'Action completed and certified by department' },
  { id: 'closed', stage: 'Closed', label: 'Closed', desc: 'Citizen confirmed resolution & case closed' },
] as const;

export default function ReportConcernScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { isDarkMode } = useTheme();

  // Active View Toggle: 'report' (submission form) vs 'my_reports' (live tracker)
  const [activeTab, setActiveTab] = useState<'report' | 'my_reports'>(
    params.tab === 'my_reports' ? 'my_reports' : 'report'
  );

  useEffect(() => {
    if (params.tab === 'my_reports') {
      setActiveTab('my_reports');
    }
  }, [params.tab]);

  // Form Fields
  const [selectedCategory, setSelectedCategory] = useState<string>(CONCERN_CATEGORIES[0]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [barangay, setBarangay] = useState('');

  // Contact Info
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // File / Photo Uploads
  const [photos, setPhotos] = useState<{ id: string; name: string; size: string; uri?: string; data?: string }[]>([]);
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

  // My Reports & Grievance Tracker State
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsFilter, setReportsFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  // Rating Modal State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Pre-load Citizen details & Fetch reports strictly for this citizen
  useEffect(() => {
    async function initUserAndReports() {
      let resolvedId: number | undefined = undefined;
      let resolvedEmail: string | undefined = undefined;
      let resolvedPhone: string | undefined = undefined;

      try {
        const session = AuthService.getCurrentUser();
        if (session.user) {
          const u = session.user;
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          if (fullName) setContactName(fullName);
          if (u.email) {
            setContactEmail(u.email);
            resolvedEmail = u.email;
          }
          if (u.mobile_number) {
            setContactPhone(u.mobile_number);
            resolvedPhone = u.mobile_number;
          }
          if (u.citizen_user_id) {
            resolvedId = u.citizen_user_id;
          }
        }
        if (session.email && !resolvedEmail) resolvedEmail = session.email;
        if (session.phone && !resolvedPhone) resolvedPhone = session.phone;
        if (session.citizen_user_id && !resolvedId) resolvedId = session.citizen_user_id;

        const res = await ProfileService.getProfile(resolvedEmail || undefined, resolvedId || undefined);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          if (d.fullName) setContactName(d.fullName);
          if (d.phone) {
            setContactPhone(d.phone);
            resolvedPhone = d.phone;
          }
          if (d.email) {
            setContactEmail(d.email);
            resolvedEmail = d.email;
          }
          if (d.citizen_user_id) {
            resolvedId = d.citizen_user_id;
          }
          if (d.barangay) setBarangay(d.barangay);
          if (d.address) setLocation(d.address);
        }
      } catch (err) {
        console.warn('Citizen profile fetch error:', err);
      }

      await fetchReports(resolvedId, resolvedEmail, resolvedPhone);
    }

    initUserAndReports();
  }, []);

  const fetchReports = async (overrideId?: number, overrideEmail?: string, overridePhone?: string) => {
    setIsLoadingReports(true);
    try {
      const session = AuthService.getCurrentUser();
      const activeUser = LocalCitizenTable.getActiveSession();

      const userId = overrideId || session?.citizen_user_id || activeUser?.citizen_user_id || undefined;
      const userEmail = overrideEmail || session?.email || contactEmail || activeUser?.email || undefined;
      const userPhone = overridePhone || session?.phone || contactPhone || activeUser?.mobile_number || undefined;

      // If user is guest or has no identifier, strictly show empty list (no reports to display)
      if (!userId && !userEmail && !userPhone) {
        setReports([]);
        return;
      }

      const rawReports = await ConcernService.getMyReports(userId, userEmail, userPhone);

      if (Array.isArray(rawReports) && rawReports.length > 0) {
        // Strict client-side filter: only keep concerns belonging strictly to this citizen!
        const myReportsOnly = rawReports.filter((r: any) => {
          if (userId && r.citizen_user_id && Number(r.citizen_user_id) === Number(userId)) return true;
          if (userEmail && r.citizen_email && r.citizen_email.trim().toLowerCase() === userEmail.trim().toLowerCase()) return true;
          if (userPhone && r.citizen_phone) {
            const cleanUserPhone = userPhone.replace(/\D/g, '');
            const cleanRepPhone = String(r.citizen_phone).replace(/\D/g, '');
            if (cleanUserPhone.length >= 7 && cleanRepPhone.length >= 7 && cleanRepPhone.endsWith(cleanUserPhone.slice(-10))) return true;
          }
          return false;
        });

        const mappedReports: CitizenReport[] = myReportsOnly.map((r: any) => {
          let status: CitizenReport['currentStatus'] = 'Submitted';
          const rawStatus = (r.status || '').toLowerCase();

          if (rawStatus === 'new') {
            status = r.ai_detected_category ? 'AI Analyzed' : 'Submitted';
          } else if (rawStatus === 'routed') {
            status = 'Automatically Routed';
          } else if (rawStatus === 'under review') {
            status = 'Under Review';
          } else if (rawStatus === 'in progress') {
            status = 'In Progress';
          } else if (rawStatus === 'resolved') {
            status = 'Resolved';
          } else if (rawStatus === 'closed') {
            status = 'Closed';
          }

          const formatPhilippineDateTime = (rawDate?: string | null, fallbackFormatted?: string): string => {
            if (fallbackFormatted && fallbackFormatted.includes('•')) return fallbackFormatted;
            if (!rawDate) {
              const now = new Date();
              return now.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }) +
                ' • ' + now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
            }
            if (rawDate.includes('•')) return rawDate;
            let parsedIso = rawDate;
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDate)) {
              parsedIso = rawDate.replace(' ', 'T') + '+08:00';
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(rawDate)) {
              parsedIso = rawDate + '+08:00';
            }
            const d = new Date(parsedIso);
            if (isNaN(d.getTime())) return rawDate;
            return d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }) +
              ' • ' + d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
          };

          const dateStr = formatPhilippineDateTime(r.created_at_iso || r.created_at, r.created_at_formatted);
          const lastUpdateStr = formatPhilippineDateTime(r.updated_at_iso || r.updated_at, r.updated_at_formatted || dateStr);

          // Build updates timeline
          const updates: DepartmentUpdate[] = [
            {
              id: `up-1-${r.concern_id}`,
              timestamp: dateStr,
              department: 'Central Intake & Triage Desk',
              message: `Concern filed by citizen. Reference ${r.ticket_number} assigned.`,
            },
          ];

          if (r.ai_detected_category) {
            updates.push({
              id: `up-2-${r.concern_id}`,
              timestamp: dateStr,
              department: 'Gemini AI Multi-Modal Engine',
              message: `Automated AI classification: ${r.ai_detected_category} (${r.priority || 'Medium'} Priority). Recommended department: ${r.assigned_department || 'Citizenship Information & Engagement'}. ${r.ai_reason ? 'Reason: ' + r.ai_reason : ''}`,
            });
          }

          if (r.status !== 'New') {
            updates.push({
              id: `up-3-${r.concern_id}`,
              timestamp: lastUpdateStr,
              department: r.assigned_department || 'Assigned Bureau',
              message: `Dispatched to ${r.assigned_department || 'designated city bureau'}. Field work order generated.`,
            });
          }

          if (r.status === 'In Progress' || r.status === 'Resolved' || r.status === 'Closed') {
            updates.push({
              id: `up-4-${r.concern_id}`,
              timestamp: lastUpdateStr,
              department: r.assigned_department || 'Field Action Team',
              message: `Field crew deployed to ${r.location || r.barangay}. Ongoing remediation work in progress.`,
            });
          }

          if (r.status === 'Resolved' || r.status === 'Closed') {
            updates.push({
              id: `up-5-${r.concern_id}`,
              timestamp: lastUpdateStr,
              department: r.assigned_department || 'Field Action Team',
              message: r.resolution_notes || 'All on-site repair and verification work orders completed according to city engineering standards.',
            });
          }

          const parsedAttachments: { name: string; size: string; type: string; uri?: string }[] = [];
          if (r.photo_evidence_url) {
            parsedAttachments.push({
              name: 'Evidence Photo',
              size: 'Photo Attachment',
              type: 'image/jpeg',
              uri: r.photo_evidence_url,
            });
          }

          return {
            id: String(r.concern_id || r.ticket_number),
            referenceNumber: r.ticket_number,
            title: r.title,
            category: r.category,
            dateSubmitted: dateStr,
            currentStatus: status,
            lastUpdate: lastUpdateStr,
            description: r.description,
            barangay: r.barangay || 'Caloocan City',
            address: r.location || 'Caloocan City',
            gpsCoords: r.gps_coordinates || undefined,
            priority: r.priority || 'Medium',
            assignedDepartment: r.assigned_department || 'Citizenship Information & Engagement (CIE)',
            aiDetectedCategory: r.ai_detected_category,
            aiConfidenceScore: r.ai_confidence_score,
            aiReason: r.ai_reason,
            photoEvidenceUrl: r.photo_evidence_url,
            resolutionNotes: r.resolution_notes,
            attachments: parsedAttachments,
            departmentUpdates: updates,
          };
        });

        setReports(mappedReports);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn('Failed to fetch reports:', err);
      setReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchReports().finally(() => setRefreshing(false));
  }, []);

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
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined;
        setPhotos((prev) => [
          ...prev,
          {
            id: `p-${Date.now()}`,
            name: asset.fileName || `evidence_photo_${prev.length + 1}.jpg`,
            size: `${Math.round((asset.fileSize || 1024 * 650) / 1024)} KB`,
            uri: asset.uri,
            data: base64Data,
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

  const handleSubmitConcern = async () => {
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

    try {
      const session = AuthService.getCurrentUser();
      const activeUser = LocalCitizenTable.getActiveSession();
      const resolvedUserId = session?.citizen_user_id || activeUser?.citizen_user_id || undefined;
      const resolvedEmail = contactEmail.trim() || session?.email || activeUser?.email || undefined;
      const resolvedPhone = contactPhone.trim() || session?.phone || activeUser?.mobile_number || undefined;

      const res = await ConcernService.submitConcern({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        location: location.trim(),
        barangay,
        citizen_user_id: resolvedUserId,
        citizen_name: isAnonymous ? 'Anonymous Resident' : contactName.trim(),
        citizen_phone: isAnonymous ? undefined : resolvedPhone,
        citizen_email: isAnonymous ? undefined : resolvedEmail,
        is_anonymous: isAnonymous,
        photos: photos.map((p) => ({
          name: p.name,
          size: p.size,
          uri: p.uri,
          data: p.data || (p.uri?.startsWith('data:image') ? p.uri : undefined),
        })),
      });

      if (res && res.data) {
        setSubmittedData({
          referenceNumber: res.data.ticket_number,
          submissionDate: res.data.submission_date,
          currentStatus: res.data.status,
          detectedCategory: res.data.detected_category,
          priority: res.data.priority,
          similarConcerns: res.data.similar_concerns,
          recommendedDepartment: res.data.recommended_department,
          confidenceScore: res.data.confidence_score,
        });

        // Prepend to reports list
        const newReportItem: CitizenReport = {
          id: `rep-${Date.now()}`,
          referenceNumber: res.data.ticket_number,
          title: title.trim(),
          category: selectedCategory,
          dateSubmitted: res.data.submission_date,
          currentStatus: 'Automatically Routed',
          lastUpdate: res.data.submission_date,
          description: description.trim(),
          barangay: barangay || 'Caloocan City',
          address: location.trim(),
          priority: res.data.priority,
          assignedDepartment: res.data.recommended_department,
          aiDetectedCategory: res.data.detected_category,
          aiConfidenceScore: res.data.confidence_score,
          attachments: photos.map((p) => ({ name: p.name, size: p.size, type: 'image/jpeg', uri: p.uri })),
          departmentUpdates: [
            {
              id: `up-new-1`,
              timestamp: res.data.submission_date,
              department: 'Central Intake & Triage Desk',
              message: `Concern filed by citizen. Reference ${res.data.ticket_number} assigned.`,
            },
            {
              id: `up-new-2`,
              timestamp: res.data.submission_date,
              department: 'Gemini AI Multi-Modal Engine',
              message: `Automated AI classification: ${res.data.detected_category} (${res.data.priority} Priority). Routed to ${res.data.recommended_department}.`,
            },
          ],
        };

        setReports((prev) => [newReportItem, ...prev]);
      }
    } catch (err) {
      console.warn('Concern submission error:', err);
      Alert.alert('Submission Error', 'Failed to submit concern. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setPhotos([]);
    setSubmittedData(null);
  };

  const getStatusVariant = (status: CitizenReport['currentStatus']) => {
    switch (status) {
      case 'Submitted':
      case 'AI Analyzed':
      case 'Automatically Routed':
        return 'info';
      case 'Under Review':
      case 'In Progress':
        return 'warning';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'neutral';
      default:
        return 'info';
    }
  };

  const getStageIndex = (status: CitizenReport['currentStatus']) => {
    return CONCERN_TIMELINE_STAGES.findIndex((s) => s.stage === status);
  };

  const handleSubmitResolutionRating = () => {
    if (!selectedReport) return;
    setIsSubmittingRating(true);
    setTimeout(() => {
      setIsSubmittingRating(false);
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Manila',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });

      const updatedReport: CitizenReport = {
        ...selectedReport,
        ratingFeedback: {
          stars: ratingStars,
          comment: feedbackComment || 'Resolution verified by citizen.',
          submittedDate: dateStr,
        },
      };

      setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? updatedReport : r)));
      setSelectedReport(updatedReport);
      setIsRatingModalOpen(false);
      Alert.alert('Feedback Recorded', 'Thank you! Your resolution rating and feedback have been sent to City Hall.');
    }, 600);
  };

  const filteredReports = reports.filter((r) => {
    if (reportsFilter === 'ACTIVE') {
      return r.currentStatus !== 'Resolved' && r.currentStatus !== 'Closed';
    }
    if (reportsFilter === 'RESOLVED') {
      return r.currentStatus === 'Resolved' || r.currentStatus === 'Closed';
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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="chevron.left"
            size={16}
            color={isDarkMode ? '#38BDF8' : '#2563EB'}
          />
          <Text style={[styles.backText, isDarkMode && { color: '#38BDF8' }]}>
            Back
          </Text>
        </TouchableOpacity>

        {/* TOP SEGMENTED TOGGLE SWITCH */}
        <View style={[styles.tabSegmentContainer, isDarkMode && styles.tabSegmentContainerDark]}>
          <TouchableOpacity
            style={[styles.tabSegmentButton, activeTab === 'report' && styles.tabSegmentButtonActive]}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="megaphone.fill"
              size={15}
              color={activeTab === 'report' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
            />
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'report' && styles.tabSegmentTextActive,
                isDarkMode && activeTab !== 'report' && { color: '#94A3B8' },
              ]}
            >
              Report a Concern
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegmentButton, activeTab === 'my_reports' && styles.tabSegmentButtonActive]}
            onPress={() => setActiveTab('my_reports')}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="list.bullet.rectangle.fill"
              size={15}
              color={activeTab === 'my_reports' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
            />
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'my_reports' && styles.tabSegmentTextActive,
                isDarkMode && activeTab !== 'my_reports' && { color: '#94A3B8' },
              ]}
            >
              My Reports & Grievances {reports.length > 0 ? `(${reports.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: REPORT A CONCERN */}
        {activeTab === 'report' && (
          <>
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

                {/* CONCERN FORM CARD */}
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

                  {/* Evidence Uploads */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#CBD5E1' }]}>
                      Photo / Image Evidence (Optional)
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                      ]}
                      onPress={handlePickPhoto}
                      disabled={isUploading}
                      activeOpacity={0.8}
                    >
                      {isUploading ? (
                        <ActivityIndicator color="#0284C7" />
                      ) : (
                        <>
                          <IconSymbol name="camera.fill" size={20} color="#0284C7" />
                          <Text style={styles.uploadButtonText}>Attach Photo / Evidence</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {photos.length > 0 && (
                      <View style={styles.photosList}>
                        {photos.map((p) => (
                          <View
                            key={p.id}
                            style={[
                              styles.photoItem,
                              isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                            ]}
                          >
                            <IconSymbol name="photo.fill" size={16} color="#0284C7" />
                            <Text
                              style={[styles.photoName, isDarkMode && { color: '#F8FAFC' }]}
                              numberOfLines={1}
                            >
                              {p.name} ({p.size})
                            </Text>
                            <TouchableOpacity onPress={() => handleRemovePhoto(p.id)}>
                              <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Contact Information */}
                  <View style={styles.divider} />
                  <Text style={[styles.sectionHeading, isDarkMode && { color: '#F8FAFC' }]}>
                    Contact Information
                  </Text>

                  {/* Anonymous Switch */}
                  <TouchableOpacity
                    style={styles.anonymousRow}
                    onPress={() => setIsAnonymous((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isAnonymous && styles.checkboxActive,
                        isDarkMode && { borderColor: '#3A506B' },
                      ]}
                    >
                      {isAnonymous && (
                        <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[styles.anonymousText, isDarkMode && { color: '#CBD5E1' }]}>
                      Submit as Anonymous (hides identity from public view)
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Citizen Full Name
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isAnonymous && { opacity: 0.5 },
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={isAnonymous ? 'Anonymous' : contactName}
                      onChangeText={setContactName}
                      editable={!isAnonymous}
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                      <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                        Mobile Number
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          isAnonymous && { opacity: 0.5 },
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                        ]}
                        value={isAnonymous ? '' : contactPhone}
                        onChangeText={setContactPhone}
                        editable={!isAnonymous}
                        placeholder={isAnonymous ? 'Hidden' : '0917XXXXXXX'}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                      <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                        Email Address
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          isAnonymous && { opacity: 0.5 },
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                        ]}
                        value={isAnonymous ? '' : contactEmail}
                        onChangeText={setContactEmail}
                        editable={!isAnonymous}
                        placeholder={isAnonymous ? 'Hidden' : 'citizen@email.com'}
                        placeholderTextColor="#94A3B8"
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
              /* 4. POST-SUBMISSION RESULTS VIEW */
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

                {/* Actions */}
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.viewInReportsBtn}
                    onPress={() => {
                      setSubmittedData(null);
                      setActiveTab('my_reports');
                    }}
                    activeOpacity={0.88}
                  >
                    <IconSymbol name="list.bullet.rectangle.fill" size={16} color="#FFFFFF" />
                    <Text style={styles.viewInReportsBtnText}>View in My Reports & Grievances</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.anotherBtn}
                    onPress={handleResetForm}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.anotherBtnText}>File Another Concern</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* TAB 2: MY REPORTS & GRIEVANCES (TOGGLE VIEW) */}
        {activeTab === 'my_reports' && (
          <View style={styles.myReportsSection}>
            {/* 1. Header Banner */}
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
                <Badge label="LIVE STATUS TRACKER" variant="info" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                My Reports & Grievances
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Track real-time progress, dispatch updates & provide resolution feedback on your submitted municipal concerns.
              </Text>
            </View>

            {/* 2. Filter Pills */}
            <View style={styles.filterRow}>
              {[
                { id: 'ALL', label: `All (${reports.length})` },
                {
                  id: 'ACTIVE',
                  label: `In Progress (${reports.filter((r) => r.currentStatus !== 'Resolved' && r.currentStatus !== 'Closed').length})`,
                },
                {
                  id: 'RESOLVED',
                  label: `Resolved (${reports.filter((r) => r.currentStatus === 'Resolved' || r.currentStatus === 'Closed').length})`,
                },
              ].map((tab) => {
                const isActive = reportsFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                      isDarkMode && { backgroundColor: isActive ? '#0284C7' : '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => setReportsFilter(tab.id as any)}
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

            {/* 3. Reports List */}
            {isLoadingReports ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={[styles.loadingText, isDarkMode && { color: '#94A3B8' }]}>
                  Fetching your live reports from City Central...
                </Text>
              </View>
            ) : filteredReports.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <View style={[styles.emptyIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <IconSymbol name="tray.fill" size={32} color="#0284C7" />
                </View>
                <Text style={[styles.emptyStateTitle, isDarkMode && { color: '#F8FAFC' }]}>
                  No Reports Found
                </Text>
                <Text style={[styles.emptyStateDesc, isDarkMode && { color: '#94A3B8' }]}>
                  You have not submitted any concerns matching this filter.
                </Text>
                <TouchableOpacity
                  style={styles.fileConcernBtn}
                  onPress={() => setActiveTab('report')}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="plus.circle.fill" size={16} color="#FFFFFF" />
                  <Text style={styles.fileConcernBtnText}>Report a Concern Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.reportsListContainer}>
                {filteredReports.map((report) => {
                  const currentIdx = getStageIndex(report.currentStatus);
                  return (
                    <TouchableOpacity
                      key={report.id}
                      style={[
                        styles.reportCard,
                        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      ]}
                      onPress={() => setSelectedReport(report)}
                      activeOpacity={0.85}
                    >
                      {/* Top Row: Ref & Status Badge */}
                      <View style={styles.reportCardTop}>
                        <View style={styles.refBadgeBlock}>
                          <Text style={[styles.reportRefText, isDarkMode && { color: '#38BDF8' }]}>
                            {report.referenceNumber}
                          </Text>
                          <Text style={[styles.reportDateText, isDarkMode && { color: '#94A3B8' }]}>
                            {report.dateSubmitted}
                          </Text>
                        </View>
                        <Badge
                          label={report.currentStatus.toUpperCase()}
                          variant={getStatusVariant(report.currentStatus)}
                        />
                      </View>

                      {/* Title & Category */}
                      <Text style={[styles.reportTitleText, isDarkMode && { color: '#F8FAFC' }]}>
                        {report.title}
                      </Text>

                      <View style={styles.categoryPillRow}>
                        <Badge label={report.category} variant="info" />
                        <Badge label={report.barangay} variant="warning" />
                        {report.priority && (
                          <Badge
                            label={`${report.priority} Priority`}
                            variant={report.priority === 'Urgent' ? 'danger' : 'info'}
                          />
                        )}
                      </View>

                      <Text
                        style={[styles.reportDescription, isDarkMode && { color: '#CBD5E1' }]}
                        numberOfLines={2}
                      >
                        {report.description}
                      </Text>

                      {/* Assigned Department */}
                      <View
                        style={[
                          styles.deptBanner,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                        ]}
                      >
                        <IconSymbol name="building.columns.fill" size={14} color="#0284C7" />
                        <Text
                          style={[styles.deptText, isDarkMode && { color: '#38BDF8' }]}
                          numberOfLines={1}
                        >
                          {report.assignedDepartment}
                        </Text>
                      </View>

                      {/* Mini Timeline Stage Indicator */}
                      <View style={styles.miniTimelineContainer}>
                        <View style={styles.miniTimelineTrack}>
                          {CONCERN_TIMELINE_STAGES.map((stg, sIdx) => {
                            const isDone = sIdx <= currentIdx;
                            const isCurrent = sIdx === currentIdx;
                            return (
                              <View key={stg.id} style={styles.miniTimelineStep}>
                                <View
                                  style={[
                                    styles.miniTimelineDot,
                                    isDone && styles.miniTimelineDotDone,
                                    isCurrent && styles.miniTimelineDotCurrent,
                                  ]}
                                />
                                {sIdx < CONCERN_TIMELINE_STAGES.length - 1 && (
                                  <View
                                    style={[
                                      styles.miniTimelineLine,
                                      isDone && styles.miniTimelineLineDone,
                                    ]}
                                  />
                                )}
                              </View>
                            );
                          })}
                        </View>
                        <View style={styles.miniTimelineLabels}>
                          <Text style={[styles.miniTimelineCurrentLabel, isDarkMode && { color: '#F8FAFC' }]}>
                            Current Stage: <Text style={{ color: '#0284C7', fontWeight: '800' }}>{report.currentStatus}</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Card Footer */}
                      <View style={styles.reportCardFooter}>
                        <Text style={[styles.viewDetailsText, isDarkMode && { color: '#38BDF8' }]}>
                          View Full Details & Live Updates ›
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 5. MODAL: DETAILED REPORT VIEW */}
        <Modal
          visible={!!selectedReport}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          {selectedReport && (
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalRefText, isDarkMode && { color: '#38BDF8' }]}>
                      {selectedReport.referenceNumber}
                    </Text>
                    <Text style={[styles.modalTitleText, isDarkMode && { color: '#F8FAFC' }]}>
                      {selectedReport.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, isDarkMode && { backgroundColor: '#152238' }]}
                    onPress={() => setSelectedReport(null)}
                  >
                    <IconSymbol name="xmark" size={16} color={isDarkMode ? '#F8FAFC' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Status Banner */}
                  <View style={styles.modalStatusRow}>
                    <Badge
                      label={selectedReport.currentStatus.toUpperCase()}
                      variant={getStatusVariant(selectedReport.currentStatus)}
                    />
                    <Badge label={selectedReport.category} variant="info" />
                    <Badge label={selectedReport.barangay} variant="warning" />
                  </View>

                  {/* Description */}
                  <Text style={[styles.modalSectionLabel, isDarkMode && { color: '#38BDF8' }]}>
                    Concern Description
                  </Text>
                  <Text style={[styles.modalBodyText, isDarkMode && { color: '#CBD5E1' }]}>
                    {selectedReport.description}
                  </Text>

                  {/* Location */}
                  <Text style={[styles.modalSectionLabel, isDarkMode && { color: '#38BDF8' }]}>
                    Location Details
                  </Text>
                  <View style={styles.locationBlock}>
                    <IconSymbol name="location.fill" size={16} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.locationStreet, isDarkMode && { color: '#F8FAFC' }]}>
                        {selectedReport.address}
                      </Text>
                      {selectedReport.gpsCoords && (
                        <Text style={[styles.locationGps, isDarkMode && { color: '#94A3B8' }]}>
                          GPS: {selectedReport.gpsCoords}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Assigned Department */}
                  <Text style={[styles.modalSectionLabel, isDarkMode && { color: '#38BDF8' }]}>
                    Assigned City Bureau
                  </Text>
                  <View
                    style={[
                      styles.deptBanner,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="building.columns.fill" size={16} color="#0284C7" />
                    <Text style={[styles.deptText, isDarkMode && { color: '#38BDF8' }]}>
                      {selectedReport.assignedDepartment}
                    </Text>
                  </View>

                  {/* Gemini AI Triage Breakdown */}
                  {selectedReport.aiDetectedCategory && (
                    <View
                      style={[
                        styles.aiBreakdownCard,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#0284C7' },
                      ]}
                    >
                      <View style={styles.aiBadgeRow}>
                        <IconSymbol name="sparkles" size={14} color="#0284C7" />
                        <Text style={styles.aiBadgeText}>Gemini AI Routing Details</Text>
                      </View>
                      <Text style={[styles.aiBreakdownItem, isDarkMode && { color: '#CBD5E1' }]}>
                        • Category: <Text style={{ fontWeight: '700' }}>{selectedReport.aiDetectedCategory}</Text>
                      </Text>
                      {selectedReport.aiConfidenceScore && (
                        <Text style={[styles.aiBreakdownItem, isDarkMode && { color: '#CBD5E1' }]}>
                          • Confidence: <Text style={{ fontWeight: '700', color: '#10B981' }}>{selectedReport.aiConfidenceScore}</Text>
                        </Text>
                      )}
                      {selectedReport.aiReason && (
                        <Text style={[styles.aiBreakdownItem, isDarkMode && { color: '#94A3B8' }]}>
                          • Note: {selectedReport.aiReason}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Stage Timeline */}
                  <Text style={[styles.modalSectionLabel, isDarkMode && { color: '#38BDF8' }]}>
                    Real-Time Status Timeline
                  </Text>
                  <View style={styles.timelineList}>
                    {CONCERN_TIMELINE_STAGES.map((stageItem, idx) => {
                      const currentIdx = getStageIndex(selectedReport.currentStatus);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <View key={stageItem.id} style={styles.timelineRow}>
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
                              {stageItem.label}
                              {isDone && ' ✓'}
                              {isCurrent && ' (Current Stage)'}
                            </Text>
                            <Text style={[styles.stageDesc, isDarkMode && { color: '#94A3B8' }]}>
                              {stageItem.desc}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Department Updates / Dispatch Log */}
                  <Text style={[styles.modalSectionLabel, isDarkMode && { color: '#38BDF8' }]}>
                    Dispatch & Action Log
                  </Text>
                  <View style={styles.updatesList}>
                    {selectedReport.departmentUpdates.map((u) => (
                      <View
                        key={u.id}
                        style={[
                          styles.updateCard,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                        ]}
                      >
                        <View style={styles.updateCardTop}>
                          <Text style={styles.updateDept}>{u.department}</Text>
                          <Text style={styles.updateTime}>{u.timestamp}</Text>
                        </View>
                        <Text style={[styles.updateMessage, isDarkMode && { color: '#E2E8F0' }]}>
                          {u.message}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Resolution Rating (if Resolved or Closed) */}
                  {(selectedReport.currentStatus === 'Resolved' || selectedReport.currentStatus === 'Closed') && (
                    <View style={styles.ratingSection}>
                      <TouchableOpacity
                        style={styles.ratingOpenBtn}
                        onPress={() => setIsRatingModalOpen(true)}
                        activeOpacity={0.85}
                      >
                        <IconSymbol name="star.fill" size={16} color="#F59E0B" />
                        <Text style={styles.ratingOpenBtnText}>
                          {selectedReport.ratingFeedback
                            ? `Rating: ${selectedReport.ratingFeedback.stars} Stars (Tap to Update)`
                            : 'Rate City Resolution & Give Feedback'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>

        {/* 6. MODAL: RESOLUTION RATING MODAL */}
        <Modal
          visible={isRatingModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRatingModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.ratingModalContent,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.ratingModalTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Resolution Satisfaction
              </Text>
              <Text style={[styles.ratingModalDesc, isDarkMode && { color: '#94A3B8' }]}>
                How satisfied are you with the Caloocan City team's resolution of this concern?
              </Text>

              {/* Star selector */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRatingStars(star)}
                    style={styles.starBtn}
                  >
                    <IconSymbol
                      name="star.fill"
                      size={28}
                      color={star <= ratingStars ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.textInputArea,
                  { minHeight: 80, marginVertical: 12 },
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                ]}
                placeholder="Optional comments or suggestions on the resolution quality..."
                placeholderTextColor="#94A3B8"
                multiline
                value={feedbackComment}
                onChangeText={setFeedbackComment}
              />

              <View style={styles.ratingModalActions}>
                <TouchableOpacity
                  style={styles.ratingCancelBtn}
                  onPress={() => setIsRatingModalOpen(false)}
                >
                  <Text style={styles.ratingCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ratingSubmitBtn}
                  onPress={handleSubmitResolutionRating}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.ratingSubmitBtnText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
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
  },

  /* HEADER BANNER */
  headerBannerCard: {
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
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  serviceExplanation: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    fontWeight: '500',
  },

  /* FEATURED "MY REPORTS & GRIEVANCES" LIVE TRACKER CARD (EXACT USER SCREENSHOT) */
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
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTrackerBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveTrackerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  featuredTrackerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  featuredTrackerDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  trackerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  featuredTrackerAction: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  featuredTrackerActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },

  /* FORM CARD */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputSublabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    textAlignVertical: 'top',
    minHeight: 90,
  },

  /* Dropdown */
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#DC2626',
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionActive: {
    backgroundColor: '#FEF2F2',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownOptionTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },

  /* GPS button */
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gpsButtonActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    flex: 1,
  },
  gpsButtonTextActive: {
    color: '#0284C7',
  },

  /* Upload */
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  photosList: {
    marginTop: 10,
    gap: 6,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  /* Contact info */
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  anonymousText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  /* Submit button */
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* POST SUBMISSION VIEW */
  postSubmitContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  postSubmitTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  postSubmitSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  refCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  refTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  refCardNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284C7',
  },
  refDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  aiCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
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
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  aiScoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  aiGrid: {
    gap: 8,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  aiValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1.5,
    textAlign: 'right',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  viewInReportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
  },
  viewInReportsBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  anotherBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 13,
  },
  anotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  /* MY REPORTS TAB STYLING */
  myReportsSection: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  fileConcernBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fileConcernBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportsListContainer: {
    gap: 14,
  },
  reportCard: {
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
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  refBadgeBlock: {
    gap: 2,
  },
  reportRefText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  reportDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  reportTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  reportDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 10,
  },
  deptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12,
  },
  deptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    flex: 1,
  },
  miniTimelineContainer: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  miniTimelineTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  miniTimelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  miniTimelineDotDone: {
    backgroundColor: '#10B981',
  },
  miniTimelineDotCurrent: {
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  miniTimelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
  },
  miniTimelineLineDone: {
    backgroundColor: '#10B981',
  },
  miniTimelineLabels: {
    marginTop: 2,
  },
  miniTimelineCurrentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  reportCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalRefText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 2,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  modalBodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  locationStreet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationGps: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  aiBreakdownCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiBreakdownItem: {
    fontSize: 12,
    color: '#334155',
  },

  /* TIMELINE */
  timelineList: {
    paddingLeft: 4,
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    width: 22,
    marginRight: 10,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotDone: {
    backgroundColor: '#10B981',
  },
  timelineDotCurrent: {
    backgroundColor: '#0284C7',
    borderWidth: 3,
    borderColor: '#BAE6FD',
  },
  currentInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  timelineTrack: {
    width: 2,
    flex: 1,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  stageTitleActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stageDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* UPDATES LIST */
  updatesList: {
    gap: 8,
    marginTop: 6,
  },
  updateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  updateCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  updateDept: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  updateTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  updateMessage: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
  },

  /* RATING SECTION */
  ratingSection: {
    marginTop: 18,
    marginBottom: 10,
  },
  ratingOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    borderRadius: 12,
  },
  ratingOpenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  ratingModalContent: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  ratingModalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 14,
  },
  starBtn: {
    padding: 4,
  },
  ratingModalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  ratingCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ratingCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  ratingSubmitBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  ratingSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

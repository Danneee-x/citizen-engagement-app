import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';

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
  attachments: { name: string; size: string; type: string }[];
  assignedDepartment: string;
  departmentUpdates: DepartmentUpdate[];
  ratingFeedback?: {
    stars: number;
    comment: string;
    submittedDate: string;
  };
}

export const TIMELINE_STAGES = [
  { stage: 'Submitted', label: 'Submitted', desc: 'Concern logged in City Central Dispatch' },
  { stage: 'AI Analyzed', label: 'AI Analyzed', desc: 'Gemini AI detected category & urgency' },
  { stage: 'Automatically Routed', label: 'Automatically Routed', desc: 'Dispatched to responsible city bureau' },
  { stage: 'Under Review', label: 'Under Review', desc: 'Technical officer assigned for site inspection' },
  { stage: 'In Progress', label: 'In Progress', desc: 'Field repair / cleanup crew currently deployed' },
  { stage: 'Resolved', label: 'Resolved', desc: 'Action completed and certified by department' },
  { stage: 'Closed', label: 'Closed', desc: 'Citizen confirmed resolution & case closed' },
] as const;

export const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: 'rpt-1',
    referenceNumber: 'CAL-RPT-2026-8812',
    title: 'Deep Pothole & Broken Asphalt along Samson Road',
    category: 'Road & Infrastructure',
    dateSubmitted: 'August 19, 2026 • 09:30 AM',
    currentStatus: 'In Progress',
    lastUpdate: '2 hours ago • Repair crew Unit 3 deployed on-site',
    description:
      'Large pothole approximately 1.5 meters wide in front of the Monumento LRT station exit. It poses severe danger to motorcycle riders and tricycle commuters especially during rain.',
    barangay: 'Barangay 81 (South Caloocan)',
    address: 'Samson Road corner Rizal Ave Extension, Monumento',
    gpsCoords: '14.6572° N, 120.9839° E',
    assignedDepartment: 'City Engineering & Public Works Department',
    attachments: [
      { name: 'pothole_photo_1.jpg', size: '2.4 MB', type: 'image' },
      { name: 'road_hazard_photo_2.jpg', size: '1.8 MB', type: 'image' },
    ],
    departmentUpdates: [
      {
        id: 'upd-1',
        timestamp: 'Aug 19, 2026 • 10:15 AM',
        department: 'City Engineering & Public Works',
        message: 'Report verified via Gemini AI and assigned to Northern District Road Maintenance Division.',
        officerName: 'Engr. R. Santos (Supervisor)',
      },
      {
        id: 'upd-2',
        timestamp: 'Aug 21, 2026 • 02:40 PM',
        department: 'City Engineering & Public Works',
        message: 'Cold-mix asphalt dispatched. Road milling and safety barricades installed on outer lane.',
        officerName: 'Engr. J. Dela Cruz (Crew Lead)',
      },
    ],
  },
  {
    id: 'rpt-2',
    referenceNumber: 'CAL-RPT-2026-7491',
    title: 'Uncollected Trash & Clogged Drainage Canal',
    category: 'Garbage & Waste',
    dateSubmitted: 'August 14, 2026 • 03:15 PM',
    currentStatus: 'Resolved',
    lastUpdate: 'August 16, 2026 • Declogging & collection completed',
    description:
      'Accumulated plastic waste and debris blocking the roadside stormwater culvert along Phase 3 Bagumbong, causing knee-deep flash floods during thunderstorms.',
    barangay: 'Barangay 171 (Bagumbong)',
    address: 'Block 12 Lot 4, Phase 3, Bagumbong Dumpsite Access Road',
    gpsCoords: '14.7521° N, 120.9823° E',
    assignedDepartment: 'Environmental Management & Sanitation Bureau (CENRO)',
    attachments: [
      { name: 'clogged_drainage.jpg', size: '3.1 MB', type: 'image' },
    ],
    departmentUpdates: [
      {
        id: 'upd-201',
        timestamp: 'Aug 14, 2026 • 04:00 PM',
        department: 'CENRO Sanitation Bureau',
        message: 'Emergency declogging crew scheduled for morning rotation.',
        officerName: 'M. Bautista (CENRO Inspector)',
      },
      {
        id: 'upd-202',
        timestamp: 'Aug 16, 2026 • 11:30 AM',
        department: 'CENRO Sanitation Bureau',
        message: 'Drainage fully declogged and 2 tons of solid waste hauled. Water flow restored.',
        officerName: 'Team Alpha Sanitation Lead',
      },
    ],
  },
  {
    id: 'rpt-3',
    referenceNumber: 'CAL-RPT-2026-6130',
    title: 'Malfunctioning LED Streetlights on Camarin Road',
    category: 'Streetlights',
    dateSubmitted: 'August 22, 2026 • 08:00 AM',
    currentStatus: 'Under Review',
    lastUpdate: 'Today • Assigned to Electrical Services Division',
    description:
      'Four consecutive solar/LED streetlights have been flickering or completely dark for the past 3 nights, creating a dark accident-prone blind spot near the high school crossing.',
    barangay: 'Barangay 178 (Camarin)',
    address: 'Near Camarin High School Crossing, Camarin Road',
    gpsCoords: '14.7410° N, 121.0345° E',
    assignedDepartment: 'Public Lighting & Electrical Maintenance Division',
    attachments: [
      { name: 'dark_street_evidence.jpg', size: '1.5 MB', type: 'image' },
    ],
    departmentUpdates: [
      {
        id: 'upd-301',
        timestamp: 'Aug 22, 2026 • 08:45 AM',
        department: 'Public Lighting Division',
        message: 'Work order #EL-2026-441 issued. Linemen bucket truck scheduled for evening inspection.',
        officerName: 'Foreman E. Alcantara',
      },
    ],
  },
];

export default function MyReportsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  // Rate Resolution Modal / Feedback State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filterCategory === 'ACTIVE') {
      return r.currentStatus !== 'Resolved' && r.currentStatus !== 'Closed';
    }
    if (filterCategory === 'RESOLVED') {
      return r.currentStatus === 'Resolved' || r.currentStatus === 'Closed';
    }
    return true;
  });

  const getStatusVariant = (status: CitizenReport['currentStatus']) => {
    switch (status) {
      case 'Submitted':
        return 'info';
      case 'AI Analyzed':
        return 'info';
      case 'Automatically Routed':
        return 'info';
      case 'Under Review':
        return 'warning';
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
    return TIMELINE_STAGES.findIndex((s) => s.stage === status);
  };

  const handleOpenReportDetails = (report: CitizenReport) => {
    setSelectedReport(report);
  };

  const handleSubmitResolutionRating = () => {
    if (!selectedReport) return;

    setIsSubmittingRating(true);
    setTimeout(() => {
      setIsSubmittingRating(false);
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      const updatedReport: CitizenReport = {
        ...selectedReport,
        ratingFeedback: {
          stars: ratingStars,
          comment: feedbackComment || 'Resolution verified by citizen.',
          submittedDate: dateStr,
        },
      };

      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
      setIsRatingModalOpen(false);
      Alert.alert(
        'Feedback Recorded',
        'Thank you! Your resolution rating and feedback have been sent to City Hall.'
      );
    }, 700);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#38BDF8' : '#2563EB'}
            colors={['#2563EB']}
          />
        }
      >
        {/* Back button */}
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
            <Badge label="CITIZEN GRIEVANCE TRACKER" variant="info" />
          </View>
          <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
            My Reports
          </Text>
          <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
            Track the live progress of all concerns, infrastructure hazards, and municipal grievances you have submitted to Caloocan City.
          </Text>
        </View>

        {/* 2. Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: `All Reports (${reports.length})` },
            {
              id: 'ACTIVE',
              label: `In Progress (${reports.filter((r) => r.currentStatus !== 'Resolved' && r.currentStatus !== 'Closed').length})`,
            },
            {
              id: 'RESOLVED',
              label: `Resolved (${reports.filter((r) => r.currentStatus === 'Resolved' || r.currentStatus === 'Closed').length})`,
            },
          ].map((tab) => {
            const isActive = filterCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                  isDarkMode && { backgroundColor: isActive ? '#0284C7' : '#152238', borderColor: '#3A506B' },
                ]}
                onPress={() => setFilterCategory(tab.id as any)}
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
        <View style={styles.listContainer}>
          {filteredReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
              onPress={() => handleOpenReportDetails(report)}
              activeOpacity={0.88}
            >
              <View style={styles.reportCardTop}>
                <Text style={[styles.reportRefText, isDarkMode && { color: '#38BDF8' }]}>
                  {report.referenceNumber}
                </Text>
                <Badge
                  label={report.currentStatus.toUpperCase()}
                  variant={getStatusVariant(report.currentStatus)}
                />
              </View>

              <Text style={[styles.reportTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {report.title}
              </Text>

              <View style={styles.categoryPillRow}>
                <Badge label={report.category} variant="info" />
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <IconSymbol name="calendar" size={13} color="#64748B" />
                  <Text style={[styles.metaText, isDarkMode && { color: '#94A3B8' }]}>
                    Submitted: {report.dateSubmitted}
                  </Text>
                </View>
              </View>

              <View style={[styles.lastUpdateBlock, isDarkMode && { backgroundColor: '#152238' }]}>
                <IconSymbol name="bell.fill" size={13} color="#0284C7" />
                <Text
                  style={[styles.lastUpdateText, isDarkMode && { color: '#CBD5E1' }]}
                  numberOfLines={1}
                >
                  {report.lastUpdate}
                </Text>
              </View>

              <View style={styles.viewDetailRow}>
                <Text style={styles.viewDetailText}>View Status Timeline & Details</Text>
                <IconSymbol name="chevron.right" size={13} color="#0284C7" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── REPORT DETAILS MODAL ── */}
      {selectedReport && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedReport(null)}
        >
          <SafeAreaView
            style={[
              styles.safeArea,
              { backgroundColor: isDarkMode ? '#0B132B' : '#F8FAFC' },
            ]}
          >
            {/* Modal Navigation */}
            <View
              style={[
                styles.modalNav,
                isDarkMode && { backgroundColor: '#0B132B', borderBottomColor: '#1C2541' },
              ]}
            >
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedReport(null)}
              >
                <IconSymbol name="xmark" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
              </TouchableOpacity>
              <Text style={[styles.modalNavTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Report Details
              </Text>
              <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Header Info */}
              <View
                style={[
                  styles.detailsHeaderCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <View style={styles.reportCardTop}>
                  <Text style={[styles.reportRefText, isDarkMode && { color: '#38BDF8' }]}>
                    {selectedReport.referenceNumber}
                  </Text>
                  <Badge
                    label={selectedReport.currentStatus.toUpperCase()}
                    variant={getStatusVariant(selectedReport.currentStatus)}
                  />
                </View>

                <Text style={[styles.detailTitleText, isDarkMode && { color: '#F8FAFC' }]}>
                  {selectedReport.title}
                </Text>

                <View style={styles.categoryPillRow}>
                  <Badge label={selectedReport.category} variant="info" />
                  <Badge label={selectedReport.barangay} variant="warning" />
                </View>

                <View style={styles.divider} />

                {/* 1. Description */}
                <Text style={[styles.sectionHeading, isDarkMode && { color: '#38BDF8' }]}>
                  Description
                </Text>
                <Text style={[styles.bodyDescription, isDarkMode && { color: '#CBD5E1' }]}>
                  {selectedReport.description}
                </Text>

                {/* 2. Location */}
                <Text style={[styles.sectionHeading, isDarkMode && { color: '#38BDF8' }]}>
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
                        GPS Pin: {selectedReport.gpsCoords}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 3. Attachments */}
                <Text style={[styles.sectionHeading, isDarkMode && { color: '#38BDF8' }]}>
                  Attached Photos / Evidence
                </Text>
                <View style={styles.attachmentsRow}>
                  {selectedReport.attachments.map((att, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.attachmentPill,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                      ]}
                    >
                      <IconSymbol name="photo.fill" size={15} color="#0284C7" />
                      <Text
                        style={[styles.attachmentName, isDarkMode && { color: '#F8FAFC' }]}
                        numberOfLines={1}
                      >
                        {att.name} ({att.size})
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 4. Submission Date */}
                <View style={styles.submissionDateRow}>
                  <Text style={styles.subDateLabel}>Submission Date:</Text>
                  <Text style={[styles.subDateValue, isDarkMode && { color: '#CBD5E1' }]}>
                    {selectedReport.dateSubmitted}
                  </Text>
                </View>
              </View>

              {/* 5. STATUS TIMELINE */}
              <View
                style={[
                  styles.timelineCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <Text style={[styles.timelineMainHeading, isDarkMode && { color: '#F8FAFC' }]}>
                  Status Timeline
                </Text>
                <Text style={[styles.timelineMainSub, isDarkMode && { color: '#94A3B8' }]}>
                  Submitted → AI Analyzed → Automatically Routed → Under Review → In Progress → Resolved → Closed
                </Text>

                <View style={styles.timelineList}>
                  {TIMELINE_STAGES.map((stageItem, idx) => {
                    const currentIdx = getStageIndex(selectedReport.currentStatus);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <View key={stageItem.stage} style={styles.timelineRow}>
                        <View style={styles.timelineMarkerCol}>
                          <View
                            style={[
                              styles.timelineDot,
                              isDone && styles.timelineDotDone,
                              isCurrent && styles.timelineDotCurrent,
                            ]}
                          >
                            {isDone && !isCurrent ? (
                              <IconSymbol name="checkmark" size={11} color="#FFFFFF" />
                            ) : isCurrent ? (
                              <View style={styles.currentInnerDot} />
                            ) : null}
                          </View>
                          {idx < TIMELINE_STAGES.length - 1 && (
                            <View
                              style={[
                                styles.timelineConnector,
                                idx < currentIdx && styles.timelineConnectorDone,
                              ]}
                            />
                          )}
                        </View>

                        <View style={styles.timelineContentCol}>
                          <Text
                            style={[
                              styles.stageName,
                              isDone && styles.stageNameDone,
                              isCurrent && styles.stageNameCurrent,
                              isDarkMode && { color: isDone ? '#38BDF8' : '#64748B' },
                            ]}
                          >
                            {stageItem.label}
                          </Text>
                          <Text style={[styles.stageDesc, isDarkMode && { color: '#94A3B8' }]}>
                            {stageItem.desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* 6. UPDATES FROM ASSIGNED DEPARTMENT */}
              <View
                style={[
                  styles.departmentUpdatesCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <View style={styles.deptHeaderRow}>
                  <IconSymbol name="building.2.fill" size={18} color="#0284C7" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deptHeading, isDarkMode && { color: '#F8FAFC' }]}>
                      Assigned Department
                    </Text>
                    <Text style={[styles.deptName, isDarkMode && { color: '#38BDF8' }]}>
                      {selectedReport.assignedDepartment}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={[styles.deptLogTitle, isDarkMode && { color: '#CBD5E1' }]}>
                  Official Department Action Logs:
                </Text>

                {selectedReport.departmentUpdates.map((upd) => (
                  <View
                    key={upd.id}
                    style={[
                      styles.updateBubble,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <View style={styles.updateBubbleTop}>
                      <Text style={[styles.officerNameText, isDarkMode && { color: '#38BDF8' }]}>
                        {upd.officerName || upd.department}
                      </Text>
                      <Text style={styles.updateTimeText}>{upd.timestamp}</Text>
                    </View>
                    <Text style={[styles.updateMessageText, isDarkMode && { color: '#F8FAFC' }]}>
                      {upd.message}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 7. WHEN RESOLVED: RATE RESOLUTION / GIVE FEEDBACK */}
              {(selectedReport.currentStatus === 'Resolved' || selectedReport.currentStatus === 'Closed') && (
                <View
                  style={[
                    styles.resolutionRatingCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' },
                  ]}
                >
                  <View style={styles.ratingCardTop}>
                    <IconSymbol name="star.seal.fill" size={24} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ratingCardHeading, isDarkMode && { color: '#F8FAFC' }]}>
                        Resolution Rating & Feedback
                      </Text>
                      <Text style={[styles.ratingCardSub, isDarkMode && { color: '#94A3B8' }]}>
                        {selectedReport.ratingFeedback
                          ? 'You have rated this resolution.'
                          : 'This concern is resolved. How satisfied are you with the city response?'}
                      </Text>
                    </View>
                  </View>

                  {selectedReport.ratingFeedback ? (
                    <View style={styles.ratingRecapBlock}>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconSymbol
                            key={star}
                            name="star.fill"
                            size={20}
                            color={star <= selectedReport.ratingFeedback!.stars ? '#F59E0B' : '#CBD5E1'}
                          />
                        ))}
                      </View>
                      <Text style={[styles.recapComment, isDarkMode && { color: '#CBD5E1' }]}>
                        “{selectedReport.ratingFeedback.comment}”
                      </Text>
                      <Text style={styles.recapDate}>
                        Submitted: {selectedReport.ratingFeedback.submittedDate}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.rateResolutionBtn}
                      onPress={() => setIsRatingModalOpen(true)}
                      activeOpacity={0.88}
                    >
                      <IconSymbol name="star.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.rateResolutionBtnText}>Rate Resolution / Give Feedback</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── RATE RESOLUTION FEEDBACK MODAL ── */}
      {isRatingModalOpen && selectedReport && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsRatingModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.ratingDialog,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.dialogTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Rate Resolution
              </Text>
              <Text style={[styles.dialogSub, isDarkMode && { color: '#94A3B8' }]}>
                {selectedReport.title}
              </Text>

              <View style={styles.dialogStarsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRatingStars(star)}
                    style={styles.starTouch}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      name="star.fill"
                      size={32}
                      color={star <= ratingStars ? '#F59E0B' : isDarkMode ? '#334155' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.feedbackInput,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                ]}
                placeholder="Add comments on the repair speed, quality or department staff..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={feedbackComment}
                onChangeText={setFeedbackComment}
              />

              <View style={styles.dialogButtonsRow}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setIsRatingModalOpen(false)}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dialogSubmitBtn, isSubmittingRating && { opacity: 0.7 }]}
                  onPress={handleSubmitResolutionRating}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.dialogSubmitText}>Submit Feedback</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 14,
  },
  reportCard: {
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
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reportRefText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.3,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 8,
  },
  categoryPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  lastUpdateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  lastUpdateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    flex: 1,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  viewDetailText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },

  /* Modal Details */
  modalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  bodyDescription: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationBlock: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  locationStreet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  locationGps: {
    fontSize: 11.5,
    color: '#B91C1C',
    marginTop: 2,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  submissionDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subDateLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  subDateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Timeline */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  timelineMainHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  timelineMainSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 16,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
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
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  timelineConnectorDone: {
    backgroundColor: '#10B981',
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  stageName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  stageNameDone: {
    color: '#0F172A',
  },
  stageNameCurrent: {
    color: '#0284C7',
    fontWeight: '800',
  },
  stageDesc: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Department Updates */
  departmentUpdatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deptHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  deptName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptLogTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  updateBubble: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  updateBubbleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  officerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  updateTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  updateMessageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  /* Resolution Rating */
  resolutionRatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  ratingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ratingCardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rateResolutionBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rateResolutionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  ratingRecapBlock: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  recapComment: {
    fontSize: 13,
    color: '#166534',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  recapDate: {
    fontSize: 11,
    color: '#15803D',
  },

  /* Rating Dialog */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  ratingDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  dialogStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  starTouch: {
    padding: 4,
  },
  feedbackInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dialogSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  dialogSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

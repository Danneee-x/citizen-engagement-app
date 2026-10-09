import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { CivicApiService } from '@/src/services/api';
import { AuthService } from '@/src/services/auth-service';
import { CertificateClaimVoucherModal, ClaimVoucherData } from '@/src/components/CertificateClaimVoucherModal';
import { styles } from './styles/TrackerScreen.styles';
import { DomainApplication } from '@/types/domain';

export function TrackerScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Active Session
  const session = AuthService.getCurrentUser();
  const activeEmail = session.email || '';

  // States
  const [applications, setApplications] = useState<DomainApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Under Review' | 'Approved' | 'Completed'>('All');

  // Modal State for Selected Application Timeline Details
  const [selectedApp, setSelectedApp] = useState<DomainApplication | null>(null);

  // Digital Claim Voucher State
  const [activeVoucher, setActiveVoucher] = useState<ClaimVoucherData | null>(null);

  const handleOpenClaimVoucher = (app: DomainApplication) => {
    const isIndigency = app.serviceTitle.toLowerCase().includes('indigency');
    const u = session.user;
    const applicantName = u?.first_name
      ? `${u.first_name} ${u.last_name || ''}`.trim()
      : app.applicantId && !app.applicantId.includes('@')
      ? app.applicantId
      : 'Danny Espelita Jr';

    setActiveVoucher({
      referenceNumber: app.id,
      certificateName: app.serviceTitle,
      applicantName,
      barangay: (app as any).barangay || 'Barangay 171',
      status: app.status === 'Completed' ? 'Completed' : app.status === 'Approved' ? 'Ready for Release' : 'Under Review',
      submissionDate: app.createdAt,
      pickupLocation: `${(app as any).barangay || 'Barangay 171'} Hall - Administrative Records Desk`,
      estimatedTurnaround: isIndigency ? 'Same-Day Fast Track' : '1 to 2 Business Days',
      feeAmount: (app as any).feeAmount ? `₱${(app as any).feeAmount}` : isIndigency ? '₱0.00' : '₱50.00',
      paymentStatus: (app as any).paymentStatus || (app.status === 'Completed' || app.status === 'Approved' ? 'Paid' : isIndigency ? 'Waived' : 'Pending'),
      validityPeriod: 'Valid for 6 Months from date of issuance',
      purpose: (app as any).purpose || 'Official Identification & Barangay Registry Filing',
    });
  };

  // Fetch Applications
  const fetchApplications = async () => {
    const data = await CivicApiService.getApplications(activeEmail, session.citizen_user_id);
    // If backend returns empty list, provide clean dynamic initial tracked applications for demonstration
    if (!data || data.length === 0) {
      setApplications([
        {
          id: 'APP-2026-001',
          domainId: 'identity',
          serviceTitle: 'Barangay Clearance & Citizen ID',
          applicantId: activeEmail || 'CIT-88490',
          status: 'Under Review',
          createdAt: '2026-07-20',
          updatedAt: '2026-07-25',
        },
        {
          id: 'APP-2026-042',
          domainId: 'business',
          serviceTitle: 'New Business Permit Application',
          applicantId: activeEmail || 'CIT-88490',
          status: 'Approved',
          createdAt: '2026-07-15',
          updatedAt: '2026-07-22',
        },
        {
          id: 'APP-2026-109',
          domainId: 'treasury',
          serviceTitle: 'Real Property Tax Payment (Q3)',
          applicantId: activeEmail || 'CIT-88490',
          status: 'Completed',
          createdAt: '2026-07-10',
          updatedAt: '2026-07-10',
        },
      ]);
    } else {
      setApplications(data);
    }
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await fetchApplications();
      setIsLoading(false);
    }
    loadData();
  }, [activeEmail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  };

  // Filtered Applications List
  const filteredApps = applications.filter((app) => {
    const matchesFilter = selectedFilter === 'All' || app.status === selectedFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Under Review':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0B132B' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#176B87" />
        }>

        {/* Header Stack */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, isDarkMode && { color: '#F8FAFC' }]}>Application Tracker</Text>
          <Text style={[styles.headerSubtitle, isDarkMode && { color: '#94A3B8' }]}>
            Monitor live status, review milestones & processing timelines for your civic permits and requests.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
          <IconSymbol name="magnifyingglass" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          <TextInput
            style={[styles.searchInput, isDarkMode && { color: '#F8FAFC' }]}
            placeholder="Search by Application ID or Service..."
            placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {(['All', 'Under Review', 'Approved', 'Completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                selectedFilter === filter && (isDarkMode ? { backgroundColor: '#176B87' } : styles.filterPillActive)
              ]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.8}>
              <Text style={[
                styles.filterPillText,
                isDarkMode && { color: '#CBD5E1' },
                selectedFilter === filter && { color: '#FFFFFF' }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={isDarkMode ? '#38BDF8' : '#176B87'} />
            <Text style={[styles.loadingText, isDarkMode && { color: '#38BDF8' }]}>Fetching tracked applications...</Text>
          </View>
        ) : null}

        {/* Applications List */}
        {!isLoading && filteredApps.length === 0 ? (
          <View style={[styles.emptyContainer, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
            <View style={styles.emptyIconBox}>
              <IconSymbol name="doc.text.fill" size={32} color="#94A3B8" />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && { color: '#F8FAFC' }]}>No Tracked Applications</Text>
            <Text style={[styles.emptySub, isDarkMode && { color: '#94A3B8' }]}>
              {searchQuery
                ? `No applications matching "${searchQuery}" found.`
                : 'You currently have no active permit or document requests being tracked.'}
            </Text>
            <TouchableOpacity
              style={styles.applyCtaBtn}
              onPress={() => router.push('/(tabs)/services')}
              activeOpacity={0.85}>
              <Text style={styles.applyCtaText}>Apply for Civic Service</Text>
              <IconSymbol name="chevron.right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appsStack}>
            {filteredApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.appCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}
                onPress={() => setSelectedApp(app)}
                activeOpacity={0.88}>
                {/* Card Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.appIdBadge, isDarkMode && { backgroundColor: '#0F2942' }]}>
                    <IconSymbol name="doc.text.fill" size={14} color={isDarkMode ? '#38BDF8' : '#176B87'} />
                    <Text style={[styles.appIdText, isDarkMode && { color: '#38BDF8' }]}>{app.id}</Text>
                  </View>
                  <Badge label={app.status.toUpperCase()} variant={getStatusVariant(app.status)} />
                </View>

                {/* Service Title */}
                <Text style={[styles.appTitleText, isDarkMode && { color: '#F8FAFC' }]}>{app.serviceTitle}</Text>

                {/* Timeline Progress Bar Summary */}
                <View style={styles.timelineSummaryBox}>
                  <View style={styles.timelineStepRow}>
                    <View style={[styles.timelineDot, styles.timelineDotDone]} />
                    <View
                      style={[
                        styles.timelineLine,
                        app.status !== 'Under Review' ? styles.timelineLineDone : null,
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineDot,
                        app.status !== 'Under Review' ? styles.timelineDotDone : styles.timelineDotActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineLine,
                        app.status === 'Completed' ? styles.timelineLineDone : null,
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineDot,
                        app.status === 'Completed' ? styles.timelineDotDone : styles.timelineDotPending,
                      ]}
                    />
                  </View>
                  <View style={styles.timelineLabelsRow}>
                    <Text style={styles.timelineLabelText}>Submitted</Text>

                    <Text
                      style={[
                        styles.timelineLabelText,
                        { textAlign: 'center' },
                        app.status === 'Under Review' && { color: '#176B87', fontWeight: '800' },
                      ]}>
                      In Review
                    </Text>

                    <Text
                      style={[
                        styles.timelineLabelText,
                        { textAlign: 'right' },
                        app.status === 'Completed' && { color: '#16A34A', fontWeight: '800' },
                      ]}>
                      {app.status === 'Completed' ? 'Completed' : 'Release'}
                    </Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooterRow}>
                  <Text style={styles.updatedDateText}>Updated: {app.updatedAt}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.claimVoucherPill}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenClaimVoucher(app);
                      }}
                      activeOpacity={0.8}
                    >
                      <IconSymbol name="qrcode" size={13} color="#0F53D1" />
                      <Text style={styles.claimVoucherPillText}>Claim Voucher</Text>
                    </TouchableOpacity>
                    <View style={styles.viewTimelineBtn}>
                      <Text style={styles.viewTimelineText}>View Details</Text>
                      <IconSymbol name="chevron.right" size={14} color="#176B87" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* APPLICATION TIMELINE DETAIL MODAL */}
      <Modal
        visible={selectedApp !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedApp(null)}>
        <View style={styles.modalOverlay}>
          {selectedApp ? (
            <View style={[styles.modalCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B', borderWidth: 1 }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={[styles.modalIdText, isDarkMode && { color: '#38BDF8' }]}>{selectedApp.id}</Text>
                  <Text style={[styles.modalTitleText, isDarkMode && { color: '#F8FAFC' }]}>{selectedApp.serviceTitle}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedApp(null)} style={[styles.closeBtn, isDarkMode && { backgroundColor: '#0B132B' }]}>
                  <Text style={[styles.closeBtnText, isDarkMode && { color: '#F8FAFC' }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBadgeRow}>
                <Badge label={selectedApp.status.toUpperCase()} variant={getStatusVariant(selectedApp.status)} />
                <Text style={[styles.modalSubmittedText, isDarkMode && { color: '#94A3B8' }]}>Filed on {selectedApp.createdAt}</Text>
              </View>

              <View style={[styles.modalDivider, isDarkMode && { backgroundColor: '#3A506B' }]} />

              <Text style={[styles.timelineHeaderTitle, isDarkMode && { color: '#F8FAFC' }]}>Processing Milestones</Text>

              {/* Step 1 */}
              <View style={styles.milestoneRow}>
                <View style={styles.milestoneIconDone}>
                  <IconSymbol name="checkmark.seal.fill" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneTitle, isDarkMode && { color: '#F8FAFC' }]}>1. Application Received & Encoded</Text>
                  <Text style={[styles.milestoneSub, isDarkMode && { color: '#94A3B8' }]}>Application data recorded on {selectedApp.createdAt}</Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.milestoneRow}>
                <View
                  style={
                    selectedApp.status === 'Under Review'
                      ? styles.milestoneIconActive
                      : styles.milestoneIconDone
                  }>
                  <IconSymbol
                    name={selectedApp.status === 'Under Review' ? 'pencil' : 'checkmark.seal.fill'}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneTitle, isDarkMode && { color: '#F8FAFC' }]}>2. Document Verification & Evaluation</Text>
                  <Text style={[styles.milestoneSub, isDarkMode && { color: '#94A3B8' }]}>
                    {selectedApp.status === 'Under Review'
                      ? 'Currently being evaluated by Department Officer'
                      : `Verified & Approved on ${selectedApp.updatedAt}`}
                  </Text>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.milestoneRow}>
                <View
                  style={
                    selectedApp.status === 'Completed'
                      ? styles.milestoneIconDone
                      : selectedApp.status === 'Approved'
                      ? styles.milestoneIconActive
                      : [styles.milestoneIconPending, isDarkMode && { backgroundColor: '#334155' }]
                  }>
                  <IconSymbol
                    name={selectedApp.status === 'Completed' ? 'checkmark.seal.fill' : 'doc.text.fill'}
                    size={16}
                    color={selectedApp.status === 'Under Review' ? (isDarkMode ? '#64748B' : '#94A3B8') : '#FFFFFF'}
                  />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneTitle, isDarkMode && { color: '#F8FAFC' }]}>3. Official E-Permit Release / Completion</Text>
                  <Text style={[styles.milestoneSub, isDarkMode && { color: '#94A3B8' }]}>
                    {selectedApp.status === 'Completed'
                      ? 'Digital Clearance Issued & Archived'
                      : selectedApp.status === 'Approved'
                      ? 'Approved. Final clearance ready for download'
                      : 'Pending completion of document review'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.openVoucherBtn}
                onPress={() => {
                  if (selectedApp) handleOpenClaimVoucher(selectedApp);
                }}
                activeOpacity={0.85}>
                <IconSymbol name="qrcode" size={16} color="#FFFFFF" />
                <Text style={styles.openVoucherBtnText}>View Digital Claim Voucher</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneModalBtn}
                onPress={() => setSelectedApp(null)}
                activeOpacity={0.85}>
                <Text style={styles.doneModalBtnText}>Close Tracker Details</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* DIGITAL CLAIM VOUCHER MODAL */}
      <CertificateClaimVoucherModal
        visible={activeVoucher !== null}
        onClose={() => setActiveVoucher(null)}
        voucherData={activeVoucher}
      />
    </View>
  );
}

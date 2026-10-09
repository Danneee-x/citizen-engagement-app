import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { CivicAlert, NotificationService } from '@/src/services/notification-service';
import { FormattedAlertBody } from './FormattedAlertBody';

interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  Emergency: {
    label: 'Emergency',
    icon: 'exclamationmark.triangle.fill',
    color: '#E11D48',
    bgColor: '#FFF1F2',
    darkBgColor: '#38141F',
    borderColor: '#FECDD3',
  },
  'Health Advisory': {
    label: 'Health Advisory',
    icon: 'cross.case.fill',
    color: '#D97706',
    bgColor: '#FFFBEB',
    darkBgColor: '#33230E',
    borderColor: '#FDE68A',
  },
  Event: {
    label: 'Event',
    icon: 'calendar',
    color: '#9333EA',
    bgColor: '#FAF5FF',
    darkBgColor: '#27114A',
    borderColor: '#E9D5FF',
  },
  'General Announcement': {
    label: 'General Announcement',
    icon: 'megaphone.fill',
    color: '#0F53D1',
    bgColor: '#EFF6FF',
    darkBgColor: '#10254C',
    borderColor: '#BFDBFE',
  },
  'Curfew / Ordinance Notice': {
    label: 'Curfew / Ordinance Notice',
    icon: 'shield.fill',
    color: '#059669',
    bgColor: '#ECFDF5',
    darkBgColor: '#0E3326',
    borderColor: '#A7F3D0',
  },
};

function getCategoryConfig(category?: string): CategoryConfig {
  const c = (category || '').toLowerCase().trim();
  if (c.includes('emergency')) return CATEGORY_MAP.Emergency;
  if (c.includes('health')) return CATEGORY_MAP['Health Advisory'];
  if (c.includes('event')) return CATEGORY_MAP.Event;
  if (c.includes('curfew') || c.includes('ordinance')) return CATEGORY_MAP['Curfew / Ordinance Notice'];
  return CATEGORY_MAP['General Announcement'];
}

export function NotificationsScreen() {
  const session = AuthService.getCurrentUser();
  const { isDarkMode } = useTheme();

  const [alerts, setAlerts] = useState<CivicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedAlert, setSelectedAlert] = useState<CivicAlert | null>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  const fetchAlerts = async () => {
    const data = await NotificationService.getCivicAlerts(session.email || '');
    if (!data || data.length === 0) {
      setAlerts([
        {
          id: 'CCN-ALT-2026-1473',
          title: 'Important Reminder: Keep Your Citizen Information Updated',
          body:
            'Dear Residents of Caloocan City,\n\nThe CIVENTRAL Citizen Portal reminds all registered residents to ensure that their personal information and contact details are accurate and up to date.\n\nPlease regularly check your account for notifications, community announcements, public consultations, and updates regarding barangay services.\n\nCIVENTRAL Administration\nCaloocan City Portal',
          bodyHtml:
            '<p>Dear Residents of Caloocan City,</p><p>The CIVENTRAL Citizen Portal reminds all registered residents to ensure that their personal information and contact details are accurate and up to date.</p><p>Please regularly check your account for notifications, community announcements, public consultations, and updates regarding barangay services.</p><p><strong>CIVENTRAL Administration</strong><br>Caloocan City Portal</p>',
          category: 'General Announcement',
          rawCategory: 'General Announcement',
          priority: 'Normal',
          timestamp: 'Just now',
          sender: 'Caloocan Public Information Office',
          attachmentUrl: null,
          isRead: false,
        },
        {
          id: 'ALT-101',
          title: 'Typhoon Weather Advisory #2 - Heavy Rainfall Alert',
          body:
            'DRRM Warning: Heavy rainfall expected across Caloocan City. Emergency evacuation shelters on standby:\n• Caloocan Sports Complex Evacuation Center\n• Barangay Covered Courts\n• Health Centers open 24/7 for emergency medical response.',
          bodyHtml:
            '<p><b>DRRM Warning:</b> Heavy rainfall expected across Caloocan City. Emergency evacuation shelters on standby:</p><ul><li>Caloocan Sports Complex Evacuation Center</li><li>Barangay Covered Courts</li><li>Health Centers open 24/7 for emergency medical response</li></ul>',
          category: 'Emergency',
          rawCategory: 'Emergency',
          priority: 'Urgent',
          timestamp: '10 mins ago',
          sender: 'Caloocan City Disaster Risk Reduction & Management',
          attachmentUrl: null,
          isRead: false,
        },
      ]);
    } else {
      setAlerts(data);
    }
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await fetchAlerts();
      setIsLoading(false);
    }
    load();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    setIsRefreshing(false);
  };

  const filterTabs = ['All', 'General', 'Emergency', 'Health', 'Events', 'Curfew / Ordinance'];

  const filteredAlerts = alerts.filter((item) => {
    if (selectedCategoryFilter === 'All') return true;
    const cat = (item.rawCategory || item.category || '').toLowerCase();
    const filter = selectedCategoryFilter.toLowerCase();
    return cat.includes(filter);
  });

  const markAlertAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleOpenAlert = (item: CivicAlert) => {
    markAlertAsRead(item.id);
    setSelectedAlert(item);
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0B132B' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? '#38BDF8' : '#0F53D1'}
          />
        }
      >
        {/* Header Title & Subtitle */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Notifications & Alerts
            </Text>
            <View style={[styles.liveBadge, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>OFFICIAL</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, isDarkMode && { color: '#94A3B8' }]}>
            Official broadcasts, emergency advisories, and public announcements sent directly from Caloocan City administration.
          </Text>
        </View>

        {/* Category Filters Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedCategoryFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedCategoryFilter(tab)}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  isActive && (isDarkMode ? styles.activeFilterPillDark : styles.activeFilterPill),
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isDarkMode && { color: '#94A3B8' },
                    isActive && styles.activeFilterPillText,
                  ]}
                >
                  {tab === 'All' ? 'All Broadcasts' : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading State */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={isDarkMode ? '#38BDF8' : '#0F53D1'} />
            <Text style={[styles.loadingText, isDarkMode && { color: '#38BDF8' }]}>
              Loading official announcements...
            </Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                isDarkMode && { backgroundColor: '#10254C' },
              ]}
            >
              <IconSymbol name="bell.fill" size={26} color={isDarkMode ? '#38BDF8' : '#0F53D1'} />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && { color: '#F8FAFC' }]}>
              No Announcements Found
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && { color: '#94A3B8' }]}>
              There are currently no active announcements in this category. Pull down to refresh.
            </Text>
          </View>
        ) : (
          <View style={styles.alertsStack}>
            {filteredAlerts.map((item) => {
              const catCfg = getCategoryConfig(item.rawCategory || item.category);
              const isUrgent = item.priority === 'Urgent';
              const isHigh = item.priority === 'High';
              const hasImage =
                item.attachmentUrl &&
                !item.attachmentUrl.toLowerCase().endsWith('.pdf') &&
                !failedImageUrls[item.attachmentUrl];
              const isPdf = item.attachmentUrl && item.attachmentUrl.toLowerCase().endsWith('.pdf');

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.92}
                  onPress={() => handleOpenAlert(item)}
                  style={[
                    styles.alertCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    !item.isRead && (isDarkMode ? styles.unreadAlertCardDark : styles.unreadAlertCard),
                  ]}
                >
                  {/* Web Admin In-App Header Row */}
                  <View
                    style={[
                      styles.alertTopHeaderRow,
                      isDarkMode && { borderBottomColor: '#2B395B' },
                    ]}
                  >
                    <View style={styles.categoryLeftRow}>
                      <View
                        style={[
                          styles.categoryIconBadge,
                          {
                            backgroundColor: isDarkMode ? catCfg.darkBgColor : catCfg.bgColor,
                            borderColor: catCfg.borderColor,
                          },
                        ]}
                      >
                        <IconSymbol name={catCfg.icon as any} size={13} color={catCfg.color} />
                      </View>
                      <Text style={[styles.categoryBadgeText, { color: catCfg.color }]}>
                        {catCfg.label}
                      </Text>

                      {/* Priority Tag (Urgent / High) */}
                      {isUrgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      )}
                      {isHigh && (
                        <View style={styles.highBadge}>
                          <Text style={styles.highBadgeText}>HIGH</Text>
                        </View>
                      )}
                    </View>

                    {/* Relative Timestamp */}
                    <Text style={[styles.timestampText, isDarkMode && { color: '#94A3B8' }]}>
                      {item.timestamp}
                    </Text>
                  </View>

                  {/* Title (Matching previewModalTitle: h4 text-sm font-black text-slate-900 leading-snug) */}
                  <Text style={[styles.alertTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {item.title}
                  </Text>

                  {/* Body Content (Faithfully preserving Web Admin rich text layout, bullets, and paragraphs) */}
                  <FormattedAlertBody
                    html={item.bodyHtml}
                    fallbackText={item.body}
                    isDarkMode={isDarkMode}
                    maxBlocks={5}
                    containerStyle={styles.formattedBodyContainer}
                  />

                  {/* Graphic Banner (Matching modalGraphicBannerContainer from Web Admin In-App Preview) */}
                  {hasImage && item.attachmentUrl && (
                    <View
                      style={[
                        styles.graphicBannerContainer,
                        isDarkMode && { borderColor: '#3A506B', backgroundColor: '#0B132B' },
                      ]}
                    >
                      <Image
                        source={{ uri: item.attachmentUrl }}
                        style={styles.graphicBannerImage}
                        resizeMode="cover"
                        onError={() => {
                          if (item.attachmentUrl) {
                            setFailedImageUrls((prev) => ({ ...prev, [item.attachmentUrl!]: true }));
                          }
                        }}
                      />
                    </View>
                  )}

                  {/* PDF Attachment Banner */}
                  {isPdf && item.attachmentUrl && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (item.attachmentUrl) Linking.openURL(item.attachmentUrl).catch(() => {});
                      }}
                      style={[
                        styles.pdfAttachmentBanner,
                        isDarkMode && { backgroundColor: '#131D38', borderColor: '#3A506B' },
                      ]}
                    >
                      <View style={styles.pdfLeftRow}>
                        <View style={styles.pdfIconContainer}>
                          <IconSymbol name="doc.text.fill" size={16} color="#E11D48" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pdfTitle, isDarkMode && { color: '#F8FAFC' }]}>
                            Official Attached Document (PDF)
                          </Text>
                          <Text style={[styles.pdfSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                            Tap to view / download document
                          </Text>
                        </View>
                      </View>
                      <View style={styles.pdfOpenPill}>
                        <Text style={styles.pdfOpenPillText}>Open</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Attribution Footer: Official sender signature & Tap to open */}
                  <View
                    style={[
                      styles.alertFooterRow,
                      isDarkMode && { borderTopColor: '#2B395B' },
                    ]}
                  >
                    <View style={styles.senderAttributionRow}>
                      <IconSymbol name="checkmark.seal.fill" size={13} color="#0F53D1" />
                      <Text
                        numberOfLines={1}
                        style={[styles.senderAttributionText, isDarkMode && { color: '#94A3B8' }]}
                      >
                        {item.sender || 'Caloocan Public Information Office'}
                      </Text>
                    </View>

                    <View style={styles.viewDetailsRow}>
                      <Text style={[styles.viewDetailsText, { color: isDarkMode ? '#38BDF8' : '#0F53D1' }]}>
                        View full
                      </Text>
                      <IconSymbol
                        name="chevron.right"
                        size={11}
                        color={isDarkMode ? '#38BDF8' : '#0F53D1'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Full Alert Review & Detail Modal (Matching Web Admin Modal & Drawer) */}
      <Modal
        visible={Boolean(selectedAlert)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedAlert && (
            <View
              style={[
                styles.modalCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* Modal Top Header Bar */}
              {(() => {
                const catCfg = getCategoryConfig(selectedAlert.rawCategory || selectedAlert.category);
                return (
                  <View
                    style={[
                      styles.modalHeaderRow,
                      isDarkMode && { borderBottomColor: '#2B395B' },
                    ]}
                  >
                    <View style={styles.categoryLeftRow}>
                      <View
                        style={[
                          styles.categoryIconBadge,
                          {
                            backgroundColor: isDarkMode ? catCfg.darkBgColor : catCfg.bgColor,
                            borderColor: catCfg.borderColor,
                          },
                        ]}
                      >
                        <IconSymbol name={catCfg.icon as any} size={14} color={catCfg.color} />
                      </View>
                      <Text style={[styles.categoryBadgeText, { color: catCfg.color }]}>
                        {catCfg.label}
                      </Text>
                      {selectedAlert.priority === 'Urgent' && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      )}
                      {selectedAlert.priority === 'High' && (
                        <View style={styles.highBadge}>
                          <Text style={styles.highBadgeText}>HIGH</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedAlert(null)}
                      style={[
                        styles.modalCloseBtn,
                        isDarkMode && { backgroundColor: '#0B132B' },
                      ]}
                    >
                      <Text style={[styles.modalCloseBtnText, isDarkMode && { color: '#F8FAFC' }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScrollBody}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Official Title */}
                <Text style={[styles.modalTitle, isDarkMode && { color: '#F8FAFC' }]}>
                  {selectedAlert.title}
                </Text>

                {/* Dispatch Details & Timestamp */}
                <View
                  style={[
                    styles.modalMetaBox,
                    isDarkMode && { backgroundColor: '#0B132B', borderColor: '#3A506B' },
                  ]}
                >
                  <View style={styles.modalMetaRow}>
                    <IconSymbol name="checkmark.seal.fill" size={14} color="#0F53D1" />
                    <Text style={[styles.modalMetaSender, isDarkMode && { color: '#E2E8F0' }]}>
                      {selectedAlert.sender || 'Caloocan Public Information Office'}
                    </Text>
                  </View>
                  <Text style={[styles.modalMetaTimestamp, isDarkMode && { color: '#94A3B8' }]}>
                    Dispatched • {selectedAlert.timestamp}
                  </Text>
                </View>

                {/* Full Graphic Banner (if available) */}
                {selectedAlert.attachmentUrl &&
                  !selectedAlert.attachmentUrl.toLowerCase().endsWith('.pdf') &&
                  !failedImageUrls[selectedAlert.attachmentUrl] && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        if (selectedAlert.attachmentUrl) {
                          Linking.openURL(selectedAlert.attachmentUrl).catch(() => {});
                        }
                      }}
                      style={[
                        styles.modalGraphicBannerContainer,
                        isDarkMode && { borderColor: '#3A506B', backgroundColor: '#0B132B' },
                      ]}
                    >
                      <Image
                        source={{ uri: selectedAlert.attachmentUrl }}
                        style={styles.modalGraphicBannerImage}
                        resizeMode="contain"
                      />
                      <View style={styles.zoomHintOverlay}>
                        <Text style={styles.zoomHintText}>Tap image to view full resolution</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                {/* Full Formatted Body */}
                <FormattedAlertBody
                  html={selectedAlert.bodyHtml}
                  fallbackText={selectedAlert.body}
                  isDarkMode={isDarkMode}
                  containerStyle={styles.modalFormattedBodyContainer}
                />

                {/* PDF Document Download/Open Action Button */}
                {selectedAlert.attachmentUrl &&
                  selectedAlert.attachmentUrl.toLowerCase().endsWith('.pdf') && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (selectedAlert.attachmentUrl) {
                          Linking.openURL(selectedAlert.attachmentUrl).catch(() => {});
                        }
                      }}
                      style={[
                        styles.modalPdfBtn,
                        isDarkMode && { backgroundColor: '#131D38', borderColor: '#3A506B' },
                      ]}
                    >
                      <IconSymbol name="doc.text.fill" size={18} color="#E11D48" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalPdfBtnTitle, isDarkMode && { color: '#F8FAFC' }]}>
                          Official PDF Notice Attached
                        </Text>
                        <Text style={[styles.modalPdfBtnSub, isDarkMode && { color: '#94A3B8' }]}>
                          Click to open official signed document
                        </Text>
                      </View>
                      <View style={styles.modalPdfBtnAction}>
                        <Text style={styles.modalPdfBtnActionText}>Open PDF</Text>
                      </View>
                    </TouchableOpacity>
                  )}
              </ScrollView>

              {/* Modal Footer Close Button */}
              <View
                style={[
                  styles.modalFooterRow,
                  isDarkMode && { borderTopColor: '#2B395B' },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedAlert(null)}
                  style={[
                    styles.modalDismissBtn,
                    isDarkMode ? { backgroundColor: '#0F53D1' } : { backgroundColor: '#0F53D1' },
                  ]}
                >
                  <Text style={styles.modalDismissBtnText}>Dismiss Notice</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  headerContainer: {
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F53D1',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F53D1',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  filterBarContainer: {
    gap: 8,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    backgroundColor: '#0F53D1',
    borderColor: '#0F53D1',
  },
  activeFilterPillDark: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#0F53D1',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  alertsStack: {
    gap: 14,
  },
  // In-App Alert Card (Faithful to Web Admin)
  alertCard: {
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
  unreadAlertCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  unreadAlertCardDark: {
    borderColor: '#0284C7',
    backgroundColor: '#122544',
  },
  alertTopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  categoryLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
  },
  highBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  highBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 8,
  },
  formattedBodyContainer: {
    marginBottom: 4,
  },
  // Attached Graphic Banner Container
  graphicBannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    maxHeight: 180,
    marginTop: 10,
  },
  graphicBannerImage: {
    width: '100%',
    height: 180,
  },
  pdfAttachmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  pdfLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pdfIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pdfSubtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  pdfOpenPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pdfOpenPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F53D1',
  },
  alertFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
    marginTop: 10,
  },
  senderAttributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  senderAttributionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalScrollBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 10,
  },
  modalMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14,
    gap: 3,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMetaSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalMetaTimestamp: {
    fontSize: 11,
    color: '#64748B',
    paddingLeft: 20,
  },
  modalGraphicBannerContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    maxHeight: 240,
    marginBottom: 14,
  },
  modalGraphicBannerImage: {
    width: '100%',
    height: 200,
  },
  zoomHintOverlay: {
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    alignItems: 'center',
  },
  zoomHintText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  modalFormattedBodyContainer: {
    marginBottom: 16,
  },
  modalPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalPdfBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalPdfBtnSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalPdfBtnAction: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalPdfBtnActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F53D1',
  },
  modalFooterRow: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalDismissBtn: {
    backgroundColor: '#0F53D1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDismissBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

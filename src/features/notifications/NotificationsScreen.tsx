import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '@/src/components/ui/Badge';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { CivicAlert, NotificationService } from '@/src/services/notification-service';

export function NotificationsScreen() {
  const session = AuthService.getCurrentUser();
  const { isDarkMode } = useTheme();

  const [alerts, setAlerts] = useState<CivicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<CivicAlert | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fetchAlerts = async () => {
    try {
      const data = await NotificationService.getCivicAlerts(session?.email || '');
      setAlerts(data || []);
    } catch {
      setAlerts([]);
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

  const getBadgeVariant = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('emergency')) return 'danger';
    if (c.includes('health') || c.includes('curfew')) return 'warning';
    if (c.includes('domain') || c.includes('event')) return 'info';
    return 'success';
  };

  const handleAlertPress = (alert: CivicAlert) => {
    setReadAlertIds(prev => new Set(prev).add(alert.id));
    setSelectedAlert(alert);
  };

  const isAlertRead = (alert: CivicAlert) => {
    return alert.isRead || readAlertIds.has(alert.id);
  };

  const markAllAsRead = () => {
    const allIds = new Set(alerts.map(a => a.id));
    setReadAlertIds(allIds);
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0B132B' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#176B87" />
        }>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.headerTitle, isDarkMode && { color: '#F8FAFC' }]}>Notifications & Alerts</Text>
              <Text style={[styles.headerSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                Real-time municipal announcements, emergency warnings & status updates.
              </Text>
            </View>
            {alerts.length > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                activeOpacity={0.7}
                style={[styles.markReadBtn, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
                <Text style={[styles.markReadText, isDarkMode && { color: '#38BDF8' }]}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Body */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={isDarkMode ? '#38BDF8' : '#176B87'} />
            <Text style={[styles.loadingText, isDarkMode && { color: '#38BDF8' }]}>Checking for live advisories...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={[styles.emptyContainer, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
            <View style={[styles.emptyIconBox, isDarkMode && { backgroundColor: '#0B132B' }]}>
              <IconSymbol name="bell.fill" size={32} color={isDarkMode ? '#64748B' : '#94A3B8'} />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && { color: '#F8FAFC' }]}>No Active Notifications</Text>
            <Text style={[styles.emptySubtitle, isDarkMode && { color: '#94A3B8' }]}>
              You are completely up to date! Broadcasts, emergency alerts, and announcements issued by the municipal administration will appear here.
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              activeOpacity={0.8}
              style={[styles.refreshBtn, isDarkMode && { backgroundColor: '#38BDF8' }]}>
              <Text style={[styles.refreshBtnText, isDarkMode && { color: '#0B132B' }]}>Check for Updates</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.alertsStack}>
            {alerts.map((item) => {
              const read = isAlertRead(item);
              const isUrgent = (item.priority || '').toLowerCase() === 'urgent' || (item.category || '').toLowerCase().includes('emergency');

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleAlertPress(item)}
                  style={[
                    styles.alertCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    !read && (isDarkMode ? { backgroundColor: '#0F2942', borderColor: '#0284C7' } : styles.unreadAlertCard),
                    isUrgent && !read && styles.urgentCardHighlight,
                  ]}>
                  
                  {/* Top Row: Category Badge + Priority / Relative Time */}
                  <View style={styles.alertTopRow}>
                    <View style={styles.badgeRow}>
                      <Badge label={(item.category || 'BROADCAST').toUpperCase()} variant={getBadgeVariant(item.category)} />
                      {item.priority === 'Urgent' && (
                        <View style={styles.urgentPill}>
                          <Text style={styles.urgentPillText}>URGENT</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.timeRow}>
                      {!read && <View style={styles.unreadDot} />}
                      <Text style={[styles.timestampText, isDarkMode && { color: '#94A3B8' }]}>{item.timestamp}</Text>
                    </View>
                  </View>

                  {/* Alert Title */}
                  <Text style={[styles.alertTitle, isDarkMode && { color: '#F8FAFC' }]}>{item.title}</Text>
                  
                  {/* Alert Body Snippet */}
                  <Text numberOfLines={3} style={[styles.alertBody, isDarkMode && { color: '#CBD5E1' }]}>
                    {item.body}
                  </Text>

                  {/* Attachment Preview (Image or Document) */}
                  {item.attachmentUrl && !item.attachmentUrl.toLowerCase().endsWith('.pdf') && !failedImages[item.attachmentUrl] ? (
                    <View style={[styles.cardImageContainer, isDarkMode && { borderColor: '#3A506B', backgroundColor: '#0B132B' }]}>
                      <Image
                        source={{ uri: item.attachmentUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                        onError={() => {
                          if (item.attachmentUrl) {
                            setFailedImages((prev) => ({ ...prev, [item.attachmentUrl!]: true }));
                          }
                        }}
                      />
                    </View>
                  ) : item.attachmentUrl && item.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                    <View style={[styles.cardPdfAttachment, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                      <IconSymbol name="doc.text.fill" size={13} color="#EF4444" />
                      <Text style={[styles.cardPdfText, isDarkMode && { color: '#FCA5A5' }]}>PDF Document Attached</Text>
                    </View>
                  ) : null}

                  {/* Card Footer: Sender & Tap Hint */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.senderText, isDarkMode && { color: '#64748B' }]}>
                      {item.sender || 'Caloocan Public Information Office'}
                    </Text>
                    <Text style={[styles.viewDetailsHint, isDarkMode && { color: '#38BDF8' }]}>
                      Tap for details &rsaquo;
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Alert Details Full Modal */}
      {selectedAlert && (
        <Modal
          visible={Boolean(selectedAlert)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAlert(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.badgeRow}>
                  <Badge label={(selectedAlert.category || 'BROADCAST').toUpperCase()} variant={getBadgeVariant(selectedAlert.category)} />
                  {selectedAlert.priority && (
                    <View style={[styles.urgentPill, selectedAlert.priority !== 'Urgent' && { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.urgentPillText, selectedAlert.priority !== 'Urgent' && { color: '#475569' }]}>
                        {selectedAlert.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedAlert(null)}
                  style={[styles.modalCloseBtn, isDarkMode && { backgroundColor: '#0B132B' }]}>
                  <Text style={[styles.modalCloseText, isDarkMode && { color: '#CBD5E1' }]}>&times;</Text>
                </TouchableOpacity>
              </View>

              {/* Title & Metadata */}
              <Text style={[styles.modalTitle, isDarkMode && { color: '#F8FAFC' }]}>{selectedAlert.title}</Text>
              
              <View style={styles.modalMetaRow}>
                <Text style={[styles.modalMetaText, isDarkMode && { color: '#94A3B8' }]}>
                  {selectedAlert.sender || 'Caloocan Public Information Office'}
                </Text>
                <Text style={[styles.modalMetaText, isDarkMode && { color: '#94A3B8' }]}>&bull;</Text>
                <Text style={[styles.modalMetaText, isDarkMode && { color: '#94A3B8' }]}>{selectedAlert.timestamp}</Text>
              </View>

              {/* Body Content & Image Attachment */}
              <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                {selectedAlert.attachmentUrl && !selectedAlert.attachmentUrl.toLowerCase().endsWith('.pdf') && !failedImages[selectedAlert.attachmentUrl] ? (
                  <View style={[styles.modalImageContainer, isDarkMode && { borderColor: '#3A506B', backgroundColor: '#0B132B' }]}>
                    <Image
                      source={{ uri: selectedAlert.attachmentUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                      onError={() => {
                        if (selectedAlert.attachmentUrl) {
                          setFailedImages((prev) => ({ ...prev, [selectedAlert.attachmentUrl!]: true }));
                        }
                      }}
                    />
                  </View>
                ) : selectedAlert.attachmentUrl && selectedAlert.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                  <View style={[styles.modalPdfContainer, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                    <IconSymbol name="doc.text.fill" size={20} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalPdfTitle, isDarkMode && { color: '#F8FAFC' }]}>PDF Document Attached</Text>
                      <Text style={[styles.modalPdfSubtitle, isDarkMode && { color: '#94A3B8' }]}>Official document included with this municipal bulletin</Text>
                    </View>
                  </View>
                ) : null}

                <Text style={[styles.modalBodyText, isDarkMode && { color: '#E2E8F0' }]}>
                  {selectedAlert.body}
                </Text>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => setSelectedAlert(null)}
                  style={[styles.modalPrimaryBtn, isDarkMode && { backgroundColor: '#38BDF8' }]}>
                  <Text style={[styles.modalPrimaryBtnText, isDarkMode && { color: '#0B132B' }]}>Got It</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

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
    paddingBottom: 130,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#176B87',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#176B87',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 18,
  },
  refreshBtn: {
    backgroundColor: '#176B87',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  alertsStack: {
    gap: 12,
  },
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
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  urgentCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  urgentPillText: {
    color: '#B91C1C',
    fontSize: 9,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  alertBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  senderText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  viewDetailsHint: {
    fontSize: 11,
    color: '#176B87',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    lineHeight: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  modalMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalBodyScroll: {
    maxHeight: 360,
    marginBottom: 16,
  },
  modalBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  cardImageContainer: {
    marginTop: 10,
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPdfAttachment: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-start',
  },
  cardPdfText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
  modalImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  modalPdfTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalPdfSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalFooter: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  modalPrimaryBtn: {
    backgroundColor: '#176B87',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});


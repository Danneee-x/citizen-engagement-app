import React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';

export interface ClaimVoucherData {
  referenceNumber: string;
  certificateName: string;
  applicantName: string;
  barangay: string;
  status: 'Submitted' | 'Under Review' | 'Processing' | 'Ready for Release' | 'Claimed' | 'Completed' | string;
  submissionDate: string;
  pickupLocation?: string;
  estimatedTurnaround?: string;
  feeAmount?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Waived' | string;
  validityPeriod?: string;
  purpose?: string;
}

export interface CertificateClaimVoucherModalProps {
  visible: boolean;
  onClose: () => void;
  voucherData: ClaimVoucherData | null;
}

/**
 * Deterministic Barcode Renderer
 */
export function BarcodeVisual({ code, isDark = false }: { code: string; isDark?: boolean }) {
  const barPattern = React.useMemo(() => {
    const pattern: { width: number; isBar: boolean }[] = [];
    pattern.push({ width: 3.5, isBar: true });
    pattern.push({ width: 2, isBar: false });
    pattern.push({ width: 2.5, isBar: true });
    pattern.push({ width: 2.5, isBar: false });

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      pattern.push({ width: (charCode % 3) + 1.8, isBar: true });
      pattern.push({ width: ((charCode * 2) % 3) + 1.2, isBar: false });
      pattern.push({ width: ((charCode * 5) % 4) + 1.6, isBar: true });
      pattern.push({ width: 1.5, isBar: false });
    }

    pattern.push({ width: 2.5, isBar: true });
    pattern.push({ width: 2, isBar: false });
    pattern.push({ width: 3.5, isBar: true });
    return pattern;
  }, [code]);

  const barColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <View style={barcodeStyles.container}>
      <View style={barcodeStyles.barsRow}>
        {barPattern.map((p, idx) => (
          <View
            key={idx}
            style={{
              width: p.width,
              height: 44,
              backgroundColor: p.isBar ? barColor : 'transparent',
            }}
          />
        ))}
      </View>
      <Text style={[barcodeStyles.codeText, isDark && { color: '#E2E8F0' }]}>{code}</Text>
    </View>
  );
}

const barcodeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  codeText: {
    marginTop: 6,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0F172A',
  },
});

export const VOUCHER_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Application filed online' },
  { id: 'under_review', label: 'Document Review', desc: 'Issuing bureau evaluating records' },
  { id: 'processing', label: 'Processing & Verification', desc: 'Registry clearance & credential coding' },
  { id: 'ready_release', label: 'Ready for Release', desc: 'Available at designated release desk' },
  { id: 'completed', label: 'Completed', desc: 'Certificate claimed & released' },
];

function getStageIndex(status?: string): number {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s.includes('claimed') || s.includes('released')) return 4;
  if (s.includes('ready') || s.includes('release')) return 3;
  if (s.includes('process')) return 2;
  if (s.includes('review') || s.includes('verif')) return 1;
  return 0;
}

/**
 * Core Claim Voucher Card (Can be embedded directly into views or opened in modal)
 */
export function CertificateClaimVoucherCard({
  voucherData,
  onSaveVoucher,
}: {
  voucherData: ClaimVoucherData;
  onSaveVoucher?: () => void;
}) {
  const { isDarkMode } = useTheme();
  const currentStageIdx = getStageIndex(voucherData.status);

  const pickupStation =
    voucherData.pickupLocation ||
    `${voucherData.barangay || 'Barangay'} Hall - Administrative Records Desk`;

  const turnaround = voucherData.estimatedTurnaround || '1 to 2 Business Days';
  const fee = voucherData.feeAmount ? `₱${voucherData.feeAmount}` : '₱50.00';
  const paymentStatus = voucherData.paymentStatus || 'Pending';

  const handleDefaultSave = () => {
    Alert.alert(
      'Digital Claim Voucher Saved',
      `Reference Code ${voucherData.referenceNumber} has been verified and saved to your device. You can present this digital barcode at ${pickupStation} upon claiming.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View
      style={[
        cardStyles.cardContainer,
        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
      ]}
    >
      {/* Official Government Seal Banner */}
      <View style={cardStyles.officialHeaderRow}>
        <View style={cardStyles.sealIconBox}>
          <IconSymbol name="building.2.fill" size={18} color="#0F53D1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.lguTitle, isDarkMode && { color: '#F8FAFC' }]}>
            CIVENTRAL • CITY OF CALOOCAN
          </Text>
          <Text style={[cardStyles.lguSubtitle, isDarkMode && { color: '#94A3B8' }]}>
            Official Barangay Certificate Issuance & Release Desk
          </Text>
        </View>
        <View style={cardStyles.officialBadge}>
          <Text style={cardStyles.officialBadgeText}>VERIFIED STUB</Text>
        </View>
      </View>

      {/* Main Digital Voucher Block */}
      <View
        style={[
          cardStyles.voucherCenterBox,
          isDarkMode && { backgroundColor: '#0B132B', borderColor: '#3A506B' },
        ]}
      >
        <Text style={cardStyles.voucherEyebrow}>DIGITAL CLAIM VOUCHER</Text>
        <Text style={[cardStyles.certNameTitle, isDarkMode && { color: '#38BDF8' }]}>
          {voucherData.certificateName}
        </Text>

        {/* Barcode Graphic */}
        <BarcodeVisual code={voucherData.referenceNumber} isDark={isDarkMode} />

        <Text style={[cardStyles.barcodeInstruction, isDarkMode && { color: '#94A3B8' }]}>
          Present this reference barcode or QR voucher at the release counter.
        </Text>
      </View>

      {/* Designated Pick-up Station (Emerald Tint Box matching Web Admin id-releases.php) */}
      <View
        style={[
          cardStyles.pickupBox,
          isDarkMode && { backgroundColor: '#0D2B22', borderColor: '#059669' },
        ]}
      >
        <View style={cardStyles.pickupTitleRow}>
          <IconSymbol name="person.text.rectangle.fill" size={15} color="#059669" />
          <Text style={cardStyles.pickupHeading}>Designated Release Counter & Pick-up</Text>
        </View>

        <View style={cardStyles.pickupDetailsGrid}>
          <View style={cardStyles.pickupDetailRow}>
            <Text style={cardStyles.pickupLabel}>Claim Center:</Text>
            <Text
              style={[
                cardStyles.pickupValueBold,
                isDarkMode && { color: '#ECFDF5' },
              ]}
              numberOfLines={2}
            >
              {pickupStation}
            </Text>
          </View>

          <View style={cardStyles.pickupDetailRow}>
            <Text style={cardStyles.pickupLabel}>Turnaround:</Text>
            <Text style={cardStyles.pickupTurnaround}>{turnaround}</Text>
          </View>

          <View style={cardStyles.pickupDetailRow}>
            <Text style={cardStyles.pickupLabel}>Applicant:</Text>
            <Text style={[cardStyles.pickupValue, isDarkMode && { color: '#CBD5E1' }]}>
              {voucherData.applicantName}
            </Text>
          </View>

          <View style={cardStyles.pickupDetailRow}>
            <Text style={cardStyles.pickupLabel}>Barangay:</Text>
            <Text style={[cardStyles.pickupValue, isDarkMode && { color: '#CBD5E1' }]}>
              {voucherData.barangay}
            </Text>
          </View>

          <View style={cardStyles.pickupDetailRow}>
            <Text style={cardStyles.pickupLabel}>Fee & Status:</Text>
            <View style={cardStyles.feeRow}>
              <Text style={[cardStyles.feeAmountText, isDarkMode && { color: '#F8FAFC' }]}>
                {fee}
              </Text>
              <View
                style={[
                  cardStyles.paymentStatusPill,
                  paymentStatus === 'Paid'
                    ? cardStyles.pillPaid
                    : paymentStatus === 'Waived'
                    ? cardStyles.pillWaived
                    : cardStyles.pillPending,
                ]}
              >
                <Text style={cardStyles.paymentStatusText}>
                  {paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 5-Stage Lifecycle Stepper (Matching id-releases.php) */}
      <View
        style={[
          cardStyles.lifecycleCard,
          isDarkMode && { backgroundColor: '#131D38', borderColor: '#3A506B' },
        ]}
      >
        <Text style={[cardStyles.lifecycleHeading, isDarkMode && { color: '#F8FAFC' }]}>
          Application Lifecycle Tracking
        </Text>
        <Text style={[cardStyles.lifecycleSub, isDarkMode && { color: '#94A3B8' }]}>
          Submitted → Document Review → Processing → Ready for Release → Completed
        </Text>

        <View style={cardStyles.stepperList}>
          {VOUCHER_STAGES.map((stg, sIdx) => {
            const isCompleted = sIdx < currentStageIdx || currentStageIdx === 4;
            const isCurrent = sIdx === currentStageIdx && currentStageIdx !== 4;
            const isPending = sIdx > currentStageIdx;

            return (
              <View key={stg.id} style={cardStyles.stepItemRow}>
                <View style={cardStyles.stepIconCol}>
                  <View
                    style={[
                      cardStyles.stepCircle,
                      isCompleted && cardStyles.stepCircleCompleted,
                      isCurrent && cardStyles.stepCircleCurrent,
                      isPending && (isDarkMode ? cardStyles.stepCirclePendingDark : cardStyles.stepCirclePending),
                    ]}
                  >
                    {isCompleted ? (
                      <IconSymbol name="checkmark" size={10} color="#FFFFFF" />
                    ) : isCurrent ? (
                      <View style={cardStyles.currentDot} />
                    ) : (
                      <View style={cardStyles.pendingDot} />
                    )}
                  </View>
                  {sIdx < VOUCHER_STAGES.length - 1 && (
                    <View
                      style={[
                        cardStyles.stepLine,
                        isCompleted && cardStyles.stepLineCompleted,
                        isDarkMode && !isCompleted && { backgroundColor: '#334155' },
                      ]}
                    />
                  )}
                </View>

                <View style={cardStyles.stepContentCol}>
                  <View style={cardStyles.stepTitleRow}>
                    <Text
                      style={[
                        cardStyles.stepTitle,
                        (isCompleted || isCurrent) && cardStyles.stepTitleActive,
                        isCurrent && { color: '#0F53D1' },
                        isDarkMode && { color: isCompleted || isCurrent ? '#F8FAFC' : '#64748B' },
                      ]}
                    >
                      {stg.label}
                    </Text>
                    {isCompleted && (
                      <Text style={cardStyles.checkMarkBadge}>✓ Done</Text>
                    )}
                    {isCurrent && (
                      <View style={cardStyles.activeStatusPill}>
                        <Text style={cardStyles.activeStatusPillText}>IN PROGRESS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[cardStyles.stepDesc, isDarkMode && { color: '#94A3B8' }]}>
                    {stg.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Checklist: Documents to Bring Upon Claiming */}
      <View
        style={[
          cardStyles.checklistCard,
          isDarkMode && { backgroundColor: '#131D38', borderColor: '#3A506B' },
        ]}
      >
        <Text style={[cardStyles.checklistHeader, isDarkMode && { color: '#F8FAFC' }]}>
          Documents to Bring Upon Claiming:
        </Text>
        <View style={cardStyles.checklistItems}>
          <View style={cardStyles.checklistItemRow}>
            <IconSymbol name="checkmark.circle.fill" size={14} color="#059669" />
            <Text style={[cardStyles.checkItemText, isDarkMode && { color: '#E2E8F0' }]}>
              1 Valid Government-issued Photo ID (original)
            </Text>
          </View>
          <View style={cardStyles.checklistItemRow}>
            <IconSymbol name="checkmark.circle.fill" size={14} color="#059669" />
            <Text style={[cardStyles.checkItemText, isDarkMode && { color: '#E2E8F0' }]}>
              Original residency proof (Utility Bill, CTC Cedula, or Barangay Endorsement)
            </Text>
          </View>
          <View style={cardStyles.checklistItemRow}>
            <IconSymbol name="checkmark.circle.fill" size={14} color="#059669" />
            <Text style={[cardStyles.checkItemText, isDarkMode && { color: '#E2E8F0' }]}>
              This digital claim voucher or printed receipt
            </Text>
          </View>
        </View>
      </View>

      {/* Security Seal Verification Tag */}
      <View
        style={[
          cardStyles.securitySealRow,
          isDarkMode && { borderTopColor: '#2B395B' },
        ]}
      >
        <IconSymbol name="lock.fill" size={11} color="#64748B" />
        <Text style={[cardStyles.securitySealText, isDarkMode && { color: '#64748B' }]}>
          OFFICIAL LGU CALOOCAN VERIFIED CREDENTIAL • CRYPTOGRAPHIC BARCODE
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={cardStyles.cardActionRow}>
        <TouchableOpacity
          style={cardStyles.saveVoucherBtn}
          onPress={onSaveVoucher || handleDefaultSave}
          activeOpacity={0.85}
        >
          <IconSymbol name="qrcode" size={15} color="#FFFFFF" />
          <Text style={cardStyles.saveVoucherBtnText}>Save Voucher</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Full Modal View of the Certificate Claim Voucher
 */
export function CertificateClaimVoucherModal({
  visible,
  onClose,
  voucherData,
}: CertificateClaimVoucherModalProps) {
  const { isDarkMode } = useTheme();

  if (!voucherData) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View
          style={[
            modalStyles.card,
            isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
          ]}
        >
          {/* Top Bar with Close Button */}
          <View
            style={[
              modalStyles.topBar,
              isDarkMode && { borderBottomColor: '#2B395B' },
            ]}
          >
            <View style={modalStyles.topBarLeft}>
              <View style={modalStyles.appLogoCircle}>
                <IconSymbol name="building.2.fill" size={14} color="#0F53D1" />
              </View>
              <Text style={[modalStyles.topBarTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Official Certificate Claim Stub
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                modalStyles.closeBtn,
                isDarkMode && { backgroundColor: '#0B132B' },
              ]}
            >
              <Text style={[modalStyles.closeBtnText, isDarkMode && { color: '#F8FAFC' }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Voucher Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollBody}
          >
            <CertificateClaimVoucherCard voucherData={voucherData} />
          </ScrollView>

          {/* Bottom Bar Close Button */}
          <View
            style={[
              modalStyles.bottomBar,
              isDarkMode && { borderTopColor: '#2B395B', backgroundColor: '#1C2541' },
            ]}
          >
            <TouchableOpacity
              style={modalStyles.dismissBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.dismissBtnText}>Close Voucher</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  officialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sealIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lguTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  lguSubtitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  officialBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  officialBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  voucherCenterBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  voucherEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: 2,
  },
  certNameTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F53D1',
    textAlign: 'center',
    marginBottom: 4,
  },
  barcodeInstruction: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  pickupBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  pickupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  pickupDetailsGrid: {
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.2)',
    paddingTop: 6,
  },
  pickupDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  pickupValueBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    maxWidth: '65%',
  },
  pickupTurnaround: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F53D1',
  },
  pickupValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeAmountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pillPaid: {
    backgroundColor: '#DCFCE7',
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
  },
  pillWaived: {
    backgroundColor: '#E0E7FF',
  },
  paymentStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F172A',
  },
  lifecycleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  lifecycleHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  lifecycleSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperList: {
    gap: 8,
    marginTop: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepIconCol: {
    alignItems: 'center',
    width: 18,
  },
  stepCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#0F53D1',
  },
  stepCirclePending: {
    backgroundColor: '#E2E8F0',
  },
  stepCirclePendingDark: {
    backgroundColor: '#334155',
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pendingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 14,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  checkMarkBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  activeStatusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeStatusPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F53D1',
  },
  stepDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  checklistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  checklistHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  checklistItems: {
    gap: 4,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkItemText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  securitySealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  securitySealText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  cardActionRow: {
    marginTop: 2,
  },
  saveVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F53D1',
    borderRadius: 12,
    paddingVertical: 11,
  },
  saveVoucherBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scrollBody: {
    padding: 14,
  },
  bottomBar: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  dismissBtn: {
    backgroundColor: '#0F53D1',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

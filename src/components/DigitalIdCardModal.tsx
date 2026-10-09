import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient as SvgGradient, Path as SvgPath, Stop as SvgStop } from 'react-native-svg';
import { IconSymbol } from '@/src/components/ui/icon-symbol';

export interface DigitalIdCardData {
  reference_no?: string;
  citizen_id_number?: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  gender?: string | null;
  sex?: string | null;
  birthdate?: string | null;
  birth_date?: string | null;
  civil_status?: string | null;
  blood_type?: string | null;
  street_address?: string | null;
  barangay?: string | null;
  district?: string | null;
  emergency_contact?: string | null;
  emergency_contact_phone?: string | null;
  photo_url?: string | null;
  photo_1x1_url?: string | null;
  photo_2x2_url?: string | null;
  signature_url?: string | null;
  signature_photo_url?: string | null;
  e_signature_name?: string | null;
  id_category?: string | null;
  id_title?: string | null;
  status?: string | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  valid_until?: string | null;
  qr_code_token?: string | null;
}

interface DigitalIdCardModalProps {
  visible: boolean;
  onClose: () => void;
  data: DigitalIdCardData | null;
}

export function DigitalIdCardModal({ visible, onClose, data }: DigitalIdCardModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  if (!visible || !data) return null;

  // Personal Info Formatter
  const firstName = (data.first_name || '').trim().toUpperCase();
  const lastName = (data.last_name || '').trim().toUpperCase();
  const middleInitial = data.middle_name ? `${data.middle_name.trim().charAt(0).toUpperCase()}.` : '';
  const suffix = data.suffix ? data.suffix.trim().toUpperCase() : '';
  const fullNameFormatted = `${lastName}, ${firstName}${middleInitial ? ' ' + middleInitial : ''}${suffix ? ' ' + suffix : ''}`.trim() || 'CITIZEN CARDHOLDER';

  // Initials for Avatar Fallback
  const initials = `${firstName ? firstName.charAt(0) : 'C'}${lastName ? lastName.charAt(0) : 'C'}`.toUpperCase();

  // Control and ID Identifiers
  const citizenId = data.citizen_id_number || data.reference_no || 'CAL-2026-000009';
  const numericSeed = citizenId.replace(/\D/g, '') || '000009';
  const barcodeNum = '0100' + numericSeed.padStart(10, '0');

  // Demographics
  const rawDob = data.birthdate || data.birth_date || '1995-10-20';
  const formattedDob = String(rawDob).replace(/-/g, '/').slice(0, 10);
  const sex = ((data.gender || data.sex || 'Female').toUpperCase().startsWith('F') ? 'F' : 'M');
  const civilStatus = (data.civil_status || 'SINGLE').toUpperCase();
  const bloodType = (data.blood_type || 'N/A').toUpperCase();

  // Dates
  const rawIssued = (data.reviewed_at || data.created_at || '2026-10-06').slice(0, 10);
  const dateIssued = rawIssued.replace(/-/g, '/');
  
  let validUntil = data.valid_until ? String(data.valid_until).slice(0, 10).replace(/-/g, '/') : '';
  if (!validUntil) {
    const issuedYear = parseInt(rawIssued.slice(0, 4), 10) || 2026;
    validUntil = `${issuedYear + 5}${dateIssued.slice(4)}`;
  }

  // Address
  const street = (data.street_address || '45 Camarin Rd.').toUpperCase();
  const brgy = (data.barangay ? (data.barangay.toUpperCase().startsWith('BARANGAY') ? data.barangay.toUpperCase() : `BARANGAY ${data.barangay.toUpperCase()}`) : 'BARANGAY 178');
  const district = (data.district || 'DISTRICT 3').toUpperCase();
  const fullAddressLine1 = `${street}, ${brgy}, ${district}`;
  const fullAddressLine2 = 'CALOOCAN CITY';

  // Emergency Contact
  const emergencyPhone = data.emergency_contact_phone || data.emergency_contact || '(02) 8366-3101';

  // QR Code Payload
  const qrPayload = `CIVENTRAL:ID:${citizenId}|TOKEN:${data.qr_code_token || barcodeNum}`;

  // Category-specific credentials and theme configuration
  const categoryKey = (data.id_category || '').toLowerCase();

  let cardTitle = 'CIVENTRAL CITIZEN CARD';
  let cardSubtitle = 'KASAMA KA SA PAG-UNLAD • CITY OF CALOOCAN';
  let classificationTitle = 'RESIDENT';
  let headerWaveStops: [string, string, string, string] = ['#881337', '#991B1B', '#DC2626', '#B91C1C'];
  let goldStripeColors: [string, string, string] = ['#D97706', '#FDE047', '#D97706'];
  let badgeBg = '#F1F5F9';
  let badgeColor = '#0F172A';
  let modalTitle = 'Civentral Citizen Card';

  // Row 2 Demographics Column Values
  let col1Label = 'BLOOD TYPE';
  let col1Value = bloodType;
  let col2Label = 'DATE ISSUED';
  let col2Value = dateIssued;
  let col3Label = 'VALID UNTIL';
  let col3Value = validUntil;

  // Hotline 4 (Bureau Specific)
  let hotline4Label = 'CIVIL REGISTRY';
  let hotline4Phone = '(02) 8366-3101';
  let hotline4Sub = 'City Hall Registry';

  if (categoryKey.includes('barangay')) {
    const brgyName = data.barangay ? (data.barangay.toUpperCase().startsWith('BARANGAY') ? data.barangay.toUpperCase() : `BARANGAY ${data.barangay.toUpperCase()}`) : 'BARANGAY 178';
    cardTitle = 'BARANGAY RESIDENT IDENTIFICATION CARD';
    cardSubtitle = `${brgyName} • SANGGUNIANG BARANGAY • CITY OF CALOOCAN`;
    classificationTitle = 'BARANGAY RESIDENT';
    headerWaveStops = ['#064E3B', '#047857', '#10B981', '#059669'];
    goldStripeColors = ['#D97706', '#FDE047', '#D97706'];
    badgeBg = '#DCFCE7';
    badgeColor = '#15803D';
    modalTitle = 'Barangay Resident Card';

    col1Label = 'PRECINCT NO.';
    col1Value = '0412-A';
    col2Label = 'DATE ISSUED';
    col2Value = dateIssued;
    col3Label = 'VALID UNTIL';
    const issuedYear = parseInt(rawIssued.slice(0, 4), 10) || 2026;
    col3Value = `${issuedYear + 1}${dateIssued.slice(4)}`;

    hotline4Label = 'BARANGAY HALL';
    hotline4Phone = '(02) 8366-3101';
    hotline4Sub = 'Barangay Secretariat';
  } else if (categoryKey.includes('pwd')) {
    cardTitle = 'PERSON WITH DISABILITY (PWD) ID';
    cardSubtitle = 'REPUBLIC ACT NO. 10754 • PERSONS WITH DISABILITY AFFAIRS OFFICE (PDAO)';
    classificationTitle = 'PWD PRIVILEGE';
    headerWaveStops = ['#172554', '#1E40AF', '#2563EB', '#1D4ED8'];
    goldStripeColors = ['#D97706', '#FDE047', '#D97706'];
    badgeBg = '#DBEAFE';
    badgeColor = '#1E40AF';
    modalTitle = 'Civentral PWD Card';

    col1Label = 'DISABILITY';
    col1Value = 'ORTHOPEDIC';
    col2Label = 'BLOOD TYPE';
    col2Value = bloodType === 'N/A' ? 'O+' : bloodType;
    col3Label = 'VALID UNTIL';
    const issuedYear = parseInt(rawIssued.slice(0, 4), 10) || 2026;
    col3Value = `${issuedYear + 3}${dateIssued.slice(4)}`;

    hotline4Label = 'PDAO OFFICE';
    hotline4Phone = '(02) 8366-4000';
    hotline4Sub = 'Caloocan PDAO Desk';
  } else if (categoryKey.includes('senior') || categoryKey.includes('osca')) {
    cardTitle = 'SENIOR CITIZEN IDENTIFICATION CARD';
    cardSubtitle = 'REPUBLIC ACT NO. 9994 • OFFICE OF SENIOR CITIZENS AFFAIRS (OSCA)';
    classificationTitle = 'SENIOR CITIZEN (60+)';
    headerWaveStops = ['#450A0A', '#7F1D1D', '#DC2626', '#D97706'];
    goldStripeColors = ['#D97706', '#FDE047', '#D97706'];
    badgeBg = '#FEF3C7';
    badgeColor = '#92400E';
    modalTitle = 'Civentral Senior Citizen Card';

    col1Label = 'OSCA NO.';
    col1Value = `CAL-OSCA-2026-${numericSeed.slice(-4) || '0812'}`;
    col2Label = 'BLOOD TYPE';
    col2Value = bloodType === 'N/A' ? 'B+' : bloodType;
    col3Label = 'VALID UNTIL';
    col3Value = 'LIFETIME VALIDITY';

    hotline4Label = 'OSCA OFFICE';
    hotline4Phone = '(02) 8366-2200';
    hotline4Sub = 'Caloocan OSCA Desk';
  } else if (categoryKey.includes('solo')) {
    // Preserved for Solo Parent ID if reactivated
    cardTitle = 'SOLO PARENT IDENTIFICATION CARD';
    cardSubtitle = 'REPUBLIC ACT NO. 11861 • CITY SOCIAL WELFARE AND DEVELOPMENT (CSWDO)';
    classificationTitle = 'SOLO PARENT';
    headerWaveStops = ['#4A044E', '#6B21A8', '#A855F7', '#EAB308'];
    goldStripeColors = ['#EAB308', '#FEF08A', '#EAB308'];
    badgeBg = '#F3E8FF';
    badgeColor = '#6B21A8';
    modalTitle = 'Solo Parent Identification Card';

    col1Label = 'DEPENDENTS';
    col1Value = '2 MINORS';
    col2Label = 'DATE ISSUED';
    col2Value = dateIssued;
    col3Label = 'VALID UNTIL';
    const issuedYear = parseInt(rawIssued.slice(0, 4), 10) || 2026;
    col3Value = `${issuedYear + 1}${dateIssued.slice(4)}`;

    hotline4Label = 'CSWDO WELFARE';
    hotline4Phone = '(02) 8366-5000';
    hotline4Sub = 'Solo Parent Section';
  }

  // Asset URLs
  const resolvedPhoto = data.photo_1x1_url || data.photo_2x2_url || data.photo_url || null;
  const resolvedSignature = data.signature_photo_url || data.signature_url || null;

  // Base64 Logo helper for HTML print
  const getBase64Logo = async (): Promise<string> => {
    try {
      const asset = Asset.fromModule(require('@/assets/images/logo.png'));
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      const uri = asset.localUri || asset.uri;
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (base64) {
          return `data:image/png;base64,${base64}`;
        }
      }
    } catch (err) {
      console.warn('Failed to load logo for print:', err);
    }
    return 'https://ui-avatars.com/api/?name=CV&background=0F4C81&color=fff&size=64';
  };

  // Generate Print HTML
  const generatePrintHtml = (logoUri: string): string => {
    const photoImgSrc = resolvedPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullNameFormatted)}&background=1E293B&color=fff&size=160`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrPayload)}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${cardTitle} - ${citizenId}</title>
  <style>
    @page { size: portrait; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; gap: 6mm; padding: 4mm; }
    .card-frame { width: 105mm; height: 66.2mm; background: #FFFFFF; border-radius: 3.5mm; border: 1px solid #CBD5E1; position: relative; overflow: hidden; page-break-inside: avoid; }
    .ribbon { position: absolute; top: 0; left: 0; width: 100%; height: 18mm; z-index: 1; }
    .card-content { position: relative; z-index: 10; padding: 2.8mm 3.2mm; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .republic-text { font-size: 5.5pt; font-weight: 700; color: #FEE2E2; letter-spacing: 1.2px; text-transform: uppercase; text-align: center; }
    .brand-row { display: flex; align-items: center; margin-top: 1mm; padding-right: 8mm; }
    .brand-title { font-size: 9.5pt; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.4px; }
    .brand-sub { font-size: 5.5pt; font-weight: 700; color: #FDE047; text-transform: uppercase; letter-spacing: 0.8px; }
    .body-cols { display: flex; gap: 2.5mm; margin-top: 2.5mm; flex: 1; }
    .col-photo { width: 22mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
    .photo-box { width: 21mm; height: 21mm; border-radius: 1.5mm; border: 1px solid #CBD5E1; background: #1E293B; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #FFF; font-weight: 800; font-size: 14pt; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .sig-box { width: 21mm; height: 6mm; border-bottom: 1px dashed #94A3B8; text-align: center; font-size: 5.5pt; color: #94A3B8; font-style: italic; display: flex; align-items: center; justify-content: center; }
    .sig-lbl { font-size: 4.8pt; font-weight: 700; color: #64748B; text-transform: uppercase; text-align: center; margin-top: 0.5mm; }
    .res-tag { font-size: 6.8pt; font-weight: 900; color: #0F172A; text-transform: uppercase; text-align: center; margin-top: 1mm; }
    .col-demo { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .f-name-lbl { font-size: 5.2pt; font-weight: 700; color: #334155; text-transform: uppercase; }
    .f-name-val { font-size: 9pt; font-weight: 900; color: #0F172A; text-transform: uppercase; }
    .grid-table { width: 100%; border-top: 1px solid #CBD5E1; padding-top: 1mm; display: grid; grid-template-columns: 1fr 1.3fr 1.2fr; gap: 1mm; }
    .cell-lbl { font-size: 4.8pt; font-weight: 700; color: #334155; text-transform: uppercase; }
    .cell-val { font-size: 6.5pt; font-weight: 800; color: #0F172A; }
    .addr-val { font-size: 5.5pt; font-weight: 800; color: #0F172A; text-transform: uppercase; line-height: 1.2; margin-top: 1mm; }
    .emg-val { font-size: 4.8pt; color: #64748B; margin-top: 1mm; }
    .col-qr { width: 19mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .qr-box { width: 18mm; height: 18mm; }
    .qr-box img { width: 100%; height: 100%; }
    .barcode-val { font-size: 5pt; font-family: monospace; font-weight: 800; color: #0F172A; text-align: center; margin-top: 1mm; }
  </style>
</head>
<body>
  <div class="card-frame">
    <svg class="ribbon" viewBox="0 0 360 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wave" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="${headerWaveStops[0]}" />
          <stop offset="35%" stop-color="${headerWaveStops[1]}" />
          <stop offset="70%" stop-color="${headerWaveStops[2]}" />
          <stop offset="100%" stop-color="${headerWaveStops[3]}" />
        </linearGradient>
      </defs>
      <path d="M 0,0 L 360,0 L 360,59 Q 266,69 180,63 T 0,76 Z" fill="url(#wave)" />
      <path d="M 0,76 Q 94,63 180,63 T 360,59 L 360,63 Q 266,73 180,67 T 0,80 Z" fill="${goldStripeColors[0]}" />
    </svg>
    <div class="card-content">
      <div>
        <div class="republic-text">Republic of the Philippines</div>
        <div class="brand-row">
          <img src="${logoUri}" style="width: 7mm; height: 7mm; border-radius: 50%; border: 1.2px solid #F59E0B; margin-right: 2mm;" />
          <div style="flex: 1; text-align: center;">
            <div class="brand-title">${cardTitle}</div>
            <div class="brand-sub">${cardSubtitle}</div>
          </div>
        </div>
      </div>
      <div class="body-cols">
        <div class="col-photo">
          <div class="photo-box">
            ${resolvedPhoto ? `<img src="${photoImgSrc}" />` : initials}
          </div>
          <div>
            <div class="sig-box">${resolvedSignature ? `<img src="${resolvedSignature}" style="max-height: 100%; max-width: 100%;" />` : 'Digital Signature'}</div>
            <div class="sig-lbl">Cardholder Signature</div>
            <div class="res-tag">${classificationTitle}</div>
          </div>
        </div>
        <div class="col-demo">
          <div>
            <div class="f-name-lbl">Last Name, First Name, M.I.</div>
            <div class="f-name-val">${fullNameFormatted}</div>
          </div>
          <div class="grid-table">
            <div><div class="cell-lbl">Sex</div><div class="cell-val">${sex}</div></div>
            <div><div class="cell-lbl">Date of Birth</div><div class="cell-val">${formattedDob}</div></div>
            <div><div class="cell-lbl">Civil Status</div><div class="cell-val">${civilStatus}</div></div>
            <div><div class="cell-lbl">${col1Label}</div><div class="cell-val">${col1Value}</div></div>
            <div><div class="cell-lbl">${col2Label}</div><div class="cell-val">${col2Value}</div></div>
            <div><div class="cell-lbl">${col3Label}</div><div class="cell-val">${col3Value}</div></div>
          </div>
          <div>
            <div class="addr-val">${fullAddressLine1}<br/>${fullAddressLine2}</div>
            <div class="emg-val">Emergency Contact: ${emergencyPhone}</div>
          </div>
        </div>
        <div class="col-qr">
          <div class="qr-box"><img src="${qrImgUrl}" /></div>
          <div class="barcode-val">${barcodeNum}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  };

  const handlePrintCard = async () => {
    try {
      setIsPrinting(true);
      const logoUri = await getBase64Logo();
      const html = generatePrintHtml(logoUri);
      if (Platform.OS === 'web') {
        window.print();
        return;
      }
      await Print.printAsync({ html });
    } catch (err) {
      console.warn('Print error:', err);
      Alert.alert('Print Error', 'Could not open native print dialog. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsPrinting(true);
      const logoUri = await getBase64Logo();
      const html = generatePrintHtml(logoUri);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Civentral_Citizen_Card_${citizenId}.pdf`,
        });
      } else {
        Alert.alert('PDF Exported', `Saved to temporary storage:\n${uri}`);
      }
    } catch (err) {
      console.warn('Share PDF error:', err);
      Alert.alert('Export Error', 'Could not export or share PDF document.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          
          {/* MODAL TOP BAR (Civentral Dark Slate Header) */}
          <View style={styles.modalTopBar}>
            <View style={styles.modalBrandRow}>
              <View style={styles.modalLogoBox}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.modalTopTitle}>{modalTitle}</Text>
                <Text style={styles.modalTopSubtitle}>Official Municipal Credential • City of Caloocan</Text>
              </View>
            </View>

            <View style={styles.modalTopActions}>
              <TouchableOpacity
                onPress={handlePrintCard}
                disabled={isPrinting}
                style={styles.modalPrintPill}
                activeOpacity={0.8}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="printer.fill" size={13} color="#FFFFFF" />
                    <Text style={styles.modalPrintPillText}>Print / Save PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Close Modal"
              >
                <IconSymbol name="xmark" size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* MODAL BODY (Scrollable for compact screens) */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* OFFICIAL WHITE PVC CR80 CITIZEN CARD */}
            <View style={styles.pvcCardFrame}>
              
              {/* Municipal Building Watermark */}
              <View pointerEvents="none" style={styles.cardWatermark}>
                <Image
                  source={require('@/assets/images/building-bg.png')}
                  style={{ width: '100%', height: '100%', opacity: 0.28 }}
                  resizeMode="contain"
                />
              </View>

              {/* Wavy Header Ribbon (Vector Gradient Ribbon with Gold Under-stripe) */}
              <View pointerEvents="none" style={styles.ribbonContainer}>
                <Svg width="100%" height={74} viewBox="0 0 360 74" preserveAspectRatio="none">
                  <Defs>
                    <SvgGradient id="modalWaveGrad" x1="0" x2="1" y1="0" y2="0">
                      <SvgStop offset="0%" stopColor={headerWaveStops[0]} />
                      <SvgStop offset="30%" stopColor={headerWaveStops[1]} />
                      <SvgStop offset="75%" stopColor={headerWaveStops[2]} />
                      <SvgStop offset="100%" stopColor={headerWaveStops[3]} />
                    </SvgGradient>
                    <SvgGradient id="modalGoldStripe" x1="0" x2="1" y1="0" y2="0">
                      <SvgStop offset="0%" stopColor={goldStripeColors[0]} />
                      <SvgStop offset="50%" stopColor={goldStripeColors[1]} />
                      <SvgStop offset="100%" stopColor={goldStripeColors[2]} />
                    </SvgGradient>
                  </Defs>
                  <SvgPath d="M 0,0 L 360,0 L 360,56 Q 266,66 180,60 T 0,70 Z" fill="url(#modalWaveGrad)" />
                  <SvgPath d="M 0,70 Q 94,60 180,60 T 360,56 L 360,60 Q 266,70 180,64 T 0,74 Z" fill="url(#modalGoldStripe)" />
                </Svg>
              </View>

              {/* Foreground Card Layer */}
              <View style={styles.cardInnerContent}>
                
                {/* Header Republic Title & Brand */}
                <View style={{ marginBottom: 4 }}>
                  <Text style={styles.cardRepublicText}>REPUBLIC OF THE PHILIPPINES</Text>
                  
                  <View style={styles.cardBrandRow}>
                    <View style={styles.cardEmblemRing}>
                      <Image
                        source={require('@/assets/images/logo.png')}
                        style={{ width: 22, height: 22 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.cardBrandTitle}>{cardTitle}</Text>
                      <Text style={styles.cardBrandSubtitle}>{cardSubtitle}</Text>
                    </View>
                  </View>
                </View>

                {/* 3-Column Card Demographics Body */}
                <View style={styles.cardColumnsRow}>
                  
                  {/* Column 1: Photo & Signature */}
                  <View style={styles.cardColPhoto}>
                    <View style={styles.cardPhotoFrame}>
                      {resolvedPhoto && !photoError ? (
                        <Image
                          source={{ uri: resolvedPhoto }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                          onError={() => setPhotoError(true)}
                        />
                      ) : (
                        <View style={styles.cardInitialsAvatar}>
                          <Text style={styles.cardInitialsText}>{initials}</Text>
                        </View>
                      )}
                    </View>

                    {/* Signature Box */}
                    <View style={styles.cardSignatureBox}>
                      {resolvedSignature && !signatureError ? (
                        <Image
                          source={{ uri: resolvedSignature }}
                          style={{ width: '90%', height: '85%' }}
                          resizeMode="contain"
                          onError={() => setSignatureError(true)}
                        />
                      ) : (
                        <Text style={styles.cardSignaturePlaceholder}>Digital Signature</Text>
                      )}
                    </View>
                    <Text style={styles.cardSignatureLabel}>CARDHOLDER SIGNATURE</Text>
                    <Text style={[styles.cardResidentTag, { color: badgeColor }]}>{classificationTitle}</Text>
                    
                    {/* Timestamp at bottom-left */}
                    <Text style={styles.cardTimestamp}>
                      {dateIssued} 03:54:06 PM
                    </Text>
                  </View>

                  {/* Column 2: Legal Name & Demographics Grid */}
                  <View style={styles.cardColDemographics}>
                    <View>
                      <Text style={styles.cardFieldLabel}>LAST NAME, FIRST NAME, M.I.</Text>
                      <Text style={styles.cardNameValue} numberOfLines={1}>{fullNameFormatted}</Text>

                      {/* Demographics Matrix */}
                      <View style={styles.cardDemoGrid}>
                        <View style={styles.cardDemoRow}>
                          <View style={{ flex: 0.8 }}>
                            <Text style={styles.cardCellLabel}>SEX</Text>
                            <Text style={styles.cardCellValue}>{sex}</Text>
                          </View>
                          <View style={{ flex: 1.3 }}>
                            <Text style={styles.cardCellLabel}>DATE OF BIRTH</Text>
                            <Text style={styles.cardCellValue}>{formattedDob}</Text>
                          </View>
                          <View style={{ flex: 1.1 }}>
                            <Text style={styles.cardCellLabel}>CIVIL STATUS</Text>
                            <Text style={styles.cardCellValue}>{civilStatus}</Text>
                          </View>
                        </View>

                        <View style={styles.cardDemoRow}>
                          <View style={{ flex: 0.8 }}>
                            <Text style={styles.cardCellLabel}>{col1Label}</Text>
                            <Text style={styles.cardCellValue}>{col1Value}</Text>
                          </View>
                          <View style={{ flex: 1.3 }}>
                            <Text style={styles.cardCellLabel}>{col2Label}</Text>
                            <Text style={styles.cardCellValue}>{col2Value}</Text>
                          </View>
                          <View style={{ flex: 1.1 }}>
                            <Text style={styles.cardCellLabel}>{col3Label}</Text>
                            <Text style={styles.cardCellValue}>{col3Value}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Address */}
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.cardAddressLine1}>{fullAddressLine1}</Text>
                        <Text style={styles.cardAddressLine2}>{fullAddressLine2}</Text>
                      </View>
                    </View>

                    {/* Bottom Emergency hotline annotation */}
                    <Text style={styles.cardEmergencyText}>
                      Emergency Contact: {emergencyPhone}
                    </Text>
                  </View>

                  {/* Column 3: Cryptographic QR Code & Barcode */}
                  <View style={styles.cardColQr}>
                    <View style={styles.cardQrBox}>
                      <QRCode
                        value={qrPayload}
                        size={64}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.cardBarcodeText}>{barcodeNum}</Text>
                    <Text style={styles.cardSecurityDigits}>00</Text>
                  </View>

                </View>
              </View>
            </View>

            {/* CALOOCAN CITY CIVIC & EMERGENCY DIRECTORY */}
            <View style={styles.directoryCard}>
              <View style={styles.directoryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconSymbol name="phone.fill" size={13} color="#DC2626" />
                  <Text style={styles.directoryTitle}>CALOOCAN CITY CIVIC & EMERGENCY DIRECTORY</Text>
                </View>
                <Text style={styles.directoryDispatchText}>24/7 Priority Dispatch</Text>
              </View>

              <View style={styles.directoryGrid}>
                {/* 1: CDRRMO */}
                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>CDRRMO RESCUE</Text>
                  <Text style={[styles.dirPillPhone, { color: '#DC2626' }]}>888-ALERTO</Text>
                  <Text style={styles.dirPillSub}>8882-5378 • 24/7</Text>
                </View>

                {/* 2: POLICE */}
                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>POLICE (PNP)</Text>
                  <Text style={styles.dirPillPhone}>(02) 8287-2270</Text>
                  <Text style={styles.dirPillSub}>Caloocan Police HQ</Text>
                </View>

                {/* 3: FIRE */}
                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>FIRE (BFP)</Text>
                  <Text style={styles.dirPillPhone}>(02) 8361-9878</Text>
                  <Text style={styles.dirPillSub}>Central Fire Station</Text>
                </View>

                {/* 4: BUREAU / REGISTRY HOTLINE */}
                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>{hotline4Label}</Text>
                  <Text style={styles.dirPillPhone}>{hotline4Phone}</Text>
                  <Text style={styles.dirPillSub}>{hotline4Sub}</Text>
                </View>
              </View>
            </View>

          </ScrollView>

          {/* MODAL FOOTER */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterNotice}>
              Standard CR80 White PVC Card • Caloocan Civil & Barangay Registry
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalFooterCloseBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.modalFooterCloseBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrintCard}
                disabled={isPrinting}
                style={styles.modalFooterPrintBtn}
                activeOpacity={0.85}
              >
                <IconSymbol name="printer.fill" size={13} color="#FFFFFF" />
                <Text style={styles.modalFooterPrintBtnText}>Print Card</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalTopBar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F4C81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  modalTopTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalTopSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  modalTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalPrintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F4C81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  modalPrintPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  pvcCardFrame: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: 1.58, // Standard CR80 ratio (~85.6mm / 54mm)
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardWatermark: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '68%',
    height: '85%',
    zIndex: 0,
  },
  ribbonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 74,
    zIndex: 1,
  },
  cardInnerContent: {
    padding: 10,
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  cardRepublicText: {
    fontSize: 6.8,
    fontWeight: '700',
    color: '#FEE2E2',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingRight: 24,
  },
  cardEmblemRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cardBrandTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardBrandSubtitle: {
    fontSize: 6.5,
    fontWeight: '700',
    color: '#FDE047',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cardColumnsRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginTop: 4,
  },
  cardColPhoto: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPhotoFrame: {
    width: 66,
    height: 66,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardInitialsAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInitialsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  cardSignatureBox: {
    width: 66,
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSignaturePlaceholder: {
    fontSize: 6.8,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cardSignatureLabel: {
    fontSize: 5.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cardResidentTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 1,
  },
  cardTimestamp: {
    fontSize: 4.8,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  cardColDemographics: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardFieldLabel: {
    fontSize: 5.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cardNameValue: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardDemoGrid: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 3,
    marginTop: 2,
    gap: 2,
  },
  cardDemoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCellLabel: {
    fontSize: 5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cardCellValue: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardAddressLine1: {
    fontSize: 6.8,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    lineHeight: 9.5,
  },
  cardAddressLine2: {
    fontSize: 6.8,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    lineHeight: 9.5,
  },
  cardEmergencyText: {
    fontSize: 5.2,
    color: '#64748B',
    marginTop: 2,
  },
  cardColQr: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardQrBox: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBarcodeText: {
    fontSize: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cardSecurityDigits: {
    fontSize: 6.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: '#475569',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  directoryCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  directoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  directoryTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  directoryDispatchText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
  },
  directoryGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  directoryPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  dirPillLabel: {
    fontSize: 6.8,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  dirPillPhone: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  dirPillSub: {
    fontSize: 6.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  modalFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalFooterNotice: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  modalFooterCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalFooterCloseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  modalFooterPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#0F4C81',
  },
  modalFooterPrintBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

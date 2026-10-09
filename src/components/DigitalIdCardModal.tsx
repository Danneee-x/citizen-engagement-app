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
import Svg, { Defs, LinearGradient as SvgGradient, Path as SvgPath, Stop as SvgStop, SvgXml } from 'react-native-svg';
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
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
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
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
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
  const citizenId = data.citizen_id_number || data.reference_no || 'CAL-2026-000035';
  const numericSeed = citizenId.replace(/\D/g, '') || '000035';
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
  const fullAddressLine1 = `${street}, ${brgy}`;
  const fullAddressLine2 = `${district}, CALOOCAN CITY`;

  // Emergency Contact Details
  const emergencyName = (data.emergency_contact_name || data.emergency_contact || 'NEXT OF KIN / FAMILY MEMBER').trim().toUpperCase();
  const emergencyPhone = (data.emergency_contact_phone || '(02) 8366-3101').trim();
  const emergencyRelation = (data.emergency_contact_relation || 'Immediate Family / Relative').trim();

  // QR Code Payload
  const qrPayload = `CIVENTRAL:ID:${citizenId}|TOKEN:${data.qr_code_token || barcodeNum}`;

  // Category-specific credentials and theme configuration
  const categoryKey = (data.id_category || '').toLowerCase();

  let cardTitle = 'CIVENTRAL CITIZEN CARD';
  let cardSubtitle = 'KASAMA KA SA PAG-UNLAD • CITY OF CALOOCAN';
  let classificationTitle = 'OFFICIAL RESIDENT';
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
    cardTitle = 'BARANGAY RESIDENT ID';
    cardSubtitle = `${brgyName} • CITY OF CALOOCAN`;
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
    cardSubtitle = 'REPUBLIC ACT NO. 10754 • PDAO CALOOCAN';
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
    cardSubtitle = 'REPUBLIC ACT NO. 9994 • OSCA CALOOCAN';
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
    cardTitle = 'SOLO PARENT IDENTIFICATION CARD';
    cardSubtitle = 'REPUBLIC ACT NO. 11861 • CSWDO CALOOCAN';
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
  const isSvgSignature = Boolean(resolvedSignature && resolvedSignature.startsWith('data:image/svg+xml'));
  const svgXmlContent = isSvgSignature && resolvedSignature
    ? decodeURIComponent(resolvedSignature.replace(/^data:image\/svg\+xml(?:;utf8)?,/, ''))
    : '';

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

  // Generate Print HTML (Both Front and Back Sides)
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
    @page { size: portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; gap: 8mm; padding: 6mm; }
    
    .print-header { text-align: center; margin-bottom: 2mm; font-size: 8pt; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* CR80 Standard Dimensions: 105mm x 66.2mm */
    .card-frame { width: 105mm; height: 66.2mm; background: #FFFFFF; border-radius: 3.5mm; border: 1.2px solid #CBD5E1; position: relative; overflow: hidden; page-break-inside: avoid; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    
    /* Front Ribbon */
    .ribbon { position: absolute; top: 0; left: 0; width: 100%; height: 18mm; z-index: 1; }
    .card-content { position: relative; z-index: 10; padding: 2mm 3.2mm; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .republic-text { font-size: 5.2pt; font-weight: 700; color: #FFFFFF; letter-spacing: 1.2px; text-transform: uppercase; text-align: center; line-height: 1; }
    .brand-row { display: flex; align-items: center; margin-top: 0.4mm; justify-content: center; }
    .brand-title { font-size: 9.2pt; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1; }
    .brand-sub { font-size: 5.4pt; font-weight: 800; color: #FDE047; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 0.3mm; }
    
    .body-cols { display: flex; gap: 2.8mm; margin-top: 2.2mm; flex: 1; }
    .col-photo { width: 22mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
    .photo-box { width: 21mm; height: 21mm; border-radius: 1.5mm; border: 1px solid #CBD5E1; background: #1E293B; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #FFF; font-weight: 800; font-size: 13pt; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .sig-box { width: 21mm; height: 5.5mm; border-bottom: 1px dashed #94A3B8; text-align: center; display: flex; align-items: center; justify-content: center; }
    .sig-lbl { font-size: 4.8pt; font-weight: 700; color: #64748B; text-transform: uppercase; text-align: center; margin-top: 0.5mm; }
    .res-tag { font-size: 6.5pt; font-weight: 900; color: #0F172A; text-transform: uppercase; text-align: center; margin-top: 0.8mm; }
    
    .col-demo { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .id-num-lbl { font-size: 4.8pt; font-weight: 700; color: #475569; text-transform: uppercase; }
    .id-num-val { font-size: 7.5pt; font-family: monospace; font-weight: 800; color: #0F172A; }
    .f-name-lbl { font-size: 4.8pt; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 0.5mm; }
    .f-name-val { font-size: 8.5pt; font-weight: 900; color: #0F172A; text-transform: uppercase; }
    .grid-table { width: 100%; border-top: 1px solid #CBD5E1; padding-top: 0.8mm; margin-top: 0.8mm; display: grid; grid-template-columns: 1fr 1.3fr 1.2fr; gap: 0.8mm; }
    .cell-lbl { font-size: 4.6pt; font-weight: 700; color: #475569; text-transform: uppercase; }
    .cell-val { font-size: 6.5pt; font-weight: 800; color: #0F172A; }
    .addr-lbl { font-size: 4.6pt; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 0.8mm; }
    .addr-val { font-size: 5.8pt; font-weight: 800; color: #0F172A; text-transform: uppercase; line-height: 1.2; }
    
    .col-qr { width: 18mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .qr-box { width: 17mm; height: 17mm; border: 1px solid #CBD5E1; border-radius: 1mm; padding: 0.5mm; }
    .qr-box img { width: 100%; height: 100%; }
    .barcode-val { font-size: 5pt; font-family: monospace; font-weight: 800; color: #0F172A; text-align: center; margin-top: 1mm; }

    /* Back Side Specific Styles */
    .back-header { background: #0F172A; color: #FFFFFF; padding: 2.2mm 3.2mm; text-align: center; border-bottom: 2px solid #D97706; }
    .back-header-title { font-size: 7.2pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .back-header-sub { font-size: 5pt; color: #94A3B8; text-transform: uppercase; margin-top: 0.3mm; }
    .back-content { padding: 2.2mm 3.2mm; height: calc(100% - 11mm); display: flex; flex-direction: column; justify-content: space-between; }
    
    .emg-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 1.5mm; padding: 1.5mm 2.2mm; }
    .emg-header { font-size: 5.5pt; font-weight: 800; color: #DC2626; text-transform: uppercase; margin-bottom: 0.5mm; display: flex; justify-content: space-between; }
    .emg-name { font-size: 7.5pt; font-weight: 900; color: #0F172A; text-transform: uppercase; }
    .emg-details { font-size: 6.2pt; font-weight: 800; color: #DC2626; margin-top: 0.3mm; }
    .emg-note { font-size: 4.5pt; color: #64748B; margin-top: 0.5mm; }
    
    .hotlines-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1mm; margin-top: 1.2mm; }
    .hotline-item { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 1mm; padding: 0.8mm 1.2mm; }
    .hl-name { font-size: 4.8pt; font-weight: 800; color: #475569; text-transform: uppercase; }
    .hl-num { font-size: 6.2pt; font-weight: 900; color: #0F172A; margin-top: 0.2mm; }
    
    .legal-text { font-size: 4.4pt; color: #64748B; line-height: 1.25; margin-top: 1.2mm; text-align: justify; }
    
    .back-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #E2E8F0; padding-top: 1mm; margin-top: 1mm; }
    .sig-official { text-align: right; }
    .official-name { font-size: 6.5pt; font-weight: 900; color: #0F172A; text-transform: uppercase; }
    .official-title { font-size: 4.6pt; font-weight: 700; color: #475569; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="print-header">Civentral Caloocan Official Printable Credential • Standard CR80 PVC Smart Card</div>

  <!-- FRONT SIDE -->
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
      <path d="M 0,0 L 360,0 L 360,63 Q 266,73 180,67 T 0,80 Z" fill="url(#wave)" />
      <path d="M 0,80 Q 94,67 180,67 T 360,63 L 360,63 Q 266,73 180,67 T 0,80 Z" fill="${goldStripeColors[0]}" />
    </svg>
    <div class="card-content">
      <div>
        <div class="republic-text">Republic of the Philippines</div>
        <div class="brand-row">
          <img src="${logoUri}" style="width: 7mm; height: 7mm; border-radius: 50%; border: 1.2px solid #F59E0B; margin-right: 2mm; margin-top: -0.5mm;" />
          <div style="text-align: center;">
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
            <div class="sig-box">
              ${resolvedSignature 
                ? `<img src="${resolvedSignature}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />` 
                : `<span style="font-family: 'Brush Script MT', 'Snell Roundhand', cursive; font-size: 11px; color: #1E3A8A; font-weight: 700; font-style: italic;">${data.e_signature_name || fullNameFormatted}</span>`
              }
            </div>
            <div class="sig-lbl">Cardholder Signature</div>
            <div class="res-tag">${classificationTitle}</div>
          </div>
        </div>
        <div class="col-demo">
          <div>
            <div class="id-num-lbl">Control / ID Number</div>
            <div class="id-num-val">${citizenId}</div>
            <div class="f-name-lbl">Full Name</div>
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
            <div class="addr-lbl">Registered Address</div>
            <div class="addr-val">${fullAddressLine1}<br/>${fullAddressLine2}</div>
          </div>
        </div>
        <div class="col-qr">
          <div class="qr-box"><img src="${qrImgUrl}" /></div>
          <div class="barcode-val">${barcodeNum}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- BACK SIDE -->
  <div class="card-frame">
    <div class="back-header">
      <div class="back-header-title">CITY GOVERNMENT OF CALOOCAN • EMERGENCY & RESIDENT RECORD</div>
      <div class="back-header-sub">Official Municipal Card • Sangguniang Panlungsod</div>
    </div>
    <div class="back-content">
      <div class="emg-box">
        <div class="emg-header">
          <span>🚨 IN CASE OF EMERGENCY / ACCIDENT NOTIFY:</span>
          <span>PRIORITY DISPATCH</span>
        </div>
        <div class="emg-name">${emergencyName}</div>
        <div class="emg-details">RELATION: ${emergencyRelation} • CONTACT: ${emergencyPhone}</div>
        <div class="emg-note">In the event of accident, medical emergency, or hospitalization, please notify the designated contact above immediately.</div>
      </div>

      <div class="hotlines-grid">
        <div class="hotline-item">
          <div class="hl-name">🚨 CDRRMO RESCUE</div>
          <div class="hl-num" style="color: #DC2626;">888-ALERTO</div>
        </div>
        <div class="hotline-item">
          <div class="hl-name">🚔 POLICE (PNP)</div>
          <div class="hl-num">(02) 8287-2270</div>
        </div>
        <div class="hotline-item">
          <div class="hl-name">🚒 FIRE (BFP)</div>
          <div class="hl-num">(02) 8361-9878</div>
        </div>
        <div class="hotline-item">
          <div class="hl-name">🏥 CCMC HOSPITAL</div>
          <div class="hl-num">(02) 8288-8888</div>
        </div>
        <div class="hotline-item">
          <div class="hl-name">🏛️ ${hotline4Label}</div>
          <div class="hl-num">${hotline4Phone}</div>
        </div>
        <div class="hotline-item">
          <div class="hl-name">📱 SMART HOTLINE</div>
          <div class="hl-num">911 / (02) 8888-2256</div>
        </div>
      </div>

      <div class="legal-text">
        1. This card is non-transferable and remains the official property of the City Government of Caloocan.<br/>
        2. Valid proof of Caloocan residency, healthcare privileges, and municipal social services.<br/>
        3. If found, please return to any Barangay Hall or Caloocan Main City Hall (Grace Park / Congressional).<br/>
        4. Tampering, unauthorized duplication, or fraudulent presentation is punishable under Philippine Law.
      </div>

      <div class="back-footer">
        <div>
          <div style="font-family: monospace; font-size: 5pt; font-weight: 800; color: #0F172A;">SERIAL: ${barcodeNum}</div>
          <div style="font-size: 4.4pt; color: #64748B;">CRYPTOGRAPHIC ID TOKEN: ${data.qr_code_token || 'VERIFIED'}</div>
        </div>
        <div class="sig-official">
          <div class="official-name">HON. DALE GONZALO "ALONG" MALAPITAN</div>
          <div class="official-title">City Mayor • Caloocan City</div>
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
                <Text style={styles.modalTopSubtitle}>Official Municipal Smart Credential • City of Caloocan</Text>
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

          {/* CARD SIDE SELECTOR TABS */}
          <View style={styles.cardSideSwitcher}>
            <TouchableOpacity
              style={[styles.cardSideTab, cardSide === 'front' && styles.cardSideTabActive]}
              onPress={() => setCardSide('front')}
              activeOpacity={0.85}
            >
              <IconSymbol
                name="creditcard.fill"
                size={14}
                color={cardSide === 'front' ? '#0F4C81' : '#64748B'}
              />
              <Text style={[styles.cardSideTabText, cardSide === 'front' && styles.cardSideTabTextActive]}>
                FRONT SIDE (IDENTITY)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardSideTab, cardSide === 'back' && styles.cardSideTabActive]}
              onPress={() => setCardSide('back')}
              activeOpacity={0.85}
            >
              <IconSymbol
                name="arrow.triangle.2.circlepath"
                size={14}
                color={cardSide === 'back' ? '#0F4C81' : '#64748B'}
              />
              <Text style={[styles.cardSideTabText, cardSide === 'back' && styles.cardSideTabTextActive]}>
                BACK SIDE (EMERGENCY & DIRECTORY)
              </Text>
            </TouchableOpacity>
          </View>

          {/* MODAL BODY (Scrollable for compact screens) */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TAP TO FLIP NOTICE */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
              style={styles.flipPrompt}
            >
              <IconSymbol name="arrow.triangle.2.circlepath" size={12} color="#0284C7" />
              <Text style={styles.flipPromptText}>
                Viewing {cardSide === 'front' ? 'Front Side' : 'Back Side'} • Tap card or button to flip
              </Text>
            </TouchableOpacity>

            {/* ========================================================= */}
            {/* FRONT SIDE CARD                                           */}
            {/* ========================================================= */}
            {cardSide === 'front' ? (
              <TouchableOpacity
                activeOpacity={0.96}
                onPress={() => setCardSide('back')}
                style={styles.pvcCardFrame}
              >
                {/* Municipal Building Watermark */}
                <View pointerEvents="none" style={styles.cardWatermark}>
                  <Image
                    source={require('@/assets/images/building-bg.png')}
                    style={{ width: '100%', height: '100%', opacity: 0.2 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Wavy Header Ribbon (Vector Gradient Ribbon with Gold Under-stripe) */}
                <View pointerEvents="none" style={styles.ribbonContainer}>
                  <Svg width="100%" height={60} viewBox="0 0 360 60" preserveAspectRatio="none">
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
                    <SvgPath d="M 0,0 L 360,0 L 360,46 Q 266,55 180,50 T 0,56 Z" fill="url(#modalWaveGrad)" />
                    <SvgPath d="M 0,56 Q 94,50 180,50 T 360,46 L 360,50 Q 266,59 180,54 T 0,60 Z" fill="url(#modalGoldStripe)" />
                  </Svg>
                </View>

                {/* Foreground Card Content */}
                <View style={styles.cardInnerContent}>
                  
                  {/* Header Republic Title & Brand */}
                  <View style={{ marginBottom: 2 }}>
                    <Text style={styles.cardRepublicText}>REPUBLIC OF THE PHILIPPINES</Text>
                    
                    <View style={styles.cardBrandRow}>
                      <View style={styles.cardEmblemRing}>
                        <Image
                          source={require('@/assets/images/logo.png')}
                          style={{ width: 19, height: 19 }}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.cardBrandTitle}>{cardTitle}</Text>
                        <Text style={styles.cardBrandSubtitle}>{cardSubtitle}</Text>
                      </View>
                      <View style={{ width: 21 }} />
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
                        {isSvgSignature && svgXmlContent ? (
                          <SvgXml xml={svgXmlContent} width="92%" height="85%" />
                        ) : resolvedSignature && !signatureError ? (
                          <Image
                            source={{ uri: resolvedSignature }}
                            style={{ width: '90%', height: '85%' }}
                            resizeMode="contain"
                            onError={() => setSignatureError(true)}
                          />
                        ) : (data.e_signature_name || fullNameFormatted) ? (
                          <Text style={styles.cardSignatureScript} numberOfLines={1}>
                            {data.e_signature_name || fullNameFormatted}
                          </Text>
                        ) : (
                          <Text style={styles.cardSignaturePlaceholder}>Cardholder Signature</Text>
                        )}
                      </View>
                      <Text style={styles.cardSignatureLabel}>CARDHOLDER SIGNATURE</Text>
                      <View style={[styles.cardResidentBadgePill, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.cardResidentTag, { color: badgeColor }]}>{classificationTitle}</Text>
                      </View>
                    </View>

                    {/* Column 2: Legal Name & Demographics Grid */}
                    <View style={styles.cardColDemographics}>
                      <View>
                        <Text style={styles.cardControlNumberLabel}>ID / CONTROL NUMBER</Text>
                        <Text style={styles.cardControlNumberValue}>{citizenId}</Text>

                        <Text style={styles.cardFieldLabel}>NAME (LAST NAME, FIRST NAME, M.I.)</Text>
                        <Text style={styles.cardNameValue} numberOfLines={1}>{fullNameFormatted}</Text>

                        {/* Demographics Matrix */}
                        <View style={styles.cardDemoGrid}>
                          <View style={styles.cardDemoRow}>
                            <View style={{ flex: 0.85 }}>
                              <Text style={styles.cardCellLabel}>SEX</Text>
                              <Text style={styles.cardCellValue}>{sex}</Text>
                            </View>
                            <View style={{ flex: 1.35 }}>
                              <Text style={styles.cardCellLabel}>DATE OF BIRTH</Text>
                              <Text style={styles.cardCellValue}>{formattedDob}</Text>
                            </View>
                            <View style={{ flex: 1.1 }}>
                              <Text style={styles.cardCellLabel}>CIVIL STATUS</Text>
                              <Text style={styles.cardCellValue}>{civilStatus}</Text>
                            </View>
                          </View>

                          <View style={styles.cardDemoRow}>
                            <View style={{ flex: 0.85 }}>
                              <Text style={styles.cardCellLabel}>{col1Label}</Text>
                              <Text style={styles.cardCellValue}>{col1Value}</Text>
                            </View>
                            <View style={{ flex: 1.35 }}>
                              <Text style={styles.cardCellLabel}>{col2Label}</Text>
                              <Text style={styles.cardCellValue}>{col2Value}</Text>
                            </View>
                            <View style={{ flex: 1.1 }}>
                              <Text style={styles.cardCellLabel}>{col3Label}</Text>
                              <Text style={styles.cardCellValue}>{col3Value}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Registered Address */}
                        <View style={{ marginTop: 4 }}>
                          <Text style={styles.cardAddressHeaderLabel}>REGISTERED ADDRESS</Text>
                          <Text style={styles.cardAddressLine1}>{fullAddressLine1}</Text>
                          <Text style={styles.cardAddressLine2}>{fullAddressLine2}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Column 3: Cryptographic QR Code & Barcode */}
                    <View style={styles.cardColQr}>
                      <View style={styles.cardQrBox}>
                        <QRCode
                          value={qrPayload}
                          size={58}
                          color="#0F172A"
                          backgroundColor="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.cardBarcodeText}>{barcodeNum}</Text>
                      <View style={styles.cardVerifiedStamp}>
                        <IconSymbol name="checkmark.seal.fill" size={10} color="#059669" />
                        <Text style={styles.cardVerifiedStampText}>VERIFIED</Text>
                      </View>
                    </View>

                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              /* ========================================================= */
              /* BACK SIDE CARD (EMERGENCY & CITY DIRECTORY)               */
              /* ========================================================= */
              <TouchableOpacity
                activeOpacity={0.96}
                onPress={() => setCardSide('front')}
                style={[styles.pvcCardFrame, styles.pvcCardBackFrame]}
              >
                {/* Municipal Seal Watermark */}
                <View pointerEvents="none" style={styles.cardWatermarkBack}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={{ width: '100%', height: '100%', opacity: 0.08 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Back Header Ribbon */}
                <View style={styles.backTopHeader}>
                  <Text style={styles.backTopHeaderTitle}>
                    CITY GOVERNMENT OF CALOOCAN • EMERGENCY & RESIDENT RECORD
                  </Text>
                  <Text style={styles.backTopHeaderSubtitle}>
                    Official Municipal Smart Credential • Kasama Ka Sa Pag-Unlad
                  </Text>
                </View>

                {/* Back Inner Body */}
                <View style={styles.backInnerBody}>
                  
                  {/* SECTION 1: IN CASE OF EMERGENCY */}
                  <View style={styles.backEmergencyCard}>
                    <View style={styles.backEmergencyHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <IconSymbol name="phone.fill" size={11} color="#DC2626" />
                        <Text style={styles.backEmergencyHeaderTitle}>IN CASE OF EMERGENCY / ACCIDENT NOTIFY:</Text>
                      </View>
                      <View style={styles.backEmergencyBadge}>
                        <Text style={styles.backEmergencyBadgeText}>PRIORITY</Text>
                      </View>
                    </View>
                    
                    <View style={styles.backEmergencyInfoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.backEmergencyContactName}>{emergencyName}</Text>
                        <Text style={styles.backEmergencyContactRelation}>Relation: {emergencyRelation}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.backEmergencyPhoneValue}>{emergencyPhone}</Text>
                        <Text style={styles.backEmergencyPhoneSub}>Primary Mobile / Tel</Text>
                      </View>
                    </View>

                    <Text style={styles.backEmergencyNotice}>
                      In case of accident, medical emergency, or hospitalization, notify the contact above or call 888-ALERTO immediately.
                    </Text>
                  </View>

                  {/* SECTION 2: CALOOCAN CITY 24/7 HOTLINE DIRECTORY */}
                  <View style={styles.backDirectorySection}>
                    <Text style={styles.backSectionTitle}>CALOOCAN 24/7 EMERGENCY & CIVIC DIRECTORY</Text>
                    
                    <View style={styles.backHotlinesRow}>
                      <View style={styles.backHotlineItem}>
                        <Text style={[styles.backHlLabel, { color: '#DC2626' }]}>🚨 CDRRMO</Text>
                        <Text style={styles.backHlPhone}>888-ALERTO</Text>
                        <Text style={styles.backHlSub}>8882-5378</Text>
                      </View>

                      <View style={styles.backHotlineItem}>
                        <Text style={styles.backHlLabel}>🚔 POLICE (PNP)</Text>
                        <Text style={styles.backHlPhone}>(02) 8287-2270</Text>
                        <Text style={styles.backHlSub}>Caloocan HQ</Text>
                      </View>

                      <View style={styles.backHotlineItem}>
                        <Text style={styles.backHlLabel}>🚒 FIRE (BFP)</Text>
                        <Text style={styles.backHlPhone}>(02) 8361-9878</Text>
                        <Text style={styles.backHlSub}>Central Station</Text>
                      </View>

                      <View style={styles.backHotlineItem}>
                        <Text style={styles.backHlLabel}>🏥 HOSPITAL (CCMC)</Text>
                        <Text style={styles.backHlPhone}>(02) 8288-8888</Text>
                        <Text style={styles.backHlSub}>City Medical</Text>
                      </View>

                      <View style={styles.backHotlineItem}>
                        <Text style={styles.backHlLabel}>🏛️ {hotline4Label}</Text>
                        <Text style={styles.backHlPhone}>{hotline4Phone}</Text>
                        <Text style={styles.backHlSub}>{hotline4Sub}</Text>
                      </View>
                    </View>
                  </View>

                  {/* SECTION 3: LEGAL TERMS & RETURN NOTICE */}
                  <View style={styles.backTermsBox}>
                    <Text style={styles.backTermsText}>
                      • Non-transferable. Property of the City Government of Caloocan.{'\n'}
                      • Valid proof of residency across city public health, social services, and partner merchants.{'\n'}
                      • If found, please return to any Barangay Hall or Caloocan City Hall. Tampering is punishable by law (RPC 172).
                    </Text>
                  </View>

                  {/* SECTION 4: MAYOR SIGNATURE & BARCODE STUB */}
                  <View style={styles.backFooterRow}>
                    <View>
                      <Text style={styles.backSerialText}>SERIAL: {barcodeNum}</Text>
                      <Text style={styles.backTokenText}>TOKEN: {data.qr_code_token || 'CAL-SEC-TOKEN'}</Text>
                    </View>

                    <View style={styles.backMayorBlock}>
                      <Text style={styles.backMayorName}>HON. DALE GONZALO "ALONG" MALAPITAN</Text>
                      <Text style={styles.backMayorTitle}>City Mayor • City of Caloocan</Text>
                    </View>
                  </View>

                </View>
              </TouchableOpacity>
            )}

            {/* SEPARATE DETAILED CIVIC & HOTLINE DIRECTORY PANEL */}
            <View style={styles.directoryCard}>
              <View style={styles.directoryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconSymbol name="phone.fill" size={13} color="#DC2626" />
                  <Text style={styles.directoryTitle}>CALOOCAN CITY CIVIC & EMERGENCY DIRECTORY</Text>
                </View>
                <Text style={styles.directoryDispatchText}>24/7 Priority Dispatch</Text>
              </View>

              <View style={styles.directoryGrid}>
                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>CDRRMO RESCUE</Text>
                  <Text style={[styles.dirPillPhone, { color: '#DC2626' }]}>888-ALERTO</Text>
                  <Text style={styles.dirPillSub}>8882-5378 • 24/7</Text>
                </View>

                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>POLICE (PNP)</Text>
                  <Text style={styles.dirPillPhone}>(02) 8287-2270</Text>
                  <Text style={styles.dirPillSub}>Caloocan Police HQ</Text>
                </View>

                <View style={styles.directoryPill}>
                  <Text style={styles.dirPillLabel}>FIRE (BFP)</Text>
                  <Text style={styles.dirPillPhone}>(02) 8361-9878</Text>
                  <Text style={styles.dirPillSub}>Central Fire Station</Text>
                </View>

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
              Standard CR80 PVC Smart Card • Front & Back Double-Sided Ready
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
                <Text style={styles.modalFooterPrintBtnText}>Print Both Sides</Text>
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
    maxHeight: '94%',
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

  /* Card Side Switcher */
  cardSideSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  cardSideTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardSideTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSideTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardSideTabTextActive: {
    color: '#0F4C81',
    fontWeight: '800',
  },

  flipPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  flipPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },

  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },

  /* ========================================================= */
  /* PVC CARD FRONT STYLES                                     */
  /* ========================================================= */
  pvcCardFrame: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: 1.586, // Standard CR80 ratio (85.6mm / 53.98mm)
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
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
    height: 60,
    zIndex: 1,
  },
  cardInnerContent: {
    paddingHorizontal: 10,
    paddingTop: 3.5,
    paddingBottom: 8,
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  cardRepublicText: {
    fontSize: 6.8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 8.5,
    marginBottom: 0.5,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    justifyContent: 'center',
  },
  cardEmblemRing: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cardBrandTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 13,
  },
  cardBrandSubtitle: {
    fontSize: 6.6,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 0.5,
    textAlign: 'center',
  },
  cardColumnsRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginTop: 6,
  },
  cardColPhoto: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPhotoFrame: {
    width: 70,
    height: 70,
    borderRadius: 5,
    borderWidth: 1.2,
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
    width: 70,
    height: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSignaturePlaceholder: {
    fontSize: 6.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cardSignatureScript: {
    fontSize: 9.5,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardSignatureLabel: {
    fontSize: 5.6,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cardResidentBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    marginTop: 2,
  },
  cardResidentTag: {
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  cardColDemographics: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardControlNumberLabel: {
    fontSize: 6,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cardControlNumberValue: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cardFieldLabel: {
    fontSize: 5.8,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  cardNameValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardDemoGrid: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 3,
    marginTop: 3,
    gap: 3,
  },
  cardDemoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCellLabel: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cardCellValue: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardAddressHeaderLabel: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cardAddressLine1: {
    fontSize: 7.2,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    lineHeight: 10,
  },
  cardAddressLine2: {
    fontSize: 7.2,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    lineHeight: 10,
  },

  cardColQr: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cardQrBox: {
    width: 62,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBarcodeText: {
    fontSize: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: '#0F172A',
  },
  cardVerifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cardVerifiedStampText: {
    fontSize: 6.5,
    fontWeight: '900',
    color: '#15803D',
  },

  /* ========================================================= */
  /* PVC CARD BACK STYLES                                      */
  /* ========================================================= */
  pvcCardBackFrame: {
    backgroundColor: '#FFFFFF',
  },
  cardWatermarkBack: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '50%',
    height: '60%',
    zIndex: 0,
  },
  backTopHeader: {
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D97706',
    zIndex: 2,
  },
  backTopHeaderTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backTopHeaderSubtitle: {
    fontSize: 6,
    fontWeight: '700',
    color: '#FDE047',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  backInnerBody: {
    padding: 8,
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 10,
  },

  /* Emergency Section */
  backEmergencyCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    padding: 5,
  },
  backEmergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  backEmergencyHeaderTitle: {
    fontSize: 6.8,
    fontWeight: '900',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  backEmergencyBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  backEmergencyBadgeText: {
    fontSize: 5.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  backEmergencyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  backEmergencyContactName: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  backEmergencyContactRelation: {
    fontSize: 7,
    fontWeight: '700',
    color: '#475569',
  },
  backEmergencyPhoneValue: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backEmergencyPhoneSub: {
    fontSize: 5.5,
    color: '#64748B',
  },
  backEmergencyNotice: {
    fontSize: 5.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 7.5,
  },

  /* Hotlines Grid */
  backDirectorySection: {
    marginTop: 3,
  },
  backSectionTitle: {
    fontSize: 6.2,
    fontWeight: '900',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  backHotlinesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  backHotlineItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 3,
  },
  backHlLabel: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  backHlPhone: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  backHlSub: {
    fontSize: 5.5,
    color: '#94A3B8',
  },

  /* Terms */
  backTermsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 4,
    marginTop: 3,
  },
  backTermsText: {
    fontSize: 5.2,
    color: '#64748B',
    lineHeight: 7.2,
  },

  /* Back Footer */
  backFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 3,
    marginTop: 3,
  },
  backSerialText: {
    fontSize: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: '#0F172A',
  },
  backTokenText: {
    fontSize: 5,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backMayorBlock: {
    alignItems: 'flex-end',
  },
  backMayorName: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  backMayorTitle: {
    fontSize: 5.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },

  /* Directory Card (Below PVC) */
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

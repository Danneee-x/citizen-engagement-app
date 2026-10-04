import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';
import { API_BASE_URL, AuthService } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { LocalCitizenTable } from '@/src/services/local-citizen-table';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient as SvgGradient, Stop as SvgStop, Path as SvgPath, Polygon as SvgPolygon } from 'react-native-svg';
import { styles } from '../styles/VerifyCitizenScreen.styles';

export interface CitizenCategory {
  title: string;
  type: string;
  stops: [string, string, string, string];
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  color: string;
  gradient: string;
  hex: string;
  lightHex: string;
  darkHex: string;
}

export type CitizenClassification = CitizenCategory;

export function resolveCitizenCategory(
  birthDateStr?: string | null,
  isPwd = false,
  isNonResident = false
): CitizenCategory {
  if (isNonResident) {
    return {
      title: 'NON-RESIDENT',
      type: 'NON-RESIDENT',
      stops: ['#0F172A', '#334155', '#475569', '#64748B'],
      accentColor: '#475569',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
      color: '#475569',
      gradient: 'from-slate-700 to-slate-500',
      hex: '#475569',
      lightHex: '#64748B',
      darkHex: '#0F172A',
    };
  }
  if (isPwd) {
    return {
      title: 'PWD',
      type: 'PWD',
      stops: ['#7C2D12', '#C2410C', '#EA580C', '#F97316'],
      accentColor: '#EA580C',
      badgeBg: '#FFF7ED',
      badgeText: '#C2410C',
      color: '#EA580C',
      gradient: 'from-orange-700 to-orange-500',
      hex: '#EA580C',
      lightHex: '#F97316',
      darkHex: '#7C2D12',
    };
  }

  let age = 30; // fallback adult
  if (birthDateStr) {
    const bDate = new Date(birthDateStr);
    if (!isNaN(bDate.getTime())) {
      const diff = Date.now() - bDate.getTime();
      age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
  }

  if (age >= 60) {
    return {
      title: 'SENIOR CITIZEN',
      type: 'SENIOR CITIZEN',
      stops: ['#172554', '#1E3A8A', '#2563EB', '#1D4ED8'],
      accentColor: '#2563EB',
      badgeBg: '#EFF6FF',
      badgeText: '#1E40AF',
      color: '#2563EB',
      gradient: 'from-blue-900 to-blue-600',
      hex: '#2563EB',
      lightHex: '#2563EB',
      darkHex: '#172554',
    };
  }

  if (age < 18) {
    return {
      title: 'MINOR / RESIDENT',
      type: 'MINOR / RESIDENT',
      stops: ['#881337', '#991B1B', '#DC2626', '#B91C1C'],
      accentColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeText: '#991B1B',
      color: '#DC2626',
      gradient: 'from-red-800 to-red-600',
      hex: '#DC2626',
      lightHex: '#DC2626',
      darkHex: '#881337',
    };
  }

  // General Adult Resident (18-59)
  return {
    title: 'RESIDENT',
    type: 'RESIDENT',
    stops: ['#881337', '#991B1B', '#DC2626', '#B91C1C'],
    accentColor: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeText: '#991B1B',
    color: '#DC2626',
    gradient: 'from-red-800 to-red-600',
    hex: '#DC2626',
    lightHex: '#DC2626',
    darkHex: '#881337',
  };
}

export const getCitizenClassification = resolveCitizenCategory;

export interface CaloocanDistrict {
  id: string;
  name: string;
  shortName: string;
  areaDescription: string;
  barangayCount: number;
  barangays: string[];
}

export const CALOOCAN_DISTRICTS: CaloocanDistrict[] = [
  {
    id: 'district-1',
    name: 'District 1 (North Caloocan - West)',
    shortName: 'District 1',
    areaDescription: 'Bagong Silang, Bagumbong, Deparo, Llano, 167-177, etc.',
    barangayCount: 59,
    barangays: [
      1, 2, 3, 4, 77, 78, 79, 80, 81, 82, 83, 84, 85,
      132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
      151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
      170, 171, 172, 173, 174, 175, 176, 177,
    ].map((num) => `Barangay ${num}`),
  },
  {
    id: 'district-2',
    name: 'District 2 (South Caloocan)',
    shortName: 'District 2',
    areaDescription: 'Grace Park, Monumento, Maypajo, Sangandaan, 5-76 & 86-131',
    barangayCount: 118,
    barangays: [
      ...Array.from({ length: 72 }, (_, i) => i + 5), // 5 to 76
      ...Array.from({ length: 46 }, (_, i) => i + 86), // 86 to 131
    ].map((num) => `Barangay ${num}`),
  },
  {
    id: 'district-3',
    name: 'District 3 (North Caloocan - East)',
    shortName: 'District 3',
    areaDescription: 'Camarin, Amparo, Tala, Bankers Village (Brgy 178 - 188)',
    barangayCount: 11,
    barangays: [
      178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188,
    ].map((num) => `Barangay ${num}`),
  },
];

const VALID_ID_TYPES = [
  'PhilSys National ID',
  "Driver's License",
  'UMID',
  'Passport',
  "Voter's ID / Certificate",
  'Barangay ID',
  'Postal ID',
  'Student ID',
];

const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Divorced / Annulled',
  'Common-Law / Live-In',
];
const SEX_OPTIONS = ['Male', 'Female'];

const EMPLOYMENT_STATUS_OPTIONS = [
  'Employed (Private Sector)',
  'Employed (Government / Public)',
  'Self-Employed / Freelancer',
  'Business Owner / Entrepreneur',
  'Unemployed / Job Seeker',
  'Student',
  'Retired / Senior Citizen',
  'OFW (Overseas Filipino Worker)',
  'Homemaker / Houseparent',
];

const OCCUPATION_OPTIONS = [
  'Government / Public Servant',
  'Corporate / Office Employee',
  'Healthcare / Medical Professional',
  'Teacher / Professor / Educator',
  'IT / Tech / BPO Professional',
  'Driver / Transport Operator',
  'Retail / Sales / Merchant',
  'Skilled Trade / Construction / Technical',
  'Service Industry / Hospitality',
  'Student / Non-Working',
  'Others',
];

const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  'Elementary Undergraduate',
  'Elementary Graduate',
  'High School / Junior High Graduate',
  'Senior High School Graduate',
  'Vocational / Technical Course',
  'College Undergraduate',
  'College / Bachelor’s Degree Graduate',
  'Postgraduate (Master’s / Doctorate)',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEAR_OPTIONS = Array.from({ length: 97 }, (_, i) => 2026 - i);

export function VerifyCitizenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 20) + 12;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Personal Details State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [sex, setSex] = useState(SEX_OPTIONS[0]);
  const [placeOfBirth, setPlaceOfBirth] = useState('Caloocan City');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [civilStatus, setCivilStatus] = useState(CIVIL_STATUS_OPTIONS[0]);
  const [isCivilStatusDropdownOpen, setIsCivilStatusDropdownOpen] = useState(false);

  // Birthdate Dropdown Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(1998);
  const [calMonth, setCalMonth] = useState(4); // May (0-indexed)
  const [calDay, setCalDay] = useState(15);
  const [isCalMonthDropdownOpen, setIsCalMonthDropdownOpen] = useState(false);
  const [isCalYearDropdownOpen, setIsCalYearDropdownOpen] = useState(false);

  // Demographic Information State (Dropdowns - initially empty to require user selection)
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [isEmploymentDropdownOpen, setIsEmploymentDropdownOpen] = useState(false);

  const [occupation, setOccupation] = useState('');
  const [isOccupationDropdownOpen, setIsOccupationDropdownOpen] = useState(false);

  const [educationalAttainment, setEducationalAttainment] = useState('');
  const [isEducationDropdownOpen, setIsEducationDropdownOpen] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Status Guarding & Persistent State
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [appData, setAppData] = useState<any | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  // STEP 2: Residency State (Caloocan District & Cascading Barangay)
  const [selectedDistrictId, setSelectedDistrictId] = useState(CALOOCAN_DISTRICTS[0].id);
  const activeDistrict = useMemo(
    () => CALOOCAN_DISTRICTS.find((d) => d.id === selectedDistrictId) || CALOOCAN_DISTRICTS[0],
    [selectedDistrictId]
  );
  const [barangay, setBarangay] = useState(activeDistrict.barangays[0]);
  const [isBarangayPickerVisible, setIsBarangayPickerVisible] = useState(false);
  const [barangaySearchQuery, setBarangaySearchQuery] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [yearsResident, setYearsResident] = useState('');

  // STEP 3: Valid ID, Liveness, 1x1 Photo & Signature State
  const [selectedIdType, setSelectedIdType] = useState(VALID_ID_TYPES[0]);
  const [isIdTypeDropdownOpen, setIsIdTypeDropdownOpen] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [hasUploadedId, setHasUploadedId] = useState(false);
  const [hasLivenessCheck, setHasLivenessCheck] = useState(false);
  const [idImageUri, setIdImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);
  const [photo1x1Uri, setPhoto1x1Uri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  // Photo Source Picker Modal State (Camera vs Gallery)
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'id' | 'selfie' | 'photo1x1' | 'signature'>('id');

  // Approved Card display fallbacks & helpers
  const [photoError, setPhotoError] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  const resolveCardAssetUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanPath = url.replace(/^\/+/, '');
    return `http://192.168.1.5/citizen-backend/${cleanPath}`;
  };

  const formatCardDate = (dateStr?: string | null, addYears = 0): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      if (addYears > 0) {
        d.setFullYear(d.getFullYear() + addYears);
      }
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}/${mm}/${dd}`;
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (dateStr?: string | null): string => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(d.getTime())) return '2026/10/04 06:04:00 PM';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const timeStr = d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${yyyy}/${mm}/${dd} ${timeStr}`;
    } catch {
      return '2026/10/04 06:04:00 PM';
    }
  };

  const formatFullName = () => {
    const lName = (appData?.last_name || 'RESIDENT').toUpperCase();
    const fName = (appData?.first_name || '').toUpperCase();
    const mName = appData?.middle_name ? `${appData.middle_name.charAt(0).toUpperCase()}.` : '';
    const sfx = appData?.suffix ? appData.suffix.toUpperCase() : '';
    return `${lName}, ${fName} ${mName} ${sfx}`.trim().replace(/\s+/g, ' ');
  };

  const classification = useMemo(() => {
    return getCitizenClassification(
      appData?.birth_date,
      !!(appData?.is_pwd || appData?.pwd),
      !!(appData?.is_non_resident || appData?.non_resident)
    );
  }, [appData]);

  const [isPrinting, setIsPrinting] = useState(false);

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
      console.warn('Failed to load local logo as base64 for print:', err);
    }
    return 'https://ui-avatars.com/api/?name=CV&background=0F4C81&color=fff&size=64';
  };

  const generateCardHtml = (logoDataUri?: string): string => {
    const resolvedLogoUri = logoDataUri || 'https://ui-avatars.com/api/?name=CV&background=0F4C81&color=fff&size=64';
    const lName = (appData?.last_name || '').toUpperCase();
    const fName = (appData?.first_name || '').toUpperCase();
    const mName = appData?.middle_name ? `${appData.middle_name.charAt(0).toUpperCase()}.` : '';
    const sfx = appData?.suffix ? appData.suffix.toUpperCase() : '';
    const fullName = `${lName}, ${fName} ${mName} ${sfx}`.trim().replace(/\s+/g, ' ') || 'CITIZEN CARDHOLDER';

    const citizenId = appData?.citizen_id_number || 'CAL-2026-000004';
    const numericSeed = citizenId.replace(/\D/g, '') || '000004';
    const barcodeNum = '0100' + numericSeed.padStart(10, '0');

    const dob = appData?.birth_date ? String(appData.birth_date).replace(/-/g, '/') : '1998/05/15';
    const sex = (appData?.sex || 'Male').toUpperCase().startsWith('F') ? 'F' : 'M';
    const civil = (appData?.civil_status || 'Single').toUpperCase();
    const blood = (appData?.blood_type || 'N/A').toUpperCase();

    const issuedDate = (appData?.reviewed_at || appData?.submitted_at || '2026-10-04').slice(0, 10).replace(/-/g, '/');
    const validUntil = (appData?.valid_until || '2031/10/04').slice(0, 10).replace(/-/g, '/');

    const street = (appData?.street_address || 'BLOCK 5 LOT 6').toUpperCase();
    const brgy = (appData?.barangay || 'BARANGAY 3').toUpperCase();
    const district = (appData?.district || 'DISTRICT 1').toUpperCase();
    const fullAddress = `${street}, ${brgy}, ${district}`;

    const emergency = appData?.emergency_contact || '(02) 8366-3101';
    const photoUrl = resolveCardAssetUrl(appData?.photo_1x1_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0F4C81&color=fff&size=200`;
    const signatureUrl = resolveCardAssetUrl(appData?.signature_photo_url) || '';
    const qrPayload = `CIVENTRAL:ID:${citizenId}|TOKEN:${appData?.qr_code_token || ''}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;

    const stops = classification.stops;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Civentral Citizen ID Card - ${citizenId}</title>
  <style>
    @page {
      size: portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 6mm !important;
      padding: 4mm 0 !important;
    }
    .card-frame {
      width: 105mm;
      height: 66.2mm;
      max-width: 105mm;
      max-height: 66.2mm;
      aspect-ratio: 105 / 66.2;
      background: #FFFFFF;
      border-radius: 3.5mm;
      border: 1px solid #CBD5E1;
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ribbon-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 18mm;
      z-index: 1;
    }
    .card-content {
      position: relative;
      z-index: 10;
      padding: 2.8mm 3.2mm;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header-block {
      text-align: center;
      margin-bottom: 1.2mm;
    }
    .republic-text {
      font-size: 5.5pt;
      font-weight: 700;
      color: #FEE2E2;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      line-height: 1;
    }
    .brand-row {
      display: flex;
      align-items: center;
      margin-top: 1mm;
      padding-right: 8mm;
    }
    .logo-emblem {
      width: 8mm;
      height: 8mm;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1pt solid #F59E0B;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.5mm;
      overflow: hidden;
      flex-shrink: 0;
    }
    .logo-img {
      width: 6.5mm;
      height: 6.5mm;
      object-fit: contain;
    }
    .brand-titles {
      flex: 1;
      text-align: center;
    }
    .brand-title {
      font-size: 8.8pt;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 4.8pt;
      font-weight: 700;
      color: #FDE047;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      line-height: 1;
      margin-top: 0.4mm;
    }
    .card-body {
      display: flex;
      gap: 2.2mm;
      align-items: stretch;
      flex: 1;
    }
    .col-left {
      width: 22mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }
    .photo-box {
      width: 21mm;
      height: 21mm;
      border-radius: 1.2mm;
      border: 0.6pt solid #CBD5E1;
      background: #F8FAFC;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .sig-box {
      width: 21mm;
      height: 5.8mm;
      border-bottom: 0.6pt dashed #94A3B8;
      background: #FFFFFF;
      margin-top: 0.6mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .sig-img {
      width: 95%;
      height: 90%;
      object-fit: contain;
    }
    .sig-label {
      font-size: 4pt;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 0.4mm;
    }
    .classif-title {
      font-size: 6pt;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin-top: 0.6mm;
      text-align: center;
    }
    .timestamp-text {
      font-size: 4.2pt;
      font-family: monospace;
      color: #64748B;
      align-self: flex-start;
      margin-top: auto;
    }
    .col-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .field-lbl {
      font-size: 4.5pt;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      display: block;
      line-height: 1;
    }
    .name-val {
      font-size: 8.5pt;
      font-weight: 900;
      color: #0F172A;
      text-transform: uppercase;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.8mm;
      border-top: 0.5pt solid #E2E8F0;
      padding-top: 0.8mm;
      margin-top: 0.8mm;
    }
    .demo-val {
      font-size: 5.6pt;
      font-weight: 900;
      color: #0F172A;
      display: block;
      line-height: 1.1;
    }
    .address-box {
      border-top: 0.5pt solid #E2E8F0;
      padding-top: 0.8mm;
      margin-top: 0.8mm;
    }
    .address-val {
      font-size: 5.6pt;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .emergency-text {
      font-size: 4.5pt;
      color: #334155;
      border-top: 0.5pt solid #E2E8F0;
      padding-top: 0.6mm;
      margin-top: auto;
    }
    .col-right {
      width: 21mm;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
    }
    .qr-box {
      width: 20mm;
      height: 20mm;
      background: #FFFFFF;
      border: 0.6pt solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img {
      width: 19mm;
      height: 19mm;
      object-fit: contain;
    }
    .barcode-val {
      font-size: 5pt;
      font-family: monospace;
      font-weight: 700;
      color: #334155;
      margin-top: 0.6mm;
      text-align: center;
      display: block;
      width: 100%;
    }
    .micro-code {
      font-size: 5.2pt;
      font-family: monospace;
      font-weight: 800;
      color: #334155;
      margin-top: auto;
    }
    .cut-guide {
      font-size: 7pt;
      font-family: monospace;
      color: #94A3B8;
      text-align: center;
      letter-spacing: 1px;
      user-select: none;
    }
  </style>
</head>
<body>
  <!-- FRONT CARD SIDE -->
  <div class="card-frame" id="printableCitizenCard">
    <svg class="ribbon-svg" viewBox="0 0 360 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="headerWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${stops[0]}" />
          <stop offset="30%" stop-color="${stops[1]}" />
          <stop offset="75%" stop-color="${stops[2]}" />
          <stop offset="100%" stop-color="${stops[3]}" />
        </linearGradient>
        <linearGradient id="goldWaveStripe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#D97706" />
          <stop offset="50%" stop-color="#FDE047" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>
      <path d="M 0,0 L 360,0 L 360,59 Q 266,69 180,63 T 0,76 Z" fill="url(#headerWaveGrad)" />
      <path d="M 0,76 Q 94,63 180,63 T 360,59 L 360,63 Q 266,73 180,67 T 0,80 Z" fill="url(#goldWaveStripe)" />
    </svg>

    <div class="card-content">
      <div class="header-block">
        <div class="republic-text">Republic of the Philippines</div>
        <div class="brand-row">
          <div class="logo-emblem">
            <img src="${resolvedLogoUri}" class="logo-img" alt="Seal" />
          </div>
          <div class="brand-titles">
            <div class="brand-title">Civentral Citizen Card</div>
            <div class="brand-tagline">Kasama Ka Sa Pag-Unlad &bull; City of Caloocan</div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div class="col-left">
          <div>
            <div class="photo-box">
              <img src="${photoUrl}" class="photo-img" alt="Photo" />
            </div>
            <div class="sig-box">
              ${signatureUrl ? `<img src="${signatureUrl}" class="sig-img" alt="Signature" />` : '<span class="sig-label">Signature</span>'}
            </div>
            <div class="sig-label">Cardholder Signature</div>
            <div class="classif-title">${classification.title}</div>
          </div>
          <div class="timestamp-text">${dob.replace(/\//g, '')}0100</div>
        </div>

        <div class="col-center">
          <div>
            <span class="field-lbl">Last Name, First Name, M.I.</span>
            <div class="name-val">${fullName}</div>

            <div class="demo-grid">
              <div>
                <span class="field-lbl">Sex</span>
                <span class="demo-val">${sex}</span>
              </div>
              <div>
                <span class="field-lbl">Date of Birth</span>
                <span class="demo-val">${dob}</span>
              </div>
              <div>
                <span class="field-lbl">Civil Status</span>
                <span class="demo-val">${civil}</span>
              </div>
              <div>
                <span class="field-lbl">Blood Type</span>
                <span class="demo-val">${blood}</span>
              </div>
              <div>
                <span class="field-lbl">Date Issued</span>
                <span class="demo-val">${issuedDate}</span>
              </div>
              <div>
                <span class="field-lbl">Valid Until</span>
                <span class="demo-val">${validUntil}</span>
              </div>
            </div>

            <div class="address-box">
              <div class="address-val">${fullAddress}</div>
              <div class="address-val">CALOOCAN CITY</div>
            </div>
          </div>

          <div class="emergency-text">
            Emergency Contact: <strong>${emergency}</strong>
          </div>
        </div>

        <div class="col-right">
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
            <div class="qr-box">
              <img src="${qrImgUrl}" class="qr-img" alt="QR" />
            </div>
            <span class="barcode-val">${barcodeNum}</span>
          </div>
          <span class="micro-code">00</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CUT HERE / FOLD LINE -->
  <div class="cut-guide">
    - - - - - - - - - - - - - - - - - - - - - CUT HERE / FOLD LINE - - - - - - - - - - - - - - - - - - - - -
  </div>

  <!-- BACK CARD SIDE (PRINT ONLY) -->
  <div class="card-frame" id="printableCardBack">
    <!-- Top Accent Line -->
    <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.5mm; background: linear-gradient(90deg, ${stops[0]} 0%, #D97706 50%, ${stops[0]} 100%);"></div>

    <div style="position: relative; z-index: 10; padding: 4.8mm 3.6mm 3.2mm; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div style="display: flex; gap: 2.8mm; align-items: stretch; flex: 1;">
        <!-- Left Column: General Terms and Conditions -->
        <div style="flex: 1.25; display: flex; flex-direction: column; justify-content: space-between; border-right: 0.5pt solid #CBD5E1; padding-right: 2.5mm;">
          <div>
            <div style="font-size: 5.6pt; font-weight: 900; color: #1E293B; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 1.2mm;">
              General Terms and Conditions
            </div>
            <div style="font-size: 4.4pt; color: #475569; line-height: 1.3; text-align: justify;">
              By signing or using this card, the cardholder agrees to be bound by the Civentral Citizen Card Terms and Conditions. Please present this card when availing of municipal services or authorized partner privileges in Caloocan City. Tampering invalidates this card. A card is deemed tampered when there are alterations or erasures apparent on the card itself. If found, please return to the City Civil Registry Office, Caloocan City Hall.
            </div>
          </div>
          <div style="font-size: 5.2pt; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-top: auto; padding-top: 1mm;">
            This card is Non-Transferable.
          </div>
        </div>

        <!-- Center Column: Issuing Authority -->
        <div style="flex: 0.95; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; border-right: 0.5pt solid #CBD5E1; padding: 0 2mm;">
          <div style="width: 13mm; height: 13mm; border-radius: 50%; border: 0.8pt solid rgba(245, 158, 11, 0.6); background: rgba(254, 243, 199, 0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10.5mm; height: 10.5mm; border-radius: 50%; border: 0.5pt dashed #D97706; display: flex; align-items: center; justify-content: center; font-size: 6.5pt; font-weight: 900; color: #B45309;">
              SEAL
            </div>
          </div>

          <div style="width: 100%; margin-top: auto; padding-top: 1mm;">
            <div style="font-size: 4.5pt; text-transform: uppercase; color: #64748B; letter-spacing: 0.3px;">Issuing Authority</div>
            <div style="width: 80%; border-bottom: 0.5pt solid #94A3B8; margin: 0.8mm auto;"></div>
            <div style="font-size: 5.5pt; font-weight: 900; color: #0F172A; text-transform: uppercase; line-height: 1.1;">
              (SGD) DALE GONZALO R. MALAPITAN
            </div>
            <div style="font-size: 4.8pt; font-weight: 700; color: #334155; text-transform: uppercase; margin-top: 0.3mm;">
              City Mayor
            </div>
            <div style="font-size: 4pt; font-weight: 600; color: #64748B; text-transform: uppercase; margin-top: 0.3mm;">
              City Government of Caloocan
            </div>
          </div>
        </div>

        <!-- Right Column: Logo, Subtext, Barcode -->
        <div style="flex: 0.8; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; padding-left: 1mm;">
          <div>
            <div style="width: 10mm; height: 10mm; border-radius: 50%; background: #FFFFFF; border: 0.8pt solid #F59E0B; display: flex; align-items: center; justify-content: center; margin: 0 auto; overflow: hidden;">
              <img src="${resolvedLogoUri}" style="width: 8.5mm; height: 8.5mm; object-fit: contain;" alt="Seal" />
            </div>
            <div style="font-size: 4.4pt; font-weight: 700; color: #334155; text-transform: uppercase; margin-top: 1mm; line-height: 1.15;">
              Valid Anywhere in the Philippines
            </div>
          </div>

          <div style="width: 100%; margin-top: auto; padding-top: 1mm;">
            <div style="background: #F1F5F9; border: 0.5pt solid #CBD5E1; border-radius: 1mm; padding: 1mm 0.6mm;">
              <div style="font-family: monospace; font-size: 4.8pt; font-weight: 800; color: #1E293B; letter-spacing: 0.8px;">
                ${barcodeNum}
              </div>
            </div>
            <div style="font-family: monospace; font-size: 4.2pt; color: #64748B; margin-top: 0.5mm;">
              ${citizenId}
            </div>
          </div>
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
      const html = generateCardHtml(logoUri);
      if (Platform.OS === 'web') {
        window.print();
        return;
      }
      await Print.printAsync({ html });
    } catch (err: any) {
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
      const html = generateCardHtml(logoUri);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Civentral_Citizen_Card_${appData?.citizen_id_number || 'ID'}.pdf`,
        });
      } else {
        Alert.alert('PDF Created', `Saved to temporary storage:\n${uri}`);
      }
    } catch (err: any) {
      console.warn('Share PDF error:', err);
      Alert.alert('PDF Export Error', 'Could not generate or share PDF document.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Auto-fetch Citizen basic info and verify existing application status
  useEffect(() => {
    async function loadCitizenData() {
      try {
        setIsLoadingStatus(true);
        const currentUser = AuthService.getCurrentUser();

        // 1. Query live verification status from citizen-backend
        const verifRes = await ProfileService.getVerificationStatus(
          currentUser.citizen_user_id || undefined,
          currentUser.email || undefined
        );

        if (verifRes && verifRes.status === 'success' && verifRes.data) {
          const d = verifRes.data;
          setAppStatus(d.verification_status);
          setAppData(d);

          // If Returned for correction or Rejected, pre-fill demographic fields for rework/appeal
          if (d.verification_status === 'Returned_For_Correction' || d.verification_status === 'Rejected') {
            if (d.first_name) setFirstName(d.first_name);
            if (d.middle_name) setMiddleName(d.middle_name);
            if (d.last_name) setLastName(d.last_name);
            if (d.suffix) setSuffix(d.suffix);
            if (d.sex && SEX_OPTIONS.includes(d.sex)) setSex(d.sex);
            if (d.birth_date) setBirthDate(d.birth_date);
            if (d.place_of_birth) setPlaceOfBirth(d.place_of_birth);
            if (d.civil_status && CIVIL_STATUS_OPTIONS.includes(d.civil_status)) {
              setCivilStatus(d.civil_status);
            }
            if (d.employment_status) setEmploymentStatus(d.employment_status);
            if (d.occupation) setOccupation(d.occupation);
            if (d.educational_attainment) setEducationalAttainment(d.educational_attainment);
            if (d.district) {
              const matchedDistrict = CALOOCAN_DISTRICTS.find(
                (dist) => dist.shortName === d.district || dist.name === d.district
              );
              if (matchedDistrict) setSelectedDistrictId(matchedDistrict.id);
            }
            if (d.barangay) setBarangay(d.barangay);
            if (d.street_address) setStreetAddress(d.street_address);
            if (d.years_resident) setYearsResident(String(d.years_resident));
            if (d.valid_id_type && VALID_ID_TYPES.includes(d.valid_id_type)) {
              setSelectedIdType(d.valid_id_type);
            }
            if (d.valid_id_number) setIdNumber(d.valid_id_number);

            // Only pre-fill previously submitted photos for correction rework, not for rejected
            if (d.verification_status === 'Returned_For_Correction') {
              if (d.id_front_photo_url) {
                setIdImageUri(d.id_front_photo_url);
                setHasUploadedId(true);
              }
              if (d.selfie_photo_url) {
                setSelfieImageUri(d.selfie_photo_url);
                setHasLivenessCheck(true);
              }
              if (d.photo_1x1_url) {
                setPhoto1x1Uri(d.photo_1x1_url);
              }
              if (d.signature_photo_url) {
                setSignatureUri(d.signature_photo_url);
              }
            }
            setIsPrefilled(true);
          }
        }

        // 2. Pre-fill from active auth session if present and not already filled
        if (currentUser && currentUser.user) {
          const u = currentUser.user;
          setFirstName((prev) => prev || u.first_name || '');
          setMiddleName((prev) => prev || u.middle_name || '');
          setLastName((prev) => prev || u.last_name || '');
          setSuffix((prev) => prev || u.suffix || '');
          setIsPrefilled(true);
        }

        // 3. Fetch fresh profile details from DB via ProfileService
        if (currentUser.email || currentUser.citizen_user_id || currentUser.phone) {
          const res = await ProfileService.getProfile(
            currentUser.email || undefined,
            currentUser.citizen_user_id || undefined,
            currentUser.phone || undefined
          );

          if (res.status === 'success' && res.data) {
            const p = res.data;
            setFirstName((prev) => prev || p.first_name || '');
            setMiddleName((prev) => prev || p.middle_name || '');
            setLastName((prev) => prev || p.last_name || '');
            setSuffix((prev) => prev || p.suffix || '');
            if (p.birthDate) setBirthDate((prev) => prev || p.birthDate || '');
            if (p.civilStatus && CIVIL_STATUS_OPTIONS.includes(p.civilStatus)) {
              setCivilStatus((prev) => prev || p.civilStatus || '');
            }
            if (p.barangay) setBarangay((prev) => prev || p.barangay || '');
            if (p.address) setStreetAddress((prev) => prev || p.address || '');
            setIsPrefilled(true);
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch citizen registration info:', err);
      } finally {
        setIsLoadingStatus(false);
      }
    }

    loadCitizenData();
  }, []);

  const handleOpenPhotoPicker = (target: 'id' | 'selfie' | 'photo1x1' | 'signature') => {
    setPhotoPickerTarget(target);
    setIsPhotoPickerVisible(true);
  };

  const convertToDataUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    // If running on web, downscale using canvas to prevent sending massive 10MB camera blobs
    if (Platform.OS === 'web' && typeof document !== 'undefined' && asset.uri) {
      try {
        const compressed = await new Promise<string>((resolve) => {
          const img = new (window as any).Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(asset.uri);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => resolve(asset.uri);
          img.src = asset.uri;
        });
        if (compressed && compressed.startsWith('data:')) {
          return compressed;
        }
      } catch (err) {
        console.warn('Canvas compression error, falling back:', err);
      }
    }

    if (asset.base64) {
      const mime = asset.mimeType || 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    }
    if (asset.uri && (asset.uri.startsWith('blob:') || asset.uri.startsWith('http'))) {
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Blob to data uri conversion error:', e);
      }
    }
    return asset.uri;
  };

  const handleTakePhoto = async () => {
    setIsPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Camera access is required to capture your photo.');
        return;
      }

      const aspectVal: [number, number] | undefined =
        photoPickerTarget === 'photo1x1' ? [1, 1] : photoPickerTarget === 'signature' ? [3, 1] : undefined;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectVal,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = await convertToDataUri(result.assets[0]);
        if (photoPickerTarget === 'id') {
          setIdImageUri(uri);
          setHasUploadedId(true);
        } else if (photoPickerTarget === 'selfie') {
          setSelfieImageUri(uri);
          setHasLivenessCheck(true);
        } else if (photoPickerTarget === 'photo1x1') {
          setPhoto1x1Uri(uri);
        } else if (photoPickerTarget === 'signature') {
          setSignatureUri(uri);
        }
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setErrorMessage('Failed to launch camera.');
    }
  };

  const handlePickFromGallery = async () => {
    setIsPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Photo gallery access is required to select an image.');
        return;
      }

      const aspectVal: [number, number] | undefined =
        photoPickerTarget === 'photo1x1' ? [1, 1] : photoPickerTarget === 'signature' ? [3, 1] : undefined;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectVal,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = await convertToDataUri(result.assets[0]);
        if (photoPickerTarget === 'id') {
          setIdImageUri(uri);
          setHasUploadedId(true);
        } else if (photoPickerTarget === 'selfie') {
          setSelfieImageUri(uri);
          setHasLivenessCheck(true);
        } else if (photoPickerTarget === 'photo1x1') {
          setPhoto1x1Uri(uri);
        } else if (photoPickerTarget === 'signature') {
          setSignatureUri(uri);
        }
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
      setErrorMessage('Failed to open photo gallery.');
    }
  };

  const handleRemovePhoto = (target: 'id' | 'selfie' | 'photo1x1' | 'signature') => {
    if (target === 'id') {
      setIdImageUri(null);
      setHasUploadedId(false);
    } else if (target === 'selfie') {
      setSelfieImageUri(null);
      setHasLivenessCheck(false);
    } else if (target === 'photo1x1') {
      setPhoto1x1Uri(null);
    } else if (target === 'signature') {
      setSignatureUri(null);
    }
  };

  // Filtered Barangays based on search in modal
  const filteredBarangays = useMemo(() => {
    const query = barangaySearchQuery.trim().toLowerCase();
    if (!query) return activeDistrict.barangays;
    return activeDistrict.barangays.filter((b) => b.toLowerCase().includes(query));
  }, [activeDistrict, barangaySearchQuery]);

  // Handle District switch & cascade to first barangay in district
  const handleSelectDistrict = (district: CaloocanDistrict) => {
    setSelectedDistrictId(district.id);
    setBarangay(district.barangays[0]);
    setBarangaySearchQuery('');
  };

  // Days in selected calendar month
  const daysInCalMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(calYear, calMonth, 1).getDay();
  }, [calYear, calMonth]);

  const handleSelectDay = (day: number) => {
    setCalDay(day);
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setBirthDate(`${calYear}-${mm}-${dd}`);
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const dmBg = isDarkMode ? '#0B132B' : '#F8FAFC';
  const dmCard = isDarkMode ? '#1C2541' : '#FFFFFF';
  const dmBorder = isDarkMode ? '#3A506B' : '#E2E8F0';
  const dmText = isDarkMode ? '#FFFFFF' : '#0F172A';
  const dmInputBg = isDarkMode ? '#152238' : '#F8FAFC';
  const dmInputText = isDarkMode ? '#F1F5F9' : '#0F172A';

  const handleNextStep1 = () => {
    setErrorMessage(null);
    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }
    if (!birthDate.trim()) {
      setErrorMessage('Date of birth is required (e.g. YYYY-MM-DD).');
      return;
    }
    if (!placeOfBirth.trim()) {
      setErrorMessage('Place of birth is required.');
      return;
    }
    if (!employmentStatus) {
      setErrorMessage('Please select your Employment Status under Demographic Information.');
      return;
    }
    if (!occupation) {
      setErrorMessage('Please select your Occupation under Demographic Information.');
      return;
    }
    if (!educationalAttainment) {
      setErrorMessage('Please select your Educational Attainment under Demographic Information.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setErrorMessage(null);
    if (!streetAddress.trim()) {
      setErrorMessage('Street address is required.');
      return;
    }
    if (!yearsResident.trim()) {
      setErrorMessage('Years of residency is required.');
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmitVerification = async () => {
    setErrorMessage(null);
    if (!idNumber.trim()) {
      setErrorMessage('Government ID number is required.');
      return;
    }
    if (!hasUploadedId) {
      setErrorMessage('Please capture or upload a copy of your valid ID.');
      return;
    }
    if (!photo1x1Uri) {
      setErrorMessage('Please upload or capture your official 1x1 applicant photo.');
      return;
    }
    if (!signatureUri) {
      setErrorMessage('Please provide your digital applicant signature.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      const userId = currentUser.citizen_user_id || 1001;

      // 1. Update citizen verification details in local store & active session
      LocalCitizenTable.update(userId, {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        suffix: suffix.trim() || null,
        registry_completed: 1,
        birth_date: birthDate,
        place_of_birth: placeOfBirth.trim(),
        civil_status: civilStatus,
        district: activeDistrict.shortName,
        barangay,
        street_address: streetAddress.trim(),
        years_resident: yearsResident.trim(),
        employment_status: employmentStatus,
        occupation,
        educational_attainment: educationalAttainment,
        valid_id_type: selectedIdType,
        valid_id_number: idNumber.trim(),
      });

      // Ensure photo URIs are full base64 Data URIs rather than local browser memory blobs
      let finalIdPhoto = idImageUri;
      if (finalIdPhoto && finalIdPhoto.startsWith('blob:')) {
        try {
          const r = await fetch(finalIdPhoto);
          const b = await r.blob();
          finalIdPhoto = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(b);
          });
        } catch (e) {
          console.warn('Could not convert blob ID photo to base64:', e);
        }
      }

      let finalSelfiePhoto = selfieImageUri;
      if (finalSelfiePhoto && finalSelfiePhoto.startsWith('blob:')) {
        try {
          const r = await fetch(finalSelfiePhoto);
          const b = await r.blob();
          finalSelfiePhoto = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(b);
          });
        } catch (e) {
          console.warn('Could not convert blob selfie photo to base64:', e);
        }
      }

      let finalPhoto1x1 = photo1x1Uri;
      if (finalPhoto1x1 && finalPhoto1x1.startsWith('blob:')) {
        try {
          const r = await fetch(finalPhoto1x1);
          const b = await r.blob();
          finalPhoto1x1 = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(b);
          });
        } catch (e) {
          console.warn('Could not convert blob 1x1 photo to base64:', e);
        }
      }

      let finalSignature = signatureUri;
      if (finalSignature && finalSignature.startsWith('blob:')) {
        try {
          const r = await fetch(finalSignature);
          const b = await r.blob();
          finalSignature = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(b);
          });
        } catch (e) {
          console.warn('Could not convert blob signature to base64:', e);
        }
      }

      // 2. Transmit to MySQL citizen_verification database via API
      const payload = {
        citizen_user_id: currentUser.citizen_user_id || userId,
        email: currentUser.email || undefined,
        phone: currentUser.phone || undefined,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        suffix: suffix.trim() || null,
        sex,
        place_of_birth: placeOfBirth.trim(),
        birth_date: birthDate,
        civil_status: civilStatus,
        employment_status: employmentStatus,
        occupation,
        educational_attainment: educationalAttainment,
        district: activeDistrict.shortName,
        barangay,
        street_address: streetAddress.trim(),
        years_resident: parseInt(yearsResident.trim(), 10) || 1,
        valid_id_type: selectedIdType,
        valid_id_number: idNumber.trim(),
        id_front_photo_url: finalIdPhoto || null,
        selfie_photo_url: finalSelfiePhoto || null,
        photo_1x1_url: finalPhoto1x1 || null,
        signature_photo_url: finalSignature || null,
      };

      const isLocalhost =
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const candidateEndpoints = [
        `${API_BASE_URL}/verify-citizen.php`,
        'http://192.168.1.5/citizen-backend/api/citizen/verify-citizen.php',
        ...(isLocalhost
          ? [
              'http://localhost/citizen-backend/api/citizen/verify-citizen.php',
              'http://127.0.0.1/citizen-backend/api/citizen/verify-citizen.php',
            ]
          : []),
      ];

      let isSuccess = false;
      let lastErrorMessage = '';

      for (const endpoint of candidateEndpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timer);

          const data = await res.json().catch(() => null);

          if (res.ok && data && (data.status === 'success' || data.success === true)) {
            console.log('Successfully saved to citizen_verification database:', data);
            isSuccess = true;
            break;
          } else if (res.status === 409 || (data && data.message && (data.message.includes('already have an active application') || data.message.includes('already verified')))) {
            // Duplicate prevention caught
            lastErrorMessage = data?.message || 'You already have an active application under review.';
            const refreshRes = await ProfileService.getVerificationStatus(
              currentUser.citizen_user_id || undefined,
              currentUser.email || undefined
            );
            if (refreshRes?.data) {
              setAppStatus(refreshRes.data.verification_status);
              setAppData(refreshRes.data);
            }
            break;
          } else if (data && data.message) {
            lastErrorMessage = data.message;
          }
        } catch (fetchErr: any) {
          lastErrorMessage = fetchErr?.message || 'Connection failed';
        }
      }

      if (isSuccess) {
        setCurrentStep(4);
      } else {
        setErrorMessage(lastErrorMessage || 'Failed to submit verification to the registry database. Please try again.');
      }
    } catch (err: any) {
      console.warn('Citizen Registry verification error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: dmBg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Navigation */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButton, isDarkMode && { backgroundColor: '#1C2541' }]}
              onPress={() => router.replace('/(tabs)' as any)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Back to Dashboard"
            >
              <IconSymbol name="chevron.left" size={20} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: dmText }]}>Verify Citizenship</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>

          {isLoadingStatus ? (
            <View style={[styles.card, styles.guardCard, { backgroundColor: dmCard, borderColor: dmBorder }]}>
              <ActivityIndicator size="large" color="#0284C7" style={{ marginBottom: 16 }} />
              <Text style={[styles.guardTitle, { color: dmText, fontSize: 17 }]}>Checking Verification Status...</Text>
              <Text style={[styles.guardSubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                Connecting to Caloocan Civil & Barangay Registry database
              </Text>
            </View>
          ) : (appStatus === 'Pending' || appStatus === 'Under_Review') ? (
            /* GUARD: APPLICATION UNDER REVIEW */
            <View style={[styles.card, styles.guardCard, { backgroundColor: dmCard, borderColor: isDarkMode ? '#F59E0B' : '#FDE68A' }]}>
              <View style={[styles.guardIconBox, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' }]}>
                <IconSymbol name="clock.fill" size={32} color="#D97706" />
              </View>
              <Text style={[styles.guardTitle, { color: dmText }]}>Application Under Review</Text>
              <Text style={[styles.guardSubtitle, { color: isDarkMode ? '#CBD5E1' : '#64748B' }]}>
                Your citizen verification application has been submitted and is currently queued for evaluation by the City Civil & Barangay Registry.
              </Text>

              <View style={[styles.guardDetailsBox, { backgroundColor: isDarkMode ? '#152238' : '#F8FAFC', borderColor: dmBorder }]}>
                <View style={[styles.guardRow, { borderBottomColor: dmBorder }]}>
                  <Text style={[styles.guardRowLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Applicant Name</Text>
                  <Text style={[styles.guardRowValue, { color: dmText }]}>{appData?.first_name} {appData?.last_name}</Text>
                </View>
                <View style={[styles.guardRow, { borderBottomColor: dmBorder }]}>
                  <Text style={[styles.guardRowLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Application Status</Text>
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: '#B45309', fontWeight: '800', fontSize: 11 }}>IN REVIEW</Text>
                  </View>
                </View>
                <View style={[styles.guardRow, { borderBottomColor: dmBorder }]}>
                  <Text style={[styles.guardRowLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Document Type</Text>
                  <Text style={[styles.guardRowValue, { color: dmText }]}>{appData?.valid_id_type || 'Government ID'}</Text>
                </View>
                <View style={[styles.guardRow, { borderBottomColor: 'transparent' }]}>
                  <Text style={[styles.guardRowLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Barangay</Text>
                  <Text style={[styles.guardRowValue, { color: dmText }]}>{appData?.barangay || 'Caloocan City'}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                New submissions are locked while your current application is under review. You will receive an update once an administrator verifies your application.
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, { width: '100%', marginBottom: 12 }]}
                onPress={async () => {
                  setIsLoadingStatus(true);
                  const currentUser = AuthService.getCurrentUser();
                  const res = await ProfileService.getVerificationStatus(
                    currentUser.citizen_user_id || undefined,
                    currentUser.email || undefined
                  );
                  if (res?.data) {
                    setAppStatus(res.data.verification_status);
                    setAppData(res.data);
                  }
                  setIsLoadingStatus(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Refresh Application Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { width: '100%' }, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : appStatus === 'Approved' ? (
            /* GUARD: OFFICIAL CITIZEN UNIFIED RESIDENT CARD & CIVIC DIRECTORY */
            <View style={{ width: '100%', gap: 16 }}>
              {/* Header Status Bar */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconSymbol name="checkmark.seal.fill" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: isDarkMode ? '#A7F3D0' : '#065F46' }}>
                    Official Resident ID Issued
                  </Text>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#D1FAE5' : '#047857', marginTop: 1 }}>
                    Certified by City Government of Caloocan
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>VERIFIED</Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: classification.badgeBg,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: classification.accentColor + '35',
                    }}
                  >
                    <Text style={{ color: classification.badgeText, fontSize: 10, fontWeight: '800' }}>
                      {classification.title}
                    </Text>
                  </View>
                </View>
              </View>

              {/* THE OFFICIAL WHITE PVC CITIZEN SMART CARD (CR80 PHYSICAL RATIO) */}
              <View
                style={{
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                  overflow: 'hidden',
                }}
              >
                {/* Municipal Building Watermark Background */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '68%',
                    height: '85%',
                    zIndex: 0,
                  }}
                >
                  <Image
                    source={require('../../assets/images/building-bg.jpg')}
                    style={{
                      width: '100%',
                      height: '100%',
                      opacity: 0.38,
                    }}
                    resizeMode="contain"
                  />
                </View>

                {/* Wavy Header Ribbon Extended All The Way to the Right (100% Full Width Container) */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                >
                  <Svg
                    width="100%"
                    height={80}
                    viewBox="0 0 360 80"
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: 80 }}
                  >
                    <Defs>
                      <SvgGradient id="headerWaveGrad" x1="0" x2="1" y1="0" y2="0">
                        <SvgStop offset="0%" stopColor={classification.stops[0]} />
                        <SvgStop offset="30%" stopColor={classification.stops[1]} />
                        <SvgStop offset="75%" stopColor={classification.stops[2]} />
                        <SvgStop offset="100%" stopColor={classification.stops[3]} />
                      </SvgGradient>
                      <SvgGradient id="goldWaveStripe" x1="0" x2="1" y1="0" y2="0">
                        <SvgStop offset="0%" stopColor="#D97706" />
                        <SvgStop offset="50%" stopColor="#FDE047" />
                        <SvgStop offset="100%" stopColor="#D97706" />
                      </SvgGradient>
                    </Defs>
                    {/* Deep red wave dipping down to 76px on left, 59px on right */}
                    <SvgPath d="M 0,0 L 360,0 L 360,59 Q 266,69 180,63 T 0,76 Z" fill="url(#headerWaveGrad)" />
                    {/* Gold accent wave border directly below */}
                    <SvgPath d="M 0,76 Q 94,63 180,63 T 360,59 L 360,63 Q 266,73 180,67 T 0,80 Z" fill="url(#goldWaveStripe)" />
                  </Svg>
                </View>

                {/* CARD FOREGROUND CONTENT LAYER */}
                <View style={{ padding: 12, position: 'relative', zIndex: 10 }}>

                  {/* TOP HEADER BLOCK */}
                  <View style={{ marginBottom: 6, zIndex: 10, elevation: 5 }}>
                  {/* Top Center Line: REPUBLIC OF THE PHILIPPINES */}
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 7.5,
                      fontWeight: '700',
                      color: '#FEE2E2',
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    REPUBLIC OF THE PHILIPPINES
                  </Text>

                  {/* Brand Row with Logo & Centered Brand Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, paddingRight: 36 }}>
                    {/* Left Emblem Over Dynamic Vector Ribbon with Gold Metallic Ring */}
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#FFFFFF',
                        padding: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                        elevation: 2,
                        borderWidth: 1.5,
                        borderColor: '#F59E0B',
                      }}
                    >
                      <Image
                        source={require('@/assets/images/logo.png')}
                        style={{ width: 28, height: 28 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Centered Brand Title & Tagline */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '900',
                          color: '#FFFFFF',
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          textShadowColor: 'rgba(0,0,0,0.25)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        CIVENTRAL CITIZEN CARD
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          fontWeight: '700',
                          color: '#FDE047',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          marginTop: 1,
                          textAlign: 'center',
                        }}
                      >
                        KASAMA KA SA PAG-UNLAD • CITY OF CALOOCAN
                      </Text>
                    </View>
                  </View>
                </View>

                {/* THREE-COLUMN CARD BODY */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  
                  {/* COLUMN 1: Left - Photo, Signature, Resident Type on clean white base */}
                  <View style={{ width: 78, alignItems: 'center', justifyContent: 'space-between', zIndex: 20, elevation: 10 }}>
                    <View style={{ alignItems: 'center' }}>
                      {/* 1x1 Photo Frame: 76x76, clean 1px neutral slate border, slightly rounded 4px */}
                      <View
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          backgroundColor: '#F8FAFC',
                          overflow: 'hidden',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {appData?.photo_1x1_url && !photoError ? (
                          <Image
                            source={{ uri: resolveCardAssetUrl(appData.photo_1x1_url) || '' }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            onError={() => setPhotoError(true)}
                          />
                        ) : (
                          <IconSymbol name="person.crop.circle.fill" size={44} color="#94A3B8" />
                        )}
                      </View>

                      {/* Signature Box */}
                      <View
                        style={{
                          width: 76,
                          height: 24,
                          borderBottomWidth: 1,
                          borderBottomColor: '#94A3B8',
                          borderStyle: 'dashed',
                          backgroundColor: '#FFFFFF',
                          marginTop: 3,
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {appData?.signature_photo_url && !signatureError ? (
                          <Image
                            source={{ uri: resolveCardAssetUrl(appData.signature_photo_url) || '' }}
                            style={{ width: '92%', height: '88%' }}
                            resizeMode="contain"
                            onError={() => setSignatureError(true)}
                          />
                        ) : (
                          <Text style={{ fontSize: 7.5, color: '#94A3B8', fontStyle: 'italic' }}>Signature</Text>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 6.5,
                          fontWeight: '600',
                          color: '#64748B',
                          marginTop: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Cardholder Signature
                      </Text>

                      {/* Dynamic Resident Status Classification on clean white base */}
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontWeight: '900',
                          color: '#0F172A',
                          marginTop: 2,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          textAlign: 'center',
                        }}
                      >
                        {classification.title}
                      </Text>
                    </View>

                    {/* Timestamp at bottom-left corner */}
                    <Text
                      style={{
                        fontSize: 5.8,
                        color: '#64748B',
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        alignSelf: 'flex-start',
                        marginTop: 4,
                      }}
                    >
                      {formatTimestamp(appData?.reviewed_at || appData?.submitted_at)}
                    </Text>
                  </View>

                  {/* COLUMN 2: Center - Citizen Demographics */}
                  <View style={{ flex: 1, justifyContent: 'space-between', zIndex: 1 }}>
                    <View>
                      {/* Full Name Block */}
                      <Text style={{ fontSize: 6.5, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
                        Last Name, First Name, M.I.
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '900',
                          color: '#0F172A',
                          letterSpacing: 0.2,
                        }}
                        numberOfLines={1}
                      >
                        {formatFullName()}
                      </Text>

                      {/* Demographics Grid (3 Columns x 2 Rows) */}
                      <View style={{ borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 3, marginTop: 3, gap: 2 }}>
                        {/* Row 1 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ flex: 0.8 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Sex</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>
                              {(appData?.sex || 'M').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1.3 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Date of Birth</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>
                              {formatCardDate(appData?.birth_date)}
                            </Text>
                          </View>
                          <View style={{ flex: 1.1 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Civil Status</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>
                              {appData?.civil_status?.toUpperCase() || 'SINGLE'}
                            </Text>
                          </View>
                        </View>

                        {/* Row 2 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ flex: 0.8 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Blood Type</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>N/A</Text>
                          </View>
                          <View style={{ flex: 1.3 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Date Issued</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>
                              {formatCardDate(appData?.reviewed_at || appData?.submitted_at)}
                            </Text>
                          </View>
                          <View style={{ flex: 1.1 }}>
                            <Text style={{ fontSize: 6, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Valid Until</Text>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#0F172A' }}>
                              {formatCardDate(appData?.reviewed_at, 5)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Address Block (2 Lines uppercase) */}
                      <View style={{ borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 3, marginTop: 3 }}>
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '800',
                            color: '#0F172A',
                            textTransform: 'uppercase',
                            lineHeight: 10,
                          }}
                          numberOfLines={1}
                        >
                          {((appData?.street_address ? `${appData.street_address}, ` : '') + (appData?.barangay || 'Barangay 3') + ', District 1').toUpperCase()}
                        </Text>
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '800',
                            color: '#0F172A',
                            textTransform: 'uppercase',
                            lineHeight: 10,
                          }}
                        >
                          CALOOCAN CITY
                        </Text>
                      </View>
                    </View>

                    {/* Emergency Contact at bottom */}
                    <Text style={{ fontSize: 6.5, color: '#334155', marginTop: 3 }}>
                      In case of Emergency, contact: <Text style={{ fontWeight: '700', color: '#0F172A' }}>(02) 8366-3101</Text>
                    </Text>
                  </View>

                  {/* COLUMN 3: Right - QR & Control String */}
                  <View style={{ width: 74, alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 20, elevation: 10 }}>
                    <View style={{ alignItems: 'center', width: '100%' }}>
                      {/* High-density square QR code matrix with zero padding/margins */}
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <QRCode
                          value={`CIVENTRAL:ID:${appData?.citizen_id_number || 'CAL-2026-000004'}|TOKEN:${appData?.qr_code_token || ''}`}
                          size={66}
                          color="#0F172A"
                          backgroundColor="#FFFFFF"
                        />
                      </View>

                      {/* Monospace numeric sequence directly below QR */}
                      <Text
                        style={{
                          fontSize: 7,
                          fontWeight: '700',
                          color: '#334155',
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          marginTop: 2,
                          textAlign: 'center',
                        }}
                      >
                        {'0100' + (String(appData?.citizen_id_number || '000004').replace(/\D/g, '') || '000004').padStart(10, '0')}
                      </Text>
                    </View>

                    {/* Security Micro-Code at bottom-right corner */}
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: '800',
                        color: '#334155',
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        marginTop: 4,
                      }}
                    >
                      00
                    </Text>
                  </View>

                </View>
              </View>
            </View>

            {/* NATIVE PRINT & SAVE PDF ACTIONS */}
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                marginTop: 14,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={handlePrintCard}
                disabled={isPrinting}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0F4C81',
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  shadowColor: '#0F4C81',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  gap: 8,
                }}
              >
                <IconSymbol name="printer.fill" size={17} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                  {isPrinting ? 'Preparing Document...' : 'Print / Save PDF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSharePdf}
                disabled={isPrinting}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#334155' : '#0F4C81',
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  gap: 8,
                }}
              >
                <IconSymbol name="square.and.arrow.up" size={17} color={isDarkMode ? '#38BDF8' : '#0F4C81'} />
                <Text style={{ color: isDarkMode ? '#38BDF8' : '#0F4C81', fontSize: 13, fontWeight: '800' }}>
                  Share PDF
                </Text>
              </TouchableOpacity>
            </View>

              {/* CITY CIVIC SUPPORT DIRECTORY & EMERGENCY HOTLINES */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: dmCard,
                    borderColor: dmBorder,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 16,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="phone.fill" size={18} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: dmText }}>
                      Caloocan Civic & Emergency Directory
                    </Text>
                    <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      24/7 Priority Emergency & Resident Hotlines
                    </Text>
                  </View>
                </View>

                {/* Hotlines Directory List */}
                <View style={{ gap: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                      borderBottomWidth: 1,
                      borderBottomColor: dmBorder,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: dmText }}>CDRRMO Rescue (Disaster)</Text>
                      <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Caloocan Disaster Command</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>(02) 888-ALERTO</Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                      borderBottomWidth: 1,
                      borderBottomColor: dmBorder,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: dmText }}>PNP Police Headquarters</Text>
                      <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Caloocan Police Station</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284C7' }}>(02) 8287-2270</Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                      borderBottomWidth: 1,
                      borderBottomColor: dmBorder,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: dmText }}>BFP Fire Central Station</Text>
                      <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Bureau of Fire Protection</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C' }}>(02) 8361-9878</Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                      borderBottomWidth: 1,
                      borderBottomColor: dmBorder,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: dmText }}>City Civil Registry Office</Text>
                      <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Citizen Verification Division</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>(02) 8366-3101</Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: dmText }}>National Emergency Hotline</Text>
                      <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Direct Nationwide Dispatch</Text>
                    </View>
                    <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>911</Text>
                    </View>
                  </View>
                </View>

                {/* Civic Links & Verification Notice */}
                <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: dmBorder, gap: 4 }}>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                    • Official Portal: <Text style={{ color: '#0284C7', fontWeight: '700' }}>caloocancity.gov.ph</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                    • Civentral Cloud: <Text style={{ color: '#0284C7', fontWeight: '700' }}>civentral.tech</Text>
                  </Text>
                  <Text style={{ fontSize: 9.5, color: isDarkMode ? '#64748B' : '#94A3B8', marginTop: 4, fontStyle: 'italic', lineHeight: 14 }}>
                    Notice: This digital resident card is issued pursuant to City Ordinance No. 0824 as an authentic, scannable proof of residency in the City of Caloocan.
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Refresh & Return */}
              <TouchableOpacity
                style={[styles.primaryButton, { width: '100%' }]}
                onPress={async () => {
                  setIsLoadingStatus(true);
                  const currentUser = AuthService.getCurrentUser();
                  const res = await ProfileService.getVerificationStatus(
                    currentUser.citizen_user_id || undefined,
                    currentUser.email || undefined
                  );
                  if (res?.data) {
                    setAppStatus(res.data.verification_status);
                    setAppData(res.data);
                  }
                  setIsLoadingStatus(false);
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Refresh Card Data</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { width: '100%' }, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {appStatus === 'Returned_For_Correction' && (
                <View style={styles.reworkBanner}>
                  <View style={styles.reworkBannerHeader}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#EA580C" />
                    <Text style={styles.reworkBannerTitle}>Correction Required by Civil Registry</Text>
                  </View>
                  <View style={styles.reworkRemarksBox}>
                    <Text style={styles.reworkRemarksLabel}>Official Reviewer Remarks:</Text>
                    <Text style={styles.reworkRemarksText}>
                      {appData?.admin_action_notes || appData?.rejection_reason || 'Please correct the indicated details or re-upload clearer photos.'}
                    </Text>
                  </View>
                  <Text style={styles.reworkInstructionsText}>
                    Your previously submitted details have been pre-filled. Please make the necessary corrections, upload any required assets, and tap "Resubmit Corrected Application".
                  </Text>
                </View>
              )}

              {appStatus === 'Rejected' && (
                <View style={[styles.reworkBanner, { borderColor: '#DC2626', backgroundColor: '#FEF2F2', marginBottom: 16 }]}>
                  <View style={styles.reworkBannerHeader}>
                    <IconSymbol name="xmark.octagon.fill" size={24} color="#DC2626" />
                    <Text style={[styles.reworkBannerTitle, { color: '#DC2626' }]}>Previous Application Was Rejected</Text>
                  </View>
                  <View style={[styles.reworkRemarksBox, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.reworkRemarksLabel, { color: '#991B1B' }]}>Rejection Reason:</Text>
                    <Text style={[styles.reworkRemarksText, { color: '#7F1D1D' }]}>
                      {appData?.rejection_reason || 'Application did not meet registry verification criteria.'}
                    </Text>
                  </View>
                  <Text style={[styles.reworkInstructionsText, { color: '#991B1B' }]}>
                    You may review your details below, attach the required clear valid identification, and submit a fresh application.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FECACA' }}>
                    <IconSymbol name="phone.fill" size={14} color="#DC2626" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B' }}>
                      Civic Inquiries & Appeals Hotline: (02) 8366-3101 | support@caloocancity.gov.ph
                    </Text>
                  </View>
                </View>
              )}

              {/* Banner */}
              {currentStep < 4 && (
                <View
                  style={[
                    styles.bannerCard,
                    { backgroundColor: isDarkMode ? '#0284C7' : '#176B87' },
                  ]}
                >
                  <View style={styles.bannerIconWrapper}>
                    <IconSymbol name="checkmark.seal.fill" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.bannerTextWrapper}>
                    <Text style={styles.bannerTitle}>Official Citizen Verification</Text>
                    <Text style={styles.bannerSubtitle}>
                      Verify your Caloocan City citizen account to access civic services and clearances.
                    </Text>
                  </View>
                </View>
              )}

          {/* Step Indicators */}
          {currentStep < 4 && (
            <View style={styles.stepIndicatorRow}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 1 && styles.stepCircleActive,
                    currentStep > 1 && styles.stepCircleCompleted,
                  ]}
                >
                  {currentStep > 1 ? (
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === 1 && styles.stepNumberActive]}>
                      1
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                  Personal
                </Text>
              </View>

              <View
                style={[
                  styles.stepConnector,
                  currentStep >= 2 && styles.stepConnectorActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 2 && styles.stepCircleActive,
                    currentStep > 2 && styles.stepCircleCompleted,
                  ]}
                >
                  {currentStep > 2 ? (
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === 2 && styles.stepNumberActive]}>
                      2
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                  Residency
                </Text>
              </View>

              <View
                style={[
                  styles.stepConnector,
                  currentStep >= 3 && styles.stepConnectorActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 3 && styles.stepCircleActive,
                  ]}
                >
                  <Text style={[styles.stepNumber, currentStep === 3 && styles.stepNumberActive]}>
                    3
                  </Text>
                </View>
                <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>
                  Valid ID
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Personal Information</Text>

              {/* Pre-filled Account Info Badge */}
              {isPrefilled && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#152E52' : '#E0F2FE',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#0369A1' : '#BAE6FD',
                  }}
                >
                  <IconSymbol name="checkmark.circle.fill" size={15} color="#0284C7" />
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '600',
                      color: isDarkMode ? '#7DD3FC' : '#0369A1',
                      flex: 1,
                    }}
                  >
                    Details pre-filled from your registered citizen account
                  </Text>
                </View>
              )}

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  First Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Juan"
                  placeholderTextColor="#94A3B8"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              {/* Middle Name & Suffix */}
              <View style={styles.rowInputs}>
                <View style={[styles.rowItem, styles.inputGroup]}>
                  <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                    Middle Name
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                    placeholder="e.g. Santos"
                    placeholderTextColor="#94A3B8"
                    value={middleName}
                    onChangeText={setMiddleName}
                  />
                </View>
                <View style={[styles.rowItem, styles.inputGroup]}>
                  <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                    Suffix
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                    placeholder="Jr., III (opt.)"
                    placeholderTextColor="#94A3B8"
                    value={suffix}
                    onChangeText={setSuffix}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Last Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Dela Cruz"
                  placeholderTextColor="#94A3B8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Sex Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Sex
                </Text>
                <View style={styles.selectionGrid}>
                  {SEX_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chipItem,
                        sex === item && styles.chipItemActive,
                        isDarkMode && { backgroundColor: sex === item ? '#0369A1' : '#152238', borderColor: dmBorder },
                      ]}
                      onPress={() => setSex(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sex === item && styles.chipTextActive,
                          isDarkMode && { color: sex === item ? '#FFFFFF' : '#CBD5E1' },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Place of Birth */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Place of Birth
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Caloocan City / Manila"
                  placeholderTextColor="#94A3B8"
                  value={placeOfBirth}
                  onChangeText={setPlaceOfBirth}
                />
              </View>

              {/* Date of Birth Dropdown Calendar */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Date of Birth
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCalendarOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isCalendarOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => setIsCalendarOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconSymbol
                      name="calendar"
                      size={18}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.dropdownValueText, { color: dmText }]}>
                      {birthDate || 'Select Date of Birth'}
                    </Text>
                  </View>
                  <IconSymbol
                    name={isCalendarOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCalendarOpen && (
                  <View
                    style={[
                      styles.calendarCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {/* Calendar Month & Year Dropdown Selectors */}
                    <View style={styles.calendarSelectorsRow}>
                      {/* Previous Month */}
                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#152238' }]}
                        onPress={handlePrevMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.left" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>

                      {/* Month Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalMonthDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalMonthDropdownOpen ? '#0369A1' : '#152238', borderColor: dmBorder },
                        ]}
                        onPress={() => {
                          setIsCalMonthDropdownOpen((prev) => !prev);
                          setIsCalYearDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, { color: dmText }]}>
                          {MONTH_NAMES[calMonth]}
                        </Text>
                        <IconSymbol
                          name={isCalMonthDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={16}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      {/* Year Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalYearDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalYearDropdownOpen ? '#0369A1' : '#152238', borderColor: dmBorder },
                        ]}
                        onPress={() => {
                          setIsCalYearDropdownOpen((prev) => !prev);
                          setIsCalMonthDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, { color: dmText }]}>
                          {calYear}
                        </Text>
                        <IconSymbol
                          name={isCalYearDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={16}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      {/* Next Month */}
                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#152238' }]}
                        onPress={handleNextMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>
                    </View>

                    {/* Expandable Month Selection Grid */}
                    {isCalMonthDropdownOpen && (
                      <View
                        style={[
                          styles.calendarMonthGrid,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                        ]}
                      >
                        {MONTH_NAMES.map((mName, mIdx) => {
                          const isSelected = calMonth === mIdx;
                          return (
                            <TouchableOpacity
                              key={mName}
                              style={[
                                styles.calendarMonthGridCell,
                                isSelected && styles.calendarMonthGridCellActive,
                                isDarkMode && !isSelected && { backgroundColor: '#1C2541', borderColor: dmBorder },
                              ]}
                              onPress={() => {
                                setCalMonth(mIdx);
                                setIsCalMonthDropdownOpen(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarMonthGridText,
                                  isSelected && styles.calendarMonthGridTextActive,
                                  isDarkMode && !isSelected && { color: '#E2E8F0' },
                                ]}
                              >
                                {mName.slice(0, 3)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Expandable Year Selection Scrollable List */}
                    {isCalYearDropdownOpen && (
                      <ScrollView
                        style={[
                          styles.calendarYearDropdownContainer,
                          isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                        ]}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {YEAR_OPTIONS.map((yr) => {
                          const isSelected = calYear === yr;
                          return (
                            <TouchableOpacity
                              key={yr}
                              style={[
                                styles.calendarYearOption,
                                isSelected && styles.calendarYearOptionActive,
                                isDarkMode && !isSelected && { borderBottomColor: '#1C2541' },
                              ]}
                              onPress={() => {
                                setCalYear(yr);
                                setIsCalYearDropdownOpen(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarYearOptionText,
                                  isSelected && styles.calendarYearOptionTextActive,
                                  isDarkMode && !isSelected && { color: '#E2E8F0' },
                                ]}
                              >
                                {yr}
                              </Text>
                              {isSelected && (
                                <IconSymbol
                                  name="checkmark.circle.fill"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}

                    {/* Weekday Column Headers */}
                    <View style={[styles.calendarWeekRow, isDarkMode && { borderBottomColor: '#152238' }]}>
                      {WEEK_DAYS.map((wd, idx) => (
                        <Text key={idx} style={[styles.calendarWeekLabel, isDarkMode && { color: '#64748B' }]}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.calendarDaysGrid}>
                      {/* Empty padding cells for start of month */}
                      {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.calendarDayCell} />
                      ))}

                      {/* Day Number Cells */}
                      {Array.from({ length: daysInCalMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const mm = String(calMonth + 1).padStart(2, '0');
                        const dd = String(dayNum).padStart(2, '0');
                        const isSelected = birthDate === `${calYear}-${mm}-${dd}`;

                        return (
                          <TouchableOpacity
                            key={`day-${dayNum}`}
                            style={[
                              styles.calendarDayCell,
                              isSelected && styles.calendarDayCellActive,
                            ]}
                            onPress={() => handleSelectDay(dayNum)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isDarkMode && { color: '#F1F5F9' },
                                isSelected && styles.calendarDayTextActive,
                              ]}
                            >
                              {dayNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Civil Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Civil Status
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCivilStatusDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isCivilStatusDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsCivilStatusDropdownOpen((prev) => !prev);
                    setIsCalendarOpen(false);
                    setIsEmploymentDropdownOpen(false);
                    setIsOccupationDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {civilStatus}
                  </Text>
                  <IconSymbol
                    name={isCivilStatusDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCivilStatusDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {CIVIL_STATUS_OPTIONS.map((status) => {
                      const isSelected = civilStatus === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#2B3958' },
                            isDarkMode && isSelected && { backgroundColor: '#152E52' },
                          ]}
                          onPress={() => {
                            setCivilStatus(status);
                            setIsCivilStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#38BDF8' : '#E2E8F0' },
                            ]}
                          >
                            {status}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#38BDF8' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* SECTION HEADER: DEMOGRAPHIC INFORMATION */}
              <View style={{ marginTop: 18, marginBottom: 12, borderTopWidth: 1, borderTopColor: dmBorder, paddingTop: 16 }}>
                <Text style={[styles.cardTitle, { color: dmText, marginBottom: 4 }]}>
                  Demographic Information
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  City census and socioeconomic profile details
                </Text>
              </View>

              {/* 1. Employment Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Employment Status
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isEmploymentDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isEmploymentDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsEmploymentDropdownOpen((prev) => !prev);
                    setIsOccupationDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: employmentStatus ? dmText : '#94A3B8' },
                    ]}
                  >
                    {employmentStatus || 'Select Employment Status'}
                  </Text>
                  <IconSymbol
                    name={isEmploymentDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isEmploymentDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {EMPLOYMENT_STATUS_OPTIONS.map((item) => {
                      const isSelected = employmentStatus === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setEmploymentStatus(item);
                            setIsEmploymentDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 2. Occupation Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Occupation / Field of Work
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isOccupationDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isOccupationDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsOccupationDropdownOpen((prev) => !prev);
                    setIsEmploymentDropdownOpen(false);
                    setIsEducationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: occupation ? dmText : '#94A3B8' },
                    ]}
                  >
                    {occupation || 'Select Occupation / Field of Work'}
                  </Text>
                  <IconSymbol
                    name={isOccupationDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isOccupationDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {OCCUPATION_OPTIONS.map((item) => {
                      const isSelected = occupation === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setOccupation(item);
                            setIsOccupationDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 3. Educational Attainment Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Educational Attainment
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isEducationDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isEducationDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => {
                    setIsEducationDropdownOpen((prev) => !prev);
                    setIsEmploymentDropdownOpen(false);
                    setIsOccupationDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValueText,
                      { color: educationalAttainment ? dmText : '#94A3B8' },
                    ]}
                  >
                    {educationalAttainment || 'Select Educational Attainment'}
                  </Text>
                  <IconSymbol
                    name={isEducationDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isEducationDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {EDUCATIONAL_ATTAINMENT_OPTIONS.map((item) => {
                      const isSelected = educationalAttainment === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setEducationalAttainment(item);
                            setIsEducationDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextStep1}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next: Residency</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: Barangay & Residency */}
          {currentStep === 2 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Caloocan Residency & District</Text>

              {/* Caloocan District Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Select Caloocan Legislative District
                </Text>
                <View style={styles.districtCardGrid}>
                  {CALOOCAN_DISTRICTS.map((district) => {
                    const isSelected = selectedDistrictId === district.id;
                    return (
                      <TouchableOpacity
                        key={district.id}
                        style={[
                          styles.districtCard,
                          isSelected && styles.districtCardActive,
                          isDarkMode && {
                            backgroundColor: isSelected ? '#0369A1' : '#152238',
                            borderColor: isSelected ? '#38BDF8' : dmBorder,
                          },
                        ]}
                        onPress={() => handleSelectDistrict(district)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.districtCardHeader}>
                          <Text
                            style={[
                              styles.districtCardTitle,
                              isSelected && styles.districtCardTitleActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#F1F5F9' },
                            ]}
                          >
                            {district.name}
                          </Text>
                          <View
                            style={[
                              styles.districtBadge,
                              isSelected && styles.districtBadgeActive,
                              isDarkMode && !isSelected && { backgroundColor: '#334155' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.districtBadgeText,
                                isSelected && styles.districtBadgeTextActive,
                                isDarkMode && !isSelected && { color: '#94A3B8' },
                              ]}
                            >
                              {district.barangayCount} Barangays
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.districtCardDesc,
                            isDarkMode && { color: isSelected ? '#E0F2FE' : '#94A3B8' },
                          ]}
                        >
                          {district.areaDescription}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Barangay Dropdown Trigger (Filtered by selected district) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Barangay (in {activeDistrict.shortName})
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: dmInputBg, borderColor: dmBorder },
                  ]}
                  onPress={() => setIsBarangayPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {barangay}
                  </Text>
                  <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
                <Text style={[styles.dropdownHintText, isDarkMode && { color: '#94A3B8' }]}>
                  Tap to search and select from {activeDistrict.barangayCount} barangays in {activeDistrict.shortName}
                </Text>
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Street Address / House No.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. Block 4 Lot 12 Sampaguita St."
                  placeholderTextColor="#94A3B8"
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                />
              </View>

              {/* Years of Residency */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Years of Residency in Caloocan City
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder="e.g. 5"
                  placeholderTextColor="#94A3B8"
                  value={yearsResident}
                  onChangeText={setYearsResident}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextStep2}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next: Valid ID</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Valid ID & Document Verification */}
          {currentStep === 3 && (
            <View
              style={[
                styles.card,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dmText }]}>Government ID Verification</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Select Primary Valid ID
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isIdTypeDropdownOpen && styles.dropdownTriggerActive,
                    { backgroundColor: dmInputBg, borderColor: isIdTypeDropdownOpen ? '#0284C7' : dmBorder },
                  ]}
                  onPress={() => setIsIdTypeDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValueText, { color: dmText }]}>
                    {selectedIdType}
                  </Text>
                  <IconSymbol
                    name={isIdTypeDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isIdTypeDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {VALID_ID_TYPES.map((idType) => {
                      const isSelected = selectedIdType === idType;
                      return (
                        <TouchableOpacity
                          key={idType}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#152238' },
                            isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                          ]}
                          onPress={() => {
                            setSelectedIdType(idType);
                            setIsIdTypeDropdownOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                              isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            {idType}
                          </Text>
                          {isSelected && (
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={18}
                              color={isDarkMode ? '#FFFFFF' : '#0284C7'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  {selectedIdType} Number
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: dmInputBg, color: dmInputText, borderColor: dmBorder }]}
                  placeholder={`Enter ${selectedIdType} number`}
                  placeholderTextColor="#94A3B8"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>

              {/* Valid ID Photo Upload or Camera Capture */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Upload Front of ID Card
                </Text>
                
                {idImageUri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <Image source={{ uri: idImageUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>ID Photo Attached</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('id')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('id')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                    ]}
                    onPress={() => handleOpenPhotoPicker('id')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      name="person.text.rectangle.fill"
                      size={34}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.uploadTitle, { color: dmText }]}>
                      Tap to Upload or Capture ID
                    </Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                      Choose camera photo or upload from photo gallery
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Liveness & Face Verification */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Liveness & Face Verification
                </Text>

                {selfieImageUri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <Image source={{ uri: selfieImageUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>Selfie Verified</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('selfie')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('selfie')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                    ]}
                    onPress={() => handleOpenPhotoPicker('selfie')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      name="sparkles"
                      size={34}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.uploadTitle, { color: dmText }]}>
                      Perform Quick Facial Match
                    </Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                      Take a selfie to match with your government ID
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 1x1 Applicant ID Photo */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  1x1 Applicant Photo (Formal / White Background)
                </Text>

                {photo1x1Uri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <View style={styles.photo1x1Container}>
                      <Image source={{ uri: photo1x1Uri }} style={styles.photo1x1Preview} resizeMode="cover" />
                    </View>
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>1x1 Photo Attached</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('photo1x1')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('photo1x1')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                    ]}
                    onPress={() => handleOpenPhotoPicker('photo1x1')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      name="person.crop.square.fill"
                      size={34}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.uploadTitle, { color: dmText }]}>
                      Upload or Capture 1x1 Photo
                    </Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                      Plain white background, no eyeglasses, formal or collared attire
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Digital Applicant Signature */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  Digital Applicant Signature
                </Text>

                {signatureUri ? (
                  <View style={[styles.photoPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                    <View style={styles.signaturePreviewBox}>
                      <Image source={{ uri: signatureUri }} style={styles.signatureImage} resizeMode="contain" />
                    </View>
                    <View style={[styles.photoPreviewFooter, isDarkMode && { backgroundColor: '#152238', borderTopColor: '#1C2541' }]}>
                      <View style={styles.photoStatusBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                        <Text style={styles.photoStatusText}>Signature Attached</Text>
                      </View>
                      <View style={styles.photoActionsRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                          onPress={() => handleOpenPhotoPicker('signature')}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.photoActionBtnText}>Upload Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, styles.photoRemoveBtn, isDarkMode && { backgroundColor: '#3F1515', borderColor: '#7F1D1D' }]}
                          onPress={() => handleRemovePhoto('signature')}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.photoActionBtnText, styles.photoRemoveBtnText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity
                      style={[
                        styles.uploadBox,
                        isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder },
                      ]}
                      onPress={() => handleOpenPhotoPicker('signature')}
                      activeOpacity={0.8}
                    >
                      <IconSymbol
                        name="signature"
                        size={34}
                        color={isDarkMode ? '#38BDF8' : '#0284C7'}
                      />
                      <Text style={[styles.uploadTitle, { color: dmText }]}>
                        Attach Applicant Signature
                      </Text>
                      <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                        Upload a clear photo of your handwritten signature on clean white paper
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, isDarkMode && { backgroundColor: '#152238', borderColor: dmBorder }]}
                  onPress={() => setCurrentStep(2)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#CBD5E1' }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmitVerification}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {appStatus === 'Returned_For_Correction' ? 'Resubmit Corrected Application' : appStatus === 'Rejected' ? 'Submit New Verification / Appeal' : 'Submit Verification'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Success / Confirmation Screen */}
          {currentStep === 4 && (
            <View
              style={[
                styles.card,
                styles.successContainer,
                { backgroundColor: dmCard, borderColor: dmBorder },
              ]}
            >
              <View style={styles.successIconBadge}>
                <IconSymbol name="checkmark.seal.fill" size={44} color="#10B981" />
              </View>

              <Text style={[styles.successTitle, { color: dmText }]}>
                Verification Submitted!
              </Text>
              <Text style={[styles.successMessage, isDarkMode && { color: '#CBD5E1' }]}>
                Your citizen credentials for <Text style={{ fontWeight: '700' }}>{firstName} {lastName}</Text> have been securely submitted to the Caloocan City Civil & Barangay Registry.
              </Text>

              <View
                style={[
                  styles.infoBox,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#0369A1' },
                ]}
              >
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Sex:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{sex}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Place of Birth:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{placeOfBirth}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Employment:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{employmentStatus}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Occupation:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{occupation}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Education:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{educationalAttainment}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>District:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{activeDistrict.shortName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Barangay:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{barangay}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Document Type:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>{selectedIdType}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode && { color: '#7DD3FC' }]}>Estimated Review:</Text>
                  <Text style={[styles.infoValue, isDarkMode && { color: '#FFFFFF' }]}>15 - 30 minutes</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { width: '100%' }]}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL: Search & Select Barangay from Active District */}
      <Modal
        visible={isBarangayPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBarangayPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && { backgroundColor: '#1C2541' }]}>
            <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#3A506B' }]}>
              <View>
                <Text style={[styles.modalTitle, { color: dmText }]}>
                  Select Barangay
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  {activeDistrict.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsBarangayPickerVisible(false);
                  setBarangaySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="cross.case.fill" size={20} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Search Input in Modal */}
            <View style={[styles.modalSearchBox, isDarkMode && { backgroundColor: '#152238' }]}>
              <IconSymbol name="magnifyingglass" size={18} color="#94A3B8" />
              <TextInput
                style={[styles.modalSearchInput, { color: dmText }]}
                placeholder="Search barangay number..."
                placeholderTextColor="#94A3B8"
                value={barangaySearchQuery}
                onChangeText={setBarangaySearchQuery}
                keyboardType="numeric"
                autoFocus={false}
              />
            </View>

            {/* List of filtered Barangays */}
            <FlatList
              data={filteredBarangays}
              keyExtractor={(item) => item}
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  No barangay found matching "{barangaySearchQuery}" in {activeDistrict.shortName}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = barangay === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalListItem,
                      isSelected && styles.modalListItemActive,
                      isDarkMode && { borderBottomColor: '#152238' },
                      isDarkMode && isSelected && { backgroundColor: '#0369A1' },
                    ]}
                    onPress={() => {
                      setBarangay(item);
                      setIsBarangayPickerVisible(false);
                      setBarangaySearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalListItemText,
                        isSelected && styles.modalListItemTextActive,
                        isDarkMode && { color: isSelected ? '#FFFFFF' : '#E2E8F0' },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <IconSymbol name="checkmark.circle.fill" size={18} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Photo Source Picker Modal (Camera vs Photo Library) */}
      <Modal
        visible={isPhotoPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPhotoPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={[styles.pickerModalContent, isDarkMode && { backgroundColor: '#1C2541' }]}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, isDarkMode && { color: '#FFFFFF' }]}>
                {photoPickerTarget === 'id'
                  ? 'Attach Valid ID Photo'
                  : photoPickerTarget === 'selfie'
                  ? 'Facial Liveness Selfie'
                  : photoPickerTarget === 'photo1x1'
                  ? 'Official 1x1 ID Photo'
                  : 'Digital Applicant Signature'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsPhotoPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.pickerModalSubtitle, isDarkMode && { color: '#94A3B8' }]}>
              {photoPickerTarget === 'id'
                ? 'Select how you want to upload your government-issued ID'
                : photoPickerTarget === 'selfie'
                ? 'Take a clear selfie to match your registered face biometrics'
                : photoPickerTarget === 'photo1x1'
                ? 'Capture or select a 1:1 square photo with plain white background'
                : 'Capture or select a photo of your handwritten signature on clean white paper'}
            </Text>

            <View style={styles.pickerOptionsList}>
              {/* Option 1: Take Photo with Camera */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionBtn,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                ]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, isDarkMode && { backgroundColor: '#0369A1' }]}>
                  <IconSymbol name="camera.fill" size={22} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionLabel, isDarkMode && { color: '#FFFFFF' }]}>
                    Take Photo with Camera
                  </Text>
                  <Text style={[styles.pickerOptionDesc, isDarkMode && { color: '#94A3B8' }]}>
                    Use your device camera to take a new picture
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
              </TouchableOpacity>

              {/* Option 2: Upload from Photo Gallery */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionBtn,
                  isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                ]}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, isDarkMode && { backgroundColor: '#0369A1' }]}>
                  <IconSymbol name="photo.fill" size={22} color={isDarkMode ? '#FFFFFF' : '#0284C7'} />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionLabel, isDarkMode && { color: '#FFFFFF' }]}>
                    Choose from Photo Gallery
                  </Text>
                  <Text style={[styles.pickerOptionDesc, isDarkMode && { color: '#94A3B8' }]}>
                    Select an existing photo from your albums
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.pickerCancelBtn, isDarkMode && { backgroundColor: '#152238' }]}
              onPress={() => setIsPhotoPickerVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.pickerCancelText, isDarkMode && { color: '#CBD5E1' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

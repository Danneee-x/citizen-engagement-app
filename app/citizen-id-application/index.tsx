import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import Svg, { Path } from 'react-native-svg';
import { IconSymbol, IconSymbolName } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService, API_BASE_URL } from '@/src/services/auth-service';
import { ProfileService } from '@/src/services/profile-service';
import { LocalCitizenTable } from '@/src/services/local-citizen-table';
import { IdIssuanceService, IdApplicationRecord, SubmitIdApplicationPayload } from '@/src/services/id-issuance-service';
import { DigitalIdCardModal, DigitalIdCardData } from '@/src/components/DigitalIdCardModal';

export interface IdCategoryOption {
  id: string;
  name: string;
  fullTitle: string;
  badgeLabel: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'neutral' | 'danger';
  icon: IconSymbolName;
  iconBg: string;
  iconColor: string;
  issuingBureau: string;
  description: string;
  keyBenefits: string[];
  primaryDocName: string;
  primaryDocDesc: string;
  supportDocName: string;
  supportDocDesc: string;
  claimOffice: string;
  estimatedTurnaround: string;
  refPrefix: string;
  isArchived?: boolean;
}

export const ID_CATEGORIES: IdCategoryOption[] = [
  {
    id: 'citizen_id',
    name: 'Citizen ID',
    fullTitle: 'Caloocan Citizen Unified ID Card',
    badgeLabel: 'CITY-WIDE RESIDENT',
    badgeVariant: 'info',
    icon: 'creditcard.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    issuingBureau: 'Caloocan Civil Registry & Identity Management Bureau',
    description: 'Official unified resident card providing digital & physical identity across all Caloocan City government offices, public health programs, and welfare portals.',
    keyBenefits: [
      'Universal access to Caloocan City e-services & public health',
      'Priority access to municipal livelihood programs and city fairs',
      'Unified cryptographic QR credential for streamlined City Hall processing',
    ],
    primaryDocName: 'Valid Identification Document',
    primaryDocDesc: 'PhilSys National ID, UMID, Driver License, Passport, or PSA Birth Certificate',
    supportDocName: 'Proof of Caloocan Address',
    supportDocDesc: 'Barangay Certificate of Residency, Utility Bill, or Lease Contract',
    claimOffice: 'Caloocan Main City Hall / Extension - Civil Registry Release Window 6',
    estimatedTurnaround: '3 to 5 Business Days',
    refPrefix: 'CAL-CIT',
  },
  {
    id: 'barangay_id',
    name: 'Barangay ID',
    fullTitle: 'Barangay Resident Identification Card',
    badgeLabel: 'LOCAL BARANGAY',
    badgeVariant: 'neutral',
    icon: 'house.fill',
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    issuingBureau: 'Respective Barangay Executive Office & Secretariat',
    description: 'Community-level official identification proving active residency in your local barangay. Essential for barangay clearances, community dispute filing, and local aid distribution.',
    keyBenefits: [
      'Official proof of residency for transactions within your local barangay',
      'Expedited issuance of Barangay Clearance & Certificate of Indigency',
      'Priority inclusion in local community aid and calamity relief distributions',
    ],
    primaryDocName: 'Proof of Identity / Birth Document',
    primaryDocDesc: 'PSA Birth Certificate or any existing Government/School/Company ID',
    supportDocName: 'Proof of Barangay Residency (Min 6 Months)',
    supportDocDesc: 'Barangay Clearance Stub, Utility Bill under applicant name, or Landlord Certification',
    claimOffice: 'Local Barangay Hall - Administrative Records Desk',
    estimatedTurnaround: '1 to 2 Business Days',
    refPrefix: 'CAL-BRGY',
  },
  {
    id: 'solo_parent_id',
    name: 'Solo Parent ID',
    fullTitle: 'Solo Parent Welfare Identification Card (RA 11861)',
    isArchived: true, // Archived per panelist review preference; preserved for reactivation
    badgeLabel: 'WELFARE & SUBSIDY',
    badgeVariant: 'warning',
    icon: 'person.2.fill',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    issuingBureau: 'City Social Welfare & Development Office (CSWDO) - Solo Parent Welfare Desk',
    description: 'Special welfare card granted under the Expanded Solo Parents Welfare Act (RA 11861), providing comprehensive social assistance, financial subsidies, leave benefits, and discounts.',
    keyBenefits: [
      'Monthly cash subsidy (Php 1,000 for minimum-wage & low-income solo parents)',
      '10% discount and VAT exemption on baby milk, food, diapers & prescribed medicines',
      '7 days paid parental leave from work & prioritization in educational scholarships',
    ],
    primaryDocName: "Dependent Child's PSA Birth Certificate(s)",
    primaryDocDesc: 'PSA Birth Certificate of child/children below 22 years old under your sole parental care',
    supportDocName: 'Barangay Solo Parent Certificate & Affidavit',
    supportDocDesc: 'Barangay Solo Parent Certification and Affidavit of Solo Parenthood / Custody',
    claimOffice: 'Caloocan CSWDO Office - Solo Parent Welfare Section (City Hall Complex)',
    estimatedTurnaround: '5 to 7 Business Days',
    refPrefix: 'CAL-SP',
  },
  {
    id: 'pwd_id',
    name: 'PWD ID',
    fullTitle: 'Persons with Disability Card (Republic Act 10754)',
    badgeLabel: 'DISABILITY PRIVILEGE',
    badgeVariant: 'info',
    icon: 'figure.roll',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    issuingBureau: 'Persons with Disability Affairs Office (PDAO)',
    description: 'Official PWD Identification Card issued pursuant to RA 10754 and RA 7277, granting essential discounts, healthcare privileges, and tax exemptions for persons with disabilities.',
    keyBenefits: [
      '20% discount & VAT exemption on medicines, hospitalization & doctor consultations',
      '20% discount on land/air/sea transport, food dining, groceries, and hotel lodging',
      'Dedicated express lanes in all government agencies and private commercial counters',
    ],
    primaryDocName: 'Clinical Medical Certificate / Disability Assessment',
    primaryDocDesc: 'Official medical certificate or clinical assessment form signed by a licensed physician with license number',
    supportDocName: 'Proof of Caloocan Residency & Identity',
    supportDocDesc: 'Barangay Residency Certificate & Valid ID / PSA Birth Certificate',
    claimOffice: 'Persons with Disability Affairs Office (PDAO) Counter - City Hall Ground Floor',
    estimatedTurnaround: '3 to 5 Business Days',
    refPrefix: 'CAL-PWD',
  },
  {
    id: 'senior_citizen_id',
    name: 'Senior Citizen ID',
    fullTitle: 'OSCA Senior Citizen Card (Republic Act 9994)',
    badgeLabel: 'AGE 60+ BENEFIT',
    badgeVariant: 'success',
    icon: 'star.fill',
    iconBg: '#FCE7F3',
    iconColor: '#BE185D',
    issuingBureau: 'Office of Senior Citizens Affairs (OSCA)',
    description: 'Official OSCA identification card for Caloocan residents aged 60 years and above, entitling seniors to statutory discounts, medical care, free cinema passes, and social pensions.',
    keyBenefits: [
      '20% discount & VAT exemption on medicines, basic groceries, transport & dining',
      'Free admission to all movie cinemas within Caloocan City on designated weekdays',
      'Automatic PhilHealth coverage, free vaccines & annual social pension programs',
    ],
    primaryDocName: 'Proof of Age 60+ (Birth Certificate or Valid ID)',
    primaryDocDesc: 'PSA Birth Certificate, Valid Philippine Passport, or Voter Certification confirming age 60 or above',
    supportDocName: 'Barangay Certificate of Residency',
    supportDocDesc: 'Barangay Certificate certifying at least 6 months continuous residence in Caloocan',
    claimOffice: 'Office of Senior Citizens Affairs (OSCA) Main Building - Caloocan City Complex',
    estimatedTurnaround: '2 to 4 Business Days',
    refPrefix: 'CAL-SR',
  },
];

// Active visible categories presented to citizens in UI: Citizen ID, Barangay ID, PWD ID, Senior Citizen ID.
// Note: Solo Parent ID is archived/hidden per panelist review preference; preserved for future reactivation.
export const VISIBLE_ID_CATEGORIES: IdCategoryOption[] = ID_CATEGORIES.filter((c) => !c.isArchived);

export const APPLICATION_TYPES = [
  { id: 'New Application', label: 'New Application', desc: 'First time applicant for this identification card' },
  { id: 'Renewal', label: 'Renewal', desc: 'Renew an expiring or expired identification card' },
  { id: 'Replacement', label: 'Replacement', desc: 'Replace lost, damaged, stolen, or updated ID card' },
] as const;

export const REPLACEMENT_REASONS = [
  { id: 'Lost', label: 'Lost', desc: 'Affidavit of Loss required upon claiming' },
  { id: 'Damaged', label: 'Damaged', desc: 'Surrender damaged ID upon release' },
  { id: 'Stolen', label: 'Stolen', desc: 'Police blotter or incident report required' },
  { id: 'Personal information correction', label: 'Personal information correction', desc: 'Supporting civil registry document required' },
] as const;

export const PWD_DISABILITY_TYPES = [
  'Orthopedic / Mobility Disability',
  'Visual / Low Vision',
  'Hearing / Speech Impairment',
  'Psychosocial / Mental Health Condition',
  'Intellectual / Learning Disability',
  'Chronic Illness / Cancer / Rare Disease',
] as const;

export const SOLO_PARENT_CATEGORIES = [
  'Unmarried Mother / Father with Custody',
  'Widow / Widower',
  'Abandoned by Spouse (>6 Months)',
  'Spouse Incarcerated / Sentenced',
  'Legal Separation / Nullity of Marriage',
  'Guardian / Relative Caring for Abandoned Child',
] as const;

export const RESIDENCY_YEARS = [
  'Less than 1 year',
  '1 - 2 years',
  '3 - 5 years',
  '6 - 10 years',
  '10+ years',
  'Since Birth',
] as const;

export const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Divorced',
] as const;

export const MONTH_NAMES = [
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

export const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const mName = MONTH_NAMES[m - 1] || '';
  return `${mName} ${d}, ${y}`;
};

export const MONTHS_LIST = [
  { value: '01', label: 'January', short: 'Jan' },
  { value: '02', label: 'February', short: 'Feb' },
  { value: '03', label: 'March', short: 'Mar' },
  { value: '04', label: 'April', short: 'Apr' },
  { value: '05', label: 'May', short: 'May' },
  { value: '06', label: 'June', short: 'Jun' },
  { value: '07', label: 'July', short: 'Jul' },
  { value: '08', label: 'August', short: 'Aug' },
  { value: '09', label: 'September', short: 'Sep' },
  { value: '10', label: 'October', short: 'Oct' },
  { value: '11', label: 'November', short: 'Nov' },
  { value: '12', label: 'December', short: 'Dec' },
] as const;

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export const calculateAgeFromDate = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

export const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-', 'Unknown'] as const;

export const EMERGENCY_RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Relative',
  'Guardian',
  'Next of Kin',
] as const;

export const CITIZEN_ID_STAGES = [
  { id: 'submitted', label: 'Submitted', desc: 'Application filed online' },
  { id: 'under_review', label: 'Document Review', desc: 'Issuing bureau evaluating documents' },
  { id: 'processing', label: 'Processing & Verification', desc: 'Registry clearance & credential coding' },
  { id: 'ready_release', label: 'Ready for Release', desc: 'Available at designated release desk' },
  { id: 'completed', label: 'Completed', desc: 'ID Card claimed & activated' },
] as const;

export const detectDistrictFromBarangay = (bgy: string): string => {
  if (!bgy) return 'District 1';
  const match = bgy.match(/(?:Barangay|Brgy\.?)\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 131) return 'District 2';
    if (num >= 132 && num <= 177) return 'District 1';
    if (num >= 178) return 'District 3';
  }
  return 'District 1';
};

export const getCategoryForApp = (catId: string): IdCategoryOption => {
  return ID_CATEGORIES.find((c) => c.id === catId) || ID_CATEGORIES[0];
};

export const getIdStageIndex = (status: string): number => {
  const s = (status || '').toLowerCase();
  if (s.includes('rejected')) return -1;
  if (s.includes('claim')) return 4;
  if (s.includes('ready') || s.includes('print')) return 3;
  if (s.includes('approv') || s.includes('process')) return 2;
  if (s.includes('under review') || s.includes('evaluat')) return 1;
  return 0;
};

export const getStatusBadgeInfo = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('reject')) {
    return { label: 'REJECTED', variant: 'danger' as const, color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' };
  }
  if (s.includes('claim')) {
    return { label: 'CLAIMED', variant: 'neutral' as const, color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' };
  }
  if (s.includes('print')) {
    return { label: 'READY TO PRINT', variant: 'info' as const, color: '#0284C7', bg: '#E0F2FE', border: '#7DD3FC' };
  }
  if (s.includes('ready')) {
    return { label: 'READY FOR RELEASE', variant: 'info' as const, color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' };
  }
  if (s.includes('approv')) {
    return { label: 'APPROVED', variant: 'success' as const, color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' };
  }
  if (s.includes('under review')) {
    return { label: 'UNDER REVIEW', variant: 'info' as const, color: '#0284C7', bg: '#E0F2FE', border: '#7DD3FC' };
  }
  return { label: 'PENDING REVIEW', variant: 'warning' as const, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
};

export default function IdIssuanceApplicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; tab?: string }>();
  const { isDarkMode } = useTheme();

  // Tab Navigation: 'apply' (Apply for ID) or 'status' (My Applications & Status)
  const [activeTab, setActiveTab] = useState<'apply' | 'status'>((params.tab as any) === 'status' ? 'status' : 'apply');

  // Selected ID Category State (null = show Selection list; string = open that ID application form)
  const [selectedId, setSelectedId] = useState<string | null>(params.id || null);

  // Live Applications tracking state
  const [applications, setApplications] = useState<IdApplicationRecord[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  // Digital ID Card Modal State
  const [selectedDigitalIdData, setSelectedDigitalIdData] = useState<DigitalIdCardData | null>(null);
  const [isDigitalIdModalVisible, setIsDigitalIdModalVisible] = useState(false);

  const handleShowDigitalId = (app: IdApplicationRecord) => {
    setSelectedDigitalIdData({
      reference_no: app.reference_no,
      citizen_id_number: app.reference_no,
      first_name: app.first_name,
      middle_name: app.middle_name,
      last_name: app.last_name,
      suffix: app.suffix,
      gender: app.gender,
      birthdate: app.birthdate,
      civil_status: app.civil_status,
      blood_type: 'N/A',
      street_address: app.street_address,
      barangay: app.barangay,
      district: app.district,
      emergency_contact: app.emergency_contact_name,
      emergency_contact_phone: app.emergency_contact_phone,
      photo_url: app.photo_2x2_url || app.primary_doc_url,
      photo_2x2_url: app.photo_2x2_url,
      signature_url: app.signature_url,
      e_signature_name: app.e_signature_name,
      id_category: app.id_category,
      id_title: app.id_title,
      status: app.status,
      created_at: app.created_at,
      reviewed_at: app.reviewed_at,
    });
    setIsDigitalIdModalVisible(true);
  };

  // Application Type State
  const [appType, setAppType] = useState<string>(APPLICATION_TYPES[0].id);
  const [replacementReason, setReplacementReason] = useState<string>(REPLACEMENT_REASONS[0].id);
  const [replacementDetails, setReplacementDetails] = useState('');
  const [oldIdNumber, setOldIdNumber] = useState('');

  // Citizen Information State
  /**
   * Sanitizes personal names and text fields (first, middle, last name, suffix, civil status, etc.)
   * Strictly blocks all numbers (0-9) and special characters (!@#$%^&* etc.).
   * Allows only alphabetic letters (including Filipino / Spanish characters like ñ, Ñ),
   * spaces, and standard name punctuation (period, hyphen, apostrophe).
   */
  const sanitizePersonalName = (val: string): string => {
    return val.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s\.\-']/g, '');
  };

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [activeDobPicker, setActiveDobPicker] = useState<'month' | 'day' | 'year' | null>(null);
  const [yearDecadeFilter, setYearDecadeFilter] = useState<string>('All');

  // Single Dropdown Birthdate Calendar & Civil Status Dropdown States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState<number>(1995);
  const [calMonth, setCalMonth] = useState<number>(4); // May (0-indexed)
  const [isCalMonthDropdownOpen, setIsCalMonthDropdownOpen] = useState(false);
  const [isCalYearDropdownOpen, setIsCalYearDropdownOpen] = useState(false);
  const [isCivilStatusDropdownOpen, setIsCivilStatusDropdownOpen] = useState(false);

  useEffect(() => {
    if (birthDate) {
      const parts = birthDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y)) setCalYear(y);
        if (!isNaN(m) && m >= 0 && m < 12) setCalMonth(m);
        setBirthYear(String(y));
        setBirthMonth(String(m + 1).padStart(2, '0'));
        setBirthDay(String(d).padStart(2, '0'));
      }
    }
  }, [birthDate]);

  const YEAR_OPTIONS = React.useMemo(() => {
    const years: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let yr = currentYear; yr >= 1920; yr--) {
      years.push(yr);
    }
    return years;
  }, []);

  const daysInCalMonth = React.useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const firstDayOfWeek = React.useMemo(() => {
    return new Date(calYear, calMonth, 1).getDay();
  }, [calYear, calMonth]);

  const handleSelectDay = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const fullDate = `${calYear}-${mm}-${dd}`;
    setBirthDate(fullDate);
    setBirthYear(String(calYear));
    setBirthMonth(mm);
    setBirthDay(dd);
    setIsCalendarOpen(false);
    setIsCalMonthDropdownOpen(false);
    setIsCalYearDropdownOpen(false);
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

  // Interactive In-App Signature Drawing Pad State
  const [isSigModalVisible, setIsSigModalVisible] = useState(false);
  const canvasRef = React.useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawnSignatureUri, setDrawnSignatureUri] = useState<string | null>(null);
  const [nativeStrokes, setNativeStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentNativeStroke, setCurrentNativeStroke] = useState<{ x: number; y: number }[]>([]);

  const generateSvgDataUrl = (strokes: { x: number; y: number }[][]): string => {
    let pathD = '';
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      pathD += `M ${stroke[0].x} ${stroke[0].y} `;
      for (let i = 1; i < stroke.length; i++) {
        pathD += `L ${stroke[i].x} ${stroke[i].y} `;
      }
    }
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180"><rect width="100%" height="100%" fill="#ffffff"/><path d="${pathD}" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
  };

  const getCanvasCoords = (e: any, canvas: any) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setDrawnSignatureUri(dataUrl);
      } catch (err) {
        console.warn('Canvas export error:', err);
      }
    }
  };

  const handleTouchStart = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const handleTouchMove = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    setDrawnSignatureUri(null);
    setNativeStrokes([]);
    setCurrentNativeStroke([]);
  };

  const handleOpenSigModal = () => {
    setIsSigModalVisible(true);
  };

  const handleCloseSigModal = () => {
    setIsSigModalVisible(false);
  };

  const handleSaveSignatureAndClose = () => {
    if (Platform.OS === 'web') {
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setDrawnSignatureUri(dataUrl);
          setHasDrawn(true);
        } catch (err) {
          console.warn('Canvas export error:', err);
        }
      }
    } else {
      if (nativeStrokes.length > 0 || currentNativeStroke.length > 0) {
        const updated = currentNativeStroke.length > 0 ? [...nativeStrokes, currentNativeStroke] : nativeStrokes;
        const svgUri = generateSvgDataUrl(updated);
        setDrawnSignatureUri(svgUri);
        setHasDrawn(true);
      }
    }
    setIsSigModalVisible(false);
  };

  const syncBirthDateParts = (dateStr: string) => {
    if (!dateStr) return;
    const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      setBirthYear(y);
      setBirthMonth(m);
      setBirthDay(d);
      setBirthDate(`${y}-${m}-${d}`);
    } else {
      setBirthDate(dateStr);
    }
  };

  const updateBirthDate = (y: string, m: string, d: string) => {
    setBirthYear(y);
    setBirthMonth(m);
    setBirthDay(d);
    if (y && m && d) {
      setBirthDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    } else {
      setBirthDate('');
    }
  };

  const currentDaysInMonth = React.useMemo(() => {
    const y = parseInt(birthYear, 10) || 2026;
    const m = parseInt(birthMonth, 10) || 1;
    return getDaysInMonth(y, m);
  }, [birthYear, birthMonth]);

  const birthYearsList = React.useMemo(() => {
    const list: string[] = [];
    for (let yr = 2026; yr >= 1920; yr--) {
      list.push(String(yr));
    }
    return list;
  }, []);
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Single');

  // ID-Specific Custom Fields State
  // PWD specific
  const [disabilityType, setDisabilityType] = useState<string>(PWD_DISABILITY_TYPES[0]);
  const [physicianName, setPhysicianName] = useState('');
  const [physicianLicense, setPhysicianLicense] = useState('');
  // Solo Parent specific
  const [soloParentCategory, setSoloParentCategory] = useState<string>(SOLO_PARENT_CATEGORIES[0]);
  const [dependentCount, setDependentCount] = useState('1');
  const [childrenDetails, setChildrenDetails] = useState('');
  // Senior Citizen specific
  const [bloodType, setBloodType] = useState<string>('O+');
  const [isPensioner, setIsPensioner] = useState('Yes (SSS / GSIS)');
  // Barangay ID specific
  const [residencyLength, setResidencyLength] = useState<string>(RESIDENCY_YEARS[2]);
  const [purokZone, setPurokZone] = useState('');
  const [housingStatus, setHousingStatus] = useState('Homeowner');
  // Citizen ID specific
  const [occupation, setOccupation] = useState('');
  const [philsysNumber, setPhilsysNumber] = useState('');

  // Address & Barangay State
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [district, setDistrict] = useState<string>('District 1');

  // Contact Information State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Universal Emergency Contact State
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState<string>('Next of Kin');

  // Universal Applicant Signature or E-Signature State
  const [signatureMode, setSignatureMode] = useState<'upload' | 'esignature'>('esignature');
  const [signatureFile, setSignatureFile] = useState<{ name: string; size: string; uri?: string } | null>(null);
  const [eSignatureName, setESignatureName] = useState('');
  const [eSignatureAgreed, setESignatureAgreed] = useState(true);

  // Requirements Upload State
  const [idDocFile, setIdDocFile] = useState<{ name: string; size: string; uri?: string } | null>(null);
  const [supportDocFile, setSupportDocFile] = useState<{ name: string; size: string; uri?: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<{ name: string; size: string; uri?: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Post Submission State
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    idCategory: IdCategoryOption;
    applicationStatus: string;
    submissionDate: string;
    applicationType: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
    signatureMode?: 'upload' | 'esignature';
    signatureSigner?: string;
    signaturePreview?: string | null;
    processingUpdates: string;
    releaseClaimInfo: {
      claimCenter: string;
      estimatedDays: string;
      claimRequirements: string;
    };
  } | null>(null);

  const activeCategory = ID_CATEGORIES.find((c) => c.id === selectedId) || null;

  // Fetch applications for status tracking
  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const session = AuthService.getCurrentUser();
      const list = await IdIssuanceService.getMyApplications(
        session?.citizen_user_id || session?.user?.citizen_user_id,
        session?.email || session?.user?.email
      );
      setApplications(list);
    } catch (err) {
      console.warn('Failed to fetch ID applications:', err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchApplications();
  }, []);

  // Sync route query parameters
  useEffect(() => {
    if (params.tab === 'status') {
      setActiveTab('status');
    } else if (params.id) {
      setActiveTab('apply');
    }
  }, [params.tab, params.id]);

  // Auto-select if passed in query param
  useEffect(() => {
    if (params.id && ID_CATEGORIES.some((c) => c.id === params.id)) {
      setSelectedId(params.id);
    }
  }, [params.id]);

  // Pre-load Citizen details from Citizen Registry & active session
  useEffect(() => {
    async function loadCitizen() {
      try {
        const session = AuthService.getCurrentUser();
        let userId = session?.citizen_user_id || session?.user?.citizen_user_id || ((params as any).citizenUserId ? Number((params as any).citizenUserId) : undefined);
        let userEmail = session?.email || session?.user?.email || (typeof (params as any).email === 'string' ? (params as any).email : undefined);
        let userPhone = session?.phone || session?.user?.mobile_number;

        // Rehydrate from web localStorage if session has not yet loaded
        if (!userEmail && typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = window.localStorage.getItem('civentral_citizen_session');
            if (raw) {
              const p = JSON.parse(raw);
              if (p.email || p.currentUserEmail) userEmail = p.email || p.currentUserEmail;
              if (p.citizen_user_id || p.currentUserId) userId = p.citizen_user_id || p.currentUserId;
            }
            if (!userEmail) {
              const lastEmail = window.localStorage.getItem('civentral_last_registered_email');
              if (lastEmail) userEmail = lastEmail;
            }
          } catch (e) {}
        }

        // If session was not found, check local table for recent citizen registration
        if (!userEmail && !userId) {
          const allLocal = LocalCitizenTable.getAll();
          if (allLocal.length > 0) {
            const last = allLocal[allLocal.length - 1];
            userId = last.citizen_user_id;
            userEmail = last.email;
            userPhone = last.mobile_number;
          }
        }

        // Step 1: Initial populate from active session / local user record
        const localUser = userEmail 
          ? LocalCitizenTable.findByEmail(userEmail)
          : (userId ? LocalCitizenTable.findById(Number(userId)) : null);
        const u = session?.user || localUser;

        if (u) {
          if (u.first_name) setFirstName(sanitizePersonalName(u.first_name));
          if (u.middle_name) setMiddleName(sanitizePersonalName(u.middle_name));
          if (u.last_name) setLastName(sanitizePersonalName(u.last_name));
          if (u.suffix) setSuffix(sanitizePersonalName(u.suffix));
          if (u.email) setEmail(u.email);
          if (u.mobile_number || (u as any).phone) setPhone(u.mobile_number || (u as any).phone);
          if ((u as any).birth_date) syncBirthDateParts((u as any).birth_date);
          if ((u as any).sex) setGender((u as any).sex.toLowerCase() === 'female' ? 'Female' : 'Male');
          if ((u as any).civil_status) setCivilStatus(sanitizePersonalName((u as any).civil_status));
          if ((u as any).street_address) setStreetAddress((u as any).street_address);
          if ((u as any).barangay) {
            setBarangay((u as any).barangay);
            setDistrict((u as any).district || detectDistrictFromBarangay((u as any).barangay));
          }
          if ((u as any).district) setDistrict((u as any).district);
          if ((u as any).occupation) setOccupation((u as any).occupation);
          if (u.first_name || u.last_name) {
            const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            if (full) setESignatureName((prev) => prev || sanitizePersonalName(full));
          }
          if ((u as any).emergency_contact_name) setEmergencyContactName(sanitizePersonalName((u as any).emergency_contact_name));
          if ((u as any).emergency_contact_phone) setEmergencyContactPhone((u as any).emergency_contact_phone);
          if ((u as any).emergency_contact_relation) setEmergencyContactRelation((u as any).emergency_contact_relation);
        }

        // Step 2: Fetch official registered demographic data from Citizen Registry (citizen_verifications)
        const verifRes = await ProfileService.getVerificationStatus(
          userId ? Number(userId) : undefined,
          userEmail || undefined
        );

        if (verifRes && verifRes.status === 'success' && verifRes.data) {
          const vd = verifRes.data;
          if (vd.first_name) setFirstName(sanitizePersonalName(vd.first_name));
          if (vd.middle_name) setMiddleName(sanitizePersonalName(vd.middle_name));
          if (vd.last_name) setLastName(sanitizePersonalName(vd.last_name));
          if (vd.suffix) setSuffix(sanitizePersonalName(vd.suffix));
          if (vd.birth_date) syncBirthDateParts(vd.birth_date);
          if (vd.sex) setGender(vd.sex.toLowerCase() === 'female' ? 'Female' : 'Male');
          if (vd.civil_status) setCivilStatus(sanitizePersonalName(vd.civil_status));
          if (vd.street_address) setStreetAddress(vd.street_address);
          if (vd.barangay) {
            setBarangay(vd.barangay);
            setDistrict(vd.district || detectDistrictFromBarangay(vd.barangay));
          }
          if (vd.district) setDistrict(vd.district);
          if (vd.occupation) setOccupation(vd.occupation);
          if (vd.valid_id_number) setPhilsysNumber(vd.valid_id_number);
          if (vd.first_name || vd.last_name) {
            const full = `${vd.first_name || ''} ${vd.last_name || ''}`.trim();
            if (full) setESignatureName(sanitizePersonalName(full));
          }
          if ((vd as any).emergency_contact_name) setEmergencyContactName(sanitizePersonalName((vd as any).emergency_contact_name));
          if ((vd as any).emergency_contact_phone) setEmergencyContactPhone((vd as any).emergency_contact_phone);
          if ((vd as any).emergency_contact_relation) setEmergencyContactRelation((vd as any).emergency_contact_relation);
          if (vd.years_resident) {
            const yrNum = parseInt(String(vd.years_resident), 10);
            if (!isNaN(yrNum)) {
              if (yrNum < 1) setResidencyLength(RESIDENCY_YEARS[0]);
              else if (yrNum <= 2) setResidencyLength(RESIDENCY_YEARS[1]);
              else if (yrNum <= 5) setResidencyLength(RESIDENCY_YEARS[2]);
              else if (yrNum <= 10) setResidencyLength(RESIDENCY_YEARS[3]);
              else setResidencyLength(RESIDENCY_YEARS[4]);
            }
          }

          // Sync to client-side local table for offline persistence
          if (userId) {
            LocalCitizenTable.update(Number(userId), {
              first_name: vd.first_name,
              middle_name: vd.middle_name,
              last_name: vd.last_name,
              suffix: vd.suffix,
              birth_date: vd.birth_date,
              civil_status: vd.civil_status,
              street_address: vd.street_address,
              barangay: vd.barangay,
              district: vd.district,
              occupation: vd.occupation,
              years_resident: String(vd.years_resident || ''),
            });
          }
        }

        // Step 3: Fetch supplementary profile details if any fields remain unpopulated
        const res = await ProfileService.getProfile(userEmail || undefined, userId ? Number(userId) : undefined);
        if (res && res.status === 'success' && res.data) {
          const d = res.data;
          if (d.email) setEmail((prev) => prev || d.email || '');
          if (d.phone) setPhone((prev) => prev || d.phone || '');
          if (d.birthDate) syncBirthDateParts(d.birthDate);
          if (d.civilStatus) setCivilStatus((prev) => prev || sanitizePersonalName(d.civilStatus || 'Single'));
          if (d.barangay) {
            setBarangay((prev) => prev || d.barangay || '');
            setDistrict((prev) => prev || (d as any).district || detectDistrictFromBarangay(d.barangay || ''));
          }
          if (d.address) setStreetAddress((prev) => prev || d.address || '');
        }
      } catch (err) {
        console.warn('Citizen Registry data fetch error:', err);
      }
    }
    loadCitizen();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchApplications().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const handlePickDocument = async (type: 'id' | 'support' | 'photo' | 'signature') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow file access to attach documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        const doc = {
          name: asset.fileName || `${type}_document_${Date.now()}.jpg`,
          size: `${Math.round((asset.fileSize || 1024 * 500) / 1024)} KB`,
          uri: dataUri,
        };

        if (type === 'id') setIdDocFile(doc);
        if (type === 'support') setSupportDocFile(doc);
        if (type === 'photo') setPhotoFile(doc);
        if (type === 'signature') setSignatureFile(doc);
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  const handleSubmitApplication = async () => {
    if (!activeCategory) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your complete legal name.');
      return;
    }
    const invalidPattern = /[0-9!@#$%^&*()_+=\[\]{};:"\\|<>/?`~]/;
    if (invalidPattern.test(firstName) || invalidPattern.test(lastName) || invalidPattern.test(middleName) || invalidPattern.test(suffix)) {
      Alert.alert('Invalid Name', 'Personal information (names) cannot contain numbers or special characters.');
      return;
    }
    if (!streetAddress.trim() || !barangay.trim()) {
      Alert.alert('Required Field', 'Please provide your current Caloocan street address and barangay.');
      return;
    }
    if (!birthDate.trim()) {
      Alert.alert('Required Field', 'Please select your Date of Birth.');
      return;
    }
    if (activeCategory.id === 'senior_citizen_id') {
      const calculatedAge = calculateAgeFromDate(birthDate);
      if (calculatedAge !== null && calculatedAge < 60) {
        Alert.alert('Age Requirement', `Senior Citizen ID applicants must be at least 60 years of age. Current age is ${calculatedAge}.`);
        return;
      }
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please provide a valid mobile contact number.');
      return;
    }
    if (!emergencyContactName.trim()) {
      Alert.alert('Required Field', 'Please provide an Emergency Contact Person full name.');
      return;
    }
    if (!emergencyContactPhone.trim()) {
      Alert.alert('Required Field', 'Please provide an Emergency Contact mobile phone number.');
      return;
    }
    if (signatureMode === 'upload' && !signatureFile) {
      Alert.alert('Missing Signature', 'Please upload a photo or scan of your handwritten signature.');
      return;
    }
    if (signatureMode === 'esignature') {
      if (!hasDrawn && !drawnSignatureUri) {
        Alert.alert('Signature Required', 'Please draw your signature on the white signature pad before submitting.');
        return;
      }
      const activeSigner = (eSignatureName.trim() || `${firstName} ${lastName}`.trim());
      if (!activeSigner) {
        Alert.alert('Missing Name', 'Please verify your printed legal name for your signature.');
        return;
      }
      if (!eSignatureAgreed) {
        Alert.alert('Certification Required', 'Please confirm the electronic signature declaration to proceed.');
        return;
      }
    }
    if (!idDocFile) {
      Alert.alert('Missing Requirement', `Please upload your ${activeCategory.primaryDocName}.`);
      return;
    }
    if (!photoFile) {
      Alert.alert('Missing Requirement', 'Please upload your 2x2 ID photo with a white background.');
      return;
    }

    setIsSubmitting(true);

    const ref = `${activeCategory.refPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr =
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let dynamicClaimReqs = '';
    if (appType === 'Replacement') {
      dynamicClaimReqs = 'Present 1 valid government ID, notarized Affidavit of Loss / damaged ID card surrender stub, and this digital QR voucher.';
    } else if (activeCategory.id === 'pwd_id') {
      dynamicClaimReqs = 'Bring 1 valid government ID, original signed Clinical Medical Certificate, and this digital claim voucher.';
    } else if (activeCategory.id === 'solo_parent_id') {
      dynamicClaimReqs = "Bring original/PSA copies of your dependent child's birth certificate, Barangay Solo Parent certification, and this voucher.";
    } else if (activeCategory.id === 'senior_citizen_id') {
      dynamicClaimReqs = 'Bring original PSA Birth Certificate or valid passport proving age 60+, Barangay Residency Certificate, and this voucher.';
    } else if (activeCategory.id === 'barangay_id') {
      dynamicClaimReqs = 'Present proof of barangay residency (lease/utility bill), any valid ID, and claim voucher at your Barangay Hall.';
    } else {
      dynamicClaimReqs = 'Present 1 original valid primary ID document and this digital claim voucher barcode upon claiming.';
    }

    // Live backend transmission to citizen-backend
    const candidateEndpoints = [
      'http://localhost/citizen-backend/api/citizen/submit-id-application.php',
      'http://localhost/citizen-information-and-engagement-final-try/api/citizen/submit-id-application.php',
      `${API_BASE_URL}/submit-id-application.php`,
    ];

    const session = AuthService.getCurrentUser();
    const currentUserId = session.citizen_user_id || session.user?.citizen_user_id || null;

    const effectiveSigner = signatureMode === 'esignature'
      ? (eSignatureName.trim() || `${firstName} ${lastName}`.trim())
      : null;

    const payload: SubmitIdApplicationPayload = {
      reference_no: ref,
      id_category: activeCategory.id,
      id_title: activeCategory.fullTitle,
      application_type: appType,
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      suffix: suffix.trim(),
      gender,
      birthdate: birthDate,
      civil_status: civilStatus,
      contact_number: phone.trim(),
      email: email.trim(),
      street_address: streetAddress.trim(),
      barangay: barangay.trim(),
      district: district || detectDistrictFromBarangay(barangay),
      resident_since: residencyLength || '2015',
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_phone: emergencyContactPhone.trim(),
      emergency_contact_relation: emergencyContactRelation.trim() || 'Next of Kin',
      signature_mode: signatureMode,
      signature_url: signatureMode === 'esignature' ? drawnSignatureUri : (signatureFile?.uri || signatureFile?.name || null),
      e_signature_name: effectiveSigner,
      issuing_bureau: activeCategory.issuingBureau,
      primary_doc_name: idDocFile?.name || activeCategory.primaryDocName,
      primary_doc_url: idDocFile?.uri || null,
      photo_2x2_url: photoFile?.uri || null,
      claim_office: activeCategory.claimOffice,
      estimated_turnaround: activeCategory.estimatedTurnaround,
      citizen_user_id: currentUserId,
    };

    try {
      const submitRes = await IdIssuanceService.submitApplication(payload);
      if (!submitRes.success) {
        setIsSubmitting(false);
        Alert.alert('Submission Error', submitRes.message || 'Could not submit ID application. Please check your connection and try again.');
        return;
      }
    } catch (err: any) {
      console.warn('ID Application live submission error:', err);
      setIsSubmitting(false);
      Alert.alert('Submission Error', err?.message || 'Failed to submit ID application. Please try again.');
      return;
    }

    setIsSubmitting(false);

    // Refresh application status list
    fetchApplications();

    setSubmittedData({
      referenceNumber: ref,
      idCategory: activeCategory,
      applicationStatus: 'Submitted (Pending Document Review)',
      submissionDate: dateStr,
      applicationType: appType,
      emergencyContact: {
        name: emergencyContactName.trim(),
        phone: emergencyContactPhone.trim(),
        relation: emergencyContactRelation.trim() || 'Next of Kin',
      },
      signatureMode,
      signatureSigner: signatureMode === 'esignature' ? effectiveSigner! : (signatureFile?.name || 'Attached Signature File'),
      signaturePreview: signatureMode === 'esignature' ? drawnSignatureUri : (signatureFile?.uri || null),
      processingUpdates: `Your ${activeCategory.name} application has been successfully transmitted to the ${activeCategory.issuingBureau}. Verification officers will evaluate submitted credentials prior to physical/digital card production.`,
      releaseClaimInfo: {
        claimCenter: activeCategory.claimOffice,
        estimatedDays: activeCategory.estimatedTurnaround,
        claimRequirements: dynamicClaimReqs,
      },
    });
  };

  const handleReset = () => {
    setSubmittedData(null);
    setSelectedId(null);
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
        {/* POST-SUBMISSION RESULTS VIEW */}
        {submittedData ? (
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              {submittedData.idCategory.name} Application Filed
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Your {submittedData.idCategory.fullTitle} application has been received and logged for official evaluation.
            </Text>

            {/* Reference & Application Meta Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.refTopRow}>
                <Text style={styles.refCardLabel}>Official Application Reference</Text>
                <Badge label="IN REVIEW" variant="warning" />
              </View>
              <Text style={[styles.refCardNumber, isDarkMode && { color: '#38BDF8' }]}>
                {submittedData.referenceNumber}
              </Text>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ID Applied For:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.idCategory.fullTitle}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Issuing Bureau:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.idCategory.issuingBureau}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Application Type:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.applicationType}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submission Date:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                  {submittedData.submissionDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Application Status:</Text>
                <Text style={[styles.metaVal, { color: '#D97706', fontWeight: '800' }]}>
                  {submittedData.applicationStatus}
                </Text>
              </View>
            </View>

            {/* Emergency Contact & Signature Confirmation */}
            {submittedData.emergencyContact && (
              <View
                style={[
                  styles.refCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                ]}
              >
                <View style={styles.refTopRow}>
                  <Text style={styles.refCardLabel}>Emergency Contact & Signature Verification</Text>
                  <Badge label="AUTHENTICATED" variant="success" />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Emergency Contact:</Text>
                  <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.emergencyContact.name} ({submittedData.emergencyContact.relation})
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Emergency Mobile:</Text>
                  <Text style={[styles.metaVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.emergencyContact.phone}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Signature Method:</Text>
                  <Text style={[styles.metaVal, { color: '#10B981', fontWeight: '700' }]}>
                    {submittedData.signatureMode === 'esignature' ? 'Drawn E-Signature (R.A. 8792)' : 'Physical Signature File'}
                  </Text>
                </View>

                {submittedData.signaturePreview && (
                  <View style={styles.postSubmitSigPreviewBox}>
                    <Text style={styles.postSubmitSigLabel}>Captured ID Signature:</Text>
                    <View style={styles.postSubmitSigImgContainer}>
                      <Image
                        source={{ uri: submittedData.signaturePreview }}
                        style={styles.postSubmitSigImg}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Signer Legal Name:</Text>
                  <Text style={[styles.metaVal, isDarkMode && { color: '#38BDF8' }]}>
                    {submittedData.signatureSigner}
                  </Text>
                </View>
              </View>
            )}

            {/* Processing Updates Card */}
            <View
              style={[
                styles.updateCard,
                isDarkMode && { backgroundColor: '#152238', borderColor: '#0284C7' },
              ]}
            >
              <View style={styles.updateHeaderRow}>
                <IconSymbol name="bell.fill" size={16} color="#0284C7" />
                <Text style={[styles.updateHeading, isDarkMode && { color: '#38BDF8' }]}>
                  Processing Instructions & Next Steps
                </Text>
              </View>
              <Text style={[styles.updateText, isDarkMode && { color: '#CBD5E1' }]}>
                {submittedData.processingUpdates}
              </Text>
            </View>

            {/* Release & Claim Information Card */}
            <View
              style={[
                styles.claimCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.updateHeaderRow}>
                <IconSymbol name="building.2.fill" size={16} color="#10B981" />
                <Text style={[styles.updateHeading, { color: '#10B981' }]}>
                  Designated Release Counter & Pick-up
                </Text>
              </View>

              <View style={styles.claimGrid}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Designated Claim Center:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#F8FAFC' }]}>
                    {submittedData.releaseClaimInfo.claimCenter}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Estimated Turnaround:</Text>
                  <Text style={[styles.claimVal, { color: '#0284C7', fontWeight: '800' }, isDarkMode && { color: '#38BDF8' }]}>
                    {submittedData.releaseClaimInfo.estimatedDays}
                  </Text>
                </View>

                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Claim Requirements:</Text>
                  <Text style={[styles.claimVal, isDarkMode && { color: '#CBD5E1' }]}>
                    {submittedData.releaseClaimInfo.claimRequirements}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Progression Timeline */}
            <View
              style={[
                styles.timelineCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Text style={[styles.timelineHeading, isDarkMode && { color: '#F8FAFC' }]}>
                Application Lifecycle Tracking
              </Text>
              <Text style={[styles.timelineSubheading, isDarkMode && { color: '#94A3B8' }]}>
                Submitted → Document Review → Verification → Ready for Release → Completed
              </Text>

              <View style={styles.timelineList}>
                {CITIZEN_ID_STAGES.map((stage, idx) => {
                  const isDone = idx === 0;
                  const isCurrent = idx === 1;
                  return (
                    <View key={stage.id} style={styles.timelineRow}>
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
                        {idx < CITIZEN_ID_STAGES.length - 1 && (
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
                          {stage.label}
                          {isDone && ' ✓'}
                          {isCurrent && ' (In Progress)'}
                        </Text>
                        <Text style={[styles.stageDesc, isDarkMode && { color: '#94A3B8' }]}>
                          {stage.desc}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.viewStatusBtn}
                onPress={() => {
                  setSubmittedData(null);
                  setSelectedId(null);
                  setActiveTab('status');
                }}
                activeOpacity={0.88}
              >
                <IconSymbol name="list.bullet.rectangle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.viewStatusBtnText}>View in Application Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.anotherBtnText}>Apply for Another ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.back()}
                activeOpacity={0.88}
              >
                <Text style={styles.doneBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Top Back Navigation */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (selectedId) {
                  setSelectedId(null);
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="chevron.left"
                size={16}
                color={isDarkMode ? '#38BDF8' : '#2563EB'}
              />
              <Text
                style={[
                  styles.backText,
                  isDarkMode && { color: '#38BDF8' },
                ]}
              >
                {selectedId ? 'Back to ID Options' : 'Back'}
              </Text>
            </TouchableOpacity>

            {/* Segmented Toggle Switch: Apply for ID | Application Status */}
            <View
              style={[
                styles.tabSegmentContainer,
                isDarkMode && styles.tabSegmentContainerDark,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabSegmentButton,
                  activeTab === 'apply' && styles.tabSegmentButtonActive,
                ]}
                onPress={() => setActiveTab('apply')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="plus.circle.fill"
                  size={15}
                  color={activeTab === 'apply' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    activeTab === 'apply' && styles.tabSegmentTextActive,
                    isDarkMode && activeTab !== 'apply' && { color: '#94A3B8' },
                  ]}
                >
                  Apply for ID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSegmentButton,
                  activeTab === 'status' && styles.tabSegmentButtonActive,
                ]}
                onPress={() => setActiveTab('status')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="list.bullet.rectangle.fill"
                  size={15}
                  color={activeTab === 'status' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    activeTab === 'status' && styles.tabSegmentTextActive,
                    isDarkMode && activeTab !== 'status' && { color: '#94A3B8' },
                  ]}
                >
                  Application Status {applications.length > 0 ? `(${applications.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: APPLY FOR ID */}
            {activeTab === 'apply' && (
              <>
                {!activeCategory ? (
                  <>
                    {/* Header Banner */}
                    <View
                      style={[
                        styles.headerBannerCard,
                        isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                      ]}
                    >
                      <View style={styles.bannerTopRow}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                          <IconSymbol name="creditcard.fill" size={24} color="#4338CA" />
                        </View>
                        <Badge label="OFFICIAL ID ISSUANCE" variant="info" />
                      </View>
                      <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                        ID Issuance Services
                      </Text>
                      <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                        Choose the official government identification card you wish to apply for. Click any card below to open the dedicated application form and submit your credentials.
                      </Text>
                    </View>

{/* List of Active ID Cards to Choose from (Solo Parent ID archived) */}
            <View style={styles.selectionCardsContainer}>
              {VISIBLE_ID_CATEGORIES.map((item) => {
                const approvedApp = applications.find(
                  (a) =>
                    (a.id_category === item.id ||
                      (item.id === 'citizen_id' && (a.id_category === 'citizen_id' || a.id_title?.toLowerCase().includes('citizen')))) &&
                    (a.status?.toLowerCase().includes('approv') ||
                      a.status?.toLowerCase().includes('print') ||
                      a.status?.toLowerCase().includes('ready'))
                );

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.idSelectionCard,
                      approvedApp && { borderColor: '#10B981', borderWidth: 1.5 },
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: approvedApp ? '#10B981' : '#3A506B' },
                    ]}
                    onPress={() => {
                      if (approvedApp) {
                        handleShowDigitalId(approvedApp);
                      } else {
                        setSelectedId(item.id);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.idIconBoxLarge, { backgroundColor: item.iconBg }]}>
                        <IconSymbol name={item.icon} size={24} color={item.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleWithBadgeRow}>
                          <Text style={[styles.cardIdTitle, isDarkMode && { color: '#F8FAFC' }]}>
                            {item.name}
                          </Text>
                          {approvedApp ? (
                            <Badge label={(approvedApp.status || '').toLowerCase().includes('print') ? 'READY TO PRINT' : 'ID APPROVED'} variant="success" />
                          ) : (
                            <Badge label={item.badgeLabel} variant={item.badgeVariant} />
                          )}
                        </View>
                        <Text style={[styles.cardIdSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                          {item.fullTitle}
                        </Text>
                      </View>
                    </View>

                    {/* Card Description */}
                    <Text style={[styles.cardIdDescription, isDarkMode && { color: '#CBD5E1' }]}>
                      {item.description}
                    </Text>

                    {/* Bureau & Turnaround Pills */}
                    <View style={styles.pillsRow}>
                      <View
                        style={[
                          styles.infoPill,
                          isDarkMode && { backgroundColor: '#152238' },
                        ]}
                      >
                        <IconSymbol name="building.2.fill" size={13} color="#64748B" />
                        <Text
                          style={[styles.infoPillText, isDarkMode && { color: '#94A3B8' }]}
                          numberOfLines={1}
                        >
                          {item.issuingBureau}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.infoPill,
                          isDarkMode && { backgroundColor: '#152238' },
                        ]}
                      >
                        <IconSymbol name="clock.fill" size={13} color="#0284C7" />
                        <Text
                          style={[styles.infoPillText, { color: '#0284C7', fontWeight: '700' }, isDarkMode && { color: '#38BDF8' }]}
                        >
                          {item.estimatedTurnaround}
                        </Text>
                      </View>
                    </View>

                    {/* Key Benefits Preview */}
                    <View
                      style={[
                        styles.cardBenefitsBox,
                        isDarkMode && { backgroundColor: '#152238' },
                      ]}
                    >
                      <Text style={[styles.cardBenefitsTitle, isDarkMode && { color: '#93C5FD' }]}>
                        Key Benefits & Entitlements:
                      </Text>
                      {item.keyBenefits.slice(0, 2).map((benefit, bIdx) => (
                        <View key={bIdx} style={styles.miniBenefitRow}>
                          <IconSymbol name="checkmark" size={11} color="#10B981" />
                          <Text style={[styles.miniBenefitText, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={1}>
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Apply or View ID Action Button */}
                    {approvedApp ? (
                      <View style={[styles.cardActionFooter, { backgroundColor: '#ECFDF5' }]}>
                        <IconSymbol name="creditcard.fill" size={15} color="#059669" />
                        <Text style={[styles.applyButtonText, { color: '#059669', fontWeight: '800' }]}>
                          View Digital ID Copy
                        </Text>
                        <IconSymbol
                          name="chevron.right"
                          size={15}
                          color="#059669"
                        />
                      </View>
                    ) : (
                      <View style={styles.cardActionFooter}>
                        <Text style={[styles.applyButtonText, isDarkMode && { color: '#38BDF8' }]}>
                          Apply for {item.name}
                        </Text>
                        <IconSymbol
                          name="chevron.right"
                          size={15}
                          color={isDarkMode ? '#38BDF8' : '#2563EB'}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED APPLICATION FORM FOR THE CHOSEN ID                      */
          /* ========================================================================= */
          <>


            {/* Hero Banner for the Chosen ID */}
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: activeCategory.iconBg }]}>
                  <IconSymbol name={activeCategory.icon} size={24} color={activeCategory.iconColor} />
                </View>
                <Badge label={activeCategory.badgeLabel} variant={activeCategory.badgeVariant} />
              </View>

              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {activeCategory.name} Application
              </Text>

              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                {activeCategory.fullTitle} • {activeCategory.issuingBureau}
              </Text>

              {/* Statutory Benefits Highlights */}
              <View
                style={[
                  styles.activeIdHighlightBox,
                  { marginTop: 14, marginBottom: 0 },
                  isDarkMode && { backgroundColor: '#152542', borderColor: '#2563EB' },
                ]}
              >
                <View style={styles.highlightHeaderRow}>
                  <IconSymbol name="checkmark.seal.fill" size={17} color="#2563EB" />
                  <Text style={[styles.highlightHeading, isDarkMode && { color: '#60A5FA' }]}>
                    Legal Benefits & Entitlements
                  </Text>
                </View>
                <View style={styles.benefitsList}>
                  {activeCategory.keyBenefits.map((benefit, bIdx) => (
                    <View key={bIdx} style={styles.benefitBulletRow}>
                      <IconSymbol name="checkmark" size={12} color="#10B981" />
                      <Text style={[styles.benefitBulletText, isDarkMode && { color: '#E2E8F0' }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Approved Digital ID Copy Banner if Application is Approved / Ready to Print */}
            {(() => {
              const approvedApp = applications.find(
                (a) =>
                  (a.id_category === activeCategory.id ||
                    (activeCategory.id === 'citizen_id' && (a.id_category === 'citizen_id' || a.id_title?.toLowerCase().includes('citizen')))) &&
                  (a.status?.toLowerCase().includes('approv') ||
                    a.status?.toLowerCase().includes('print') ||
                    a.status?.toLowerCase().includes('ready'))
              );
              if (!approvedApp) return null;
              return (
                <View
                  style={[
                    styles.approvedIdCopyCard,
                    isDarkMode && { backgroundColor: '#064E3B', borderColor: '#059669' },
                  ]}
                >
                  <View style={styles.approvedIdCopyHeader}>
                    <View style={styles.approvedIdIconCircle}>
                      <IconSymbol name="creditcard.fill" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.approvedIdCopyTitle}>
                        Official Digital ID Issued & Active
                      </Text>
                      <Text style={styles.approvedIdCopySubtitle}>
                        Status: {(approvedApp.status || '').toLowerCase().includes('print') ? 'Ready to Print' : approvedApp.status} • Ref: {approvedApp.reference_no}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.approvedIdCopyDesc}>
                    Your official {activeCategory.name} copy has been evaluated, approved, and generated by the Civil Registry. Tap below to view your official digital card copy with security QR code.
                  </Text>
                  <TouchableOpacity
                    style={styles.approvedIdCopyBtn}
                    onPress={() => handleShowDigitalId(approvedApp)}
                    activeOpacity={0.85}
                  >
                    <IconSymbol name="eye.fill" size={17} color="#065F46" />
                    <Text style={styles.approvedIdCopyBtnText}>Open Digital ID Copy</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Application Form Card */}
            <View
              style={[
                styles.formCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              {/* SECTION 1: APPLICATION TYPE */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Application Type *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Indicate if this is your first application, renewal, or replacement
                  </Text>
                </View>
              </View>

              <View style={styles.appTypeGrid}>
                {APPLICATION_TYPES.map((t) => {
                  const isSelected = appType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.appTypeCard,
                        isSelected && styles.appTypeCardSelected,
                        isDarkMode && {
                          backgroundColor: '#152238',
                          borderColor: isSelected ? '#0284C7' : '#3A506B',
                        },
                      ]}
                      onPress={() => setAppType(t.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text
                          style={[
                            styles.appTypeLabel,
                            isSelected && styles.appTypeLabelSelected,
                            isDarkMode && { color: isSelected ? '#38BDF8' : '#F8FAFC' },
                          ]}
                        >
                          {t.label}
                        </Text>
                      </View>
                      <Text style={[styles.appTypeDesc, isDarkMode && { color: '#94A3B8' }]}>
                        {t.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* REPLACEMENT SPECIFIC SECTION */}
              {appType === 'Replacement' && (
                <View
                  style={[
                    styles.replacementBox,
                    isDarkMode && { backgroundColor: '#1E293B', borderColor: '#F59E0B' },
                  ]}
                >
                  <View style={styles.replacementHeader}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#D97706" />
                    <Text style={styles.replacementHeading}>Reason for Replacement *</Text>
                  </View>

                  <View style={styles.reasonsList}>
                    {REPLACEMENT_REASONS.map((r) => {
                      const isChosen = replacementReason === r.id;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={[
                            styles.reasonOption,
                            isChosen && styles.reasonOptionChosen,
                            isDarkMode && { backgroundColor: isChosen ? '#2A3B5C' : '#152238', borderColor: '#3A506B' },
                          ]}
                          onPress={() => setReplacementReason(r.id)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.radioCircleSmall,
                              isChosen && styles.radioCircleSelected,
                            ]}
                          >
                            {isChosen && <View style={styles.radioInnerSmall} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.reasonLabel,
                                isChosen && { color: '#0284C7', fontWeight: '800' },
                                isDarkMode && { color: isChosen ? '#38BDF8' : '#F8FAFC' },
                              ]}
                            >
                              {r.label}
                            </Text>
                            <Text style={[styles.reasonSub, isDarkMode && { color: '#94A3B8' }]}>
                              {r.desc}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Previous {activeCategory.name} Number (If Known)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder={`e.g. ${activeCategory.refPrefix}-2023-4512`}
                      placeholderTextColor="#94A3B8"
                      value={oldIdNumber}
                      onChangeText={setOldIdNumber}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Details / Circumstance of Replacement (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder="e.g. Lost wallet during commute / card damaged"
                      placeholderTextColor="#94A3B8"
                      value={replacementDetails}
                      onChangeText={setReplacementDetails}
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION 2: CITIZEN PERSONAL INFORMATION */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Applicant Personal Information *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Legal identity as registered in Civil Registry / Philippine Statistics Authority
                  </Text>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    First Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={firstName}
                    onChangeText={(val) => setFirstName(sanitizePersonalName(val))}
                    placeholder="First Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Middle Name
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={middleName}
                    onChangeText={(val) => setMiddleName(sanitizePersonalName(val))}
                    placeholder="Middle Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Last Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={lastName}
                    onChangeText={(val) => setLastName(sanitizePersonalName(val))}
                    placeholder="Last Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { width: 85 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Suffix
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={suffix}
                    onChangeText={(val) => setSuffix(sanitizePersonalName(val))}
                    placeholder="Jr/III"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Universal Date of Birth (Single Dropdown Trigger + Interactive Calendar Drawer) */}
              <View style={styles.inputGroup}>
                <View style={styles.dobLabelRow}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Date of Birth *
                  </Text>
                  {birthDate ? (
                    <View
                      style={[
                        styles.ageBadge,
                        activeCategory.id === 'senior_citizen_id' && (calculateAgeFromDate(birthDate) ?? 0) < 60
                          ? styles.ageBadgeWarning
                          : styles.ageBadgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ageBadgeText,
                          activeCategory.id === 'senior_citizen_id' && (calculateAgeFromDate(birthDate) ?? 0) < 60
                            ? styles.ageBadgeTextWarning
                            : styles.ageBadgeTextNormal,
                        ]}
                      >
                        {calculateAgeFromDate(birthDate) !== null
                          ? `Age: ${calculateAgeFromDate(birthDate)} yrs${(calculateAgeFromDate(birthDate) ?? 0) >= 60 ? ' • Senior' : ''}`
                          : birthDate}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dobPlaceholderHint, isDarkMode && { color: '#64748B' }]}>
                      Select Birthdate
                    </Text>
                  )}
                </View>

                {/* Single Dropdown Trigger */}
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCalendarOpen && styles.dropdownTriggerActive,
                    isDarkMode && { backgroundColor: '#152238', borderColor: isCalendarOpen ? '#0284C7' : '#3A506B' },
                  ]}
                  onPress={() => {
                    setIsCalendarOpen((prev) => !prev);
                    setIsCivilStatusDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <IconSymbol
                      name="calendar"
                      size={18}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        !birthDate && styles.dobDropdownValuePlaceholder,
                        isDarkMode && { color: birthDate ? '#F8FAFC' : '#64748B' },
                      ]}
                      numberOfLines={1}
                    >
                      {birthDate ? formatDisplayDate(birthDate) : 'Select Date of Birth'}
                    </Text>
                  </View>
                  <IconSymbol
                    name={isCalendarOpen ? 'chevron.up' : 'chevron.down'}
                    size={18}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {/* Dropdown Calendar Drawer */}
                {isCalendarOpen && (
                  <View
                    style={[
                      styles.calendarCard,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                  >
                    {/* Calendar Header with Nav & Selectors */}
                    <View style={styles.calendarSelectorsRow}>
                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#1C2541' }]}
                        onPress={handlePrevMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.left" size={16} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>

                      {/* Month Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalMonthDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalMonthDropdownOpen ? '#0369A1' : '#1C2541', borderColor: '#3A506B' },
                        ]}
                        onPress={() => {
                          setIsCalMonthDropdownOpen((prev) => !prev);
                          setIsCalYearDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, isDarkMode && { color: '#F8FAFC' }]}>
                          {MONTH_NAMES[calMonth]}
                        </Text>
                        <IconSymbol
                          name={isCalMonthDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={14}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      {/* Year Dropdown Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDropdownBtn,
                          isCalYearDropdownOpen && styles.calendarDropdownBtnActive,
                          isDarkMode && { backgroundColor: isCalYearDropdownOpen ? '#0369A1' : '#1C2541', borderColor: '#3A506B' },
                        ]}
                        onPress={() => {
                          setIsCalYearDropdownOpen((prev) => !prev);
                          setIsCalMonthDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.calendarDropdownBtnText, isDarkMode && { color: '#F8FAFC' }]}>
                          {calYear}
                        </Text>
                        <IconSymbol
                          name={isCalYearDropdownOpen ? 'chevron.up' : 'chevron.down'}
                          size={14}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.calendarNavBtn, isDarkMode && { backgroundColor: '#1C2541' }]}
                        onPress={handleNextMonth}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="chevron.right" size={16} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                      </TouchableOpacity>
                    </View>

                    {/* Month Selection Grid */}
                    {isCalMonthDropdownOpen && (
                      <View style={[styles.calendarMonthGrid, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
                        {MONTH_NAMES.map((mName, mIdx) => {
                          const isSelected = calMonth === mIdx;
                          return (
                            <TouchableOpacity
                              key={mName}
                              style={[
                                styles.calendarMonthGridCell,
                                isSelected && styles.calendarMonthGridCellActive,
                                isDarkMode && !isSelected && { backgroundColor: '#152238', borderColor: '#2B3958' },
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

                    {/* Year Selection List */}
                    {isCalYearDropdownOpen && (
                      <ScrollView
                        style={[styles.calendarYearDropdownContainer, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}
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
                                isDarkMode && !isSelected && { borderBottomColor: '#152238' },
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
                                <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}

                    {/* Weekday Labels */}
                    <View style={[styles.calendarWeekRow, isDarkMode && { borderBottomColor: '#2B3958' }]}>
                      {WEEK_DAYS.map((wd, idx) => (
                        <Text key={idx} style={[styles.calendarWeekLabel, isDarkMode && { color: '#64748B' }]}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.calendarDaysGrid}>
                      {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.calendarDayCell} />
                      ))}

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

                {activeCategory.id === 'senior_citizen_id' &&
                  birthDate &&
                  (calculateAgeFromDate(birthDate) ?? 0) < 60 && (
                    <View style={styles.seniorAlertBox}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={15} color="#D97706" />
                      <Text style={styles.seniorAlertText}>
                        Senior Citizen ID notice: Applicant age is {calculateAgeFromDate(birthDate)} years old. OSCA accreditation requires applicants to be at least 60 years of age upon filing.
                      </Text>
                    </View>
                  )}
              </View>

              {/* Civil Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Civil Status *
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    isCivilStatusDropdownOpen && styles.dropdownTriggerActive,
                    isDarkMode && { backgroundColor: '#152238', borderColor: isCivilStatusDropdownOpen ? '#0284C7' : '#3A506B' },
                  ]}
                  onPress={() => {
                    setIsCivilStatusDropdownOpen((prev) => !prev);
                    setIsCalendarOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <IconSymbol
                      name="person.2.fill"
                      size={17}
                      color={isDarkMode ? '#38BDF8' : '#0284C7'}
                    />
                    <Text style={[styles.dropdownValueText, isDarkMode && { color: '#F8FAFC' }]}>
                      {civilStatus || 'Select Civil Status'}
                    </Text>
                  </View>
                  <IconSymbol
                    name={isCivilStatusDropdownOpen ? 'chevron.up' : 'chevron.down'}
                    size={18}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>

                {isCivilStatusDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                  >
                    {CIVIL_STATUS_OPTIONS.map((cs) => {
                      const isSelected = civilStatus === cs;
                      return (
                        <TouchableOpacity
                          key={cs}
                          style={[
                            styles.dropdownOptionItem,
                            isSelected && styles.dropdownOptionItemActive,
                            isDarkMode && { borderBottomColor: '#2B3958' },
                            isDarkMode && isSelected && { backgroundColor: '#1E293B' },
                          ]}
                          onPress={() => {
                            setCivilStatus(cs);
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
                            {cs}
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

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Sex / Gender *
                </Text>
                <View style={styles.chipsContainer}>
                  {['Male', 'Female'].map((g) => {
                    const isSel = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.chipItem,
                          isSel && styles.chipItemSelected,
                          isDarkMode && {
                            backgroundColor: isSel ? '#2563EB' : '#152238',
                            borderColor: isSel ? '#60A5FA' : '#3A506B',
                          },
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSel && styles.chipTextSelected,
                            isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 3: SPECIFIC INFO FOR THIS CHOSEN ID */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Specific {activeCategory.name} Details *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Required qualifications and records for {activeCategory.issuingBureau}
                  </Text>
                </View>
              </View>

              {/* PWD ID Specific Fields */}
              {activeCategory.id === 'pwd_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Type of Disability / Impairment *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {PWD_DISABILITY_TYPES.map((type) => {
                      const isSel = disabilityType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#2563EB' : '#152238',
                              borderColor: isSel ? '#60A5FA' : '#3A506B',
                            },
                          ]}
                          onPress={() => setDisabilityType(type)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Attending Licensed Physician or Hospital/Clinic Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={physicianName}
                      onChangeText={(val) => setPhysicianName(sanitizePersonalName(val))}
                      placeholder="e.g. Dr. Maria Santos, MD (Caloocan City Medical Center)"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Physician PRC License Number (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={physicianLicense}
                      onChangeText={setPhysicianLicense}
                      placeholder="e.g. PRC Lic. No. 0123456"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              {/* Solo Parent ID Specific Fields */}
              {activeCategory.id === 'solo_parent_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Solo Parent Eligibility Category *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {SOLO_PARENT_CATEGORIES.map((cat) => {
                      const isSel = soloParentCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#D97706' : '#152238',
                              borderColor: isSel ? '#FBBF24' : '#3A506B',
                            },
                          ]}
                          onPress={() => setSoloParentCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Number of Dependent Children under 22 Years Old *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={dependentCount}
                      onChangeText={setDependentCount}
                      keyboardType="numeric"
                      placeholder="e.g. 1"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Names & Ages of Children (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={childrenDetails}
                      onChangeText={setChildrenDetails}
                      placeholder="e.g. Marco Espelita (Age 6), Bea Espelita (Age 3)"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              {/* Senior Citizen ID Specific Fields */}
              {activeCategory.id === 'senior_citizen_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Blood Type (Printed on OSCA Emergency Medical Record)
                  </Text>
                  <View style={styles.chipsContainer}>
                    {BLOOD_TYPES.map((bt) => {
                      const isSel = bloodType === bt;
                      return (
                        <TouchableOpacity
                          key={bt}
                          style={[
                            styles.chipItemSmall,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#BE185D' : '#152238',
                              borderColor: isSel ? '#F472B6' : '#3A506B',
                            },
                          ]}
                          onPress={() => setBloodType(bt)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {bt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Pension Status
                  </Text>
                  <View style={styles.chipsContainer}>
                    {['Yes (SSS / GSIS)', 'Indigent / Social Pensioner', 'Non-Pensioner'].map((ps) => {
                      const isSel = isPensioner === ps;
                      return (
                        <TouchableOpacity
                          key={ps}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#BE185D' : '#152238',
                              borderColor: isSel ? '#F472B6' : '#3A506B',
                            },
                          ]}
                          onPress={() => setIsPensioner(ps)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {ps}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Barangay ID Specific Fields */}
              {activeCategory.id === 'barangay_id' && (
                <View style={styles.dynamicBox}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Length of Continuous Residency in this Barangay *
                  </Text>
                  <View style={styles.chipsContainer}>
                    {RESIDENCY_YEARS.map((ry) => {
                      const isSel = residencyLength === ry;
                      return (
                        <TouchableOpacity
                          key={ry}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#15803D' : '#152238',
                              borderColor: isSel ? '#4ADE80' : '#3A506B',
                            },
                          ]}
                          onPress={() => setResidencyLength(ry)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {ry}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Purok / Sitio / Zone (If Applicable)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={purokZone}
                      onChangeText={setPurokZone}
                      placeholder="e.g. Purok 4, Zone 12"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Living Arrangement / Housing Status
                  </Text>
                  <View style={styles.chipsContainer}>
                    {['Homeowner', 'Tenant / Renter', 'Living with Relatives'].map((hs) => {
                      const isSel = housingStatus === hs;
                      return (
                        <TouchableOpacity
                          key={hs}
                          style={[
                            styles.chipItem,
                            isSel && styles.chipItemSelected,
                            isDarkMode && {
                              backgroundColor: isSel ? '#15803D' : '#152238',
                              borderColor: isSel ? '#4ADE80' : '#3A506B',
                            },
                          ]}
                          onPress={() => setHousingStatus(hs)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextSelected,
                              isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                            ]}
                          >
                            {hs}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Citizen ID Specific Fields */}
              {activeCategory.id === 'citizen_id' && (
                <View style={styles.dynamicBox}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      PhilSys Card Number / PCN (If already registered)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={philsysNumber}
                      onChangeText={setPhilsysNumber}
                      placeholder="e.g. 1234-5678-9012-3456"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Occupation / Employment Classification
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={occupation}
                      onChangeText={setOccupation}
                      placeholder="e.g. Private Employee, Self-Employed, Student"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION 4: ADDRESS & BARANGAY */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Current Address & Barangay *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Registered address in Caloocan City
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Current Street Address *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="e.g. House No., Street, Subdivision"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Barangay *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={barangay}
                  onChangeText={(text) => {
                    setBarangay(text);
                    const autoD = detectDistrictFromBarangay(text);
                    if (autoD) setDistrict(autoD);
                  }}
                  placeholder="e.g. Barangay 171 (Bagumbong)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Caloocan Legislative District *
                </Text>
                <View style={styles.chipsContainer}>
                  {['District 1', 'District 2', 'District 3'].map((d) => {
                    const isSel = district === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.chipItem,
                          isSel && styles.chipItemSelected,
                          isDarkMode && {
                            backgroundColor: isSel ? '#1D4ED8' : '#152238',
                            borderColor: isSel ? '#60A5FA' : '#3A506B',
                          },
                        ]}
                        onPress={() => setDistrict(d)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSel && styles.chipTextSelected,
                            isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 5: CONTACT INFORMATION */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>5</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Contact Information *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Notifications and release notifications will be dispatched here
                  </Text>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Mobile Phone *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                    Email Address *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* SECTION 6: EMERGENCY CONTACT INFORMATION */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>6</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Emergency Contact Information *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Designated contact in medical situations, urgent verification, or card release notices
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Emergency Contact Full Name *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={emergencyContactName}
                  onChangeText={(val) => setEmergencyContactName(sanitizePersonalName(val))}
                  placeholder="Full Legal Name (e.g. Maria Santos)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Relationship to Applicant *
                </Text>
                <View style={styles.chipsContainer}>
                  {EMERGENCY_RELATIONSHIPS.map((rel) => {
                    const isSel = emergencyContactRelation === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.chipItemSmall,
                          isSel && styles.chipItemSelected,
                          isDarkMode && {
                            backgroundColor: isSel ? '#0284C7' : '#152238',
                            borderColor: isSel ? '#38BDF8' : '#3A506B',
                          },
                        ]}
                        onPress={() => setEmergencyContactRelation(rel)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSel && styles.chipTextSelected,
                            isDarkMode && { color: isSel ? '#FFFFFF' : '#CBD5E1' },
                          ]}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                  Emergency Mobile Phone *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                  ]}
                  value={emergencyContactPhone}
                  onChangeText={(val) => setEmergencyContactPhone(val.replace(/[^0-9]/g, '').slice(0, 11))}
                  placeholder="09XXXXXXXXX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <View style={styles.divider} />

              {/* SECTION 7: APPLICANT SIGNATURE OR E-SIGNATURE */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>7</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Applicant Signature or E-Signature *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Required for official municipal registry records and ID card fabrication
                  </Text>
                </View>
              </View>

              {/* Signature Mode Selector Switch */}
              <View style={[styles.signatureModeContainer, isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' }]}>
                <TouchableOpacity
                  style={[
                    styles.signatureModeBtn,
                    signatureMode === 'esignature' && styles.signatureModeBtnActive,
                    isDarkMode && signatureMode === 'esignature' && { backgroundColor: '#0284C7' },
                  ]}
                  onPress={() => setSignatureMode('esignature')}
                >
                  <IconSymbol
                    name="pencil"
                    size={16}
                    color={signatureMode === 'esignature' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.signatureModeBtnText,
                      signatureMode === 'esignature' && styles.signatureModeBtnTextActive,
                      isDarkMode && signatureMode !== 'esignature' && { color: '#94A3B8' },
                    ]}
                  >
                    Digital E-Signature
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.signatureModeBtn,
                    signatureMode === 'upload' && styles.signatureModeBtnActive,
                    isDarkMode && signatureMode === 'upload' && { backgroundColor: '#0284C7' },
                  ]}
                  onPress={() => setSignatureMode('upload')}
                >
                  <IconSymbol
                    name="camera.fill"
                    size={16}
                    color={signatureMode === 'upload' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.signatureModeBtnText,
                      signatureMode === 'upload' && styles.signatureModeBtnTextActive,
                      isDarkMode && signatureMode !== 'upload' && { color: '#94A3B8' },
                    ]}
                  >
                    Upload Physical Signature
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mode 1: Digital E-Signature (Modal Drawing Experience) */}
              {signatureMode === 'esignature' ? (
                <View style={[styles.signatureCard, isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' }]}>
                  {drawnSignatureUri ? (
                    /* Captured Signature Preview Card */
                    <View style={[styles.sigPreviewCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#10B981' }]}>
                      <View style={styles.sigPreviewTop}>
                        <View style={styles.sigPreviewBadge}>
                          <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                          <Text style={styles.sigPreviewBadgeText}>E-SIGNATURE ATTACHED</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.sigPreviewReSignBtn, isDarkMode && { backgroundColor: '#152238' }]}
                          onPress={handleOpenSigModal}
                          activeOpacity={0.75}
                        >
                          <IconSymbol name="pencil" size={13} color="#0284C7" />
                          <Text style={[styles.sigPreviewReSignText, isDarkMode && { color: '#38BDF8' }]}>
                            Re-draw / Edit
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.sigPreviewImgBox}>
                        <Image
                          source={{ uri: drawnSignatureUri }}
                          style={styles.sigPreviewImg}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  ) : (
                    /* Trigger Button to Open Modal */
                    <TouchableOpacity
                      style={[styles.sigTriggerCard, isDarkMode && { backgroundColor: '#152238', borderColor: '#0284C7' }]}
                      onPress={handleOpenSigModal}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.sigTriggerIconCircle, isDarkMode && { backgroundColor: '#1C2541' }]}>
                        <IconSymbol name="pencil" size={26} color="#0284C7" />
                      </View>
                      <Text style={[styles.sigTriggerTitle, isDarkMode && { color: '#38BDF8' }]}>
                        Draw Your Official E-Signature
                      </Text>
                      <Text style={[styles.sigTriggerDesc, isDarkMode && { color: '#94A3B8' }]}>
                        Tap to open the expanded drawing pad on clean white paper with full room to draw using your finger, stylus, or mouse.
                      </Text>
                      <View style={styles.sigTriggerBtn}>
                        <IconSymbol name="pencil" size={14} color="#FFFFFF" />
                        <Text style={styles.sigTriggerBtnText}>Open Signature Pad to Draw</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Printed Legal Name Input */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputSublabel, isDarkMode && { color: '#94A3B8' }]}>
                      Printed Legal Signer Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isDarkMode && { backgroundColor: '#0E1726', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      value={eSignatureName || `${firstName} ${lastName}`.trim()}
                      onChangeText={(val) => setESignatureName(sanitizePersonalName(val))}
                      placeholder="Full Legal Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Legal Attestation Checkbox */}
                  <TouchableOpacity
                    style={styles.declarationRow}
                    onPress={() => setESignatureAgreed(!eSignatureAgreed)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkboxBox, eSignatureAgreed && styles.checkboxBoxActive]}>
                      {eSignatureAgreed && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.declarationText, isDarkMode && { color: '#CBD5E1' }]}>
                      I hereby certify under penalty of law that the drawn signature above is executed by me, represents my official signature, and is legally binding pursuant to Republic Act No. 8792 (Philippine Electronic Commerce Act).
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Mode 2: Upload Handwritten Physical Signature */
                <View style={[styles.signatureCard, isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' }]}>
                  <View style={styles.signatureTipsBox}>
                    <IconSymbol name="info.circle.fill" size={16} color="#0284C7" />
                    <Text style={[styles.signatureTipsText, isDarkMode && { color: '#BAE6FD' }]}>
                      Sign on a clean sheet of white paper using black or dark blue ink. Avoid shadows or glares, and make sure the signature is clearly visible.
                    </Text>
                  </View>

                  {signatureFile ? (
                    <View style={{ gap: 8 }}>
                      <View
                        style={[
                          styles.docAttachedRow,
                          isDarkMode && { backgroundColor: '#0E1726', borderColor: '#2B3958' },
                        ]}
                      >
                        <IconSymbol name="pencil" size={18} color="#10B981" />
                        <Text
                          style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                          numberOfLines={1}
                        >
                          {signatureFile.name} ({signatureFile.size})
                        </Text>
                        <TouchableOpacity onPress={() => setSignatureFile(null)}>
                          <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      {signatureFile.uri ? (
                        <View style={{ height: 68, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                          <Image source={{ uri: signatureFile.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.signatureUploadCard,
                        isDarkMode && { backgroundColor: '#0E1726', borderColor: '#3A506B' },
                      ]}
                      onPress={() => handlePickDocument('signature')}
                      activeOpacity={0.82}
                    >
                      <View style={styles.signatureUploadIconCircle}>
                        <IconSymbol name="camera.fill" size={20} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.signatureUploadCardTitle, isDarkMode && { color: '#F8FAFC' }]}>
                          Attach Handwritten Signature
                        </Text>
                        <Text style={[styles.signatureUploadCardSub, isDarkMode && { color: '#94A3B8' }]}>
                          Tap to select or capture a photo of your signature on white paper (JPG/PNG)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.divider} />

              {/* SECTION 8: REQUIREMENTS UPLOAD */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>8</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {activeCategory.name} Document Requirements *
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                    Upload clear photo copies or PDF files for bureau document evaluation
                  </Text>
                </View>
              </View>

              {/* PWD Document Requirements Checklist Banner */}
              {activeCategory.id === 'pwd_id' && (
                <View style={[styles.pwdRequirementsCard, isDarkMode && { backgroundColor: '#1E1B4B', borderColor: '#4338CA' }]}>
                  <View style={styles.pwdRequirementsHeader}>
                    <IconSymbol name="figure.roll" size={20} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
                    <Text style={[styles.pwdRequirementsTitle, isDarkMode && { color: '#E0E7FF' }]}>
                      Mandatory PWD Document Checklist (RA 10754)
                    </Text>
                  </View>
                  <View style={styles.pwdRequirementsList}>
                    <View style={styles.pwdReqItem}>
                      <IconSymbol name="checkmark.circle.fill" size={15} color="#10B981" />
                      <Text style={[styles.pwdReqText, isDarkMode && { color: '#C7D2FE' }]}>
                        Clinical Medical Certificate stating exact disability & diagnosis signed by attending physician
                      </Text>
                    </View>
                    <View style={styles.pwdReqItem}>
                      <IconSymbol name="checkmark.circle.fill" size={15} color="#10B981" />
                      <Text style={[styles.pwdReqText, isDarkMode && { color: '#C7D2FE' }]}>
                        Barangay Certificate of Residency proving applicant resides in Caloocan City
                      </Text>
                    </View>
                    <View style={styles.pwdReqItem}>
                      <IconSymbol name="checkmark.circle.fill" size={15} color="#10B981" />
                      <Text style={[styles.pwdReqText, isDarkMode && { color: '#C7D2FE' }]}>
                        2x2 Formal Portrait with plain white background & applicant signature
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Requirement 1: Primary Document */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    1. {activeCategory.primaryDocName} *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  {activeCategory.primaryDocDesc}
                </Text>

                {idDocFile ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="doc.text.fill" size={18} color="#0284C7" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {idDocFile.name} ({idDocFile.size})
                    </Text>
                    <TouchableOpacity onPress={() => setIdDocFile(null)}>
                      <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('id')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                    <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                      Upload {activeCategory.primaryDocName} (PDF/JPG)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 2: Supporting Document */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    2. {activeCategory.supportDocName}
                  </Text>
                  <Text style={[styles.reqBadge, { backgroundColor: '#F1F5F9', color: '#64748B' }]}>
                    Recommended
                  </Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  {activeCategory.supportDocDesc}
                </Text>

                {supportDocFile ? (
                  <View
                    style={[
                      styles.docAttachedRow,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                    ]}
                  >
                    <IconSymbol name="doc.text.fill" size={18} color="#0284C7" />
                    <Text
                      style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                      numberOfLines={1}
                    >
                      {supportDocFile.name} ({supportDocFile.size})
                    </Text>
                    <TouchableOpacity onPress={() => setSupportDocFile(null)}>
                      <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('support')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="arrow.up.doc.fill" size={18} color="#0284C7" />
                    <Text style={[styles.uploadTriggerText, isDarkMode && { color: '#38BDF8' }]}>
                      Upload Supporting Document (Optional/Recommended)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirement 3: 2x2 Photo */}
              <View style={styles.reqBlock}>
                <View style={styles.reqLabelRow}>
                  <Text style={[styles.reqLabel, isDarkMode && { color: '#CBD5E1' }]}>
                    3. 2x2 Formal ID Photo *
                  </Text>
                  <Text style={styles.reqBadge}>Required</Text>
                </View>
                <Text style={[styles.reqSub, isDarkMode && { color: '#94A3B8' }]}>
                  Clear formal front-facing portrait with plain white background
                </Text>

                {photoFile ? (
                  <View style={{ gap: 8 }}>
                    <View
                      style={[
                        styles.docAttachedRow,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#2B3958' },
                      ]}
                    >
                      <IconSymbol name="photo.fill" size={18} color="#10B981" />
                      <Text
                        style={[styles.docAttachedName, isDarkMode && { color: '#F8FAFC' }]}
                        numberOfLines={1}
                      >
                        {photoFile.name} ({photoFile.size})
                      </Text>
                      <TouchableOpacity onPress={() => setPhotoFile(null)}>
                        <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    {photoFile.uri ? (
                      <View style={{ height: 110, width: 110, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', padding: 4, alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={{ uri: photoFile.uri }} style={{ width: '100%', height: '100%', borderRadius: 6 }} resizeMode="cover" />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.uploadTrigger,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                    ]}
                    onPress={() => handlePickDocument('photo')}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="camera.fill" size={18} color="#10B981" />
                    <Text style={[styles.uploadTriggerText, { color: '#059669' }, isDarkMode && { color: '#34D399' }]}>
                      Upload 2x2 ID Photo (JPG/PNG)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* SUBMIT APPLICATION BUTTON */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitApplication}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Submit {activeCategory.name} Application
                    </Text>
                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </>
    )}

    {/* TAB 2: APPLICATION STATUS */}
    {activeTab === 'status' && (
      <View style={styles.statusSectionContainer}>
        {/* Header Banner */}
        <View
          style={[
            styles.headerBannerCard,
            isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
          ]}
        >
          <View style={styles.bannerTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="creditcard.fill" size={24} color="#7C3AED" />
            </View>
            <Badge label="STATUS TRACKER" variant="info" />
          </View>
          <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
            My ID Applications & Status
          </Text>
          <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
            Track real-time verification progress, document evaluation, approval status, and claim voucher schedules for all your municipal identity card requests.
          </Text>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: `All (${applications.length})` },
            {
              id: 'IN_REVIEW',
              label: `In Review (${applications.filter((a) => a.status === 'Pending Review' || a.status === 'Under Review').length})`,
            },
            {
              id: 'READY',
              label: `Ready / Approved (${applications.filter((a) => a.status === 'Approved' || a.status === 'Ready to Print' || a.status === 'Ready for Release').length})`,
            },
            {
              id: 'CLAIMED',
              label: `Claimed (${applications.filter((a) => a.status === 'Claimed').length})`,
            },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                  isDarkMode && { backgroundColor: isActive ? '#0284C7' : '#152238', borderColor: '#3A506B' },
                ]}
                onPress={() => setStatusFilter(tab.id)}
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

        {/* Applications List or Empty State */}
        {isLoadingApplications ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, isDarkMode && { color: '#94A3B8' }]}>
              Loading your official ID applications from City Central...
            </Text>
          </View>
        ) : applications.filter((app) => {
            if (statusFilter === 'ALL') return true;
            if (statusFilter === 'IN_REVIEW') return app.status === 'Pending Review' || app.status === 'Under Review';
            if (statusFilter === 'READY') return app.status === 'Approved' || app.status === 'Ready to Print' || app.status === 'Ready for Release';
            if (statusFilter === 'CLAIMED') return app.status === 'Claimed';
            return true;
          }).length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="creditcard.fill" size={32} color="#7C3AED" />
            </View>
            <Text style={[styles.emptyStateTitle, isDarkMode && { color: '#F8FAFC' }]}>
              No Applications Found
            </Text>
            <Text style={[styles.emptyStateDesc, isDarkMode && { color: '#94A3B8' }]}>
              {statusFilter === 'ALL'
                ? "You haven't filed any ID applications yet. Choose an ID card to start your application."
                : `No ID applications matching the "${statusFilter}" filter were found.`}
            </Text>
            <TouchableOpacity
              style={styles.applyNowBtn}
              onPress={() => {
                setSelectedId(null);
                setActiveTab('apply');
              }}
              activeOpacity={0.85}
            >
              <IconSymbol name="plus.circle.fill" size={16} color="#FFFFFF" />
              <Text style={styles.applyNowBtnText}>Apply for an ID Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.applicationsListContainer}>
            {applications
              .filter((app) => {
                // Hide archived Solo Parent applications from resident list per panelist preference
                if (app.id_category === 'solo_parent_id') return false;
                if (statusFilter === 'ALL') return true;
                if (statusFilter === 'IN_REVIEW') return app.status === 'Pending Review' || app.status === 'Under Review';
                if (statusFilter === 'READY') return app.status === 'Approved' || app.status === 'Ready to Print' || app.status === 'Ready for Release';
                if (statusFilter === 'CLAIMED') return app.status === 'Claimed';
                return true;
              })
              .map((app) => {
                const catMeta = getCategoryForApp(app.id_category);
                const stageIdx = getIdStageIndex(app.status);
                const badgeInfo = getStatusBadgeInfo(app.status);
                const isExpanded = expandedAppId === app.id;
                const isRejected = (app.status || '').toLowerCase().includes('reject');
                const isReadyForDigitalId =
                  app.status === 'Ready to Print' ||
                  app.status === 'Approved' ||
                  app.status === 'Ready for Release' ||
                  app.status === 'Claimed' ||
                  (app.status || '').toLowerCase().includes('ready') ||
                  (app.status || '').toLowerCase().includes('print') ||
                  (app.status || '').toLowerCase().includes('approv');

                return (
                  <View
                    key={app.id || app.reference_no}
                    style={[
                      styles.appCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    {/* Card Top Row */}
                    <View style={styles.appCardHeader}>
                      <View style={[styles.appIconCircle, { backgroundColor: catMeta.iconBg }]}>
                        <IconSymbol name={catMeta.icon} size={22} color={catMeta.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.appTitleBadgeRow}>
                          <Text style={[styles.appCategoryName, isDarkMode && { color: '#F8FAFC' }]}>
                            {catMeta.name}
                          </Text>
                          <View
                            style={[
                              styles.statusPillBadge,
                              { backgroundColor: badgeInfo.bg, borderColor: badgeInfo.border },
                            ]}
                          >
                            <Text style={[styles.statusPillText, { color: badgeInfo.color }]}>
                              {badgeInfo.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.appFullTitle, isDarkMode && { color: '#94A3B8' }]} numberOfLines={1}>
                          {app.id_title || catMeta.fullTitle}
                        </Text>
                      </View>
                    </View>

                    {/* Reference Number & Type Chips */}
                    <View style={[styles.refRowBar, isDarkMode && { backgroundColor: '#152238' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.refRowLabel}>REFERENCE CODE</Text>
                        <Text style={[styles.refRowCode, isDarkMode && { color: '#38BDF8' }]}>
                          {app.reference_no}
                        </Text>
                      </View>
                      <View style={styles.typeBadgeContainer}>
                        <Text style={[styles.typeBadgeText, isDarkMode && { color: '#94A3B8' }]}>
                          {app.application_type || 'New Application'}
                        </Text>
                      </View>
                    </View>

                    {/* Meta Details Grid */}
                    <View style={styles.appMetaGrid}>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Applicant</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]} numberOfLines={1}>
                          {app.first_name} {app.middle_name ? `${app.middle_name.charAt(0)}. ` : ''}{app.last_name} {app.suffix || ''}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Date Filed</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]}>
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </Text>
                      </View>
                      <View style={[styles.appMetaItem, { width: '100%' }]}>
                        <Text style={styles.appMetaLabel}>Claim Office</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={2}>
                          {app.claim_office || catMeta.claimOffice}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Turnaround</Text>
                        <Text style={[styles.appMetaValue, { color: '#0284C7', fontWeight: '700' }, isDarkMode && { color: '#38BDF8' }]}>
                          {app.estimated_turnaround || catMeta.estimatedTurnaround}
                        </Text>
                      </View>
                      <View style={styles.appMetaItem}>
                        <Text style={styles.appMetaLabel}>Barangay</Text>
                        <Text style={[styles.appMetaValue, isDarkMode && { color: '#F8FAFC' }]}>
                          {app.barangay ? `Brgy ${app.barangay}` : 'City Wide'}
                        </Text>
                      </View>
                    </View>

                    {/* Rejection Notice if applicable */}
                    {isRejected && (
                      <View style={styles.rejectionCard}>
                        <View style={styles.rejectionHeader}>
                          <IconSymbol name="exclamationmark.octagon.fill" size={16} color="#DC2626" />
                          <Text style={styles.rejectionTitle}>Application Disapproved</Text>
                        </View>
                        <Text style={styles.rejectionBody}>
                          {app.rejection_reason || app.review_notes || 'Credentials did not satisfy official requirements. Please verify documents and re-apply.'}
                        </Text>
                      </View>
                    )}

                    {/* 5-Stage Stepper Tracker */}
                    {!isRejected && (
                      <View style={[styles.stepperContainer, isDarkMode && { backgroundColor: '#152238' }]}>
                        <Text style={[styles.stepperHeaderTitle, isDarkMode && { color: '#93C5FD' }]}>
                          Application Progression
                        </Text>
                        <View style={styles.stepperTrackRow}>
                          {CITIZEN_ID_STAGES.map((stg, sIdx) => {
                            const isDone = sIdx <= stageIdx;
                            const isCurrent = sIdx === stageIdx;
                            return (
                              <View key={stg.id} style={styles.stepItemCol}>
                                <View style={styles.stepDotLineContainer}>
                                  {sIdx > 0 && (
                                    <View
                                      style={[
                                        styles.stepLineBefore,
                                        sIdx <= stageIdx && styles.stepLineActive,
                                      ]}
                                    />
                                  )}
                                  <View
                                    style={[
                                      styles.stepDot,
                                      isDone && styles.stepDotDone,
                                      isCurrent && styles.stepDotCurrent,
                                    ]}
                                  >
                                    {isDone && !isCurrent ? (
                                      <IconSymbol name="checkmark" size={10} color="#FFFFFF" />
                                    ) : isCurrent ? (
                                      <View style={styles.stepDotCurrentInner} />
                                    ) : (
                                      <Text style={styles.stepDotNumber}>{sIdx + 1}</Text>
                                    )}
                                  </View>
                                  {sIdx < CITIZEN_ID_STAGES.length - 1 && (
                                    <View
                                      style={[
                                        styles.stepLineAfter,
                                        sIdx < stageIdx && styles.stepLineActive,
                                      ]}
                                    />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.stepItemLabel,
                                    isCurrent && styles.stepItemLabelCurrent,
                                    isDarkMode && { color: isCurrent ? '#38BDF8' : isDone ? '#94A3B8' : '#475569' },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {stg.label}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* "Show Digital ID" Action Banner (Prominent Button when Ready to Print / Approved / Ready for Release) */}
                    {isReadyForDigitalId && (
                      <TouchableOpacity
                        style={[
                          styles.showDigitalIdBannerBtn,
                          isDarkMode && { backgroundColor: '#0B2545', borderColor: '#1D4ED8' },
                        ]}
                        onPress={() => handleShowDigitalId(app)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.showDigitalIdIconBox}>
                          <IconSymbol name="creditcard.fill" size={18} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.showDigitalIdTitleText, isDarkMode && { color: '#60A5FA' }]}>
                              Show Digital ID
                            </Text>
                            <View style={styles.digitalIdReadyBadge}>
                              <Text style={styles.digitalIdReadyBadgeText}>
                                {(app.status || '').toLowerCase().includes('print') ? 'READY TO PRINT' : 'READY'}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.showDigitalIdSubText, isDarkMode && { color: '#93C5FD' }]}>
                            {(app.status || '').toLowerCase().includes('print')
                              ? 'Admin changed status to Ready to Print • Tap to view Digital ID'
                              : 'Official Municipal Digital Credential Available'}
                          </Text>
                        </View>
                        <View style={[styles.showDigitalIdArrowBox, isDarkMode && { backgroundColor: '#1E3A8A' }]}>
                          <IconSymbol name="chevron.right" size={14} color={isDarkMode ? '#93C5FD' : '#0284C7'} />
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Expandable Claim Voucher / Details Drawer */}
                    {isExpanded && (
                      <View
                        style={[
                          styles.voucherDrawer,
                          isDarkMode && { backgroundColor: '#131D31', borderColor: '#3A506B' },
                        ]}
                      >
                        {/* Digital Claim Voucher Barcode Mockup */}
                        <View style={styles.voucherCodeCard}>
                          <Text style={styles.voucherCardHeader}>DIGITAL CLAIM VOUCHER</Text>
                          <Text style={styles.voucherBigRef}>{app.reference_no}</Text>
                          <View style={styles.mockBarcodeContainer}>
                            <View style={styles.mockBarcodeLines} />
                            <Text style={styles.mockBarcodeText}>||| | |||| | ||| |||| | || | |||| ||</Text>
                          </View>
                          <Text style={styles.voucherHintText}>
                            Present this reference code or digital voucher at the release desk.
                          </Text>
                        </View>

                        {/* Claim Requirements Checklist */}
                        <View style={styles.voucherReqsSection}>
                          <Text style={[styles.voucherReqsTitle, isDarkMode && { color: '#F8FAFC' }]}>
                            Documents to Bring Upon Claiming:
                          </Text>
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              1 Valid Government-issued Photo ID (original)
                            </Text>
                          </View>
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              Original supporting proof ({catMeta.supportDocName || 'Proof of Residency'})
                            </Text>
                          </View>
                          {catMeta.id === 'pwd_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                Original signed Clinical Medical Certificate
                              </Text>
                            </View>
                          )}
                          {catMeta.id === 'solo_parent_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                PSA Birth Certificate(s) of dependent child/children
                              </Text>
                            </View>
                          )}
                          {catMeta.id === 'senior_citizen_id' && (
                            <View style={styles.reqCheckItem}>
                              <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                              <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                                PSA Birth Certificate or proof of age 60+
                              </Text>
                            </View>
                          )}
                          <View style={styles.reqCheckItem}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#10B981" />
                            <Text style={[styles.reqCheckText, isDarkMode && { color: '#CBD5E1' }]}>
                              This digital claim voucher or printed receipt
                            </Text>
                          </View>
                        </View>

                        {/* Release Desk Notice */}
                        <View style={[styles.releaseDeskBox, isDarkMode && { backgroundColor: '#1A2942' }]}>
                          <IconSymbol name="building.2.fill" size={16} color="#0284C7" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.releaseDeskTitle, isDarkMode && { color: '#93C5FD' }]}>
                              Designated Pick-up Desk:
                            </Text>
                            <Text style={[styles.releaseDeskText, isDarkMode && { color: '#E2E8F0' }]}>
                              {app.claim_office || catMeta.claimOffice}
                            </Text>
                          </View>
                        </View>

                        {app.emergency_contact_name && (
                          <View style={[styles.appEmergencyBox, isDarkMode && { backgroundColor: '#1A2942' }]}>
                            <Text style={[styles.appEmergencyLabel, isDarkMode && { color: '#93C5FD' }]}>Emergency Contact:</Text>
                            <Text style={[styles.appEmergencyValue, isDarkMode && { color: '#F8FAFC' }]}>
                              {app.emergency_contact_name} {app.emergency_contact_relation ? `(${app.emergency_contact_relation})` : ''} • {app.emergency_contact_phone}
                            </Text>
                          </View>
                        )}

                        {(app.signature_url || app.e_signature_name) && (
                          <View style={[styles.appSignatureBox, isDarkMode && { backgroundColor: '#1A2942' }]}>
                            <Text style={[styles.appSignatureLabel, isDarkMode && { color: '#6EE7B7' }]}>Official Cardholder Signature:</Text>
                            {app.signature_url && (app.signature_url.startsWith('data:image') || app.signature_url.startsWith('http')) ? (
                              <View style={styles.voucherSigImgWrapper}>
                                <Image
                                  source={{ uri: app.signature_url }}
                                  style={styles.voucherSigImg}
                                  resizeMode="contain"
                                />
                                <Text style={[styles.voucherSigSignerText, isDarkMode && { color: '#94A3B8' }]}>
                                  {app.e_signature_name || 'Cardholder Signature'} • Digitally Captured
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.appSignatureValue, isDarkMode && { color: '#F8FAFC' }]}>
                                {app.signature_mode === 'esignature' || app.e_signature_name
                                  ? `Digital E-Signature: ${app.e_signature_name}`
                                  : `Physical Signature File: ${app.signature_url || 'Attached'}`}
                              </Text>
                            )}
                          </View>
                        )}

                        {app.review_notes && (
                          <View style={styles.reviewNotesBox}>
                            <Text style={styles.reviewNotesLabel}>Bureau Officer Notes:</Text>
                            <Text style={styles.reviewNotesText}>{app.review_notes}</Text>
                          </View>
                        )}

                        {isReadyForDigitalId && (
                          <TouchableOpacity
                            style={styles.drawerDigitalIdBtn}
                            onPress={() => handleShowDigitalId(app)}
                            activeOpacity={0.85}
                          >
                            <IconSymbol name="creditcard.fill" size={15} color="#FFFFFF" />
                            <Text style={styles.drawerDigitalIdBtnText}>Open Official Civentral Citizen Card</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Toggle Accordion Button */}
                    <TouchableOpacity
                      style={[
                        styles.drawerToggleBtn,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
                      ]}
                      onPress={() => setExpandedAppId(isExpanded ? null : app.id)}
                      activeOpacity={0.8}
                    >
                      <IconSymbol
                        name={isExpanded ? 'chevron.up' : 'chevron.down'}
                        size={14}
                        color={isDarkMode ? '#38BDF8' : '#0284C7'}
                      />
                      <Text style={[styles.drawerToggleBtnText, isDarkMode && { color: '#38BDF8' }]}>
                        {isExpanded ? 'Hide Claim Voucher & Details' : 'View Claim Voucher & Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}
      </View>
    )}
  </>
)}
      </ScrollView>

      {/* EXPANDED FULLSCREEN SIGNATURE DRAWING MODAL */}
      <Modal
        visible={isSigModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSigModal}
      >
        <View style={styles.sigModalOverlay}>
          <View style={[styles.sigModalContainer, isDarkMode && { backgroundColor: '#1E293B' }]}>
            {/* Modal Header */}
            <View style={styles.sigModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.sigModalTitle, isDarkMode && { color: '#F8FAFC' }]}>
                  Digital E-Signature Pad
                </Text>
                <Text style={[styles.sigModalSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                  Draw your official signature clearly on the white area below using your finger, stylus, or mouse
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sigModalCloseBtn, isDarkMode && { backgroundColor: '#0F172A' }]}
                onPress={handleCloseSigModal}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark" size={16} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Large White Canvas Pad */}
            <View style={styles.sigModalCanvasWrapper}>
              {Platform.OS === 'web' ? (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  style={{
                    width: '100%',
                    height: 280,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    cursor: 'crosshair',
                    touchAction: 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              ) : (
                <View
                  style={styles.sigModalNativePad}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(evt) => {
                    const { locationX, locationY } = evt.nativeEvent;
                    setCurrentNativeStroke([{ x: locationX, y: locationY }]);
                    setIsDrawing(true);
                  }}
                  onResponderMove={(evt) => {
                    if (!isDrawing) return;
                    const { locationX, locationY } = evt.nativeEvent;
                    setCurrentNativeStroke((prev) => [...prev, { x: locationX, y: locationY }]);
                    setHasDrawn(true);
                  }}
                  onResponderRelease={() => {
                    setIsDrawing(false);
                    if (currentNativeStroke.length > 0) {
                      const updated = [...nativeStrokes, currentNativeStroke];
                      setNativeStrokes(updated);
                      setCurrentNativeStroke([]);
                      const svgUri = generateSvgDataUrl(updated);
                      setDrawnSignatureUri(svgUri);
                    }
                  }}
                >
                  <Svg width="100%" height={280}>
                    {nativeStrokes.map((stroke, sIdx) => {
                      let d = `M ${stroke[0].x} ${stroke[0].y} `;
                      for (let i = 1; i < stroke.length; i++) d += `L ${stroke[i].x} ${stroke[i].y} `;
                      return <Path key={sIdx} d={d} stroke="#0F172A" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                    })}
                    {currentNativeStroke.length > 0 && (() => {
                      let d = `M ${currentNativeStroke[0].x} ${currentNativeStroke[0].y} `;
                      for (let i = 1; i < currentNativeStroke.length; i++) d += `L ${currentNativeStroke[i].x} ${currentNativeStroke[i].y} `;
                      return <Path d={d} stroke="#0F172A" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                    })()}
                  </Svg>
                </View>
              )}

              {/* Guideline watermark */}
              <View style={styles.sigPadWatermarkRow} pointerEvents="none">
                <Text style={styles.sigPadWatermarkX}>✖</Text>
                <View style={styles.sigPadDottedLine} />
                <Text style={styles.sigPadWatermarkText}>Sign on line</Text>
              </View>
            </View>

            {/* Modal Action Footer */}
            <View style={styles.sigModalFooter}>
              <TouchableOpacity
                style={styles.sigModalClearBtn}
                onPress={handleClearSignature}
                activeOpacity={0.75}
              >
                <IconSymbol name="arrow.clockwise" size={15} color="#DC2626" />
                <Text style={styles.sigModalClearBtnText}>Clear Pad</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sigModalSaveBtn,
                  !hasDrawn && !drawnSignatureUri && styles.sigModalSaveBtnDisabled,
                ]}
                onPress={handleSaveSignatureAndClose}
                disabled={!hasDrawn && !drawnSignatureUri}
                activeOpacity={0.85}
              >
                <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.sigModalSaveBtnText}>Save & Apply Signature</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OFFICIAL CIVENTRAL CITIZEN CARD MODAL */}
      <DigitalIdCardModal
        visible={isDigitalIdModalVisible}
        onClose={() => setIsDigitalIdModalVisible(false)}
        data={selectedDigitalIdData}
      />
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
    fontSize: 21,
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

  /* Selection View Cards */
  selectionCardsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  idSelectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  idIconBoxLarge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardIdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardIdSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  cardIdDescription: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
  },
  infoPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardBenefitsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 5,
  },
  cardBenefitsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  miniBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBenefitText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  applyButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Dedicated Form View Styles */
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Active ID Highlights */
  activeIdHighlightBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  highlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  highlightHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  benefitsList: {
    gap: 6,
    marginTop: 4,
  },
  benefitBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitBulletText: {
    fontSize: 11.5,
    color: '#1E293B',
    flex: 1,
    lineHeight: 16,
  },

  /* Chips */
  dynamicBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipItemSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipItemSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperTipText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 4,
    fontWeight: '600',
  },

  /* Application Types */
  appTypeGrid: {
    gap: 10,
    marginBottom: 10,
  },
  appTypeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  appTypeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563EB',
  },
  appTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  appTypeLabelSelected: {
    color: '#2563EB',
  },
  appTypeDesc: {
    fontSize: 12,
    color: '#64748B',
    paddingLeft: 26,
  },

  /* Replacement Box */
  replacementBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  replacementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  replacementHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reasonsList: {
    gap: 8,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonOptionChosen: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  reasonLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  reasonSub: {
    fontSize: 11,
    color: '#64748B',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  /* Form Inputs */
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputSublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
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

  /* Document Requirements */
  reqBlock: {
    marginBottom: 14,
  },
  reqLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  reqLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reqBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reqSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
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

  /* Submit Button */
  submitButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Post Submission Result */
  postSubmitContainer: {
    alignItems: 'center',
    paddingTop: 8,
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
  },
  refCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
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
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    width: '40%',
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    width: '58%',
    textAlign: 'right',
  },
  updateCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  updateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  updateHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  updateText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  claimCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  claimGrid: {
    gap: 8,
    marginTop: 6,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    width: '42%',
  },
  claimVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    width: '56%',
    textAlign: 'right',
  },
  timelineCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  timelineSubheading: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 15,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    width: 22,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#10B981',
  },
  timelineDotCurrent: {
    backgroundColor: '#0284C7',
  },
  currentInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timelineTrack: {
    width: 2,
    flex: 1,
    minHeight: 22,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 1,
  },
  stageTitleActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  stageDesc: {
    fontSize: 11,
    color: '#94A3B8',
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

  /* VIEW STATUS BTN IN SUCCESS SCREEN */
  viewStatusBtn: {
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  viewStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* FEATURED STATUS TRACKER CARD */
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTrackerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  featuredTrackerDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 14,
  },
  featuredTrackerAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  featuredTrackerActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },

  /* APPLICATION STATUS SECTION */
  statusSectionContainer: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* EMPTY & LOADING STATES */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  applyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  applyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* APPLICATION CARDS LIST */
  applicationsListContainer: {
    gap: 14,
  },
  appCard: {
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
  appCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  appIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitleBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  appCategoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  appFullTitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },

  /* REF ROW BAR */
  refRowBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  refRowLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  refRowCode: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0284C7',
  },
  typeBadgeContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* META GRID */
  appMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  appMetaItem: {
    width: '47%',
  },
  appMetaLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 1,
  },
  appMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* REJECTION CARD */
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rejectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  rejectionBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#991B1B',
  },

  /* STEPPER TRACKER */
  stepperContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stepperHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItemCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepDotLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepLineBefore: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepLineAfter: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#10B981',
  },
  stepDotCurrent: {
    backgroundColor: '#0284C7',
  },
  stepDotCurrentInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepDotNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  stepItemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  stepItemLabelCurrent: {
    color: '#0284C7',
    fontWeight: '800',
  },

  /* EXPANDABLE VOUCHER DRAWER */
  voucherDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  voucherCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  voucherCardHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 4,
  },
  voucherBigRef: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mockBarcodeContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  mockBarcodeLines: {
    height: 2,
    width: 140,
    backgroundColor: '#0F172A',
    marginBottom: 2,
  },
  mockBarcodeText: {
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
    fontWeight: '900',
  },
  voucherHintText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  voucherReqsSection: {
    gap: 6,
    marginBottom: 12,
  },
  voucherReqsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reqCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqCheckText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  releaseDeskBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'flex-start',
  },
  releaseDeskTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 1,
  },
  releaseDeskText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  reviewNotesBox: {
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewNotesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewNotesText: {
    fontSize: 11,
    color: '#92400E',
  },
  drawerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  drawerToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  signatureModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  signatureModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signatureModeBtnActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signatureModeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  signatureModeBtnTextActive: {
    color: '#FFFFFF',
  },
  signatureCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  eSignaturePreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    padding: 16,
    marginTop: 10,
    marginBottom: 14,
  },
  eSignatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eSignatureStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eSignatureStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  eSignatureDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  eSignatureScriptArea: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  eSignatureScriptText: {
    fontSize: 26,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    color: '#1D4ED8',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },
  eSignatureLine: {
    width: 200,
    height: 1.5,
    backgroundColor: '#60A5FA',
    marginTop: 6,
  },
  eSignatureCertText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  declarationText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#334155',
    fontWeight: '500',
  },
  signatureTipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  signatureTipsText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0369A1',
    lineHeight: 16,
  },
  appEmergencyBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  appEmergencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  appEmergencyValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  appSignatureBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  appSignatureLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  appSignatureValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  dobLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dobPlaceholderHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ageBadgeNormal: {
    backgroundColor: '#E0F2FE',
  },
  ageBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ageBadgeTextNormal: {
    color: '#0369A1',
  },
  ageBadgeTextWarning: {
    color: '#B45309',
  },
    dropdownTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  dropdownValueText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dobDropdownValuePlaceholder: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionItemActive: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  calendarCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarDropdownBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  calendarDropdownBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  calendarMonthGridCell: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarMonthGridCellActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  calendarMonthGridText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  calendarMonthGridTextActive: {
    color: '#FFFFFF',
  },
  calendarYearDropdownContainer: {
    maxHeight: 180,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    padding: 6,
  },
  calendarYearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarYearOptionActive: {
    backgroundColor: '#0284C7',
  },
  calendarYearOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  calendarYearOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  calendarWeekLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: '13%',
    textAlign: 'center',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayCellActive: {
    backgroundColor: '#0284C7',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  seniorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  seniorAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  sigPadTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sigPadStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sigPadStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  clearSigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  clearSigBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  whitePadWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  nativeSigPad: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFFFFF',
  },
  sigPadWatermarkRow: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.45,
  },
  sigPadWatermarkX: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
  },
  sigPadDottedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  sigPadWatermarkText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sigPadHintText: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 8,
    fontStyle: 'italic',
  },
  postSubmitSigPreviewBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  postSubmitSigLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  postSubmitSigImgContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 6,
    alignItems: 'center',
  },
  postSubmitSigImg: {
    width: '100%',
    height: 60,
  },
  voucherSigImgWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  voucherSigImg: {
    width: 180,
    height: 48,
  },
  voucherSigSignerText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sigModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sigModalContainer: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  sigModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sigModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sigModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  sigModalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  sigModalCanvasWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#94A3B8',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sigModalNativePad: {
    width: '100%',
    height: 280,
    backgroundColor: '#FFFFFF',
  },
  sigModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  sigModalClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  sigModalClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  sigModalSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0284C7',
  },
  sigModalSaveBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  sigModalSaveBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sigTriggerCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0284C7',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  sigTriggerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigTriggerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0369A1',
    textAlign: 'center',
  },
  sigTriggerDesc: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  sigTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  sigTriggerBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sigPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
  },
  sigPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sigPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sigPreviewBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  sigPreviewReSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  sigPreviewReSignText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  sigPreviewImgBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  sigPreviewImg: {
    width: '100%',
    height: '100%',
  },
  showDigitalIdBannerBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  showDigitalIdIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  showDigitalIdTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  digitalIdReadyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  digitalIdReadyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  showDigitalIdSubText: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '500',
  },
  showDigitalIdArrowBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerDigitalIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F4C81',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  drawerDigitalIdBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  approvedIdCopyCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  approvedIdCopyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  approvedIdIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedIdCopyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  approvedIdCopySubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  approvedIdCopyDesc: {
    fontSize: 12.5,
    color: '#ECFDF5',
    lineHeight: 18,
    marginBottom: 14,
  },
  approvedIdCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  approvedIdCopyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  signatureUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  signatureUploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureUploadCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 2,
  },
  signatureUploadCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  pwdRequirementsCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  pwdRequirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pwdRequirementsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#6B21A8',
  },
  pwdRequirementsList: {
    gap: 8,
  },
  pwdReqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pwdReqText: {
    flex: 1,
    fontSize: 12,
    color: '#581C87',
    lineHeight: 17,
  },
});
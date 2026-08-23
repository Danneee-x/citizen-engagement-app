import React, { useState } from 'react';
import {
  ImageBackground,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/src/context/ThemeContext';
import { AuthService } from '@/src/services/auth-service';
import { styles } from './styles/ServicesCatalogScreen.styles';

export interface ServiceCatalogItem {
  id: string;
  title: string;
  category: 'EDUCATION' | 'BARANGAY' | 'BUSINESS' | 'TREASURY' | 'HEALTH' | 'SOCIAL' | 'DISASTER' | 'HOUSING' | 'TRANSPORT' | 'FACILITIES';
  description: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  badgeLabel: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  route: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'All Services',
  DISASTER: 'Disaster & Emergency',
  HOUSING: 'Zoning & Housing',
  TRANSPORT: 'Transport & Mobility',
  FACILITIES: 'Public Facilities',
  EDUCATION: 'Education',
  BARANGAY: 'Barangay',
  BUSINESS: 'Business',
  TREASURY: 'Treasury & RPT',
  HEALTH: 'Health',
  SOCIAL: 'Social Welfare',
};

const CATEGORIES = [
  'ALL',
  'DISASTER',
  'HOUSING',
  'TRANSPORT',
  'FACILITIES',
  'EDUCATION',
  'BARANGAY',
  'BUSINESS',
  'TREASURY',
  'HEALTH',
  'SOCIAL',
] as const;

const SERVICES_CATALOG: ServiceCatalogItem[] = [
  // CITIZEN REPORT & GRIEVANCE
  {
    id: 'SVC-CONCERN',
    title: 'Report a Concern',
    category: 'DISASTER',
    description: 'Submit complaints, community issues, service concerns, and public safety reports directly to Caloocan City.',
    iconName: 'megaphone.fill',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    badgeLabel: 'REPORT & GRIEVANCE',
    badgeVariant: 'danger',
    route: '/report-a-concern',
  },
  // CITIZEN ID & REGISTRY SERVICES
  {
    id: 'SVC-CITIZEN-ID',
    title: 'Citizen ID Application',
    category: 'BARANGAY',
    description: 'Apply for official Caloocan Digital & Physical Citizen ID, renewal, or replacement with claim voucher.',
    iconName: 'creditcard.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    badgeLabel: 'CITIZEN ID',
    badgeVariant: 'info',
    route: '/citizen-id-application',
  },
  // CERTIFICATE & DOCUMENT REQUESTS
  {
    id: 'SVC-CERTIFICATES',
    title: 'Certificate & Document Requests',
    category: 'BARANGAY',
    description: 'Request Barangay Certificate, Certificate of Residency, Indigency & official municipal clearances online.',
    iconName: 'doc.text.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeLabel: 'ONLINE REQUEST',
    badgeVariant: 'info',
    route: '/certificate-requests',
  },
  // PUBLIC SURVEYS & CONSULTATIONS
  {
    id: 'SVC-SURVEYS',
    title: 'Public Surveys & Consultations',
    category: 'SOCIAL',
    description: 'Participate in active municipal surveys, civic policy consultations, and public opinion polls.',
    iconName: 'bubble.left.and.bubble.right.fill',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    badgeLabel: 'VOICE & POLLS',
    badgeVariant: 'info',
    route: '/public-surveys',
  },
  // COMMUNITY FEEDBACK
  {
    id: 'SVC-FEEDBACK',
    title: 'Community Feedback & Rating',
    category: 'SOCIAL',
    description: 'Rate recent municipal service transactions, staff experience & share suggestions for Caloocan City offices.',
    iconName: 'star.bubble.fill',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    badgeLabel: 'RATE SERVICE',
    badgeVariant: 'warning',
    route: '/community-feedback',
  },
  // MY REPORTS
  {
    id: 'SVC-MY-REPORTS',
    title: 'My Reports & Grievances',
    category: 'BARANGAY',
    description: 'Track real-time progress, dispatch updates & provide resolution feedback on your submitted concerns.',
    iconName: 'list.bullet.rectangle.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeLabel: 'LIVE TRACKER',
    badgeVariant: 'info',
    route: '/my-reports',
  },

  // 1. DISASTER & EMERGENCY SERVICES
  {
    id: 'SVC-DRR',
    title: 'Disaster & Emergency Services',
    category: 'DISASTER',
    description: 'Hazard & Evacuation Map, Report an Incident, Emergency Alerts, Relief Distribution Status.',
    iconName: 'exclamationmark.triangle.fill',
    iconBg: '#FFEDD5',
    iconColor: '#C2410C',
    badgeLabel: 'EMERGENCY',
    badgeVariant: 'danger',
    route: '/emergency',
  },
  {
    id: 'SVC-DRR-MAP',
    title: 'Hazard & Evacuation Map',
    category: 'DISASTER',
    description: 'Interactive flood maps, active evacuation centers, shelter capacity & nearest emergency checkpoints.',
    iconName: 'location.fill',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    badgeLabel: 'EVACUATION',
    badgeVariant: 'warning',
    route: '/emergency',
  },
  {
    id: 'SVC-DRR-RLF',
    title: 'Relief Distribution Status',
    category: 'DISASTER',
    description: 'Track calamity aid schedules, food pack distribution sites & barangay relief claim stubs.',
    iconName: 'heart.text.square.fill',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    badgeLabel: 'RELIEF STATUS',
    badgeVariant: 'info',
    route: '/emergency',
  },

  // 2. ZONING & HOUSING SERVICES
  {
    id: 'SVC-HOU',
    title: 'Zoning & Housing Services',
    category: 'HOUSING',
    description: 'Zoning Clearance, Housing Assistance/Beneficiary Application, Occupancy Requests, Building/Subdivision Review.',
    iconName: 'building.2.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0369A1',
    badgeLabel: 'HOUSING PORTAL',
    badgeVariant: 'info',
    route: '/housing',
  },
  {
    id: 'SVC-HOU-ZON',
    title: 'Zoning Clearance',
    category: 'HOUSING',
    description: 'Apply for locational clearance, land-use verification certificates & commercial zoning approval.',
    iconName: 'doc.text.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeLabel: 'ZONING',
    badgeVariant: 'info',
    route: '/housing',
  },
  {
    id: 'SVC-HOU-AST',
    title: 'Housing Assistance & Beneficiary Application',
    category: 'HOUSING',
    description: 'Caloocan socialized housing program, informal settler relocation & housing beneficiary application.',
    iconName: 'house.fill',
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    badgeLabel: 'BENEFICIARY',
    badgeVariant: 'success',
    route: '/housing',
  },
  {
    id: 'SVC-HOU-OCC',
    title: 'Occupancy Requests & Permits',
    category: 'HOUSING',
    description: 'Submit requests for Certificate of Occupancy, structural safety inspection & clearance verification.',
    iconName: 'checkmark.seal.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    badgeLabel: 'OCCUPANCY',
    badgeVariant: 'info',
    route: '/housing',
  },
  {
    id: 'SVC-HOU-REV',
    title: 'Building & Subdivision Review',
    category: 'HOUSING',
    description: 'Architectural plan evaluation, subdivision development clearance & municipal engineering review.',
    iconName: 'wrench.and.screwdriver.fill',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
    badgeLabel: 'BUILDING REVIEW',
    badgeVariant: 'neutral',
    route: '/housing',
  },

  // 3. TRANSPORT & MOBILITY SERVICES
  {
    id: 'SVC-TRN',
    title: 'Transport & Mobility Services',
    category: 'TRANSPORT',
    description: 'PUV Services, Franchise Application/Renewal, Traffic Violations, Vehicle Inspection.',
    iconName: 'car.fill',
    iconBg: '#ECFDF5',
    iconColor: '#047857',
    badgeLabel: 'TRANSPORT',
    badgeVariant: 'success',
    route: '/transport',
  },
  {
    id: 'SVC-TRN-PUV',
    title: 'PUV Services & Route Management',
    category: 'TRANSPORT',
    description: 'Tricycle, jeepney, and shuttle route permits, terminal slots & official fare matrix schedules.',
    iconName: 'car.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeLabel: 'PUV ROUTES',
    badgeVariant: 'info',
    route: '/transport',
  },
  {
    id: 'SVC-TRN-FRN',
    title: 'Franchise Application & Renewal',
    category: 'TRANSPORT',
    description: 'Apply for new TODA franchise, annual renewal, body number assignment & operator ID card.',
    iconName: 'creditcard.fill',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    badgeLabel: 'TODA FRANCHISE',
    badgeVariant: 'warning',
    route: '/transport',
  },
  {
    id: 'SVC-TRN-TKT',
    title: 'Traffic Violations & Citation Fines',
    category: 'TRANSPORT',
    description: 'Check CPTMD traffic violation tickets, contest citations online & settle fines.',
    iconName: 'exclamationmark.triangle.fill',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    badgeLabel: 'TRAFFIC TICKETS',
    badgeVariant: 'danger',
    route: '/transport',
  },
  {
    id: 'SVC-TRN-INS',
    title: 'Vehicle & Roadworthiness Inspection',
    category: 'TRANSPORT',
    description: 'Schedule public transport emission testing, roadworthiness inspection & safety checks.',
    iconName: 'wrench.and.screwdriver.fill',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    badgeLabel: 'INSPECTION',
    badgeVariant: 'success',
    route: '/transport',
  },

  // 4. PUBLIC FACILITIES & UTILITIES
  {
    id: 'SVC-FAC',
    title: 'Public Facilities & Utilities',
    category: 'FACILITIES',
    description: 'Cemetery & Burial Services, Parks & Recreation Scheduling, Facility Reservations, Water Supply & Drainage Requests.',
    iconName: 'wrench.and.screwdriver.fill',
    iconBg: '#F5F3FF',
    iconColor: '#6D28D9',
    badgeLabel: 'FACILITIES',
    badgeVariant: 'neutral',
    route: '/facilities',
  },
  {
    id: 'SVC-FAC-CEM',
    title: 'Cemetery & Burial Services',
    category: 'FACILITIES',
    description: 'Public cemetery plot assignment, burial permits, cremation requests & indigent burial assistance.',
    iconName: 'house.fill',
    iconBg: '#F1F5F9',
    iconColor: '#334155',
    badgeLabel: 'BURIAL AID',
    badgeVariant: 'neutral',
    route: '/facilities',
  },
  {
    id: 'SVC-FAC-PRK',
    title: 'Parks & Recreation Scheduling',
    category: 'FACILITIES',
    description: 'Book public parks, Caloocan Sports Complex courts, amphitheaters & municipal recreation grounds.',
    iconName: 'heart.text.square.fill',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    badgeLabel: 'PARKS & RECREATION',
    badgeVariant: 'success',
    route: '/facilities',
  },
  {
    id: 'SVC-FAC-RES',
    title: 'Facility & Hall Reservations',
    category: 'FACILITIES',
    description: 'Reserve City Hall convention centers, barangay multi-purpose halls & community gymnasiums.',
    iconName: 'building.2.fill',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeLabel: 'RESERVATIONS',
    badgeVariant: 'info',
    route: '/facilities',
  },
  {
    id: 'SVC-FAC-WTR',
    title: 'Water Supply & Drainage Requests',
    category: 'FACILITIES',
    description: 'Request drainage declogging, flood control maintenance, water tank dispatch & utility repairs.',
    iconName: 'wrench.and.screwdriver.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    badgeLabel: 'WATER & DRAINAGE',
    badgeVariant: 'info',
    route: '/facilities',
  },

  // 5. EXISTING CATEGORIES
  {
    id: 'SVC-EDU',
    title: 'Education & Scholarship Portal',
    category: 'EDUCATION',
    description: 'City College grants, SHEAP scholarships, new application, renewal & cash allowance distribution schedule.',
    iconName: 'book.closed.fill',
    iconBg: '#F3E8FF',
    iconColor: '#7E22CE',
    badgeLabel: '4 SUB-SERVICES',
    badgeVariant: 'success',
    route: '/education',
  },
  {
    id: 'SVC-BPLO',
    title: 'Business Permit & E-Clearance',
    category: 'BUSINESS',
    description: 'New business registration, annual permit renewal, BPLO inspection & e-tax clearances.',
    iconName: 'briefcase.fill',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    badgeLabel: 'FAST-TRACK',
    badgeVariant: 'info',
    route: '/(tabs)/tracker',
  },
  {
    id: 'SVC-RPT',
    title: 'Real Property Tax (RPT)',
    category: 'TREASURY',
    description: 'Real property assessment, online RPT bill computation, official tax declaration & online payments.',
    iconName: 'house.fill',
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    badgeLabel: 'ONLINE PAY',
    badgeVariant: 'success',
    route: '/(tabs)/tracker',
  },
  {
    id: 'SVC-HLT',
    title: 'Health & Medical Clinic Services',
    category: 'HEALTH',
    description: 'Barangay health center appointments, free medicine distribution, dental caravan & vaccination cards.',
    iconName: 'cross.case.fill',
    iconBg: '#FEE2E2',
    iconColor: '#B91C1C',
    badgeLabel: 'FREE CLINIC',
    badgeVariant: 'danger',
    route: '/(tabs)/tracker',
  },
  {
    id: 'SVC-SWD',
    title: 'Social Welfare & Relief Assistance',
    category: 'SOCIAL',
    description: 'Senior citizen pension, PWD ID registration, emergency relief aid & solo parent grants.',
    iconName: 'heart.text.square.fill',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    badgeLabel: 'CIVIC AID',
    badgeVariant: 'warning',
    route: '/(tabs)/tracker',
  },
];

export function ServicesCatalogScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ isGuest?: string }>();

  // Detect guest mode via params OR session
  const session = AuthService.getCurrentUser();
  const isGuestMode = params.isGuest === 'true' || (!session.email && !session.citizen_user_id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('ALL');
  const [isAuthGateVisible, setIsAuthGateVisible] = useState(false);

  const filteredServices = SERVICES_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.id === 'SVC-CONCERN' &&
        ['concern', 'complaint', 'grievance', 'report', 'issue', 'hazard', 'garbage', 'pothole', 'streetlights'].some((k) =>
          k.includes(query) || query.includes(k)
        )) ||
      (item.id === 'SVC-CITIZEN-ID' &&
        ['id', 'citizen id', 'card', 'valid id', 'identification', 'replacement', 'renewal', 'barangay id'].some((k) =>
          k.includes(query) || query.includes(k)
        )) ||
      (item.id === 'SVC-CERTIFICATES' &&
        ['certificate', 'clearance', 'residency', 'indigency', 'barangay certificate', 'document', 'cedula'].some((k) =>
          k.includes(query) || query.includes(k)
        )) ||
      (item.id === 'SVC-SURVEYS' &&
        ['survey', 'consultation', 'poll', 'feedback', 'voice', 'opinion', 'ordinance', 'vote'].some((k) =>
          k.includes(query) || query.includes(k)
        )) ||
      (item.id === 'SVC-FEEDBACK' &&
        ['feedback', 'rating', 'rate', 'review', 'satisfaction', 'stars', 'evaluation', 'comment'].some((k) =>
          k.includes(query) || query.includes(k)
        )) ||
      (item.id === 'SVC-MY-REPORTS' &&
        ['my reports', 'reports', 'tracked concerns', 'grievance', 'ticket', 'status', 'resolution'].some((k) =>
          k.includes(query) || query.includes(k)
        ));

    return matchesCat && matchesQuery;
  });

  const handleServicePress = (route: string) => {
    if (isGuestMode) {
      setIsAuthGateVisible(true);
      return;
    }
    router.push(route as any);
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0B132B' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, isDarkMode && { color: '#F8FAFC' }]}>Municipal Services Directory</Text>
          <Text style={[styles.headerSubtitle, isDarkMode && { color: '#94A3B8' }]}>
            Access official Caloocan City government e-services, permits, education grants & digital clearance.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' }]}>
          <IconSymbol name="magnifyingglass" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          <TextInput
            style={[styles.searchInput, isDarkMode && { color: '#F8FAFC' }]}
            placeholder="Search municipal service, scholarship or permit..."
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

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  isSelected && (isDarkMode ? { backgroundColor: '#0284C7' } : styles.categoryPillActive)
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}>
                <Text style={[
                  styles.categoryPillText,
                  isDarkMode && { color: '#CBD5E1' },
                  isSelected && { color: '#FFFFFF' }
                ]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Guest Warning Banner */}
        {isGuestMode && (
          <View style={styles.guestWarningBanner}>
            <IconSymbol name="lock.fill" size={14} color="#B45309" />
            <Text style={styles.guestWarningText}>
              {' '}Sign in or register to access municipal e-services.
            </Text>
          </View>
        )}

        {/* Services List */}
        <View style={styles.servicesList}>
          {filteredServices.map((service) => {
            if (service.id === 'SVC-EDU') {
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    styles.educationBannerCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    isGuestMode && styles.serviceCardLocked
                  ]}
                  onPress={() => handleServicePress(service.route)}
                  activeOpacity={0.88}>
                  <ImageBackground
                    source={
                      isDarkMode
                        ? require('@/assets/images/education-dark.png')
                        : require('@/assets/images/education-light.png')
                    }
                    style={styles.educationBannerBg}
                    imageStyle={styles.educationBannerImageStyle}
                    resizeMode="cover">
                    <View style={styles.educationBannerContent}>
                      <View style={[styles.educationIconCircle, isDarkMode && { backgroundColor: '#1C2541' }]}>
                        <IconSymbol name="book.closed.fill" size={24} color={isDarkMode ? '#C084FC' : '#7E22CE'} />
                      </View>
                      <Text style={[styles.educationBannerTitle, isDarkMode && { color: '#F8FAFC' }]}>
                        Education & Scholarship
                      </Text>
                      <Text style={[styles.educationBannerSub, isDarkMode && { color: '#CBD5E1' }]}>
                        Manage applications, renewals, grants and scholar services.
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  isGuestMode && styles.serviceCardLocked
                ]}
                onPress={() => handleServicePress(service.route)}
                activeOpacity={0.85}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#0F2942' : service.iconBg }]}>
                    <IconSymbol name={service.iconName as any} size={22} color={isDarkMode ? '#38BDF8' : service.iconColor} />
                  </View>
                  <View style={styles.badgeRow}>
                    <Badge label={service.badgeLabel} variant={service.badgeVariant} />
                    {isGuestMode && (
                      <View style={styles.lockBadge}>
                        <IconSymbol name="lock.fill" size={11} color="#94A3B8" />
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>{service.title}</Text>
                <Text style={[styles.serviceSub, isDarkMode && { color: '#CBD5E1' }]}>{service.description}</Text>

                <View style={styles.cardFooterRow}>
                  <Text style={[styles.launchText, isDarkMode && { color: '#38BDF8' }, isGuestMode && styles.launchTextLocked]}>
                    {isGuestMode ? 'Login Required' : 'Open E-Service'}
                  </Text>
                  <IconSymbol name={isGuestMode ? 'lock.fill' : 'chevron.right'} size={14} color={isGuestMode ? '#94A3B8' : isDarkMode ? '#38BDF8' : '#176B87'} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* AUTH GATE MODAL */}
      <Modal
        visible={isAuthGateVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAuthGateVisible(false)}>
        <View style={styles.authGateOverlay}>
          <View style={[styles.authGateCard, isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B', borderWidth: 1 }]}>
            {/* Icon Ring */}
            <View style={[styles.authGateIconRing, isDarkMode && { backgroundColor: '#0F2942' }]}>
              <IconSymbol name="lock.shield.fill" size={34} color={isDarkMode ? '#38BDF8' : '#165B7E'} />
            </View>

            {/* Title */}
            <Text style={[styles.authGateTitle, isDarkMode && { color: '#F8FAFC' }]}>Sign In Required</Text>
            <Text style={[styles.authGateSub, isDarkMode && { color: '#CBD5E1' }]}>
              This municipal e-service is only accessible to registered Caloocan City citizens. Please sign in to continue.
            </Text>

            {/* Divider with city branding */}
            <View style={styles.authGateBrandRow}>
              <View style={[styles.authGateBrandLine, isDarkMode && { backgroundColor: '#3A506B' }]} />
              <Text style={[styles.authGateBrandText, isDarkMode && { color: '#94A3B8' }]}>CALOOCAN CITY GOVERNMENT</Text>
              <View style={[styles.authGateBrandLine, isDarkMode && { backgroundColor: '#3A506B' }]} />
            </View>

            {/* Buttons */}
            <View style={styles.authGateActions}>
              <TouchableOpacity
                style={styles.authGateLoginBtn}
                onPress={() => {
                  setIsAuthGateVisible(false);
                  router.replace('/(auth)/login' as any);
                }}
                activeOpacity={0.88}>
                <IconSymbol name="person.fill" size={16} color="#FFFFFF" />
                <Text style={styles.authGateLoginText}>Sign In to My Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authGateCancelBtn, isDarkMode && { backgroundColor: '#334155', borderColor: '#475569' }]}
                onPress={() => setIsAuthGateVisible(false)}
                activeOpacity={0.7}>
                <Text style={[styles.authGateCancelText, isDarkMode && { color: '#F8FAFC' }]}>Continue Browsing as Guest</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.authGateFooter}>
              <IconSymbol name="shield.fill" size={11} color="#94A3B8" />
              <Text style={[styles.authGateFooterText, isDarkMode && { color: '#94A3B8' }]}>  Protected by Caloocan City E-Governance Portal</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

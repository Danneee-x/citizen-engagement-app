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

export interface SurveyItem {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  estimatedTime: string;
  closingDate: string;
  status: 'Open' | 'Completed' | 'Closing Soon';
  isPublicResults: boolean;
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: string;
  title: string;
  type: 'multiple_choice' | 'multiple_selection' | 'yes_no' | 'rating_scale' | 'likert_scale' | 'short_answer' | 'long_answer';
  options?: string[];
  required?: boolean;
}

export interface ConsultationItem {
  id: string;
  title: string;
  category: string;
  closingDate: string;
  backgroundInfo: string;
  objective: string;
  participantsCount: number;
}

export const SURVEYS_DATA: SurveyItem[] = [
  {
    id: 'srv-1',
    title: 'Caloocan Urban Mobility & Bike Lane Expansion 2026',
    shortDescription: 'Share your feedback on dedicated bike corridors, pedestrian walkability, and UV express terminal relocation along Samson Road & Monumento.',
    category: 'Urban Mobility & Transport',
    estimatedTime: '4 mins',
    closingDate: 'August 31, 2026',
    status: 'Open',
    isPublicResults: true,
    questions: [
      {
        id: 'q1',
        title: 'How often do you commute or travel within Caloocan City using active transport (walking, cycling, e-scooter)?',
        type: 'multiple_choice',
        options: ['Daily', '3-4 times a week', 'Once a week', 'Rarely / Never'],
      },
      {
        id: 'q2',
        title: 'Which arterial routes do you think need immediate protected bike lane barriers?',
        type: 'multiple_selection',
        options: ['Samson Road (Monumento to Malabon boundary)', 'Camarin Road (North Caloocan)', 'Bagumbong - Bignay Access Road', 'Rizal Avenue Extension'],
      },
      {
        id: 'q3',
        title: 'Do you support relocating street-side tricycle queues into designated off-street multi-modal bays?',
        type: 'yes_no',
      },
      {
        id: 'q4',
        title: 'Rate the overall pedestrian safety and streetlighting of your primary commute route:',
        type: 'rating_scale',
      },
      {
        id: 'q5',
        title: '“The current pedestrian overpasses in Caloocan are well-maintained, accessible for PWDs, and safe at night.”',
        type: 'likert_scale',
      },
      {
        id: 'q6',
        title: 'What is your primary Barangay or terminal checkpoint during rush hour?',
        type: 'short_answer',
      },
      {
        id: 'q7',
        title: 'What specific mobility improvement would make the biggest positive difference for your daily travel in Caloocan?',
        type: 'long_answer',
      },
    ],
  },
  {
    id: 'srv-2',
    title: 'Community Waste Segregation & Green Energy Initiative',
    shortDescription: 'Evaluation of household garbage collection schedules, barangay composting hubs, and solar streetlighting rollout across Districts 1, 2, and 3.',
    category: 'Environment & Sanitation',
    estimatedTime: '3 mins',
    closingDate: 'September 15, 2026',
    status: 'Closing Soon',
    isPublicResults: true,
    questions: [
      {
        id: 'q2_1',
        title: 'Does your household actively practice biodegradable vs non-biodegradable waste separation?',
        type: 'yes_no',
      },
      {
        id: 'q2_2',
        title: 'Which environmental programs would you like Caloocan to prioritize?',
        type: 'multiple_selection',
        options: ['Barangay Materials Recovery Facilities (MRF)', 'River Cleanups & Trash Traps', 'Community Solar Streetlights', 'Plastic-for-Rice Incentive Programs'],
      },
      {
        id: 'q2_3',
        title: 'Rate the promptness of garbage collection trucks in your neighborhood:',
        type: 'rating_scale',
      },
      {
        id: 'q2_4',
        title: 'Provide any suggestions to eliminate illegal dumping spots in your area:',
        type: 'long_answer',
      },
    ],
  },
];

export const CONSULTATIONS_DATA: ConsultationItem[] = [
  {
    id: 'cons-1',
    title: 'Draft Ordinance No. 2026-042: Night Market & Micro-Vendor Formalization Program',
    category: 'Local Economic Development',
    closingDate: 'September 10, 2026',
    backgroundInfo:
      'Caloocan City Council is drafting Ordinance 2026-042 to establish regulated, clean night market economic zones with subsidized power, sanitary water connections, and digital POS payment systems for micro-entrepreneurs and food vendors along designated pedestrian streets.',
    objective:
      'Balancing informal vendor livelihood opportunities with pedestrian walkability, food safety compliance, and zero-extortion security monitoring.',
    participantsCount: 1420,
  },
  {
    id: 'cons-2',
    title: 'Comprehensive Youth Sports & After-School Tech Hub Expansion',
    category: 'Youth & Education Policy',
    closingDate: 'September 25, 2026',
    backgroundInfo:
      'The City Government is allocating ₱85M capital development funding to upgrade 15 barangay multi-purpose courts into covered climate-resilient community centers equipped with free public WiFi and AI Robotics coding learning pods for public school students.',
    objective:
      'Gathering citizen input on proposed locations, facility schedules, and security measures for youth hubs.',
    participantsCount: 980,
  },
];

export const LIKERT_OPTIONS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral / Undecided',
  'Agree',
  'Strongly Agree',
];

export default function PublicSurveysScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Active Tab: 'surveys' | 'consultations'
  const [activeTab, setActiveTab] = useState<'surveys' | 'consultations'>('surveys');

  // Active Survey Questionnaire State
  const [activeSurvey, setActiveSurvey] = useState<SurveyItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);

  // Survey Submission Confirmation State
  const [surveySubmittedData, setSurveySubmittedData] = useState<{
    surveyTitle: string;
    dateSubmitted: string;
    isPublicResults: boolean;
  } | null>(null);

  // Public Results Modal State
  const [isResultsModalVisible, setIsResultsModalVisible] = useState(false);

  // Active Consultation Modal State
  const [activeConsultation, setActiveConsultation] = useState<ConsultationItem | null>(null);
  const [consultationStance, setConsultationStance] = useState<'In Favor' | 'Neutral' | 'Against' | 'Suggested Amendments'>('In Favor');
  const [consultationComment, setConsultationComment] = useState('');
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationSuccessMsg, setConsultationSuccessMsg] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleStartSurvey = (survey: SurveyItem) => {
    setActiveSurvey(survey);
    setAnswers({});
    setSurveySubmittedData(null);
  };

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleToggleMultiSelection = (qId: string, opt: string) => {
    const currentList: string[] = answers[qId] || [];
    if (currentList.includes(opt)) {
      setAnswers((prev) => ({ ...prev, [qId]: currentList.filter((i) => i !== opt) }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: [...currentList, opt] }));
    }
  };

  const handleSubmitSurveyAnswers = () => {
    if (!activeSurvey) return;

    setIsSubmittingSurvey(true);
    setTimeout(() => {
      setIsSubmittingSurvey(false);
      const now = new Date();
      const dateStr =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ` + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      setSurveySubmittedData({
        surveyTitle: activeSurvey.title,
        dateSubmitted: dateStr,
        isPublicResults: activeSurvey.isPublicResults,
      });
    }, 850);
  };

  const handleSubmitConsultationOpinion = () => {
    if (!consultationComment.trim()) {
      Alert.alert('Required Field', 'Please write your comment or suggestion for the consultation.');
      return;
    }

    setIsSubmittingConsultation(true);
    setTimeout(() => {
      setIsSubmittingConsultation(false);
      setConsultationSuccessMsg(
        'Your position and suggestions have been formally recorded and forwarded to the Caloocan City Legislative Committee.'
      );
    }, 800);
  };

  const handleCloseConsultationModal = () => {
    setActiveConsultation(null);
    setConsultationComment('');
    setConsultationSuccessMsg(null);
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
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeSurvey) {
              setActiveSurvey(null);
              setSurveySubmittedData(null);
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
          <Text style={[styles.backText, isDarkMode && { color: '#38BDF8' }]}>
            {activeSurvey ? 'Back to Surveys List' : 'Back to Services Directory'}
          </Text>
        </TouchableOpacity>

        {/* ── NOT IN SURVEY MODE: SHOW MAIN HUB ── */}
        {!activeSurvey ? (
          <>
            {/* Header Banner */}
            <View
              style={[
                styles.headerBannerCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.bannerTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <IconSymbol name="bubble.left.and.bubble.right.fill" size={24} color="#7C3AED" />
                </View>
                <Badge label="CIVIC ENGAGEMENT" variant="info" />
              </View>
              <Text style={[styles.serviceTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Public Surveys & Consultations
              </Text>
              <Text style={[styles.serviceExplanation, isDarkMode && { color: '#94A3B8' }]}>
                Make your voice heard. Participate in official policy surveys, urban planning consultations, and community initiatives in Caloocan City.
              </Text>
            </View>

            {/* TAB SELECTOR */}
            <View
              style={[
                styles.tabContainer,
                isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B' },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'surveys' && styles.tabButtonActive,
                  activeTab === 'surveys' && isDarkMode && { backgroundColor: '#0284C7' },
                ]}
                onPress={() => setActiveTab('surveys')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="list.bullet.clipboard.fill"
                  size={16}
                  color={activeTab === 'surveys' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'surveys' && styles.tabButtonTextActive,
                    isDarkMode && activeTab !== 'surveys' && { color: '#94A3B8' },
                  ]}
                >
                  Active Surveys ({SURVEYS_DATA.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'consultations' && styles.tabButtonActive,
                  activeTab === 'consultations' && isDarkMode && { backgroundColor: '#0284C7' },
                ]}
                onPress={() => setActiveTab('consultations')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="person.3.fill"
                  size={16}
                  color={activeTab === 'consultations' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'consultations' && styles.tabButtonTextActive,
                    isDarkMode && activeTab !== 'consultations' && { color: '#94A3B8' },
                  ]}
                >
                  Civic Consultations ({CONSULTATIONS_DATA.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── TAB 1: SURVEYS LIST ── */}
            {activeTab === 'surveys' && (
              <View style={styles.listContainer}>
                {SURVEYS_DATA.map((survey) => (
                  <View
                    key={survey.id}
                    style={[
                      styles.surveyCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    <View style={styles.surveyCardTop}>
                      <Badge
                        label={survey.category}
                        variant="info"
                      />
                      <Badge
                        label={survey.status.toUpperCase()}
                        variant={survey.status === 'Closing Soon' ? 'warning' : 'success'}
                      />
                    </View>

                    <Text style={[styles.surveyCardTitle, isDarkMode && { color: '#F8FAFC' }]}>
                      {survey.title}
                    </Text>
                    <Text style={[styles.surveyCardDesc, isDarkMode && { color: '#CBD5E1' }]}>
                      {survey.shortDescription}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="clock.fill" size={13} color="#0284C7" />
                        <Text style={[styles.metaText, isDarkMode && { color: '#94A3B8' }]}>
                          Est. {survey.estimatedTime}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol name="calendar" size={13} color="#D97706" />
                        <Text style={[styles.metaText, isDarkMode && { color: '#94A3B8' }]}>
                          Closes: {survey.closingDate}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.startSurveyBtn}
                      onPress={() => handleStartSurvey(survey)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.startSurveyBtnText}>Answer Survey</Text>
                      <IconSymbol name="arrow.right" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── TAB 2: CONSULTATIONS LIST ── */}
            {activeTab === 'consultations' && (
              <View style={styles.listContainer}>
                {CONSULTATIONS_DATA.map((cons) => (
                  <View
                    key={cons.id}
                    style={[
                      styles.surveyCard,
                      isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                    ]}
                  >
                    <View style={styles.surveyCardTop}>
                      <Badge label={cons.category} variant="info" />
                      <View style={styles.participantsBadge}>
                        <IconSymbol name="person.2.fill" size={12} color="#0284C7" />
                        <Text style={styles.participantsText}>
                          {cons.participantsCount.toLocaleString()} Participated
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.surveyCardTitle, isDarkMode && { color: '#F8FAFC' }]}>
                      {cons.title}
                    </Text>
                    <Text style={[styles.surveyCardDesc, isDarkMode && { color: '#CBD5E1' }]} numberOfLines={3}>
                      {cons.backgroundInfo}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="calendar" size={13} color="#D97706" />
                        <Text style={[styles.metaText, isDarkMode && { color: '#94A3B8' }]}>
                          Feedback Period: Until {cons.closingDate}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.startSurveyBtn, { backgroundColor: '#7C3AED' }]}
                      onPress={() => setActiveConsultation(cons)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.startSurveyBtnText}>Read & Submit Opinion</Text>
                      <IconSymbol name="bubble.left.fill" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : !surveySubmittedData ? (
          /* ── ACTIVE SURVEY QUESTIONNAIRE ── */
          <View
            style={[
              styles.questionnaireCard,
              isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
            ]}
          >
            <View style={styles.surveyHeader}>
              <Badge label={activeSurvey.category} variant="info" />
              <Text style={[styles.questionnaireTitle, isDarkMode && { color: '#F8FAFC' }]}>
                {activeSurvey.title}
              </Text>
              <Text style={[styles.questionnaireSub, isDarkMode && { color: '#94A3B8' }]}>
                Please answer all questions below thoughtfully to guide LGU planning.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Questions Form */}
            {activeSurvey.questions.map((q, idx) => {
              const currentVal = answers[q.id];

              return (
                <View key={q.id} style={styles.questionBlock}>
                  <Text style={[styles.questionTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {idx + 1}. {q.title}
                  </Text>

                  {/* 1. Multiple Choice */}
                  {q.type === 'multiple_choice' && q.options && (
                    <View style={styles.optionsList}>
                      {q.options.map((opt) => {
                        const isChosen = currentVal === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.optionChoice,
                              isChosen && styles.optionChoiceSelected,
                              isDarkMode && { backgroundColor: isChosen ? '#152238' : '#0B132B', borderColor: '#3A506B' },
                            ]}
                            onPress={() => handleAnswerChange(q.id, opt)}
                            activeOpacity={0.8}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                isChosen && styles.radioCircleSelected,
                              ]}
                            >
                              {isChosen && <View style={styles.radioInner} />}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                isChosen && { color: '#0284C7', fontWeight: '700' },
                                isDarkMode && { color: isChosen ? '#38BDF8' : '#F8FAFC' },
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 2. Multiple Selection */}
                  {q.type === 'multiple_selection' && q.options && (
                    <View style={styles.optionsList}>
                      {q.options.map((opt) => {
                        const isSelected = (currentVal || []).includes(opt);
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.optionChoice,
                              isSelected && styles.optionChoiceSelected,
                              isDarkMode && { backgroundColor: isSelected ? '#152238' : '#0B132B', borderColor: '#3A506B' },
                            ]}
                            onPress={() => handleToggleMultiSelection(q.id, opt)}
                            activeOpacity={0.8}
                          >
                            <View
                              style={[
                                styles.checkboxSquare,
                                isSelected && styles.checkboxSquareSelected,
                              ]}
                            >
                              {isSelected && <IconSymbol name="checkmark" size={11} color="#FFFFFF" />}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && { color: '#0284C7', fontWeight: '700' },
                                isDarkMode && { color: isSelected ? '#38BDF8' : '#F8FAFC' },
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 3. Yes / No */}
                  {q.type === 'yes_no' && (
                    <View style={styles.yesNoRow}>
                      {['Yes', 'No'].map((choice) => {
                        const isChosen = currentVal === choice;
                        return (
                          <TouchableOpacity
                            key={choice}
                            style={[
                              styles.yesNoButton,
                              isChosen && styles.yesNoButtonSelected,
                              isDarkMode && { backgroundColor: isChosen ? '#0284C7' : '#152238', borderColor: '#3A506B' },
                            ]}
                            onPress={() => handleAnswerChange(q.id, choice)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.yesNoText,
                                isChosen && styles.yesNoTextSelected,
                                isDarkMode && !isChosen && { color: '#CBD5E1' },
                              ]}
                            >
                              {choice}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 4. Rating Scale (1 to 5 Stars) */}
                  {q.type === 'rating_scale' && (
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (currentVal || 0) >= star;
                        return (
                          <TouchableOpacity
                            key={star}
                            style={styles.starTouch}
                            onPress={() => handleAnswerChange(q.id, star)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol
                              name="star.fill"
                              size={32}
                              color={isFilled ? '#F59E0B' : isDarkMode ? '#334155' : '#CBD5E1'}
                            />
                            <Text style={[styles.starNum, isDarkMode && { color: '#94A3B8' }]}>
                              {star}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 5. Likert Scale */}
                  {q.type === 'likert_scale' && (
                    <View style={styles.likertList}>
                      {LIKERT_OPTIONS.map((level) => {
                        const isSelected = currentVal === level;
                        return (
                          <TouchableOpacity
                            key={level}
                            style={[
                              styles.likertItem,
                              isSelected && styles.likertItemSelected,
                              isDarkMode && { backgroundColor: isSelected ? '#152238' : '#0B132B', borderColor: '#3A506B' },
                            ]}
                            onPress={() => handleAnswerChange(q.id, level)}
                            activeOpacity={0.8}
                          >
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
                                styles.likertText,
                                isSelected && { color: '#0284C7', fontWeight: '800' },
                                isDarkMode && { color: isSelected ? '#38BDF8' : '#F8FAFC' },
                              ]}
                            >
                              {level}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 6. Short Answer */}
                  {q.type === 'short_answer' && (
                    <TextInput
                      style={[
                        styles.shortInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder="Type your brief answer here..."
                      placeholderTextColor="#94A3B8"
                      value={currentVal || ''}
                      onChangeText={(txt) => handleAnswerChange(q.id, txt)}
                    />
                  )}

                  {/* 7. Long Answer */}
                  {q.type === 'long_answer' && (
                    <TextInput
                      style={[
                        styles.longInput,
                        isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                      ]}
                      placeholder="Write your suggestions and thoughts in detail..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                      value={currentVal || ''}
                      onChangeText={(txt) => handleAnswerChange(q.id, txt)}
                    />
                  )}
                </View>
              );
            })}

            {/* Submit Response Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmittingSurvey && { opacity: 0.7 }]}
              onPress={handleSubmitSurveyAnswers}
              disabled={isSubmittingSurvey}
              activeOpacity={0.88}
            >
              {isSubmittingSurvey ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Response</Text>
                  <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ── AFTER SUBMISSION CONFIRMATION ── */
          <View style={styles.postSubmitContainer}>
            <View style={styles.successIconCircle}>
              <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
            </View>

            <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Response Submitted!
            </Text>
            <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
              Thank you for sharing your feedback. Your responses directly guide city development decisions.
            </Text>

            {/* Summary Card */}
            <View
              style={[
                styles.refCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Survey Title:</Text>
                <Text style={[styles.metaVal, { flex: 1, textAlign: 'right' }, isDarkMode && { color: '#F8FAFC' }]}>
                  {surveySubmittedData.surveyTitle}
                </Text>
              </View>

              <View style={styles.refDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date Submitted:</Text>
                <Text style={[styles.metaVal, isDarkMode && { color: '#38BDF8' }]}>
                  {surveySubmittedData.dateSubmitted}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Participation Status:</Text>
                <Text style={[styles.metaVal, { color: '#10B981', fontWeight: '800' }]}>
                  Completed ✓
                </Text>
              </View>
            </View>

            {/* Option to View Public Results */}
            {surveySubmittedData.isPublicResults && (
              <TouchableOpacity
                style={styles.viewResultsBtn}
                onPress={() => setIsResultsModalVisible(true)}
                activeOpacity={0.85}
              >
                <IconSymbol name="chart.bar.fill" size={16} color="#0284C7" />
                <Text style={styles.viewResultsBtnText}>View Public Survey Results & Analytics</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setActiveSurvey(null);
                setSurveySubmittedData(null);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.doneBtnText}>Return to Surveys List</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── CONSULTATION OPINION MODAL ── */}
      {activeConsultation && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseConsultationModal}
        >
          <SafeAreaView
            style={[
              styles.safeArea,
              { backgroundColor: isDarkMode ? '#0B132B' : '#F8FAFC' },
            ]}
          >
            <View
              style={[
                styles.modalNav,
                isDarkMode && { backgroundColor: '#0B132B', borderBottomColor: '#1C2541' },
              ]}
            >
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCloseConsultationModal}
              >
                <IconSymbol name="xmark" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
              </TouchableOpacity>
              <Text style={[styles.modalNavTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Civic Consultation
              </Text>
              <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {!consultationSuccessMsg ? (
                <View
                  style={[
                    styles.consultationDetailCard,
                    isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
                  ]}
                >
                  <Badge label={activeConsultation.category} variant="info" />
                  <Text style={[styles.consultationTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    {activeConsultation.title}
                  </Text>

                  <View style={styles.divider} />

                  {/* 1. Background Information */}
                  <Text style={[styles.consSectionHeading, isDarkMode && { color: '#38BDF8' }]}>
                    Background Information
                  </Text>
                  <Text style={[styles.consBodyText, isDarkMode && { color: '#CBD5E1' }]}>
                    {activeConsultation.backgroundInfo}
                  </Text>

                  {/* 2. Key Objectives */}
                  <Text style={[styles.consSectionHeading, isDarkMode && { color: '#38BDF8' }]}>
                    Consultation Objectives
                  </Text>
                  <Text style={[styles.consBodyText, isDarkMode && { color: '#CBD5E1' }]}>
                    {activeConsultation.objective}
                  </Text>

                  <View style={styles.divider} />

                  {/* 3. Submit Opinion */}
                  <Text style={[styles.consSectionHeading, isDarkMode && { color: '#F8FAFC' }]}>
                    Your Position / Opinion *
                  </Text>
                  <View style={styles.stanceGrid}>
                    {(['In Favor', 'Neutral', 'Against', 'Suggested Amendments'] as const).map((st) => {
                      const isChosen = consultationStance === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.stanceBtn,
                            isChosen && styles.stanceBtnChosen,
                            isDarkMode && { backgroundColor: isChosen ? '#7C3AED' : '#152238', borderColor: '#3A506B' },
                          ]}
                          onPress={() => setConsultationStance(st)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.stanceBtnText,
                              isChosen && styles.stanceBtnTextChosen,
                              isDarkMode && !isChosen && { color: '#CBD5E1' },
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 4. Add Comments / Suggestions */}
                  <Text style={[styles.consSectionHeading, isDarkMode && { color: '#F8FAFC' }]}>
                    Comments, Recommendations & Proposed Amendments *
                  </Text>
                  <TextInput
                    style={[
                      styles.longInput,
                      isDarkMode && { backgroundColor: '#152238', borderColor: '#3A506B', color: '#F8FAFC' },
                    ]}
                    placeholder="Provide your specific input, neighborhood concerns, or policy recommendations..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={5}
                    value={consultationComment}
                    onChangeText={setConsultationComment}
                  />

                  {/* Submit Opinion Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: '#7C3AED' }, isSubmittingConsultation && { opacity: 0.7 }]}
                    onPress={handleSubmitConsultationOpinion}
                    disabled={isSubmittingConsultation}
                    activeOpacity={0.88}
                  >
                    {isSubmittingConsultation ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Submit Consultation Response</Text>
                        <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.postSubmitContainer}>
                  <View style={styles.successIconCircle}>
                    <IconSymbol name="checkmark.seal.fill" size={42} color="#10B981" />
                  </View>
                  <Text style={[styles.postSubmitTitle, isDarkMode && { color: '#F8FAFC' }]}>
                    Consultation Recorded
                  </Text>
                  <Text style={[styles.postSubmitSub, isDarkMode && { color: '#94A3B8' }]}>
                    {consultationSuccessMsg}
                  </Text>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={handleCloseConsultationModal}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.doneBtnText}>Close Consultation</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── PUBLIC RESULTS MODAL ── */}
      <Modal
        visible={isResultsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsResultsModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: isDarkMode ? '#0B132B' : '#F8FAFC' },
          ]}
        >
          <View
            style={[
              styles.modalNav,
              isDarkMode && { backgroundColor: '#0B132B', borderBottomColor: '#1C2541' },
            ]}
          >
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsResultsModalVisible(false)}
            >
              <IconSymbol name="xmark" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalNavTitle, isDarkMode && { color: '#F8FAFC' }]}>
              Public Results & Analytics
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.resultsCard,
                isDarkMode && { backgroundColor: '#1C2541', borderColor: '#3A506B' },
              ]}
            >
              <Badge label="LIVE AGGREGATED METRICS" variant="success" />
              <Text style={[styles.resultsTitle, isDarkMode && { color: '#F8FAFC' }]}>
                Caloocan Urban Mobility & Bike Lane Expansion 2026
              </Text>
              <Text style={[styles.resultsMeta, isDarkMode && { color: '#94A3B8' }]}>
                Total Verified Citizen Responses: 3,412
              </Text>

              <View style={styles.divider} />

              {/* Metric 1 */}
              <View style={styles.metricBlock}>
                <Text style={[styles.metricLabel, isDarkMode && { color: '#F8FAFC' }]}>
                  Support Relocating Tricycle Queues into Off-Street Bays:
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: '84%', backgroundColor: '#10B981' }]} />
                </View>
                <Text style={styles.metricPercent}>84% YES (2,866 Votes)</Text>
              </View>

              {/* Metric 2 */}
              <View style={styles.metricBlock}>
                <Text style={[styles.metricLabel, isDarkMode && { color: '#F8FAFC' }]}>
                  Top Priority Route: Samson Road (Monumento to Malabon):
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: '68%', backgroundColor: '#0284C7' }]} />
                </View>
                <Text style={styles.metricPercent}>68% Priority Ranking</Text>
              </View>

              {/* Metric 3 */}
              <View style={styles.metricBlock}>
                <Text style={[styles.metricLabel, isDarkMode && { color: '#F8FAFC' }]}>
                  Overall Pedestrian Safety Satisfaction:
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: '72%', backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.metricPercent}>3.8 / 5.0 Average Star Rating</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setIsResultsModalVisible(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.doneBtnText}>Back to Survey</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 14,
  },
  surveyCard: {
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
  surveyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  participantsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  surveyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
  },
  surveyCardDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  startSurveyBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  startSurveyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* Questionnaire */
  questionnaireCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  surveyHeader: {
    marginBottom: 8,
  },
  questionnaireTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  questionnaireSub: {
    fontSize: 12.5,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  questionBlock: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 20,
  },
  optionsList: {
    gap: 8,
  },
  optionChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
  },
  optionChoiceSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
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
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0284C7',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#0284C7',
  },
  optionText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  yesNoTextSelected: {
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  starTouch: {
    alignItems: 'center',
    gap: 4,
  },
  starNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  likertList: {
    gap: 6,
  },
  likertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 8,
  },
  likertItemSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  likertText: {
    fontSize: 12.5,
    color: '#334155',
  },
  shortInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  longInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 85,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Post-submit */
  postSubmitContainer: {
    alignItems: 'center',
    paddingTop: 12,
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
    lineHeight: 18,
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
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  refDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  viewResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 10,
  },
  viewResultsBtnText: {
    color: '#0284C7',
    fontSize: 13.5,
    fontWeight: '800',
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

  /* Consultation Modal */
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
  consultationDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  consultationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    lineHeight: 24,
  },
  consSectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 10,
  },
  consBodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 6,
  },
  stanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  stanceBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stanceBtnChosen: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  stanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  stanceBtnTextChosen: {
    color: '#FFFFFF',
  },

  /* Results Modal */
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  resultsMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  metricBlock: {
    marginBottom: 14,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  barContainer: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  metricPercent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
});

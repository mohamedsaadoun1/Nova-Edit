import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  videoUrl?: string;
  relatedArticles?: string[];
  lastUpdated: Date;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

interface HelpSystemProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialQuery?: string;
  theme?: 'dark' | 'light';
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export default function HelpSystem({
  visible,
  onClose,
  initialCategory,
  initialQuery = '',
  theme = 'dark',
  userLevel = 'beginner'
}: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'faq' | 'contact'>('browse');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      const results = helpDatabase.categories
        .flatMap(cat => cat.articles)
        .filter(article => 
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 10);
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const renderHeader = () => (
    <View style={[
      styles.header,
      { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }
    ]}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons 
          name="close" 
          size={24} 
          color={theme === 'dark' ? '#ffffff' : '#333333'} 
        />
      </TouchableOpacity>
      
      <Text style={[
        styles.headerTitle,
        { color: theme === 'dark' ? '#ffffff' : '#333333' }
      ]}>
        مركز المساعدة
      </Text>
      
      <TouchableOpacity onPress={() => setActiveTab('contact')} style={styles.contactButton}>
        <Ionicons 
          name="chatbubble-ellipses" 
          size={20} 
          color={theme === 'dark' ? '#007AFF' : '#0066CC'} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[
      styles.searchContainer,
      { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }
    ]}>
      <View style={[
        styles.searchBar,
        { backgroundColor: theme === 'dark' ? '#333333' : '#f0f0f0' }
      ]}>
        <Ionicons name="search" size={20} color="#999999" />
        <TextInput
          style={[
            styles.searchInput,
            { color: theme === 'dark' ? '#ffffff' : '#333333' }
          ]}
          placeholder="ابحث عن مساعدة..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setActiveTab('search')}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[
      styles.tabContainer,
      { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa' }
    ]}>
      {[
        { id: 'browse', name: 'تصفح', icon: 'library' },
        { id: 'search', name: 'بحث', icon: 'search' },
        { id: 'faq', name: 'أسئلة شائعة', icon: 'help-circle' },
        { id: 'contact', name: 'اتصل بنا', icon: 'mail' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
            { borderBottomColor: theme === 'dark' ? '#007AFF' : '#0066CC' }
          ]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={18}
            color={
              activeTab === tab.id
                ? (theme === 'dark' ? '#007AFF' : '#0066CC')
                : '#999999'
            }
          />
          <Text style={[
            styles.tabText,
            {
              color: activeTab === tab.id
                ? (theme === 'dark' ? '#007AFF' : '#0066CC')
                : '#999999'
            }
          ]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryList = () => (
    <ScrollView style={styles.contentContainer}>
      {helpDatabase.categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryCard,
            { backgroundColor: theme === 'dark' ? '#333333' : '#ffffff' }
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <View style={styles.categoryHeader}>
            <View style={styles.categoryIcon}>
              <Ionicons 
                name={category.icon as any} 
                size={24} 
                color={theme === 'dark' ? '#007AFF' : '#0066CC'} 
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[
                styles.categoryName,
                { color: theme === 'dark' ? '#ffffff' : '#333333' }
              ]}>
                {category.name}
              </Text>
              <Text style={[
                styles.categoryDescription,
                { color: theme === 'dark' ? '#cccccc' : '#666666' }
              ]}>
                {category.description}
              </Text>
              <Text style={[
                styles.categoryCount,
                { color: theme === 'dark' ? '#999999' : '#888888' }
              ]}>
                {category.articles.length} مقال
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderArticleList = (articles: HelpArticle[]) => (
    <ScrollView style={styles.contentContainer}>
      {articles.map((article) => (
        <TouchableOpacity
          key={article.id}
          style={[
            styles.articleCard,
            { backgroundColor: theme === 'dark' ? '#333333' : '#ffffff' }
          ]}
          onPress={() => setSelectedArticle(article)}
        >
          <View style={styles.articleHeader}>
            <Text style={[
              styles.articleTitle,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              {article.title}
            </Text>
            <View style={styles.articleMeta}>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(article.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {getDifficultyLabel(article.difficulty)}
                </Text>
              </View>
              <Text style={[
                styles.timeEstimate,
                { color: theme === 'dark' ? '#999999' : '#666666' }
              ]}>
                {article.estimatedTime} دقيقة
              </Text>
            </View>
          </View>
          {article.videoUrl && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play-circle" size={16} color="#007AFF" />
              <Text style={styles.videoText}>يحتوي على فيديو</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderArticleContent = () => {
    if (!selectedArticle) return null;

    return (
      <ScrollView style={styles.contentContainer}>
        <View style={[
          styles.articleContentCard,
          { backgroundColor: theme === 'dark' ? '#333333' : '#ffffff' }
        ]}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedArticle(null)}
          >
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>العودة</Text>
          </TouchableOpacity>

          {/* Article header */}
          <Text style={[
            styles.articleContentTitle,
            { color: theme === 'dark' ? '#ffffff' : '#333333' }
          ]}>
            {selectedArticle.title}
          </Text>

          <View style={styles.articleMetaRow}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(selectedArticle.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {getDifficultyLabel(selectedArticle.difficulty)}
              </Text>
            </View>
            <Text style={[
              styles.timeEstimate,
              { color: theme === 'dark' ? '#999999' : '#666666' }
            ]}>
              ⏱️ {selectedArticle.estimatedTime} دقيقة
            </Text>
          </View>

          {/* Video button if available */}
          {selectedArticle.videoUrl && (
            <TouchableOpacity style={styles.videoButton}>
              <Ionicons name="play-circle" size={24} color="#ffffff" />
              <Text style={styles.videoButtonText}>شاهد الفيديو التوضيحي</Text>
            </TouchableOpacity>
          )}

          {/* Article content */}
          <Text style={[
            styles.articleContent,
            { color: theme === 'dark' ? '#cccccc' : '#555555' }
          ]}>
            {selectedArticle.content}
          </Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <Text style={[
              styles.tagsLabel,
              { color: theme === 'dark' ? '#999999' : '#666666' }
            ]}>
              الكلمات المفتاحية:
            </Text>
            <View style={styles.tagsRow}>
              {selectedArticle.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Related articles */}
          {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[
                styles.relatedTitle,
                { color: theme === 'dark' ? '#ffffff' : '#333333' }
              ]}>
                مقالات ذات صلة
              </Text>
              {selectedArticle.relatedArticles.map((relatedId) => {
                const relatedArticle = findArticleById(relatedId);
                return relatedArticle ? (
                  <TouchableOpacity
                    key={relatedId}
                    style={styles.relatedArticle}
                    onPress={() => setSelectedArticle(relatedArticle)}
                  >
                    <Text style={[
                      styles.relatedArticleText,
                      { color: theme === 'dark' ? '#007AFF' : '#0066CC' }
                    ]}>
                      {relatedArticle.title}
                    </Text>
                  </TouchableOpacity>
                ) : null;
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderFAQ = () => (
    <ScrollView style={styles.contentContainer}>
      {helpDatabase.faqs
        .sort((a, b) => b.popularity - a.popularity)
        .map((faq) => (
          <FAQItem key={faq.id} faq={faq} theme={theme} />
        ))}
    </ScrollView>
  );

  const renderContactForm = () => (
    <ScrollView style={styles.contentContainer}>
      <View style={[
        styles.contactCard,
        { backgroundColor: theme === 'dark' ? '#333333' : '#ffffff' }
      ]}>
        <Text style={[
          styles.contactTitle,
          { color: theme === 'dark' ? '#ffffff' : '#333333' }
        ]}>
          اتصل بفريق الدعم
        </Text>
        
        <Text style={[
          styles.contactDescription,
          { color: theme === 'dark' ? '#cccccc' : '#666666' }
        ]}>
          لم تجد ما تبحث عنه؟ تواصل معنا وسنساعدك!
        </Text>

        <View style={styles.contactOptions}>
          <TouchableOpacity style={[
            styles.contactOption,
            { borderColor: theme === 'dark' ? '#007AFF' : '#0066CC' }
          ]}>
            <Ionicons name="mail" size={24} color={theme === 'dark' ? '#007AFF' : '#0066CC'} />
            <Text style={[
              styles.contactOptionText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              إرسال بريد إلكتروني
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[
            styles.contactOption,
            { borderColor: theme === 'dark' ? '#28a745' : '#198754' }
          ]}>
            <Ionicons name="chatbubbles" size={24} color={theme === 'dark' ? '#28a745' : '#198754'} />
            <Text style={[
              styles.contactOptionText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              دردشة مباشرة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[
            styles.contactOption,
            { borderColor: theme === 'dark' ? '#6f42c1' : '#5a2d91' }
          ]}>
            <Ionicons name="logo-discord" size={24} color={theme === 'dark' ? '#6f42c1' : '#5a2d91'} />
            <Text style={[
              styles.contactOptionText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              انضم لمجتمع Discord
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    if (selectedArticle) {
      return renderArticleContent();
    }

    if (selectedCategory) {
      const category = helpDatabase.categories.find(c => c.id === selectedCategory);
      return category ? renderArticleList(category.articles) : null;
    }

    switch (activeTab) {
      case 'search':
        return isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={[
              styles.loadingText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              جاري البحث...
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          renderArticleList(searchResults)
        ) : searchQuery.length > 2 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color="#999999" />
            <Text style={[
              styles.noResultsText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              لم نجد نتائج للبحث "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.searchPromptContainer}>
            <Ionicons name="search" size={48} color="#999999" />
            <Text style={[
              styles.searchPromptText,
              { color: theme === 'dark' ? '#ffffff' : '#333333' }
            ]}>
              ابحث عن أي شيء تريد تعلمه
            </Text>
          </View>
        );
      case 'faq':
        return renderFAQ();
      case 'contact':
        return renderContactForm();
      case 'browse':
      default:
        return renderCategoryList();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderHeader()}
          {renderSearchBar()}
          {renderTabs()}
          {renderContent()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// FAQ Item Component
function FAQItem({ faq, theme }: { faq: FAQ; theme: 'dark' | 'light' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={[
      styles.faqCard,
      { backgroundColor: theme === 'dark' ? '#333333' : '#ffffff' }
    ]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[
          styles.faqQuestion,
          { color: theme === 'dark' ? '#ffffff' : '#333333' }
        ]}>
          {faq.question}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#999999"
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <Text style={[
          styles.faqAnswer,
          { color: theme === 'dark' ? '#cccccc' : '#666666' }
        ]}>
          {faq.answer}
        </Text>
      )}
    </View>
  );
}

// Helper functions
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return '#28a745';
    case 'intermediate': return '#ffc107';
    case 'advanced': return '#dc3545';
    default: return '#6c757d';
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'مبتدئ';
    case 'intermediate': return 'متوسط';
    case 'advanced': return 'متقدم';
    default: return 'عام';
  }
}

function findArticleById(id: string): HelpArticle | undefined {
  return helpDatabase.categories
    .flatMap(cat => cat.articles)
    .find(article => article.id === id);
}

// Help Database
const helpDatabase: { categories: HelpCategory[]; faqs: FAQ[] } = {
  categories: [
    {
      id: 'getting_started',
      name: 'البداية',
      icon: 'play-circle',
      description: 'تعلم أساسيات Nova Edit وابدأ مشروعك الأول',
      articles: [
        {
          id: 'first_project',
          title: 'إنشاء مشروعك الأول',
          content: 'في هذا الدليل، ستتعلم كيفية إنشاء مشروع جديد واستيراد أول فيديو لك...',
          category: 'getting_started',
          tags: ['مبتدئ', 'مشروع', 'استيراد'],
          difficulty: 'beginner',
          estimatedTime: 3,
          videoUrl: 'https://example.com/video1',
          relatedArticles: ['import_video', 'basic_editing'],
          lastUpdated: new Date()
        }
      ]
    },
    {
      id: 'editing',
      name: 'التحرير',
      icon: 'cut',
      description: 'أدوات التحرير الأساسية والمتقدمة',
      articles: [
        {
          id: 'basic_cutting',
          title: 'قطع وتقسيم المقاطع',
          content: 'تعلم كيفية قطع وتقسيم مقاطع الفيديو بدقة...',
          category: 'editing',
          tags: ['قطع', 'تقسيم', 'Timeline'],
          difficulty: 'beginner',
          estimatedTime: 5,
          lastUpdated: new Date()
        }
      ]
    },
    {
      id: 'ai_features',
      name: 'ميزات الذكاء الاصطناعي',
      icon: 'sparkles',
      description: 'استخدم قوة الذكاء الاصطناعي في تحرير الفيديو',
      articles: [
        {
          id: 'ai_background_removal',
          title: 'إزالة الخلفية بالذكاء الاصطناعي',
          content: 'تعلم كيفية إزالة الخلفية من الفيديو باستخدام AI...',
          category: 'ai_features',
          tags: ['AI', 'خلفية', 'إزالة'],
          difficulty: 'intermediate',
          estimatedTime: 7,
          videoUrl: 'https://example.com/ai-video',
          lastUpdated: new Date()
        }
      ]
    }
  ],
  faqs: [
    {
      id: 'faq_1',
      question: 'هل Nova Edit مجاني تماماً؟',
      answer: 'نعم! Nova Edit مجاني تماماً مع جميع الميزات المتقدمة والذكاء الاصطناعي بدون أي رسوم أو اشتراكات.',
      category: 'general',
      popularity: 100
    },
    {
      id: 'faq_2',
      question: 'ما هي أفضل جودة للتصدير؟',
      answer: 'ننصح باستخدام جودة 1080p للمنصات الاجتماعية، و4K للمحتوى الاحترافي.',
      category: 'export',
      popularity: 85
    }
  ]
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },
  articleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  articleHeader: {
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeEstimate: {
    fontSize: 12,
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  videoText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  articleContentCard: {
    borderRadius: 12,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#007AFF',
    marginLeft: 4,
    fontSize: 16,
  },
  articleContentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  articleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
  },
  videoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#007AFF',
    fontSize: 12,
  },
  relatedSection: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  relatedArticle: {
    paddingVertical: 8,
  },
  relatedArticleText: {
    fontSize: 14,
  },
  faqCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 12,
    padding: 20,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  contactOptions: {
    gap: 12,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  contactOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  searchPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPromptText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
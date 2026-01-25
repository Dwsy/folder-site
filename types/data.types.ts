// Global Data Types
export interface GlobalData {
  header: HeaderData;
  footer: FooterData;
}

export interface HeaderData {
  labels: {
    expertise: string;
    insights: string;
    ourPeople: string;
  };
  languages: LanguageOption[];
  practices: NavigationLink[];
  sectors: NavigationLink[];
  insights: HeaderInsights;
}

export interface LanguageOption {
  label: string;
  url: string;
  code?: string;
  active?: boolean;
}

export interface NavigationLink {
  label: string;
  url: string;
}

export interface HeaderInsights {
  featured: FeaturedInsight[];
  topics: TopicItem[];
  latestThinking: LinkItem[];
  publications: LinkItem[];
  labels: {
    insights: string;
    featuredInsights: string;
    topics: string;
    latestThinking: string;
    publications: string;
    exploreAllInsights: string;
    exploreAllTopics: string;
    viewAllPublications: string;
    exploreOurInsights: string;
  };
}

export interface FeaturedInsight {
  title: string;
  link: string;
  image: string;
}

export interface TopicItem {
  title: string;
  link: string;
  image: string;
}

export interface LinkItem {
  title: string;
  link: string;
}

export interface FooterData {
  helpText: string;
  contactButton: {
    label: string;
    url: string;
  };
  columns: FooterColumn[];
  social: SocialLink[];
  legalData: LegalLink[];
  copyright: string;
  icp: IcpItem[];
}

export interface FooterColumn {
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  url: string;
  isTitle?: boolean;
  target?: string;
}

export interface SocialLink {
  icon: string;
  url: string;
}

export interface LegalLink {
  label: string;
  url: string;
}

export interface IcpItem {
  label: string;
  url: string;
}

// Home Config Types
export interface HomeHeroData {
  id: string;
  autoplay: boolean;
  delay: number;
  slides: HeroSlide[];
}

export interface HeroSlide {
  slideNum: number;
  total: number;
  itemClass: string;
  bannerClass: string;
  backgroundImage: string;
  title: string;
  url: string;
  description: string;
  buttonUrl: string;
  indicatorLabel: string;
}

export interface HomeTrendingData {
  title: string;
  items: TrendingItem[];
}

export interface TrendingItem {
  title: string;
  url: string;
  image: string;
  description: string;
}

export interface HomeLatestPublicationsData {
  title: string;
  pageSize: number;
  showNum: string;
  items: PublicationItem[];
  cta: CtaButton;
}

export interface PublicationItem {
  category: string;
  title: string;
  url: string;
  abstract: string;
  date: string;
}

export interface CtaButton {
  label: string;
  url: string;
}

export interface HomeFirmNewsData {
  title: string;
  pageSize: number;
  showNum: string;
  items: NewsItem[];
  cta: CtaButton;
}

export interface NewsItem {
  category: string;
  title: string;
  url: string;
  abstract: string;
  date: string;
}

export interface HomeLatestThinkingData {
  title: string;
  items: ThinkingItem[];
  cta: CtaButton | null;
}

export interface ThinkingItem {
  type: string;
  title: string;
  url: string;
  abstract: string;
  date: string;
}

export interface HomeTopicsData {
  containerId: string;
  containerClass: string;
  swiper: {
    id: string;
    autoplay: string;
    delay: string;
    autopauseDisabled: string;
  };
  title: string;
  items: TopicItem[];
  buttonLabel: string;
  exploreMore: {
    label: string;
    url: string;
  };
}

export interface HomePromoboxData {
  items: PromoboxItem[];
}

export interface PromoboxItem {
  modelClass: string;
  title: string;
  url: string;
  image: string;
  summary: string;
  buttonLabel: string;
}

export interface HomeProgressData {
  containerClass: string;
  id: string;
  leftClass: string;
  rightClass: string;
  iconClass: string;
}

// Article Data Types
export interface ArticleData {
  content: ContentBlock[];
  download: DownloadSection;
  hero: ArticleHero;
  latestThinking: LatestThinkingSection;
}

export type ContentBlock = string | HtmlContent;

export interface HtmlContent {
  type: 'html';
  value: string;
}

export interface DownloadSection {
  title: string;
  pubTitle: string;
  pubSubtitle: string;
  imgSrc: string;
  link: string;
  fileName: string;
  clId: string;
}

export interface ArticleHero {
  title: string;
  type: string;
  date: string;
  imgSrc: string;
}

export interface LatestThinkingSection {
  title: string;
  buttonText: string;
  buttonLink: string;
  items: LatestThinkingItem[];
}

export interface LatestThinkingItem {
  type: string;
  title: string;
  link: string;
  summary: string;
  date: string;
  clId: string;
}

// Simple Page Types
export interface SimplePageData {
  hero: ArticleHero;
  title: string;
  content: ContentBlock[];
}

// Skeleton Page Types
export interface SkeletonPageData {
  hero: ArticleHero;
  content: ContentBlock[];
  latestThinking: LatestThinkingSection;
}

// Page Sections Types
export interface PageSection<T = unknown> {
  type: string;
  data?: T;
  slot?: string;
}

export interface ArticlePageSections {
  hiddenInputs: PageSection<ArticlePageMeta>;
  hero: PageSection<ArticleHero>;
  breadcrumb: PageSection<{ articleTitle: string }>;
  articleBody: PageSection<ArticleData>;
  latestThinking: PageSection<LatestThinkingSection>;
}

export interface ArticlePageMeta {
  pageURL: string;
  pageName: string;
  pageTitle: string;
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  language: string;
  country: string;
}

export interface HomePageSections {
  header: PageSection;
  hero: PageSection<HomeHeroData>;
  trending: PageSection<HomeTrendingData>;
  latestPublications: PageSection<HomeLatestPublicationsData>;
  latestThinking: PageSection<HomeLatestThinkingData>;
  topics: PageSection<HomeTopicsData>;
  firmNews: PageSection<HomeFirmNewsData>;
  promobox: PageSection<HomePromoboxData>;
  progress: PageSection<HomeProgressData>;
}

// Content Types
export type ContentType = 'string' | 'html';

// Language
export type Language = 'en' | 'zh';
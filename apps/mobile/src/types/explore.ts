import type { ApiEnvelope } from './auth';

export interface ExploreFilterOption {
  label: string;
  value: string;
}

export interface ExploreFeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  goals: string[];
  route: string;
}

export interface ExploreTopicItem {
  id: string;
  title: string;
  summary: string;
  tag: string;
  route: string;
  publishedAt: string | null;
}

export interface ExploreContentItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  filterType: string;
  goals: string[];
  duration: string;
  stat: string;
  buttonText: string;
  route: string;
  sourceType:
    | 'lucky_item'
    | 'fortune_content'
    | 'report_template'
    | 'assessment_test'
    | 'fallback';
  sourceLabel: string;
  publishedAt: string | null;
}

export interface ExploreIndexData {
  isLoggedIn: boolean;
  searchPlaceholder: string;
  todayFit: {
    icon: string;
    text: string;
    route: string;
  };
  filters: {
    types: ExploreFilterOption[];
    goals: ExploreFilterOption[];
    sorts: ExploreFilterOption[];
  };
  defaultSort: 'recommended' | 'related' | 'latest';
  banner: {
    eyebrow: string;
    title: string;
    summary: string;
    ctaText: string;
    icon: string;
    route: string;
  };
  features: ExploreFeatureItem[];
  topics: ExploreTopicItem[];
  contents: ExploreContentItem[];
}

export type ExploreIndexResponse = ApiEnvelope<ExploreIndexData>;

export interface ExploreSearchData {
  keyword: string;
  sort: 'recommended' | 'related' | 'latest';
  features: ExploreFeatureItem[];
  topics: ExploreTopicItem[];
  contents: ExploreContentItem[];
}

export type ExploreSearchResponse = ApiEnvelope<ExploreSearchData>;

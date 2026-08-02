// types/siteContent.ts

export interface ContentSection {
  id: string;       // stable key so React doesn't lose focus on edit
  title: string;
  body: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HomepageContent {
  heroHeadline: string;
  heroSubhead: string;
  missionTitle: string;
  missionBody: string;
  sections: ContentSection[];
  faq: FaqItem[];
  updatedAt?: string;
}

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

export interface DonateContent {
  headline: string;
  body: string;
  // A Stripe Payment Link (or any hosted checkout URL) — paste one in
  // here from /admin/donate once Stripe access is sorted out. Until
  // then, the public /donate page shows a "coming soon" state instead
  // of a dead button.
  paymentLink?: string;
  updatedAt?: string;
}

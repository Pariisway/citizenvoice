// types/community.ts
//
// Community Chat: one directory of "profile cards" — communities, cities,
// counties, neighborhoods — each opening into its own room with a text
// discussion and a live Agora voice room. See app/community-chat/.

export type CommunityType = "county" | "city" | "neighborhood" | "statewide";

export interface Community {
  id: string;
  name: string;              // e.g. "St. Clair County", "Fairview Heights"
  type: CommunityType;
  description?: string;
  photoUrl?: string;
  areaCityFips?: string;
  areaCountyFips?: string;
  memberCount?: number;      // denormalized, informational only
  createdAt: string;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

// functions/src/index.ts
export { findMyRepresentatives } from "./findMyRepresentatives";
export { setAdminRole } from "./admin/setAdminRole";
export { generateAgoraToken } from "./voice/generateAgoraToken";
export { guardProposalCommentBursts, guardCommunityMessageBursts } from "./moderation/rateLimitGuard";
export { submitProposal } from "./billLab/submitProposal";
export { upvoteProposal } from "./billLab/upvoteProposal";

// Phase 2+ exports go here as they're built, e.g.:
// export { summarizeLegislation } from "./ai/summarizeLegislation";
// export { onBillStatusChange } from "./notifications/billNotifications";

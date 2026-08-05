// lib/defaultDonateContent.ts

import type { DonateContent } from "@/types/siteContent";

export const DEFAULT_DONATE_CONTENT: DonateContent = {
  headline: "Help keep Citizen Voice running",
  body:
    "Citizen Voice is free for everyone to use — no ads blocking content, no paywalls on civic information. " +
    "Running it costs real money: hosting, voice chat infrastructure, and the time it takes to review every " +
    "proposal that comes through. If this site has been useful to you, a donation helps keep it going.\n\n" +
    "Right now, Citizen Voice accepts donations as a personal/business account, not a registered nonprofit — " +
    "so donations aren't tax-deductible. We plan to move to 501(c)(4) status in the future, and this page will " +
    "be updated when that changes.",
  paymentLink: "",
};

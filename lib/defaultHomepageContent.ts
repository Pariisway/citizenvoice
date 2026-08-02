// lib/defaultHomepageContent.ts
//
// Real, substantial default copy — not lorem ipsum. Shown until an admin
// edits and saves real content through /admin/homepage. Written to
// actually teach something, both because that's the point of the site and
// because thin/placeholder content is exactly what gets a site rejected
// from AdSense review.

import type { HomepageContent } from "@/types/siteContent";

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroHeadline: "Learn how laws are made.\nBuild your own.",
  heroSubhead:
    "Citizen Voice is where everyday people learn how government actually works, understand the laws that affect their community, and turn their own ideas into well-supported proposals.",
  missionTitle: "You don't have to be an elected official to change your city.",
  missionBody:
    "Most people never learn how a law actually gets written, because most sources make it feel like it's not their job. Here, it is. Learn the process, then build a community proposal for the change you want to see.",
  sections: [
    {
      id: "what-is-a-bill",
      title: "What Is a Bill, Really?",
      body: "A bill is just an idea for a new law, written down in a specific format so a legislature can debate and vote on it. Before it's a law, it's a proposal — someone identified a problem (a dangerous intersection, an unfair fee, a gap in a program) and wrote up exactly what they think should change and why. Every law that exists today, from speed limits to school funding formulas, started as one of these documents. Bills get introduced by elected officials, but the ideas behind them almost always come from somewhere else first: a constituent's complaint, a community group's campaign, a problem someone noticed and decided to do something about. That's the part most people never see — and it's the part this platform is built around.",
    },
    {
      id: "who-writes-laws",
      title: "Who Actually Makes Your Laws?",
      body: "Everyone knows the President. Most people know their mayor. Almost nobody can name their state representative or state senator — which is a problem, because those are usually the people writing and voting on the laws that affect daily life most directly: property taxes, school policy, local infrastructure funding, zoning rules, criminal justice reform. Congress gets the headlines, but state legislatures and city councils write far more of the law that actually touches your street. Knowing who represents you at every level — city, county, state, and federal — is the first step to understanding how any of it works, and it's usually the one piece of information nobody ever hands you directly.",
    },
    {
      id: "how-you-can-get-involved",
      title: "How You Can Get Involved",
      body: "Civic participation isn't limited to voting once a year. You can watch a city council meeting from your phone, read a plain-English summary of a bill before it's voted on, show up to a public comment period, or — the part most people don't know is possible — draft your own community proposal and build public support for it. Change usually starts small: a handful of neighbors noticing the same problem, writing it down clearly, and bringing it to the people who can act on it. That process is learnable, and it's what Civic Academy and the Community Bill Lab are built to teach and support, step by step.",
    },
  ],
  faq: [
    {
      id: "is-this-political",
      question: "Is Citizen Voice a political organization?",
      answer:
        "No. We don't take positions on issues, endorse candidates, or tell people what to believe. We help people understand how government works and give communities tools to organize around their own ideas — the content itself stays neutral.",
    },
    {
      id: "what-is-find-my-reps",
      question: "How do I find out who represents me?",
      answer:
        "Use \"Find My Representatives\" and enter your address. We'll show you your city, county, state, and federal officials — including the state legislators most people have never heard of, who often have the most direct impact on local life.",
    },
    {
      id: "can-i-really-write-a-law",
      question: "Can I actually write my own law?",
      answer:
        "You can write a community proposal — a clearly documented idea for a change, with evidence and community support behind it. That's the same starting point every real bill has. The Community Bill Lab walks you through it step by step.",
    },
    {
      id: "is-my-info-private",
      question: "Is my information private if I use the site?",
      answer:
        "You can browse, learn, and comment without creating an account. See our Privacy Policy for exactly what's collected and why — we don't sell data or build advertising profiles beyond standard ad-serving.",
    },
  ],
};

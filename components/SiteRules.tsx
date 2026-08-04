const RULES = [
  {
    emoji: "🤝",
    title: "Be respectful",
    desc: "Disagree with ideas, not people. No personal attacks, harassment, or name-calling — toward other members, candidates, or officials.",
  },
  {
    emoji: "✅",
    title: "Stick to facts",
    desc: "Back up claims with sources when you can. Misinformation gets removed, not debated.",
  },
  {
    emoji: "🏘️",
    title: "Keep it local",
    desc: "This is a space for your community — city, county, and neighborhood issues that affect real people you live near.",
  },
  {
    emoji: "🚫",
    title: "No harassment or threats",
    desc: "Zero tolerance for threats, intimidation, or targeted harassment of any member, candidate, or official.",
  },
  {
    emoji: "🗳️",
    title: "No partisan attacks",
    desc: "Critique policy and record, not party affiliation. We're here to solve problems, not refight national politics.",
  },
  {
    emoji: "👤",
    title: "One identity",
    desc: "One account or display name per person. Impersonation and sockpuppeting get you removed.",
  },
];

export default function SiteRules() {
  return (
    <section className="px-6 py-16 border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-center">Community Guidelines</h2>
        <p className="text-white/50 text-center mt-2 text-sm max-w-xl mx-auto">
          Citizen Voice only works if it stays a place people trust. That starts with
          how we treat each other.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{rule.emoji}</span>
                <p className="text-sm text-white/90 font-medium">{rule.title}</p>
              </div>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Moderators can remove content or suspend accounts that break these guidelines.
          Repeated violations may result in a permanent ban.
        </p>
      </div>
    </section>
  );
}

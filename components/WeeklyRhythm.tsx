const SCHEDULE = [
  {
    day: "Monday",
    emoji: "🔦",
    label: "Community Issue Spotlight",
    desc: "We highlight one issue affecting local neighborhoods this week — potholes, school funding, zoning changes, whatever residents are talking about — with the facts laid out plainly.",
  },
  {
    day: "Tuesday",
    emoji: "🎙️",
    label: "Candidate Video or Interview",
    desc: "A short video from a local candidate or elected official, answering the same questions every week so you can compare them side by side over time.",
  },
  {
    day: "Wednesday",
    emoji: "💬",
    label: "Live Community Voice Chat",
    desc: "A moderated, open voice conversation where members can talk through the week's issues together in real time — no shouting matches, just neighbors talking.",
  },
  {
    day: "Thursday",
    emoji: "📚",
    label: "Youth Civics: How Local Government Works",
    desc: "A short, plain-language explainer on how a piece of local government actually works — how a city council votes, what a county board does, how a bill becomes a law.",
  },
  {
    day: "Friday",
    emoji: "📊",
    label: "Community Poll & Recap",
    desc: "A quick poll on the week's biggest issue, plus a recap of what proposals moved forward, what got discussed, and what's next.",
  },
  {
    day: "Weekend",
    emoji: "🏛️",
    label: "Live Town Hall / Open Discussion",
    desc: "An open floor for anyone to bring up what's on their mind — no set agenda, just a space to be heard.",
  },
];

export default function WeeklyRhythm() {
  return (
    <section className="px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-center">What's Happening This Week</h2>
        <p className="text-white/50 text-center mt-2 text-sm max-w-xl mx-auto">
          Citizen Voice runs on a weekly rhythm, so there's always something new to
          learn, watch, or join — here's what each day looks like.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {SCHEDULE.map((item) => (
            <div
              key={item.day}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[#00E5C3] text-xs font-medium uppercase tracking-wide">
                  {item.day}
                </span>
              </div>
              <p className="text-sm text-white/90 font-medium mt-2">{item.label}</p>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

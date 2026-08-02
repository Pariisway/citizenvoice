const SCHEDULE = [
  { day: "Monday", label: "Community Issue Spotlight" },
  { day: "Tuesday", label: "Candidate Video or Interview" },
  { day: "Wednesday", label: "Live Community Voice Chat" },
  { day: "Thursday", label: "Youth Civics: How Local Government Works" },
  { day: "Friday", label: "Community Poll & Recap" },
  { day: "Weekend", label: "Live Town Hall / Open Discussion" },
];

export default function WeeklyRhythm() {
  return (
    <section className="px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-center">What's Happening This Week</h2>
        <p className="text-white/50 text-center mt-2 text-sm">
          New civic content, every day.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {SCHEDULE.map((item) => (
            <div
              key={item.day}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center gap-3"
            >
              <span className="text-[#00E5C3] text-xs font-medium uppercase tracking-wide w-16 shrink-0">
                {item.day}
              </span>
              <span className="text-sm text-white/80">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

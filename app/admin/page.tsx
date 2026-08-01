"use client";

// app/admin/page.tsx — dashboard home

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Site Control</h1>
      <p className="text-white/50 mt-1">St. Clair County pilot</p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <DashboardCard
          title="Upload a video"
          description="Add a video to Citizen Chat — meeting recordings, candidate interviews, explainers."
          href="/admin/videos"
        />
        <DashboardCard
          title="Manage representatives"
          description="Add or correct local officials (mayor, council, county board, school board)."
          href="/admin/representatives"
        />
        <DashboardCard
          title="Review flagged content"
          description="Comments and questions reported by the community."
          href="/admin/flags"
        />
        <DashboardCard
          title="Moderators"
          description="Grant or revoke moderator/community leader access."
          href="/admin/team"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm
                 px-5 py-4 hover:border-[#00E5C3]/40 transition-colors block"
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm text-white/50 mt-1">{description}</p>
    </a>
  );
}

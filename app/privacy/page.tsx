// app/privacy/page.tsx
//
// Required before applying for AdSense review, and it's the honest thing
// to have on a civic-trust platform regardless. Written for the actual
// data this app collects — update if the data model changes.
//
// NOTE: This is a starting draft, not legal advice. Have an actual lawyer
// review it before launch, especially the sections on data retention,
// children's privacy (COPPA — relevant if a school-board conversation
// draws in minors), and any state-specific requirements (Illinois has its
// own biometric and consumer privacy laws — BIPA is relevant if you ever
// add voice-based speaker identification).

import TopNav from "@/components/TopNav";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-6 py-16 prose prose-invert prose-headings:text-white">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-white/50">Last updated: July 31, 2026</p>


        <h2>What we collect</h2>
        <p>
          You can browse representatives, legislation, and Citizen Chat
          videos without creating an account. If you post a comment, ask a
          question, or speak in a voice room, we assign your browser an
          anonymous ID and store the display name you choose. We do not
          collect your name, email, or phone number unless you choose to
          include it in something you post.
        </p>

        <h2>Location</h2>
        <p>
          If you use "Find My Representatives" with an address or shared
          location, that address/location is sent to Mapbox and the U.S.
          Census Bureau to determine your districts. We cache the resulting
          district and representative data, not your specific address.
        </p>

        <h2>Advertising</h2>
        <p>
          This site is supported by Google AdSense. Google may use cookies
          and similar technologies to serve ads based on your visits to this
          and other sites. You can opt out of personalized advertising
          through{" "}
          <a href="https://adssettings.google.com" className="text-[#00E5C3]">
            Google's Ad Settings
          </a>.
        </p>

        <h2>Voice rooms</h2>
        <p>
          Live audio is transmitted through Agora's real-time communication
          network. If a room is marked as recorded, that recording is
          retained per the retention policy shown in that room before you
          join.
        </p>

        <h2>Anonymous accounts and moderation</h2>
        <p>
          Your anonymous ID may be used to enforce posting limits and to
          suspend accounts that violate community guidelines, including
          coordinated or automated posting. This is the extent of tracking:
          we do not sell data, and we do not build advertising profiles
          beyond what Google AdSense independently collects for ad serving.
        </p>

        <h2>Children's privacy</h2>
        <p>
          This site is intended for general audiences learning about local
          government and is not directed at children under 13. We do not
          knowingly collect information from children under 13.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or a request to remove content you
          posted: [add a contact email before launch].
        </p>
      </div>
    </main>
  );
}

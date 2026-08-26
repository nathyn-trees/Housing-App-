export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-sm text-neutral-700">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
        <strong>Placeholder.</strong> This is standard MVP boilerplate, not reviewed by a lawyer. Before real users
        join, have this reviewed against wherever they live (e.g. GDPR in the EU, CCPA in California) — what&apos;s
        below is a reasonable starting point, not compliance.
      </div>

      <h1 className="text-2xl font-bold text-brand-700">Privacy Policy</h1>

      <h2 className="font-semibold text-neutral-900">1. What we collect</h2>
      <p>
        Your name, email, and city; what you tell us about your housing search or listing (budget, timeline,
        neighborhoods); optional lifestyle preferences; who you&apos;re connected to; and messages you send through
        the app.
      </p>

      <h2 className="font-semibold text-neutral-900">2. How it's used</h2>
      <p>
        To compute your private match feed, show connection context (who connects you to someone), and let you
        message people you&apos;re matched or connected with. We don&apos;t sell your data.
      </p>

      <h2 className="font-semibold text-neutral-900">3. Who can see what</h2>
      <p>
        Your housing need/offer is only shown to people within the network distance you choose. Messages are visible
        only to you and the other participant.
      </p>

      <h2 className="font-semibold text-neutral-900">4. Your controls</h2>
      <p>
        You can pause or mark your listing as found, block another user, and delete your account and associated data
        at any time from your account settings.
      </p>

      <h2 className="font-semibold text-neutral-900">5. Contact</h2>
      <p>Questions about your data can be sent to the app operator.</p>
    </div>
  );
}

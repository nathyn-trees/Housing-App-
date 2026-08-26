export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-sm text-neutral-700">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
        <strong>Placeholder.</strong> This is standard MVP boilerplate, not reviewed by a lawyer. Have real Terms of
        Service drafted (and reviewed for your state/country) before onboarding people who aren&apos;t testing the
        product for you.
      </div>

      <h1 className="text-2xl font-bold text-brand-700">Terms of Service</h1>

      <h2 className="font-semibold text-neutral-900">1. What this is</h2>
      <p>
        Nearby helps people find housing and roommates through their personal network. You&apos;re responsible for
        the accuracy of what you post and for how you conduct yourself with other users.
      </p>

      <h2 className="font-semibold text-neutral-900">2. Your account</h2>
      <p>
        You must provide accurate information and keep your login credentials secure. You&apos;re responsible for
        activity under your account.
      </p>

      <h2 className="font-semibold text-neutral-900">3. Acceptable use</h2>
      <p>
        No harassment, discrimination, scams, or impersonation. We can suspend or remove accounts that violate this
        or that other users report and we substantiate.
      </p>

      <h2 className="font-semibold text-neutral-900">4. No warranty</h2>
      <p>
        Nearby doesn&apos;t vet users, verify housing listings, or guarantee any match, vouch, or connection is
        trustworthy. You&apos;re responsible for your own due diligence before entering any housing or roommate
        arrangement.
      </p>

      <h2 className="font-semibold text-neutral-900">5. Limitation of liability</h2>
      <p>
        Nearby is provided as-is. To the extent permitted by law, we&apos;re not liable for disputes, losses, or
        damages arising from arrangements made through the platform.
      </p>

      <h2 className="font-semibold text-neutral-900">6. Changes</h2>
      <p>We may update these terms as the product changes; continued use means you accept the current version.</p>
    </div>
  );
}

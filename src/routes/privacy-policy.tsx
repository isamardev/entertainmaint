import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Entertainment Trends" },
      {
        name: "description",
        content:
          "Entertainment Trends' privacy policy — what data we collect, how we use it, cookies, and your rights.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const lastUpdated = "1 August 2026";

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 border-b-4 border-yellow pb-6">
        <div className="eyebrow">Legal</div>
        <h1 className="display text-4xl font-black uppercase md:text-6xl">Privacy Policy</h1>
        <p className="meta mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <p className="mt-3 text-muted-foreground md:text-lg">
          This Privacy Policy explains how Entertainment Trends (“we”, “us”, or “our”) collects,
          uses, and protects information when you visit entertainmenttrends.example (the “Site”).
        </p>
      </header>

      <div className="prose max-w-none space-y-8 text-foreground/90">
        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">1. Information we collect</h2>
          <p>
            We collect two categories of information: (a) information you voluntarily provide, and
            (b) information automatically collected as you browse the Site.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>
              <strong>Voluntary information:</strong> name, email address or message body when you
              submit a contact form or email us.
            </li>
            <li>
              <strong>Automatic information:</strong> your IP address, browser type, device type,
              referring website, pages visited, and approximate country/region via standard web
              server logs.
            </li>
            <li>
              <strong>Cookies & storage:</strong> small text files stored in your browser to
              remember preferences, anonymised analytics sessions, and ad serving settings.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">2. How we use information</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>To operate, maintain and improve the Site and our editorial output.</li>
            <li>
              To respond to your enquiries, feedback or tips submitted via email or contact forms.
            </li>
            <li>To measure anonymous audience engagement with stories and pages.</li>
            <li>To personalise advertisements and content where permitted by applicable law.</li>
            <li>To detect, prevent and address security, spam or abuse issues.</li>
          </ul>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">
            3. Cookies & similar technologies
          </h2>
          <p>
            We use both first-party and third-party cookies and similar technologies (e.g. local
            storage, web beacons) to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Remember your preferences such as cookie consent.</li>
            <li>Understand how readers engage with the Site via analytics tools.</li>
            <li>Serve and measure relevant advertisements through our advertising partners.</li>
          </ul>
          <p className="text-muted-foreground">
            You can control or disable cookies through your browser settings. Doing so may limit
            some features of the Site.
          </p>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">4. Third-party services</h2>
          <p className="text-muted-foreground">
            Portions of the Site are served through trusted third-party providers including hosting
            companies, analytics providers, CDNs, and ad networks. These providers may process your
            information under their own privacy policies; we only share information with contractual
            protections for confidentiality and data minimisation. Where required by law, we rely on
            legitimate interest, consent or other legal bases for such transfers.
          </p>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">5. Children under 16</h2>
          <p className="text-muted-foreground">
            The Site is intended for a general audience and is not directed to children under the
            age of 16. We do not knowingly collect personal information from children under 16. If
            you believe such information has been provided, please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">6. Your rights</h2>
          <p>Depending on where you live, you may have rights to:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Request access to the personal information we hold about you.</li>
            <li>Request correction or deletion of your personal information.</li>
            <li>Object to or restrict certain processing of your information.</li>
            <li>Withdraw consent previously provided at any time.</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">7. Data retention</h2>
          <p className="text-muted-foreground">
            Contact correspondence is retained for a maximum of 24 months after the last
            communication unless longer retention is required by law or contractual obligation.
            Anonymised analytics data is kept in aggregate form indefinitely.
          </p>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">8. Changes to this policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time in response to legal, regulatory,
            technical or operational changes. Material changes will be flagged with an updated “Last
            updated” date at the top of this page, and — where appropriate — a notice on the Site.
            Your continued use of the Site after changes become effective constitutes acceptance of
            the revised policy.
          </p>
        </section>

        <section>
          <h2 className="display mb-3 text-2xl font-black uppercase">9. Contact</h2>
          <p>
            If you have any questions, concerns, or requests regarding this policy or how your data
            is handled, write to us at{" "}
            <a
              className="text-black underline underline-offset-2 hover:text-yellow"
              href="mailto:privacy@entertainmenttrends.example"
            >
              privacy@entertainmenttrends.example
            </a>
            , or use the form on our{" "}
            <Link
              className="text-black underline underline-offset-2 hover:text-yellow"
              to="/contact"
            >
              Contact
            </Link>{" "}
            page. We will respond within 30 days of a valid request.
          </p>
        </section>
      </div>
    </article>
  );
}

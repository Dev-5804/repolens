import Link from "next/link";
import { ScrollText, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Repolens",
  description: "Read the Terms of Service for Repolens, a read-only analytics tool for public GitHub repositories.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-3 pb-2 border-b border-gh-border">{title}</h2>
    <div className="space-y-3 text-gh-text-secondary leading-relaxed">{children}</div>
  </section>
);

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gh-bg">
      {/* Header Band */}
      <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-10 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gh-blue/10 rounded-xl mb-4">
            <ScrollText className="w-6 h-6 text-gh-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gh-text-secondary">Last updated: April 25, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gh-text-secondary hover:text-white transition-colors text-sm mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Repolens
        </Link>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Repolens ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Repolens is a read-only analytics dashboard for public GitHub repositories. It uses the GitHub REST API to fetch and display publicly available repository data including commit activity, contributor statistics, language composition, and repository health scores.
          </p>
          <p>
            Repolens is an independent tool and is <strong className="text-white">not affiliated with, sponsored by, or endorsed by GitHub, Inc.</strong>
          </p>
        </Section>

        <Section title="3. Your GitHub Personal Access Token">
          <p>
            To use the Service, you must provide a valid GitHub Personal Access Token (PAT). By using the Service, you agree that:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>You are solely responsible for any actions taken through API calls made using your token.</li>
            <li>You will keep your token secure and will not share it with others.</li>
            <li>You will only provide tokens that you have the right to use and that comply with GitHub's Terms of Service.</li>
            <li>You will revoke your token immediately if you believe it has been compromised.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Analyze private repositories without the explicit permission of the repository owner.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Service.</li>
            <li>Use the Service in any manner that could overload, damage, or impair GitHub's API infrastructure.</li>
            <li>Automate mass repository lookups in a way that violates GitHub's API rate limit policies.</li>
            <li>Use the Service for any unlawful or prohibited purpose.</li>
          </ul>
        </Section>

        <Section title="5. GitHub API Usage & Rate Limits">
          <p>
            The Service makes requests to the GitHub API on your behalf using your PAT. You are responsible for staying within the rate limits associated with your token. Repolens is not liable for any service degradation resulting from exceeding GitHub's API rate limits.
          </p>
          <p>
            Your use of GitHub's API through Repolens is also subject to{" "}
            <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" target="_blank" rel="noreferrer" className="text-gh-blue hover:underline">
              GitHub's Terms of Service
            </a>.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All repository data displayed by Repolens is the property of the respective repository owners and contributors. Repolens does not claim ownership over any analyzed repository data.
          </p>
          <p>
            The Repolens application code, UI design, and scoring algorithms are the intellectual property of the Repolens project maintainers.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            The Service is provided on an <strong className="text-white">"AS IS" and "AS AVAILABLE"</strong> basis without any warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that the data provided will be accurate or complete.
          </p>
          <p>
            The health scores and metrics generated by Repolens are heuristic estimates based on publicly available data. They should not be used as the sole basis for any business, hiring, or investment decisions.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, Repolens and its maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We reserve the right to modify these Terms at any time. Changes will be indicated by the "Last updated" date at the top of this page. Your continued use of the Service after any changes constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            If you have any questions about these Terms, please open an issue on our{" "}
            <a href="https://github.com/Dev-5804/repolens" target="_blank" rel="noreferrer" className="text-gh-blue hover:underline">
              GitHub repository
            </a>.
          </p>
        </Section>

        <div className="border-t border-gh-border pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-gh-text-muted">
          <span>© {new Date().getFullYear()} Repolens. All rights reserved.</span>
          <Link href="/privacy" className="text-gh-blue hover:underline">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}

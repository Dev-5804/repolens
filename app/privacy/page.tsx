import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Repolens",
  description: "Learn how Repolens handles your data. We are committed to transparency and protecting your privacy.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-3 pb-2 border-b border-gh-border">{title}</h2>
    <div className="space-y-3 text-gh-text-secondary leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gh-bg">
      {/* Header Band */}
      <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-10 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gh-blue/10 rounded-xl mb-4">
            <ShieldCheck className="w-6 h-6 text-gh-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gh-text-secondary">Last updated: April 25, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gh-text-secondary hover:text-white transition-colors text-sm mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Repolens
        </Link>

        <Section title="1. Overview">
          <p>
            Repolens (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a read-only analytics tool for public GitHub repositories. This Privacy Policy explains what information we collect (or more importantly, what we <strong className="text-white">do not</strong> collect), and how your data is handled.
          </p>
          <p>
            We are committed to building a trustworthy product. Our goal is to be radically transparent about our data practices.
          </p>
        </Section>

        <Section title="2. Information We Do NOT Collect">
          <p>We do not collect, store, or transmit:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your GitHub Personal Access Token (PAT)</li>
            <li>Your name, email address, or any personally identifiable information</li>
            <li>Your GitHub account details or profile information</li>
            <li>Any data from private repositories</li>
            <li>Browser cookies for tracking purposes</li>
          </ul>
        </Section>

        <Section title="3. Your GitHub Token">
          <p>
            Repolens requires a GitHub Personal Access Token (PAT) to make API requests on your behalf. Here is exactly how it is handled:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your token is stored <strong className="text-white">exclusively in your browser&apos;s localStorage</strong> on your own device.</li>
            <li>It is sent directly from your browser to the GitHub API on each request.</li>
            <li>It passes through our Next.js API route solely for the purpose of proxying the request to GitHub - it is <strong className="text-white">never logged or persisted</strong> on our servers.</li>
            <li>You can delete your token at any time by clearing it from the settings (the 🔑 icon in the header) or by clearing your browser&apos;s local storage.</li>
          </ul>
        </Section>

        <Section title="4. Repository Data & Caching">
          <p>
            When you analyze a repository, Repolens fetches publicly available data from the GitHub API. This data (stars, forks, commit counts, language breakdown, etc.) may be cached in server memory for up to 24 hours to improve performance and reduce redundant API calls.
          </p>
          <p>
            This cached data contains no personal information - it is purely aggregate, public repository metadata.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>Repolens interacts with the following third-party service:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong className="text-white">GitHub API</strong> - All repository data is sourced from the GitHub REST API. Your use of this service is governed by{" "}
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer" className="text-gh-blue hover:underline">
                GitHub&apos;s Privacy Policy
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="6. Analytics & Logging">
          <p>
            We do not use any third-party analytics services (e.g., Google Analytics). Standard server access logs may be maintained for security and debugging purposes. These logs do not contain your GitHub token or any personal repository data you searched.
          </p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will indicate the &quot;Last updated&quot; date at the top of this page. Continued use of Repolens after any changes constitutes your acceptance of the revised policy.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            If you have questions or concerns about this Privacy Policy, please open an issue on our{" "}
            <a href="https://github.com/Dev-5804/repolens" target="_blank" rel="noreferrer" className="text-gh-blue hover:underline">
              GitHub repository
            </a>.
          </p>
        </Section>

        <div className="border-t border-gh-border pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-gh-text-muted">
          <span>© {new Date().getFullYear()} Repolens. All rights reserved.</span>
          <Link href="/terms" className="text-gh-blue hover:underline">Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}

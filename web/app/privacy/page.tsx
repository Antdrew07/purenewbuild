import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pure Peptide LLC collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" accent="policy" updated="22 August 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Contact details</strong> you submit — name, email, subject, and message.</li>
          <li><strong>Order details</strong> where you place an order — shipping address and order contents.</li>
          <li><strong>Technical data</strong> — IP address and basic request metadata, retained in server logs for security and rate limiting.</li>
        </ul>
        <p>
          We do not collect health information, and we ask that you do not send
          any in a contact message.
        </p>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          To answer your enquiries, fulfil and support orders, prevent abuse of
          our systems, and meet our legal and record-keeping obligations. We do
          not sell your personal information, and we do not share it with
          advertisers.
        </p>
      </section>

      <section>
        <h2>Processors we rely on</h2>
        <p>
          We use a small number of third-party services to operate the site —
          hosting, database, and transactional email delivery. Each receives only
          the data required to perform its function, and each is bound by its own
          data-processing terms.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          Contact messages are retained for up to 24 months. Order records are
          retained for as long as required by applicable tax and commercial law.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You may request a copy of the personal information we hold about you,
          ask us to correct it, or ask us to delete it where we are not required
          to retain it. Email{" "}
          <a href="mailto:support@purepeptide.us" className="text-red hover:underline">
            support@purepeptide.us
          </a>{" "}
          and we will respond within 30 days.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Traffic is encrypted in transit. Administrative access is restricted and
          credentials are stored hashed. No system is perfectly secure, and we
          will notify affected users promptly in the event of a breach involving
          personal data.
        </p>
      </section>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Lab Results & COA",
  description: "Certificates of Analysis and third-party testing for Pure Peptide research compounds.",
};

export default function LabResultsPage() {
  return (
    <LegalPage title="Lab Results" accent="& COA" updated="2 November 2026">
      <section>
        <h2>HPLC testing</h2>
        <p>
          Every batch is tested via High-Performance Liquid Chromatography to
          verify purity levels of 99%+.
        </p>
      </section>

      <section>
        <h2>Mass spectrometry</h2>
        <p>
          Mass Spec analysis confirms molecular identity and structure for every
          compound we sell.
        </p>
      </section>

      <section>
        <h2>Third-party verified</h2>
        <p>
          All testing is conducted by independent, accredited laboratories to
          ensure unbiased results.
        </p>
      </section>

      <section>
        <h2>Certificate of Analysis</h2>
        <p>
          We are committed to full transparency. Certificates of Analysis (COAs)
          are available for every product and batch. Each COA includes HPLC
          purity data, mass spectrometry confirmation, and appearance testing
          results.
        </p>
        <p>
          To request the COA for any product or lot, email{" "}
          <a href="mailto:info@purepeptide.us">info@purepeptide.us</a> with the
          compound and, where you have it, the lot number, and we will send it
          across.
        </p>
      </section>
    </LegalPage>
  );
}

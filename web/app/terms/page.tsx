import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms governing the sale of research materials by Pure Peptide LLC.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" accent="of sale" updated="22 August 2026">
      <section>
        <h2>Research use only</h2>
        <p>
          All products supplied by Pure Peptide LLC are sold strictly as
          laboratory research chemicals for <em>in vitro</em> study by qualified
          professionals. They are not drugs, foods, cosmetics, medical devices,
          or dietary supplements. They are not intended to diagnose, treat, cure,
          or prevent any disease, and they may not be administered to humans or
          animals under any circumstances.
        </p>
      </section>

      <section>
        <h2>Who may purchase</h2>
        <p>By placing an order you represent and warrant that you:</p>
        <ul>
          <li>are at least 21 years of age;</li>
          <li>are a qualified researcher, or are purchasing on behalf of a research institution;</li>
          <li>will use the materials solely for lawful laboratory research;</li>
          <li>will not resell, repackage, or supply the materials for human or veterinary use;</li>
          <li>accept full responsibility for safe handling, storage, and disposal.</li>
        </ul>
      </section>

      <section>
        <h2>No guidance provided</h2>
        <p>
          We do not provide dosing information, administration protocols, medical
          advice, or guidance of any kind regarding use in humans or animals. Our
          staff will not answer such enquiries. Nothing on this site constitutes
          medical advice.
        </p>
      </section>

      <section>
        <h2>Product information and analysis</h2>
        <p>
          Purity figures reflect independent third-party analysis of the
          identified lot. A Certificate of Analysis is available on request for
          any lot we have supplied. Product images are representative; packaging
          and labelling may vary between lots.
        </p>
      </section>

      <section>
        <h2>Pricing and availability</h2>
        <p>
          Prices are in US dollars and may change without notice. Listing a
          product does not guarantee availability. Where an order cannot be
          fulfilled we will contact you and offer a substitution or a full refund.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Pure Peptide LLC is not liable
          for any indirect, incidental, or consequential damages arising from the
          use or misuse of materials we supply. Our total liability for any claim
          is limited to the amount paid for the product giving rise to the claim.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the United States and the state
          in which Pure Peptide LLC is registered, without regard to conflict of
          law provisions.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:support@purepeptide.us" className="text-red hover:underline">
            support@purepeptide.us
          </a>
        </p>
      </section>
    </LegalPage>
  );
}

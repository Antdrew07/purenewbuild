import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Dispatch times, packaging, and the returns policy for Pure Peptide orders.",
};

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping" accent="& returns" updated="22 August 2026">
      <section>
        <h2>Dispatch</h2>
        <p>
          Orders are dispatched within 48 hours. The weekly cut-off is 2pm CT on
          Friday.
        </p>
        <p>
          Orders placed on Friday ship the following Monday, as do orders placed
          over the weekend or on a public holiday.
        </p>
      </section>

      <section>
        <h2>Packaging</h2>
        <p>
          Lyophilised material is shipped in sealed vials, cushioned, and
          discreetly boxed. Cold-pack shipping is available on request for
          temperature-sensitive compounds. Every shipment is labelled for
          research use only.
        </p>
      </section>

      <section>
        <h2>Included with every order</h2>
        <p>Every order comes with reconstitution liquid.</p>
        <ul>
          <li>Orders under $150 — free PBS solution</li>
          <li>Orders $150–$250 — free acetic water</li>
          <li>Orders over $250 — free PBS solution</li>
        </ul>
        <p>Ready-use pens are available at $50, including three cartridges and ten needles.</p>
      </section>

      <section>
        <h2>Certificates of Analysis</h2>
        <p>
          A Certificate of Analysis is available for every lot we ship. Email{" "}
          <a href="mailto:support@purepeptide.us">support@purepeptide.us</a> with
          the compound and, where you have it, the lot number, and we will send
          the COA across.
        </p>
      </section>

      <section>
        <h2>Domestic shipping only</h2>
        <p>
          We currently ship within the United States only. We do not ship to
          jurisdictions where the sale or import of research chemicals is
          restricted, and we reserve the right to cancel and refund any order we
          cannot lawfully fulfil.
        </p>
      </section>

      <section>
        <h2>Damaged or incorrect items</h2>
        <p>
          Inspect your shipment on arrival. If a vial arrives broken, or the
          contents do not match your order, contact us within 7 days with your
          order number and photographs. We will replace the item or refund it in
          full at your choice.
        </p>
      </section>

      <section>
        <h2>Returns</h2>
        <p>
          Because these are research materials whose storage conditions cannot be
          verified once they leave our control, we cannot accept returns of
          opened or unsealed products. Unopened, undamaged items may be returned
          within 14 days of delivery for a refund less shipping. Contact us
          before returning anything so we can issue a return authorisation.
        </p>
      </section>

      <section>
        <h2>Lost shipments</h2>
        <p>
          If tracking shows no movement for 7 business days, contact us and we
          will open a carrier trace. Confirmed lost shipments are replaced at our
          cost.
        </p>
      </section>
    </LegalPage>
  );
}

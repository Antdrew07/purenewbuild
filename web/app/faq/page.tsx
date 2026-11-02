import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Pure Peptide research materials, ordering, shipping and storage.",
};

const FAQS = [
  { q: "What are research peptides?", a: "Research peptides are short chains of amino acids used in scientific research and laboratory studies. They are synthesized for use in understanding biological processes, drug development, and academic research." },
  { q: "Are your products for human consumption?", a: "No. All products sold by Pure Peptide LLC are strictly for laboratory and research use only. They are not intended for human or animal consumption, and we do not provide medical advice." },
  { q: "What purity levels do your peptides have?", a: "All of our peptides are manufactured to 99%+ purity standards. Each batch undergoes rigorous HPLC and Mass Spectrometry testing by independent third-party laboratories." },
  { q: "Do you provide Certificates of Analysis (COA)?", a: "Yes. We provide COAs for every product and batch. You can request a COA by contacting our support team or from the Lab Results page." },
  { q: "What payment methods do you accept?", a: "Orders are paid by Venmo. The Venmo details and your order number are shown as soon as the order is placed and are emailed to you — put the order number in the payment note." },
  { q: "How long does shipping take?", a: "Orders placed before 2pm ET are processed the same day. Standard shipping within the US typically takes 2–5 business days. Expedited options are available on request." },
  { q: "Do you offer free shipping?", a: "Yes. Standard shipping is free on all orders of $200 or more. Orders under $200 ship for a flat $15." },
  { q: "Do you have a loyalty program?", a: "Yes. Members earn 2 points for every $100 spent. Each point is worth 1¢ and can be redeemed at checkout — 200 points takes $2.00 off an order." },
  { q: "What is your return policy?", a: "Due to the nature of our products, we do not accept returns on opened items. Unopened products may be returned within 30 days of purchase. Please contact support for return authorization." },
  { q: "How should I store peptides?", a: "Lyophilized (freeze-dried) peptides should be stored at -20°C for long-term storage or 2–8°C for short-term storage. Keep sealed vials away from light and moisture. Refer to the Certificate of Analysis for product-specific storage recommendations." },
  { q: "Do you ship internationally?", a: "Currently we ship within the United States only. Please contact us about international orders." },
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently" accent="asked questions" updated="2 November 2026">
      {FAQS.map((f) => (
        <section key={f.q}>
          <h2>{f.q}</h2>
          <p>{f.a}</p>
        </section>
      ))}
    </LegalPage>
  );
}

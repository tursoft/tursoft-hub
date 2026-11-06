import { Helmet } from "react-helmet-async";
import { Plus } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { faqJsonLd } from "@/lib/site";
import faqData from "@/data/faq.json";

/**
 * Questions as hairline rows that open in place. Native <details> keeps every answer in
 * the HTML (prerender, search engines, find in page) and needs no script to toggle.
 */
const FaqSection = () => {
  const items = faqData.items;

  return (
    <section id="faq" className="py-16 lg:py-24">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(items))}</script>
      </Helmet>
      <div className="container">
        <SectionHeader
          id="faq"
          title="Frequently asked questions"
          description="Short answers to the questions people ask about Muhammet Turşak, Tursoft and AI-enabled software architecture."
          aside={<p>{items.length} questions</p>}
        />

        <div className="faq-list">
          {items.map((item) => (
            <details key={item.question} className="faq-item">
              <summary className="faq-question">
                <h3 className="faq-question-text">{item.question}</h3>
                <Plus className="faq-icon" strokeWidth={1.5} aria-hidden="true" />
              </summary>
              <p className="faq-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

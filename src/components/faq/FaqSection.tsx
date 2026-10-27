import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/ui/reveal";
import { faqJsonLd } from "@/lib/site";
import faqData from "@/data/faq.json";

const FaqSection = () => {
  const items = faqData.items;

  return (
    <section id="faq" className="py-20 bg-background/50">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(items))}</script>
      </Helmet>
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase tracking-widest">FAQ</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Frequently Asked
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Short answers to the questions people ask about Muhammet Turşak, Tursoft and AI-enabled software architecture.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item, index) => (
              <Reveal key={item.question} direction="up" delay={(index % 2) * 80}>
                <Card className="gradient-card border-border card-hover hover:border-primary/40 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">{item.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

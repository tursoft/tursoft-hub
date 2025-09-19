import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quote, Phone, Mail, Linkedin, Twitter, Facebook, ExternalLink, Globe, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import referencesData from "@/data/references.json";

// Import all reference photos
import antonisPhoto from "@/assets/references/andonis.philippidis.jpg";
import nuraliPhoto from "@/assets/references/nurali.unal.jpg";
import myozdenPhoto from "@/assets/references/myozden.jpg";
import cetinPhoto from "@/assets/references/cetin.balanuye.jpg";
import kursatPhoto from "@/assets/references/kursat.cagiltay.png";
import alexanderPhoto from "@/assets/references/alexander.berler.jpg";
import umutPhoto from "@/assets/references/umut.huseyinoglu.jpg";
import gulpembePhoto from "@/assets/references/gulpembe.ergin.jpg";
import firatPhoto from "@/assets/references/firat.ozerden.jpg";
import johanPhoto from "@/assets/references/johan.sellstrom.jpg";
import aslakPhoto from "@/assets/references/aslak.felin.jpg";
import uwePhoto from "@/assets/references/uwe.weimer.jpg";
import mehmetAlpPhoto from "@/assets/references/mehmet.alp.karabas.jpg";
import eleftheriaPhoto from "@/assets/references/eleftheria.polychronidou.jpg";
import kostasPhoto from "@/assets/references/kostas.karkaletsis.jpg";
import veliPhoto from "@/assets/references/veli.bicer.jpg";
import erolPhoto from "@/assets/references/erol.ozcelik.jpg";
import mesutPhoto from "@/assets/references/mesut.demirer.jpg";
import davutPhoto from "@/assets/references/davut.gurbuz.jpg";

// Photo mapping object
const photoMap: { [key: string]: string } = {
  "andonis.philippidis.jpg": antonisPhoto,
  "nurali.unal.jpg": nuraliPhoto,
  "myozden.jpg": myozdenPhoto,
  "cetin.balanuye.jpg": cetinPhoto,
  "kursat.cagiltay.png": kursatPhoto,
  "alexander.berler.jpg": alexanderPhoto,
  "umut.huseyinoglu.jpg": umutPhoto,
  "gulpembe.ergin.jpg": gulpembePhoto,
  "firat.ozerden.jpg": firatPhoto,
  "johan.sellstrom.jpg": johanPhoto,
  "aslak.felin.jpg": aslakPhoto,
  "uwe.weimer.jpg": uwePhoto,
  "mehmet.alp.karabas.jpg": mehmetAlpPhoto,
  "eleftheria.polychronidou.jpg": eleftheriaPhoto,
  "kostas.karkaletsis.jpg": kostasPhoto,
  "veli.bicer.jpg": veliPhoto,
  "erol.ozcelik.jpg": erolPhoto,
  "mesut.demirer.jpg": mesutPhoto,
  "davut.gurbuz.jpg": davutPhoto,
};

interface Reference {
  id: number;
  name: string;
  photoPath: string;
  photo?: string;
  company: string;
  position: string;
  testimonial: string;
  date: string;
  contacts: Array<{ code: string; value: string }>;
  rating: number;
  isActive: boolean;
}

const ReferencesSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [references, setReferences] = useState<Reference[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load references from JSON and map photos
    const loadedReferences = referencesData
      .filter((ref: Reference) => ref.isActive)
      .map((ref: Reference) => ({
        ...ref,
        photo: photoMap[ref.photoPath] || '',
      }));
    setReferences(loadedReferences);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === references.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? references.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getCardTransform = (index: number) => {
    const offset = index - currentIndex;
    const isActive = offset === 0;
    const distance = Math.abs(offset);
    
    if (distance > 2) return { transform: 'scale(0)', opacity: '0' };
    
    const translateX = offset * 590; // Card width + gap
    const rotateY = isActive ? 0 : offset > 0 ? -25 : 25;
    const scale = isActive ? 1 : 0.8 - (distance * 0.1);
    const zIndex = isActive ? 10 : 10 - distance;
    const opacity = isActive ? 1 : 0.6 - (distance * 0.2);
    
    return {
      transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity: opacity.toString(),
      zIndex: zIndex.toString()
    };
  };

  const getContactIcon = (code: string) => {
    switch (code) {
      case 'phone': return Phone;
      case 'email': return Mail;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'facebook': return Facebook;
      case 'website': return Globe;
      case 'skype': return MessageSquare;
      default: return ExternalLink;
    }
  };

  const getContactHref = (code: string, value: string) => {
    switch (code) {
      case 'phone': return `tel:${value.replace(/\D/g, '')}`;
      case 'email': return `mailto:${value}`;
      case 'skype': return `skype:${value}?chat`;
      default: return value.startsWith('http') ? value : `https://${value}`;
    }
  };

  const getContactLabel = (code: string, value: string) => {
    switch (code) {
      case 'phone': return value;
      case 'email': return value;
      case 'linkedin': return 'LinkedIn';
      case 'twitter': return 'Twitter';
      case 'facebook': return 'Facebook';
      case 'website': return 'Website';
      case 'skype': return 'Skype';
      default: return value;
    }
  };

  return (
    <section id="references" className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            Professional References
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            What Colleagues Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Testimonials from industry leaders and colleagues who have worked closely with me
            throughout my professional career.
          </p>
        </div>

        {/* References Coverflow */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            disabled={references.length <= 1}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            disabled={references.length <= 1}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Coverflow Container */}
          <div 
            ref={containerRef}
            className="relative h-[500px] flex items-center justify-center overflow-hidden"
            style={{ perspective: '1000px' }}
          >
            {references.map((reference, index) => {
              const cardStyle = getCardTransform(index);
              
              return (
                <Card 
                  key={reference.id}
                  className="absolute w-[36rem] h-[28rem] border-border bg-card cursor-pointer transition-all duration-500 ease-in-out flex flex-col"
                  style={cardStyle}
                  onClick={() => goToSlide(index)}
                >
                  <CardHeader className="pb-4 relative">
                    <div className="flex flex-col items-center text-center">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0 mb-2 -mt-8">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-lg">
                          <img 
                            src={reference.photo} 
                            alt={reference.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Reference Info */}
                      <div className="w-full">
                        <h3 className="text-xl font-bold mb-2">{reference.name}</h3>
                        <p className="text-primary font-semibold text-sm">
                          {reference.position}
                        </p>
                        <p className="text-muted-foreground text-xs mb-3">
                          {reference.company}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex flex-col h-full">
                    {/* Quote */}
                    <div className="flex-1 flex flex-col justify-center">
                      <blockquote 
                        className="text-sm leading-relaxed text-muted-foreground italic text-center line-clamp-5"
                        dangerouslySetInnerHTML={{ __html: `"${reference.testimonial}"` }}
                      />
                      {/* Reference Date */}
                      <div className="text-xs text-muted-foreground/70 text-right mt-2 font-light">
                        {reference.date}
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {reference.contacts.slice(0, 3).map((contact, idx) => {
                        const ContactIcon = getContactIcon(contact.code);
                        const href = getContactHref(contact.code, contact.value);
                        const label = getContactLabel(contact.code, contact.value);
                          
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs hover:bg-primary hover:text-primary-foreground transition-all duration-200 px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(href, "_blank");
                            }}
                          >
                            <ContactIcon className="w-3 h-3 mr-1" />
                            {contact.code === 'phone' || contact.code === 'email' ? 
                              contact.code === 'phone' ? 'Call' : 'Email' : 
                              label
                            }
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>

                  {/* Decorative Quote Mark */}
                  <div className="absolute top-2 right-2 text-4xl text-primary/10 font-serif">
                    "
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center mt-8 gap-3">
            {references.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-border hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6 text-lg">
            Want to add your reference or testimonial?
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 transition-all duration-300"
            onClick={() => window.open("mailto:tursoft@gmail.com?subject=Reference Request", "_blank")}
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Contact for Reference
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReferencesSection;
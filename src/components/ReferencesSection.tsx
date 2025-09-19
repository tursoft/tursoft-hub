import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quote, Phone, Mail, Linkedin, Twitter, Facebook, ExternalLink, Globe, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import antonisPhoto from "@/assets/references/andonis.philippidis.jpg";
import nuraliPhoto from "@/assets/references/nurali.unal.jpg";
import myozdenPhoto from "@/assets/references/myozden.jpg";
import cetinPhoto from "@/assets/references/cetin.balanuye.jpg";
import kursatPhoto from "@/assets/references/kursat.cagiltay.png";
import alexanderPhoto from "@/assets/references/alexander.berler.jpg";
import umutPhoto from "@/assets/references/umut.huseyinoglu.jpg";
import gulpembePhoto from "@/assets/references/gulpembe.ergin.jpg";
import firatPhoto from "@/assets/references/firat.ozerden.jpg";

const ReferencesSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const references = [
    {
      id: 1,
      name: "Andonis Philippidis",
      photo: antonisPhoto,
      company: "Datasel",
      position: "CEO",
      testimonial: "As a <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>technologically very advanced</span> and at the same time <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>business oriented</span> <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>fast learner</span> and <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>team leader</span> who always tries to be at the <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>edge of technology</span> and development, Muhammet is a person of trust and a person to count on when things need to be done. I enjoy very much working with him...",
      date: "March 2018",
      contacts: [
        { code: "phone", value: "+90 533 291 05 22" },
        { code: "email", value: "a.filippidis@datasel.com.tr" },
        { code: "linkedin", value: "https://www.linkedin.com/in/andonis-filippidis-9731364/" },
        { code: "twitter", value: "https://twitter.com/A_Filippidis" },
        { code: "facebook", value: "https://www.facebook.com/andonis" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 3,
      name: "Prof. Dr. M. Yaşar Özden",
      photo: myozdenPhoto,
      company: "Doğu Akdeniz Üniversitesi",
      position: "Rektör Yardımcısı",
      testimonial: "Muhammet Turşak'ı lisans öğrenimi sırasında benden aldığı derslerden başlayarak tanıma şansım oldu. <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>Çalışkan</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>bilgili</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>işten kaçmayan</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>disiplinli</span>, bilgisini gerçek hayat problemlerinin çözümünde <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>başarıyla</span> kullanabilen çok iyi bir insadır diye özetleyebilirim. Saygılarımla",
      date: "September 2015",
      contacts: [
        { code: "phone", value: "+90 392 630 3128" },
        { code: "email", value: "myozden@gmail.com" },
        { code: "website", value: "http://myozden.blogspot.com/" },
        { code: "linkedin", value: "https://www.linkedin.com/in/m-yasar-ozden-903a725a/" },
        { code: "twitter", value: "https://twitter.com/myozden" },
        { code: "facebook", value: "https://www.facebook.com/m.yasar.ozden" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 4,
      name: "Çetin Balanuye",
      photo: cetinPhoto,
      company: "Akdeniz University",
      position: "Professor",
      testimonial: "I have known Muhammet Turşak for about 10 years. He served in my instructional software development team as <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>chief developer</span>. He is extremely <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>task oriented</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>easy-to-communicate</span> and <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>solution-driven</span> type person that facilitates project difficulties of any kind. I have no reservation in recommending Muhammet for high quality IT projects as either manager or assistant manager.",
      date: "January 2017",
      contacts: [
        { code: "phone", value: "+90 0312 210 00 20" },
        { code: "email", value: "balanuye@akdeniz.edu.tr" },
        { code: "website", value: "http://www.balanuye.net/main/" },
        { code: "linkedin", value: "https://www.linkedin.com/in/cetin-balanuye-24083547/" },
        { code: "twitter", value: "https://twitter.com/balanuye" },
        { code: "facebook", value: "https://www.facebook.com/cetin.balanuye" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 5,
      name: "Prof. Dr. Kürşat Çağıltay",
      photo: kursatPhoto,
      company: "Middle East Technical University",
      position: "Professor",
      testimonial: "Muhammet was one of my undergrad students at METU. He was very <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>diligent</span> and <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>hard working</span> person. More importantly he had <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>self-learning ability</span> so he could easily adopt to new technologies. His personality is also unique, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>teamwork oriented</span> and easygoing person. It was always a pleasure to work with Muhammet.",
      date: "May 2014",
      contacts: [
        { code: "phone", value: "+90 312 210 36 83" },
        { code: "email", value: "kursat@metu.edu.tr" },
        { code: "website", value: "https://ceit.metu.edu.tr/tr/kursat-cagiltay" },
        { code: "linkedin", value: "https://www.linkedin.com/in/kursat-cagiltay-30651aa/" },
        { code: "twitter", value: "https://twitter.com/cagiltay" },
        { code: "facebook", value: "https://www.facebook.com/cagiltay" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 6,
      name: "Alexander Berler",
      photo: alexanderPhoto,
      company: "Gnomon",
      position: "Head of consulting services at Gnomon, Chair at HL7 Hellas IHE Services Director at IHE-EUROPE",
      testimonial: "I have the honor to work together with Muhammet in conjunction with the proempower pcp project as members of the DM4ALL Consortium. Muhammet is an important <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>cornerstone</span> of our project. He is always <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>proactive</span> with an <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>excel experience</span> in health care information exchange integration. It is surely <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>trustful</span> person and a perfect partner with very high professional standards.",
      date: "November 2016",
      contacts: [
        { code: "email", value: "a.berler@gnomon.com.gr" },
        { code: "twitter", value: "alexanderberler" },
        { code: "linkedin", value: "https://www.linkedin.com/in/aberler" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 7,
      name: "Umut Hüseyinoğlu",
      photo: umutPhoto,
      company: "Hacettepe University",
      position: "Faculty Member",
      testimonial: "Muhammet and I worked together on the e-Ders Project at METU Informatics Institute. During this period I was the direct supervisor of Muhammet and had the chance to observe his work closely. He was always <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>punctual</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>businesslike</span> and very <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>disciplined</span>. I consider myself extremely fortunate for having worked with Muhammet and sincerely believe he would make a <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>tremendous addition</span> to any software development team.",
      date: "August 2013",
      contacts: [
        { code: "phone", value: "+90 312 2978950#121" },
        { code: "email", value: "uhus@hacettepe.edu.tr" },
        { code: "website", value: "http://aes.hacettepe.edu.tr/uhus" },
        { code: "linkedin", value: "https://www.linkedin.com/in/umut-huseyinoglu-1a2a991b/" },
        { code: "twitter", value: "https://twitter.com/uhus" },
        { code: "facebook", value: "https://www.facebook.com/umut.huseyinoglu" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 8,
      name: "Gülpembe Ergin",
      photo: gulpembePhoto,
      company: "Ondokuz Mayıs University",
      position: "Asst. Prof.",
      testimonial: "Birlikte Vaka Karması yazılım projesinde çalıştık. Sen hayal et Muhammet yazsın. Sonunda çıkan ürün senin hayalinin ötesindedir. İletişimi <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>kolay</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>pozitif</span>, bildiklerini paylaşan, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>lider</span>, <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>analitik düşünen</span> bir çalışma arkadaşıdır.",
      date: "June 2019",
      contacts: [
        { code: "phone", value: "+90 362 457 6020#6355" },
        { code: "email", value: "gulpembe.oguzhan@omu.edu.tr" },
        { code: "linkedin", value: "https://www.linkedin.com/in/gulpembe-ergin-a274b729/" },
        { code: "twitter", value: "https://twitter.com/gulpembeergin" },
        { code: "facebook", value: "https://www.facebook.com/gulpembe.ergin" }
      ],
      rating: 5,
      isActive: true
    },
    {
      id: 9,
      name: "Fırat Özerden",
      photo: firatPhoto,
      company: "Mh Handel GmbH",
      position: "Interims Geschäftsführer, Finanzmanagement, Konfliktmanagement, Business Development",
      testimonial: "During 2015 and 2017 I have had the privilege to work with Muhammet Turşak on a major project in Turkey. I have rarely come across such a <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>focused</span> and <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>competent</span> Software-Architect leading a project. He has been a <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>key</span> for the success of the project, being 2 steps ahead of the customer at all times. I would blindly <span class='bg-primary/20 text-primary font-semibold px-1 rounded'>recommend</span> him to any team-lead in his field of expertise.",
      date: "February 2018",
      contacts: [
        { code: "phone", value: "+90 531 509 31 97" },
        { code: "email", value: "firatozerden@gmail.com" },
        { code: "skype", value: "firat.oezerden" },
        { code: "linkedin", value: "https://www.linkedin.com/in/firatozerden" }
      ],
      rating: 5,
      isActive: true
    }
  ].filter(ref => ref.isActive);

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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Linkedin, Twitter, Facebook, ExternalLink, Globe, MessageSquare } from "lucide-react";
import { referencesRepo } from "@/repositories/ReferencesRepo";
import type { Reference } from "@/models/Reference";
import ListViewer from "@/components/ui/ListViewer";

// Extended reference with photo field for rendering
interface ReferenceWithPhoto extends Reference {
  photo: string;
}

const ReferencesSection = () => {
  const [references, setReferences] = useState<ReferenceWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load references from repository with photos
    const loadReferences = async () => {
      try {
        const allReferences = await referencesRepo.getList();
        
        // Filter active references and load photos
        const activeReferences = allReferences.filter((ref) => ref.isActive);
        const referencesWithPhotos = await Promise.all(
          activeReferences.map(async (ref) => ({
            ...ref,
            photo: (await referencesRepo.getPhotoUrlByCode(ref.code)) || '',
          }))
        );
        
        setReferences(referencesWithPhotos);
      } catch (error) {
        console.error('Error loading references:', error);
        setReferences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferences();
  }, []);

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
      default: return value;
    }
  };

  return (
    <section id="references">
      <ListViewer<ReferenceWithPhoto>
        data={references}
        isLoading={isLoading}
        loadingMessage="Loading references..."
        emptyMessage="No references available"
      defaultViewMode="carousel"
      enabledModes={['card', 'list', 'carousel']}
      title="What<span class='bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4'>Colleagues</span> Say"
      subtitle="Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career."
      badge="Professional References"
      imageRounded={true}
      fieldMapping={{
        code: 'code',
        title: 'title',
        subtitle: (ref) => `${ref.position} at ${ref.company}`,
        description: (ref) => `"${ref.testimonial}"`,
        image: 'photo',
        date: 'date',
        actions: references.length > 0 ? references[0].contacts.slice(0, 3).map((contact) => ({
          label: (ref: ReferenceWithPhoto) => {
            const c = ref.contacts.find(ct => ct.code === contact.code);
            if (!c) return contact.code;
            return c.code === 'phone' ? 'Call' : c.code === 'email' ? 'Email' : getContactLabel(c.code, c.value);
          },
          icon: getContactIcon(contact.code),
          onClick: (ref: ReferenceWithPhoto, e: React.MouseEvent) => {
            const c = ref.contacts.find(ct => ct.code === contact.code);
            if (c) {
              const href = getContactHref(c.code, c.value);
              window.open(href, "_blank");
            }
          },
          variant: 'outline' as const,
        })) : [],
      }}
      footer={
        <div className="text-center">
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
      }
    />
    </section>
  );
};

export default ReferencesSection;

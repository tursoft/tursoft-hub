import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, MapPin, Github, Linkedin, Twitter } from "lucide-react";
import cvData from "@/data/cv.json";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "tursoft@gmail.com",
      href: "mailto:tursoft@gmail.com",
      primary: true
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+90 554 200 78 29",
      href: "tel:+905542007829"
    },
    {
      icon: Globe,
      label: "Website",
      value: "tursoft.net",
      href: "https://tursoft.net"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Turkey",
      href: null
    }
  ];

  const socialLinks = [
    {
      icon: Linkedin,
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/tursoft/",
      color: "text-blue-600"
    },
    {
      icon: Github,
      name: "GitHub", 
      href: "https://github.com/tursoft",
      color: "text-gray-800 dark:text-gray-200"
    },
    {
      icon: Twitter,
      name: "Twitter",
      href: "https://twitter.com/muhammettursak",
      color: "text-blue-400"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">Get In Touch</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Let's Work
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Together</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              I'm always interested in discussing new opportunities, innovative projects, 
              and collaborations in enterprise software development.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="animate-slide-in">
              <h3 className="text-2xl font-bold mb-8 text-foreground">Contact Information</h3>
              
              <div className="space-y-6">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      contact.primary ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      <contact.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{contact.label}</p>
                      {contact.href ? (
                        <a 
                          href={contact.href}
                          className="text-foreground font-medium hover:text-primary transition-colors link-hover"
                          target={contact.href.startsWith('http') ? '_blank' : undefined}
                          rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {contact.value}
                        </a>
                      ) : (
                        <p className="text-foreground font-medium">{contact.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-12">
                <h4 className="text-lg font-semibold mb-6 text-foreground">Follow Me</h4>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary transition-all duration-300 hover:scale-105"
                    >
                      <social.icon className={`h-5 w-5 ${social.color}`} />
                      <span className="text-sm font-medium text-foreground">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="animate-scale-in">
              <Card className="gradient-card border-border">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-foreground">Ready to Start a Project?</h3>
                  
                  <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      I'm currently available for consulting, architectural reviews, and 
                      senior development roles. Whether you're looking to:
                    </p>
                    
                    <ul className="space-y-3">
                      {[
                        "Architect enterprise-grade software solutions",
                        "Lead development teams and establish best practices", 
                        "Modernize legacy systems and improve performance",
                        "Implement scalable cloud-native architectures"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6 space-y-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] hover:scale-105 text-primary-foreground glow-on-hover transition-all duration-300"
                        onClick={() => window.location.href = 'mailto:tursoft@gmail.com?subject=Project Inquiry'}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Start a Conversation
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => window.open(cvData.general.downloadUrl, '_blank')}
                      >
                        Download My CV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Availability Status */}
          <div className="mt-16 text-center animate-fade-in">
            <Card className="gradient-card border-border max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    Available
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Currently accepting new projects and consulting opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
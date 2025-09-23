import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Globe, 
  MapPin, 
  Calendar,
  Users,
  Briefcase,
  Star,
  ExternalLink,
  Phone,
  Mail,
  Clock
} from "lucide-react";

interface Customer {
  name: string;
  title: string;
  logoPath: string;
  category?: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  relationship?: string;
  projects?: string[];
  technologies?: string[];
  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'ongoing';
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  services?: string[];
  achievements?: string[];
  testimonial?: {
    text: string;
    author: string;
    position: string;
  };
}

interface CustomerDetailDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  if (!customer) return null;

  // Helper function to get partnership status color
  const getPartnershipStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Helper function to format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      // Assume format is dd.mm.yyyy or similar
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Helper function to format partnership period
  const formatPartnershipPeriod = () => {
    if (!customer.partnership?.startDate) return '';
    
    const startFormatted = formatDate(customer.partnership.startDate);
    
    if (!customer.partnership.endDate) {
      return `${startFormatted} - Present`;
    }
    
    const endFormatted = formatDate(customer.partnership.endDate);
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-6 pl-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {customer.title}
                </DialogTitle>
                {customer.category && (
                  <Badge variant="outline" className="text-xs">
                    {customer.category}
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-base text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{customer.name}</span>
                </div>
                {customer.location && (
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{customer.location}</span>
                  </div>
                )}
                {customer.partnership && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatPartnershipPeriod()}</span>
                  </div>
                )}
              </DialogDescription>
            </div>
            {customer.logoPath && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={customer.logoPath} 
                  alt={`${customer.title} logo`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">
              <span className="flex items-center gap-2">
                Services
                {customer.services && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {customer.services.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="partnership">Partnership</TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-3 min-h-[400px]">
              {/* Customer Description */}
              {customer.description && (
                <div className="px-4 py-2">
                  <CardDescription 
                    className="text-sm leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: customer.description }}
                  />
                </div>
              )}

              {/* Industry & Category */}
              <div className="px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.industry && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">Industry:</span>
                      <Badge variant="outline">{customer.industry}</Badge>
                    </div>
                  )}
                  {customer.relationship && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">Relationship:</span>
                      <Badge variant="outline">{customer.relationship}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {customer.contact && (
                <Card className="mx-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="w-4 h-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{customer.contact.email}</span>
                        </div>
                      )}
                      {customer.contact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{customer.contact.phone}</span>
                        </div>
                      )}
                      {customer.contact.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{customer.contact.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Website Link */}
              {customer.website && (
                <div className="px-4 py-2">
                  <a 
                    href={customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Visit Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Testimonial */}
              {customer.testimonial && (
                <Card className="mx-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Testimonial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-sm italic text-muted-foreground mb-3">
                      "{customer.testimonial.text}"
                    </blockquote>
                    <div className="text-sm">
                      <div className="font-semibold">{customer.testimonial.author}</div>
                      <div className="text-muted-foreground">{customer.testimonial.position}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Achievements */}
              {customer.achievements && customer.achievements.length > 0 && (
                <Card className="mx-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="w-4 h-4" />
                      Key Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {customer.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-6 min-h-[400px]">
              <div className="p-4">
                {customer.services && customer.services.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Services Provided</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {customer.services.map((service, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-sm font-medium text-foreground">{service}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No service information available.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Technologies Used */}
                {customer.technologies && customer.technologies.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Technologies Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {customer.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Projects */}
                {customer.projects && customer.projects.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Related Projects</h4>
                    <div className="space-y-2">
                      {customer.projects.map((project, index) => (
                        <div key={index} className="p-3 bg-card border border-border/50 rounded-lg">
                          <div className="text-sm font-medium">{project}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="partnership" className="space-y-6 min-h-[400px]">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Partnership Details</h3>
                </div>

                {customer.partnership ? (
                  <div className="space-y-4">
                    {/* Partnership Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Partnership Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Status:</span>
                          <Badge className={getPartnershipStatusColor(customer.partnership.status)}>
                            {customer.partnership.status?.charAt(0).toUpperCase() + customer.partnership.status?.slice(1) || 'Unknown'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Partnership Duration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatPartnershipPeriod()}</span>
                          </div>
                          {customer.partnership.startDate && (
                            <div className="text-xs text-muted-foreground">
                              Partnership established: {formatDate(customer.partnership.startDate)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No partnership information available.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog;
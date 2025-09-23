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
  companyCodes?: string[];
  projectNames?: string[];
  resolvedCompanyNames?: string[];
  resolvedProjectTitles?: string[];
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
  customerLogo?: string;
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({
  customer,
  isOpen,
  onClose,
  customerLogo
}) => {
  if (!customer) return null;

  // Helper function to resolve company logo paths
  const resolveCompanyLogo = (companyCode: string): string | null => {
    // Map company codes to logo filenames
    const logoMap: { [key: string]: string } = {
      'ERC': 'erc.png',
      'DATASEL': 'datasel.png',
      'jengai': 'jengai.png',
      'gamyte': 'gamyte.png',
      'FONET': 'fonet.png',
      'JANDARMA': 'jandarma.egitim.png',
      'HALICI': 'halici.png',
      'LABRIS': 'labris.png',
      'METU.CEIT': 'metu.ceit.png',
      'METU.II': 'metu.ii.png',
      'METU': 'metu.png'
    };
    
    const logoFile = logoMap[companyCode];
    return logoFile ? `/src/assets/logos/companies/${logoFile}` : null;
  };

  // Helper function to resolve technology logo paths
  const resolveTechnologyLogo = (tech: string): string | null => {
    // Map technology names to logo filenames (normalize to lowercase for matching)
    const techLogoMap: { [key: string]: string } = {
      '.net': 'net.png',
      'c#': 'csharp.png',
      'ms sql server': 'mssql.png',
      'mssql': 'mssql.png',
      'sql server': 'mssql.png',
      'asp.net': 'aspnet.png',
      'crystal reports': 'crystalreports.png',
      'oracle': 'oracle.png',
      'web services': 'soap.png',
      'javascript': 'js.png',
      'jquery': 'jquery.png',
      'html': 'html5.png',
      'css': 'css3.png',
      'bootstrap': 'bootstrap.png',
      'angular': 'angular.png',
      'react': 'js.png',
      'nodejs': 'nodejs.png',
      'node.js': 'nodejs.png',
      'typescript': 'typescript.png',
      'mysql': 'mysql.png',
      'postgresql': 'postgresql.png',
      'mongodb': 'mongodb.png',
      'docker': 'docker.png',
      'azure': 'azure.png',
      'aws': 'aws.png',
      'git': 'git.png',
      'visual studio': 'visualstudio.png',
      'vs code': 'vscode.png',
      'java': 'java.png',
      'python': 'python.png',
      'php': 'php.png'
    };
    
    const normalizedTech = tech.toLowerCase().trim();
    const logoFile = techLogoMap[normalizedTech];
    return logoFile ? `/src/assets/logos/technologies/small_50x50/${logoFile}` : null;
  };

  // Helper function to resolve project logo paths based on project name
  const resolveProjectLogo = (projectName: string): string | null => {
    // Map project names to their icon filenames
    const projectLogoMap: { [key: string]: string } = {
      'JENGAIAPP': 'jengai.app.png',
      'GAMYTEAPP': 'gamyte.app.png', 
      'ALISVERISASISTANI': 'alisveris.asistani.png',
      'PARDUSDOCKER': 'PARDUSDOCKER.png',
      'ATTP': 'ATTP.png',
      'ATTPMobile': 'ATTPMobile.png',
      'PDFW': 'PDFW.png',
      'VKBS': 'VKBS.png',
      'ProEmpower': 'ProEmpower.png',
      'HIS2x': 'HIS2x.png',
      'ABI': 'ABI.png',
      'AHBS': 'AHBS.png',
      'AIS': 'AIS.png'
    };
    
    const logoFile = projectLogoMap[projectName];
    return logoFile ? `/src/assets/files/projects/_logos/${logoFile}` : null;
  };

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
            {customerLogo && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={customerLogo} 
                  alt={`${customer.title} logo`}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    // Try with /src/assets/ prefix for development fallback
                    const currentSrc = e.currentTarget.src;
                    if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                      e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                    } else {
                      // Hide image if it fails to load even with fallback
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="companies-projects">
              <span className="flex items-center gap-2">
                Companies & Projects
                {((customer.companyCodes && customer.companyCodes.length > 0) || (customer.projectNames && customer.projectNames.length > 0)) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {(customer.companyCodes?.length || 0) + (customer.projectNames?.length || 0)}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                {customer.technologies && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {customer.technologies.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
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
              </div>
            </TabsContent>

            <TabsContent value="companies-projects" className="space-y-6 min-h-[400px]">
              <div className="p-4">
                {/* Associated Companies Section */}
                {customer.companyCodes && customer.companyCodes.length > 0 ? (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Associated Companies</h3>
                    </div>
                    <div className="space-y-3">
                      {customer.companyCodes.map((companyCode, index) => {
                        const companyName = customer.resolvedCompanyNames?.[index];
                        const logoPath = resolveCompanyLogo(companyCode);
                        
                        // Only show company if we have a resolved name (don't show raw codes)
                        if (!companyName) return null;
                        
                        return (
                          <div key={index} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-lg hover:shadow-md transition-shadow">
                            {/* Company Logo */}
                            {logoPath && (
                              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={logoPath}
                                  alt={`${companyName} logo`}
                                  className="w-10 h-10 object-contain rounded"
                                  onError={(e) => {
                                    // Try with /assets/ prefix for production fallback
                                    const currentSrc = e.currentTarget.src;
                                    if (currentSrc.includes('/src/assets/')) {
                                      e.currentTarget.src = currentSrc.replace('/src/assets/', '/assets/');
                                    } else {
                                      // Hide image if it fails to load
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Company Name */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {companyName}
                              </div>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>
                ) : null}

                {/* Related Projects Section */}
                {customer.projectNames && customer.projectNames.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Related Projects</h3>
                    </div>
                    <div className="space-y-3">
                      {customer.projectNames.map((projectName, index) => {
                        const projectTitle = customer.resolvedProjectTitles?.[index] || projectName;
                        const logoPath = resolveProjectLogo(projectName);
                        
                        return (
                          <div key={index} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-lg hover:shadow-md transition-shadow">
                            {/* Project Logo */}
                            {logoPath && (
                              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={logoPath}
                                  alt={`${projectTitle} logo`}
                                  className="w-10 h-10 object-contain rounded"
                                  onError={(e) => {
                                    // Try with /assets/ prefix for production fallback
                                    const currentSrc = e.currentTarget.src;
                                    if (currentSrc.includes('/src/assets/')) {
                                      e.currentTarget.src = currentSrc.replace('/src/assets/', '/assets/');
                                    } else {
                                      // Hide image if it fails to load
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Project Details */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {projectTitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* No Data Message */}
                {(!customer.companyCodes || customer.companyCodes.length === 0) && (!customer.projectNames || customer.projectNames.length === 0) && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No company or project information available.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="technologies" className="space-y-6 min-h-[400px]">
              <div className="p-4">
                {customer.technologies && customer.technologies.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Technologies Used</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {customer.technologies.map((tech, index) => {
                        const logoPath = resolveTechnologyLogo(tech);
                        
                        return (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30 hover:shadow-sm transition-shadow">
                            {/* Technology Logo */}
                            {logoPath && (
                              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={logoPath}
                                  alt={`${tech} logo`}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    // Try with /assets/ prefix for production fallback
                                    const currentSrc = e.currentTarget.src;
                                    if (currentSrc.includes('/src/assets/')) {
                                      e.currentTarget.src = currentSrc.replace('/src/assets/', '/assets/');
                                    } else {
                                      // Hide image if it fails to load
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Technology Name */}
                            <span className="text-sm font-medium text-foreground">
                              {tech}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No technology information available.</p>
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
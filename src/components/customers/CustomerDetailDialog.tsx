import React, { useEffect, useState } from 'react';
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
  Briefcase,
  Star,
  ExternalLink,
  Phone,
  Mail,
  Clock
} from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { referencesRepo } from '@/repositories/ReferencesRepo';
import type { Customer } from '@/models/Customer';
import type { Company } from '@/models/Companies';
import type { Reference } from '@/models/Reference';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  customerLogo?: string;
  companyTitle?: string;
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({
  customer,
  isOpen,
  onClose,
  customerLogo,
  companyTitle
}) => {
  const [projectLogos, setProjectLogos] = useState<Record<string, string>>({});
  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [customerReferences, setCustomerReferences] = useState<Reference[]>([]);

  // Fetch project logos when customer changes
  useEffect(() => {
    const fetchLogos = async () => {
      if (!customer?.projectCodes) return;
      
      const logos: Record<string, string> = {};
      for (const projectCode of customer.projectCodes) {
        if (projectCode) {
          const logo = await projectsRepo.getPhotoUrlByCode(projectCode);
          if (logo) {
            logos[projectCode] = logo;
          }
        }
      }
      setProjectLogos(logos);
    };

    if (customer?.projectCodes && customer.projectCodes.length > 0) {
      fetchLogos();
    }
  }, [customer?.projectCodes]);

  // Fetch technology logos when customer changes
  useEffect(() => {
    const fetchLogos = async () => {
      if (!customer?.skillCodes) return;
      
      const logos: Record<string, string> = {};
      for (const skillCode of customer.skillCodes) {
        if (skillCode) {
          const logo = await skillsRepo.getPhotoUrlByCode(skillCode);
          if (logo) {
            logos[skillCode] = logo;
          }
        }
      }
      setTechnologyLogos(logos);
    };

    if (customer?.skillCodes && customer.skillCodes.length > 0) {
      fetchLogos();
    }
  }, [customer?.skillCodes]);

  // Fetch company data when customer changes
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!customer?.companyCode) return;
      
      const company = await companiesRepo.getByCode(customer.companyCode);
      setCompanyData(company);
    };

    if (customer?.companyCode) {
      fetchCompanyData();
    }
  }, [customer?.companyCode]);

  // Fetch testimonials/references related to customer's company
  useEffect(() => {
    const fetchReferences = async () => {
      if (!customer?.companyCode) return;
      
      const allReferences = await referencesRepo.getList();
      // Find references from people who worked at this company
      const relatedRefs = allReferences.filter(
        ref => ref.isActive && 
        ref.company.toLowerCase().includes(companyData?.title.toLowerCase() || customer.companyCode?.toLowerCase() || '')
      );
      setCustomerReferences(relatedRefs.slice(0, 3)); // Show up to 3 testimonials
    };

    if (customer?.companyCode && companyData) {
      fetchReferences();
    }
  }, [customer?.companyCode, companyData]);

  if (!customer) return null;

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
                  {companyTitle || customer.companyCode || customer.code}
                </DialogTitle>
                {customer.category && (
                  <Badge variant="outline" className="text-xs">
                    {customer.category}
                  </Badge>
                )}
              </div>
              <div className="text-base text-muted-foreground">
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
              </div>
            </div>
            {customerLogo && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={customerLogo} 
                  alt={`${companyTitle || customer.companyCode} logo`}
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <span className="flex items-center gap-2">
                Overview
                {(customer.projectCodes && customer.projectCodes.length > 0) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {customer.projectCodes.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                {customer.skillCodes && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {customer.skillCodes.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="services">
              <span className="flex items-center gap-2">
                Services
                {customer.serviceCodes && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {customer.serviceCodes.length}
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
              {(customer.industry || customer.relationship) && (
                <div className="px-4 py-2">
                  <div className="flex flex-wrap gap-3">
                    {customer.industry && (
                      <Badge variant="outline">{customer.industry}</Badge>
                    )}
                    {customer.relationship && (
                      <Badge variant="outline">{customer.relationship}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Company Information Card */}
              {companyData && (
                <Card className="mx-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="w-4 h-4" />
                      Company Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {companyData.city && companyData.country && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{companyData.city}, {companyData.country}</span>
                      </div>
                    )}
                    {companyData.websiteUrl && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={companyData.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    {companyData.linkedinUrl && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={companyData.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Testimonials Section */}
              {customerReferences.length > 0 && (
                <Card className="mx-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Testimonials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customerReferences.map((reference, index) => (
                      <div key={index} className="space-y-2">
                        <blockquote 
                          className="text-sm italic text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: `"${reference.testimonial}"` }}
                        />
                        <div className="flex items-center gap-2 pt-2">
                          {reference.photoUrl && (
                            <img 
                              src={reference.photoUrl}
                              alt={reference.title}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="text-sm">
                            <div className="font-semibold">{reference.title}</div>
                            <div className="text-muted-foreground text-xs">{reference.position} at {reference.company}</div>
                          </div>
                        </div>
                        {index < customerReferences.length - 1 && (
                          <div className="border-b border-border/50 mt-3"></div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Related Projects */}
              {customer.projectCodes && customer.projectCodes.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Related Projects</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {customer.projectCodes.length}
                    </Badge>
                  </h4>
                  <div className="space-y-3">
                    {customer.projectCodes.map((projectCode, index) => {
                        const logoPath = projectLogos[projectCode] || "";
                        
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            {/* Project Logo */}
                            {logoPath && (
                              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={logoPath}
                                  alt={`${projectCode} logo`}
                                  className="w-7 h-7 object-contain rounded"
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
                                {projectCode}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-6 min-h-[400px]">
              <div className="p-4">
                {customer.serviceCodes && customer.serviceCodes.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Services Provided</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {customer.serviceCodes.map((serviceCode, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-sm font-medium text-foreground">{serviceCode}</div>
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

            <TabsContent value="technologies" className="space-y-2 min-h-[400px]">
              {customer.skillCodes && customer.skillCodes.length > 0 ? (
                <div className="px-4 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    {customer.skillCodes.map((skillCode, index) => {
                      const logoPath = technologyLogos[skillCode] || "";
                      const isEven = index % 2 === 0;
                      const isLastInColumn = index === customer.skillCodes.length - 1 || 
                        (isEven && index === customer.skillCodes.length - 2 && customer.skillCodes.length % 2 === 0);
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                            {/* Technology Logo */}
                            {logoPath && (
                              <img 
                                src={logoPath}
                                alt={`${skillCode} logo`}
                                className="w-5 h-5 object-contain flex-shrink-0"
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
                            )}
                            
                            {/* Technology Name */}
                            <span className="text-sm font-medium text-foreground">
                              {skillCode}
                            </span>
                          </div>
                          {!isLastInColumn && (
                            <div className="border-b border-dashed border-border/50 mx-4"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No technology information available.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog;
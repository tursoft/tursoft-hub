import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { domainsRepo } from '@/repositories/DomainsRepo';
import type { Domain, DomainsData } from '@/models/Domain';

const DomainsSection = () => {
  const [domainsData, setDomainsData] = useState<DomainsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load domains data using repository
  useEffect(() => {
    const loadDomainsData = async () => {
      try {
        const domains = await domainsRepo.getList();
        setDomainsData({ items: domains });
      } catch (error) {
        console.error('Failed to load domains data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDomainsData();
  }, []);

  if (isLoading || !domainsData) {
    return (
      <section id="domains" className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">Loading domains...</div>
          </div>
        </div>
      </section>
    );
  }

  const { items: domains } = domainsData;

  return (
    <section id="domains" className="py-20 bg-background/50">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">Domain Expertise</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Industry
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">
                Domains
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Specialized expertise across diverse industries and technology domains
            </p>
          </div>

          {/* Domains Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {domains.map((domain, index) => (
              <Card 
                key={domain.code}
                className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Domain Icon/Image */}
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors overflow-hidden">
                      {domain.photoUrl ? (
                        <img 
                          src={domain.photoUrl} 
                          alt={`${domain.title} icon`}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-primary">
                          {domain.title?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {domain.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;
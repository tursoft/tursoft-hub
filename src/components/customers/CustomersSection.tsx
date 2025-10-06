import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import CustomerDetailDialog from './CustomerDetailDialog';
import type { Customer, CustomerData } from '@/models/Customer';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import DataDisplaySection from '@/components/ui/DataDisplaySection';

interface CustomerWithLogo extends Customer {
  logo: string;
  companyTitle: string;
}

const CustomersSectionRefactored = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState<CustomerWithLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Load customer data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/customers.json');
        const data = await response.json() as CustomerData;

        // Load customer logos and titles from companiesRepo
        const customersWithLogos = await Promise.all(
          data.items.map(async (customer) => {
            const logo = (await companiesRepo.getPhotoUrlByCode(customer.companyCode)) || '';
            const companyTitle = (await companiesRepo.getTitleByCode(customer.companyCode)) || customer.companyCode;
            return {
              ...customer,
              logo,
              companyTitle,
            };
          })
        );

        setCustomers(customersWithLogos);
      } catch (error) {
        console.error('Failed to load customers:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter customers by category and search
  const filteredCustomers = customers.filter((customer) => {
    const matchesCategory = selectedCategory === "All" || customer.category === selectedCategory;
    const matchesSearch = !searchText.trim() || 
      customer.companyCode.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.description.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.category?.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['All', ...new Set(customers.map(c => c.category))].sort();

  const getCategoryCount = (category: string) => {
    if (category === "All") return customers.length;
    return customers.filter(c => c.category === category).length;
  };

  // Handle customer click
  const handleCustomerClick = (customer: CustomerWithLogo) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <section id="customers" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Clients & <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent">Customers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors
          </p>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters ({getCategoryCount(selectedCategory)})
            </Button>
          </div>

          {/* Filter Categories */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="flex flex-wrap gap-2 w-full">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex-1 min-w-fit transition-all duration-200 hover:scale-105"
                >
                  {category}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getCategoryCount(category)}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers, industries, or categories..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* DataDisplaySection */}
        <DataDisplaySection<CustomerWithLogo>
          data={filteredCustomers}
          isLoading={isLoading}
          loadingMessage="Loading customers..."
          emptyMessage="No customers found in this category."
          defaultViewMode="card"
          enabledModes={['card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={30}
          fieldMapping={{
            code: 'code',
            title: (customer) => customer.companyTitle,
            subtitle: (customer) => customer.companyCode,
            description: 'description',
            image: 'logo',
            badge: 'category',
          }}
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          carouselHeight="600px"
          carouselCardWidth="400px"
          carouselCardHeight="500px"
          onItemClick={handleCustomerClick}
          footer={
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {customers.length}+
                </div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {categories.length - 1}
                </div>
                <div className="text-sm text-muted-foreground">Industries</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  8
                </div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  15+
                </div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>
          }
        />
      </div>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        customer={selectedCustomer}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCustomer(null);
        }}
        customerLogo={selectedCustomer ? customers.find(c => c.code === selectedCustomer.code)?.logo : undefined}
        companyTitle={selectedCustomer ? customers.find(c => c.code === selectedCustomer.code)?.companyTitle : undefined}
      />
    </section>
  );
};

export default CustomersSectionRefactored;

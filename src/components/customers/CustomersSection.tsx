import { useState, useEffect } from 'react';
import CustomerDetailDialog from './CustomerDetailDialog';
import type { Customer, CustomerData } from '@/models/Customer';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ListViewer from '@/components/ui/listviewer';
import AnimatedCounter from '@/components/ui/animated-counter';

interface CustomerWithLogo extends Customer {
  logo: string;
  companyTitle: string;
}

const CustomersSection = () => {
  const [customers, setCustomers] = useState<CustomerWithLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Get unique categories for statistics
  const categories = [...new Set(customers.map(c => c.category))];

  // Handle customer click
  const handleCustomerClick = (customer: CustomerWithLogo) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <section id="customers" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* listviewer with built-in filters */}
        <ListViewer<CustomerWithLogo>
          data={customers}
          isLoading={isLoading}
          loadingMessage="Loading customers..."
          emptyMessage="No customers found in this category."
          title='Clients & <span class="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent">Customers</span>'
          subtitle="Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors"
          summary={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={customers.length} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={categories.length} />
                </div>
                <div className="text-sm text-muted-foreground">Industries</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={8} />
                </div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={25} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>
          }
          defaultViewMode="small-card"
          enabledModes={['small-card', 'card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={21}
          enableCategoryFilter={true}
          categoryField="category"
          enableSearch={true}
          searchFields={['companyCode', 'description', 'category']}
          searchPlaceholder="Search customers, industries, or categories..."
          fieldMapping={{
            code: 'code',
            title: (customer) => customer.companyTitle,
            description: 'description',
            image: 'logo',
            badge: 'category',
          }}
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          carouselHeight="600px"
          carouselCardWidth="400px"
          carouselCardHeight="500px"
          onItemClick={handleCustomerClick}
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

export default CustomersSection;

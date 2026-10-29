import { useState, useEffect, type ComponentType, type ReactNode } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { MapPin, Building2, Handshake, CalendarRange, Layers, Globe, Award, Users, type LucideProps } from 'lucide-react';
import CustomerDetailDialog from './CustomerDetailDialog';
import type { Customer, CustomerData } from '@/models/Customer';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ListViewer from '@/components/ui/listviewer';
import AnimatedCounter from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { LogoPlate } from '@/components/ui/logo-plate';

interface CustomerWithLogo extends Customer {
  logo: string;
  companyTitle: string;
}

type IconType = ComponentType<LucideProps>;

/** "01.01.2008" → "2008" */
const yearOf = (date?: string) => date?.split('.').pop() ?? '';

/** Partnership years, e.g. "2008 – 2018", "2019 – Present" or "2021". */
const partnershipLabel = (customer: Customer) => {
  const p = customer.partnership;
  if (!p?.startDate) return '';
  const start = yearOf(p.startDate);
  const end = p.endDate ? yearOf(p.endDate) : p.status === 'completed' ? '' : 'Present';
  return end && end !== start ? `${start} – ${end}` : start;
};

const CategoryBadge = ({ category }: { category?: string | null }) =>
  category ? (
    <Badge variant="outline" className="border-primary/30 text-[10px] uppercase tracking-wider text-primary">
      {category}
    </Badge>
  ) : null;

const Meta = ({ icon: Icon, children }: { icon: IconType; children: ReactNode }) => (
  <span className="inline-flex min-w-0 items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--primary-light))]/80" aria-hidden="true" />
    <span className="truncate">{children}</span>
  </span>
);

const Fact = ({ icon: Icon, label, value }: { icon: IconType; label: string; value?: string | null }) =>
  value ? (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/80">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </dt>
      <dd className="truncate text-xs font-medium text-foreground/90">{value}</dd>
    </div>
  ) : null;

/** Compact grid tile: logo on a light plate, name and sector underneath. */
const CustomerTile = ({ customer }: { customer: CustomerWithLogo }) => (
  <div className="customer-tile group flex h-full flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
    <LogoPlate src={customer.logo} alt={customer.companyTitle} className="aspect-[4/3] w-full p-3" />
    <div className="w-full text-center">
      <div className="line-clamp-2 text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        {customer.companyTitle}
      </div>
      {customer.category && (
        <div className="mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">{customer.category}</div>
      )}
    </div>
  </div>
);

/** Card view: logo, sector, location, summary and the key facts. */
const CustomerCard = ({ customer }: { customer: CustomerWithLogo }) => (
  <div className="group flex h-full flex-col gap-4 p-5">
    <div className="flex items-start gap-4">
      <LogoPlate src={customer.logo} alt={customer.companyTitle} className="h-16 w-24 flex-shrink-0 p-2" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5">
          <CategoryBadge category={customer.category} />
        </div>
        <h3 className="font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {customer.companyTitle}
        </h3>
        {customer.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {customer.location}
          </p>
        )}
      </div>
    </div>
    {customer.description && (
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{customer.description}</p>
    )}
    <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/50 pt-3">
      <Fact icon={Building2} label="Industry" value={customer.industry} />
      <Fact icon={Handshake} label="Relationship" value={customer.relationship} />
      <Fact icon={CalendarRange} label="Period" value={partnershipLabel(customer)} />
      <Fact icon={Layers} label="Stack" value={customer.skillCodes?.slice(0, 3).join(' · ')} />
    </dl>
  </div>
);

/** List view: one row per customer with the facts inline and the stack as chips. */
const CustomerRow = ({ customer }: { customer: CustomerWithLogo }) => {
  const period = partnershipLabel(customer);
  const skills = customer.skillCodes ?? [];
  return (
    <div className="group flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
      <LogoPlate src={customer.logo} alt={customer.companyTitle} className="h-20 w-full p-3 sm:w-32 sm:flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {customer.companyTitle}
          </h3>
          <CategoryBadge category={customer.category} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {customer.location && <Meta icon={MapPin}>{customer.location}</Meta>}
          {customer.industry && <Meta icon={Building2}>{customer.industry}</Meta>}
          {customer.relationship && <Meta icon={Handshake}>{customer.relationship}</Meta>}
          {period && <Meta icon={CalendarRange}>{period}</Meta>}
        </div>
        {customer.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{customer.description}</p>
        )}
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-readable"
              >
                {skill}
              </span>
            ))}
            {skills.length > 6 && <span className="px-1 text-[11px] text-muted-foreground">+{skills.length - 6}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ icon: Icon, label, children }: { icon: IconType; label: string; children: ReactNode }) => (
  <div className="stat-tile relative overflow-hidden rounded-xl border border-border/60 bg-card/70 p-5 text-center transition-all duration-300 hover:border-primary/50">
    <Icon className="mx-auto mb-2 h-5 w-5 text-[hsl(var(--primary-light))] opacity-80" aria-hidden="true" />
    <div className="text-gradient text-3xl font-bold">{children}</div>
    <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

const CustomersSection = () => {
  const [customers, setCustomers] = useSnapshotState<CustomerWithLogo[]>('customers.customers', []);
  const [isLoading, setIsLoading] = useSnapshotState('customers.isLoading', true);
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
  }, [setCustomers, setIsLoading]);

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
          title='Clients & Customers<span class="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent"> in Healthcare, Government and Enterprise</span>'
          subtitle="Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors"
          summary={
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              <StatTile icon={Users} label="Total Customers">
                <AnimatedCounter end={customers.length} suffix="+" />
              </StatTile>
              <StatTile icon={Layers} label="Industries">
                <AnimatedCounter end={categories.length} />
              </StatTile>
              <StatTile icon={Globe} label="Countries">
                <AnimatedCounter end={8} />
              </StatTile>
              <StatTile icon={Award} label="Years Experience">
                <AnimatedCounter end={25} suffix="+" />
              </StatTile>
            </div>
          }
          defaultViewMode="small-card"
          enabledModes={['small-card', 'card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={18}
          enableCategoryFilter={true}
          categoryField="category"
          enableSearch={true}
          searchFields={['companyCode', 'companyTitle', 'description', 'category', 'location', 'industry']}
          searchPlaceholder="Search customers, industries, or categories..."
          fieldMapping={{
            code: 'code',
            title: (customer) => customer.companyTitle,
            description: 'description',
            image: 'logo',
            badge: 'category',
          }}
          renderSmallCardContent={(customer) => <CustomerTile customer={customer} />}
          renderCardContent={(customer) => <CustomerCard customer={customer} />}
          renderListContent={(customer) => <CustomerRow customer={customer} />}
          smallCardGridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          gridCols={{ sm: 1, md: 2, lg: 3 }}
          carouselLabel="Customers"
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

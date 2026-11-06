import { useState, useEffect, type ReactNode } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import CustomerDetailDialog from './CustomerDetailDialog';
import type { Customer, CustomerData } from '@/models/Customer';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SectionHeader from '@/components/SectionHeader';
import ListViewer from '@/components/ui/listviewer';
import AnimatedCounter from '@/components/ui/animated-counter';
import { LogoPlate } from '@/components/ui/logo-plate';
import { cn } from '@/lib/utils';

interface CustomerWithLogo extends Customer {
  logo: string;
  companyTitle: string;
}

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

/** "Government · Ankara, Turkey · Government Healthcare": quiet meta joined with middots. */
const metaLine = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

const Fact = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="min-w-0">
      <dt className="text-xs leading-4 text-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] leading-5 text-foreground">{value}</dd>
    </div>
  ) : null;

/** Compact grid: the printed client list. Logo on a plain sheet, name and sector under it. */
const CustomerTile = ({ customer }: { customer: CustomerWithLogo }) => (
  <div className="group flex h-full flex-col gap-3">
    <LogoPlate src={customer.logo} alt={customer.companyTitle} className="aspect-[3/2] w-full p-4" />
    <div className="min-w-0">
      <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 ease-dossier group-hover:decoration-foreground/40">
        {customer.companyTitle}
      </h3>
      {customer.category && <p className="mt-0.5 truncate text-[13px] leading-5 text-faint">{customer.category}</p>}
    </div>
  </div>
);

/** Card view (and carousel): logo, sector, location, summary and the key facts. */
const CustomerCard = ({ customer }: { customer: CustomerWithLogo }) => (
  <div className="group flex h-full flex-col p-5">
    <div className="flex items-start gap-4">
      <LogoPlate src={customer.logo} alt={customer.companyTitle} className="h-14 w-20 flex-shrink-0 p-2" />
      <div className="min-w-0 flex-1">
        {customer.category && <p className="text-[13px] leading-5 text-faint">{customer.category}</p>}
        <h3 className="text-base font-medium leading-6 text-foreground">{customer.companyTitle}</h3>
        {customer.location && <p className="text-[13px] leading-5 text-muted-foreground">{customer.location}</p>}
      </div>
    </div>
    {customer.description && (
      <p className="mt-4 line-clamp-3 text-sm leading-[22px] text-muted-foreground">{customer.description}</p>
    )}
    <div className="mt-auto pt-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        <Fact label="Industry" value={customer.industry} />
        <Fact label="Relationship" value={customer.relationship} />
        <Fact label="Period" value={partnershipLabel(customer)} />
        <Fact label="Stack" value={customer.skillCodes?.slice(0, 3).join(' · ')} />
      </dl>
    </div>
  </div>
);

/** List view: one ruled row per customer, the facts as a quiet meta line, the stack as text. */
const CustomerRow = ({ customer }: { customer: CustomerWithLogo }) => {
  const period = partnershipLabel(customer);
  const skills = customer.skillCodes ?? [];
  return (
    <div className="group flex items-start gap-4 px-4 py-5 sm:gap-6">
      <LogoPlate
        src={customer.logo}
        alt={customer.companyTitle}
        className="h-14 w-20 flex-shrink-0 p-2 sm:h-16 sm:w-28 sm:p-3"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <h3 className="text-base font-medium leading-6 text-foreground sm:text-[17px]">{customer.companyTitle}</h3>
          {period && <p className="text-[13px] leading-5 text-faint tnum sm:flex-shrink-0">{period}</p>}
        </div>
        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
          {metaLine([customer.category, customer.location, customer.industry, customer.relationship])}
        </p>
        {customer.description && (
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-[22px] text-muted-foreground">{customer.description}</p>
        )}
        {skills.length > 0 && (
          <p className="mt-2 text-[13px] leading-5 text-faint">
            {skills.slice(0, 6).join(' · ')}
            {skills.length > 6 && <span className="tnum"> and {skills.length - 6} more</span>}
          </p>
        )}
      </div>
    </div>
  );
};

/** A key figure set large in the serif, its label under it. Hairlines divide the four. */
const StatFigure = ({ label, index, children }: { label: string; index: number; children: ReactNode }) => (
  <div
    className={cn(
      'flex flex-col-reverse justify-end border-border py-5 md:py-6',
      index === 1 && 'border-l pl-5 md:pl-8',
      index === 2 && 'border-t md:border-l md:border-t-0 md:pl-8',
      index === 3 && 'border-l border-t pl-5 md:border-t-0 md:pl-8',
    )}
  >
    <dt className="mt-2 text-[13px] leading-5 text-muted-foreground">{label}</dt>
    <dd className="font-serif text-[40px] leading-none tracking-[-0.01em] text-foreground tnum md:text-5xl">
      {children}
    </dd>
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
    <section id="customers" className="py-16 lg:py-24">
      <div className="container">
        <SectionHeader
          id="customers"
          title="Clients and customers in healthcare, government and enterprise"
          description="Organizations and institutions that have trusted us with their technology needs across healthcare, government and enterprise sectors"
        />

        {/* listviewer with built-in filters */}
        <ListViewer<CustomerWithLogo>
          data={customers}
          isLoading={isLoading}
          loadingMessage="Loading customers"
          emptyMessage="No customers found in this category"
          summary={
            <dl className="grid grid-cols-2 border-b border-border md:grid-cols-4">
              <StatFigure index={0} label="Customers">
                <AnimatedCounter end={customers.length} suffix="+" />
              </StatFigure>
              <StatFigure index={1} label="Industries">
                <AnimatedCounter end={categories.length} />
              </StatFigure>
              <StatFigure index={2} label="Countries">
                <AnimatedCounter end={8} />
              </StatFigure>
              <StatFigure index={3} label="Years of experience">
                <AnimatedCounter end={25} suffix="+" />
              </StatFigure>
            </dl>
          }
          defaultViewMode="small-card"
          enabledModes={['small-card', 'card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={18}
          enableCategoryFilter={true}
          categoryField="category"
          enableSearch={true}
          searchFields={['companyCode', 'companyTitle', 'description', 'category', 'location', 'industry']}
          searchPlaceholder="Search customers, industries or categories"
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
          renderCarouselContent={(customer) => <CustomerCard customer={customer} />}
          smallCardGridClassName="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-8 xl:grid-cols-6"
          // ListViewer builds its grid classes from gridCols at run time, so they are spelled out
          // here for Tailwind to generate: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          gridCols={{ sm: 1, md: 2, lg: 3 }}
          carouselLabel="Customers"
          carouselHeight="540px"
          carouselCardWidth="400px"
          carouselCardHeight="420px"
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

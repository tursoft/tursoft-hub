import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import type { Customer, CustomerData } from "@/models/Customer";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import { CAREER } from "@/lib/site";
import CustomerDetailDialog from "./CustomerDetailDialog";

interface CustomerWithCompany extends Customer {
  logo: string;
  companyTitle: string;
  country: string;
}

const CustomersSection = () => {
  const [customers, setCustomers] = useState<CustomerWithCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCompany | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/data/customers.json");
        const data = (await response.json()) as CustomerData;
        const withCompanies = await Promise.all(
          data.items.map(async (customer) => {
            const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
            return {
              ...customer,
              logo: company?.photoUrl ?? "",
              companyTitle: company?.title ?? customer.companyCode ?? customer.code,
              country: company?.country ?? "",
            };
          }),
        );
        setCustomers(withCompanies);
      } catch (error) {
        console.error("Failed to load customers:", error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const industryCount = new Set(customers.map((customer) => customer.category).filter(Boolean)).size;
  const countryCount = new Set(customers.map((customer) => customer.country).filter(Boolean)).size;

  return (
    <Section id="customers">
      <SectionHeader
        index="06"
        label="clients"
        title={
          <>
            Organisations that <em>trusted the work.</em>
          </>
        }
        lede="Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors."
      />

      <StatGrid>
        <StatTile value={customers.length} label="customers" />
        <StatTile value={industryCount} label="industries" />
        <StatTile value={countryCount} label="countries" />
        <StatTile value={CAREER.years} suffix="+" label="years" />
      </StatGrid>

      <ListViewer<CustomerWithCompany>
        data={customers}
        isLoading={isLoading}
        loadingMessage="Loading customers…"
        emptyMessage="No customers found in this category."
        defaultViewMode="small-card"
        enabledModes={["small-card", "card", "list", "carousel"]}
        enableShowMore
        visibleMajorItemCount={24}
        enableCategoryFilter
        categoryField="category"
        enableSearch
        searchFields={["companyTitle", "description", "category", "country"]}
        searchPlaceholder="Search customers, industries, or categories…"
        imageVariant="logo-light"
        smallCardCols={{ base: 2, md: 4, lg: 6 }}
        gridCols={{ sm: 1, md: 2, lg: 3 }}
        onItemClick={setSelectedCustomer}
        fieldMapping={{
          code: "code",
          title: "companyTitle",
          subtitle: "country",
          description: (customer) => customer.description ?? "",
          image: "logo",
          badge: "category",
        }}
        ariaLabel="Clients"
      />

      <CustomerDetailDialog
        customer={selectedCustomer}
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customerLogo={selectedCustomer?.logo}
        companyTitle={selectedCustomer?.companyTitle}
      />
    </Section>
  );
};

export default CustomersSection;

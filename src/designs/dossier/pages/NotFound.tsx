import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Seo from "@/shared/Seo";
import PageHeader from "@design/components/PageHeader";
import SiteFooter from "@design/components/SiteFooter";
import { Button } from "@design/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Seo
        title="Page not found | Muhammet Turşak"
        description="The page you requested does not exist on tursoft.net."
        path={location.pathname}
        noindex
      />
      <PageHeader />

      <main className="container flex-1 pt-16 md:pt-24">
        <div className="max-w-[40rem]">
          <p className="kicker">
            <span className="kicker-num">404</span>
            Error
          </p>
          <h1 className="feature-title mt-4">Page not found</h1>
          <p className="mt-5 text-[17px] leading-7 text-muted-foreground [text-wrap:pretty]">
            The address{" "}
            <code className="break-all rounded-sm bg-secondary px-1.5 py-0.5 font-sans text-[15px] text-foreground">{location.pathname}</code>{" "}
            does not exist on this site.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href="/">
              <ArrowLeft strokeWidth={1.5} aria-hidden="true" />
              Return to the homepage
            </a>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFound;

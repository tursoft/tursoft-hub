import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Seo
        title="Page not found | Muhammet Turşak"
        description="The page you requested does not exist on tursoft.net."
        path={location.pathname}
        noindex
      />
      <div className="text-center px-6">
        <p className="text-sm uppercase tracking-widest text-primary mb-4">Error 404</p>
        <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          The address <code className="text-foreground">{location.pathname}</code> does not exist on this site.
        </p>
        <a href="/" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Return to the homepage
        </a>
      </div>
    </div>
  );
};

export default NotFound;

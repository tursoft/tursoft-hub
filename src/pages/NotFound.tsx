import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="container-page flex min-h-screen flex-col items-start justify-center gap-5 py-24">
      <p className="type-eyebrow">
        <span className="type-eyebrow-index">404</span>
        not found
      </p>
      <h1 className="type-display max-w-[16ch]">
        This page does not <em>exist.</em>
      </h1>
      <p className="type-lede max-w-md">
        Nothing lives at <span className="font-mono text-foreground">{location.pathname}</span>.
      </p>
      <Button asChild variant="secondary">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Back to home
        </Link>
      </Button>
    </main>
  );
};

export default NotFound;

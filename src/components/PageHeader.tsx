import { Link } from "react-router-dom";
import { CASE_STUDIES_PATH } from "@/lib/case-studies";
import { PERSON } from "@/lib/site";
import profilePhoto from "@/assets/profile-photo-80.webp";

/** Compact header for pages other than the homepage. */
const PageHeader = () => (
  <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
    <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 group">
        <img src={profilePhoto} alt="" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-primary/40" />
        <span className="text-sm font-semibold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
          {PERSON.name}
        </span>
      </Link>
      <nav aria-label="Site" className="flex items-center gap-5 text-sm">
        <Link to={CASE_STUDIES_PATH} className="text-muted-foreground hover:text-primary transition-colors">
          Case studies
        </Link>
        <a href="/#contact" className="text-muted-foreground hover:text-primary transition-colors">
          Contact
        </a>
      </nav>
    </div>
  </header>
);

export default PageHeader;

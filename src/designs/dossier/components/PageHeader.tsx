import { Link } from "react-router-dom";
import { CASE_STUDIES_PATH } from "@/lib/case-studies";
import { PERSON } from "@/lib/site";

/** Masthead for pages other than the homepage: the name, two quiet links, a hairline. */
const PageHeader = () => (
  <header className="sticky top-0 z-40 bg-background">
    <div className="container">
      <div className="flex h-14 items-center justify-between gap-4 border-b border-border md:h-[72px]">
        <Link to="/" className="whitespace-nowrap text-base font-medium text-foreground md:text-[17px]">
          {PERSON.name}
        </Link>
        <nav aria-label="Site" className="flex items-center gap-5">
          <Link to={CASE_STUDIES_PATH} className="mast-link">
            Case studies
          </Link>
          <a href="/#contact" className="mast-link">
            Contact
          </a>
        </nav>
      </div>
    </div>
  </header>
);

export default PageHeader;

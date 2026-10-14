import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import profilePhoto from "@/assets/profile-photo.jpg";
import { Button } from "@/components/ui/button";
import { CV_LINKS, NAV_ITEMS, OWNER, scrollToSection } from "@/lib/site";
import { cn } from "@/lib/utils";
import CvMenu from "./CvMenu";

const openInNewTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** Id of the section currently crossing the upper third of the viewport. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState("hero");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );
    ["hero", ...ids].forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/** Drives the 1px progress bar and reports whether the hero has been scrolled past. */
function useScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      const hero = document.getElementById("hero");
      setPastHero(window.scrollY > (hero ? hero.offsetHeight - 120 : 400));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return { progressRef, pastHero };
}

/** Sticky top bar: wordmark, section links (≥1181px) or a full-screen menu, and the CV menu. */
export default function SiteNav() {
  const ids = useMemo(() => NAV_ITEMS.map((item) => item.id), []);
  const active = useActiveSection(ids);
  const { progressRef, pastHero } = useScrollProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);

  // From the menu sheet, scroll only after it has closed and released the scroll lock.
  const goTo = (id: string) => {
    if (menuOpen) {
      pendingTarget.current = id;
      setMenuOpen(false);
    } else {
      scrollToSection(id);
    }
  };

  return (
    <header className="site-nav">
      <div ref={progressRef} className="site-nav-progress" aria-hidden="true" />
      <div className="container-page flex h-[var(--nav-height)] items-center justify-between gap-6">
        <a
          href="#hero"
          className="group flex items-center gap-2.5 font-mono text-[13px] text-foreground"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <img
            src={profilePhoto}
            alt=""
            className={cn(
              "h-[26px] w-[26px] rounded-[6px] object-cover outline outline-1 outline-line-strong transition-[opacity,transform] duration-500 ease-smooth group-hover:-rotate-6 group-hover:scale-110",
              pastHero ? "opacity-100" : "-translate-x-1 opacity-0",
            )}
          />
          <span className="whitespace-nowrap">{OWNER.name}</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-[18px] min-[1181px]:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={cn("nav-link", active === item.id && "is-active")}
              onClick={(event) => {
                event.preventDefault();
                goTo(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CvMenu size="sm" className="hidden min-[1181px]:inline-flex" />

          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="secondary" size="icon" className="h-[42px] w-[42px] min-[1181px]:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <DialogPrimitive.Content
                className="fixed inset-0 z-[81] flex flex-col overflow-y-auto px-6 pb-8 pt-[76px] focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
                onCloseAutoFocus={(event) => {
                  const target = pendingTarget.current;
                  if (!target) return;
                  event.preventDefault();
                  pendingTarget.current = null;
                  scrollToSection(target);
                }}
              >
                <DialogPrimitive.Title className="sr-only">Site menu</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Jump to a section or download the CV.
                </DialogPrimitive.Description>
                <DialogPrimitive.Close asChild>
                  <Button variant="secondary" size="icon" className="absolute right-6 top-2 h-[42px] w-[42px]" aria-label="Close menu">
                    <X />
                  </Button>
                </DialogPrimitive.Close>

                <nav aria-label="Sections" className="flex flex-col">
                  {NAV_ITEMS.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center justify-between border-b border-line py-3.5 text-[21px] font-medium tracking-[-0.02em] text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        goTo(item.id);
                      }}
                    >
                      {item.label}
                      <span className="font-mono text-[11px] font-normal text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </a>
                  ))}
                </nav>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <Button onClick={() => openInNewTab(CV_LINKS.compact)}>CV · Compact</Button>
                  <Button variant="secondary" onClick={() => openInNewTab(CV_LINKS.detailed)}>
                    CV · Detailed
                  </Button>
                  <Button variant="secondary" className="col-span-2" onClick={() => goTo("contact")}>
                    Get in touch
                  </Button>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}

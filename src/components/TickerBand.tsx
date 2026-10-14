import { useEffect, useRef, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { skillsRepo } from "@/repositories/SkillsRepo";
import type { CustomerData } from "@/models/Customer";
import { useFrame, usePrefersReducedMotion } from "@/lib/motion/hooks";
import { wrap } from "@/lib/motion/math";
import { cn } from "@/lib/utils";

interface TickerItem {
  key: string;
  label: string;
  image?: string | null;
  /** Logos that need a light background to stay visible (client logos). */
  lightLogo?: boolean;
}

/** Copies of the item list laid side by side so the row never shows a gap while wrapping. */
const COPIES = 3;
/** How far a row slides per pixel of page scroll. */
const SCROLL_FACTOR = 0.35;

interface TickerRowProps {
  items: TickerItem[];
  /** 1: drifts left and slides right while scrolling down; -1: the opposite. */
  direction: 1 | -1;
  /** Idle drift speed in px per second. */
  speed: number;
}

function TickerRow({ items, direction, speed }: TickerRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const copyWidth = useRef(0);
  const phase = useRef(0);
  const hovered = useRef(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const measure = () => {
      copyWidth.current = copy.offsetWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [items]);

  useFrame((state) => {
    const row = rowRef.current;
    const width = copyWidth.current;
    if (!row || width === 0) return;
    if (!hovered.current) phase.current += state.delta * speed;
    const offset = direction * (state.scrollY * SCROLL_FACTOR - phase.current);
    row.style.transform = `translate3d(${(wrap(offset, width) - width).toFixed(1)}px, 0, 0)`;
  }, !reduce);

  return (
    <div
      ref={rowRef}
      className="ticker-row"
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      {Array.from({ length: COPIES }, (_, copyIndex) => (
        <div
          key={copyIndex}
          ref={copyIndex === 0 ? copyRef : undefined}
          className="ticker-copy"
          aria-hidden={copyIndex > 0 ? true : undefined}
        >
          {items.map((item) => (
            <span key={item.key} className="ticker-item">
              {item.image && (
                <img src={item.image} alt="" loading="lazy" className={cn(item.lightLogo && "ticker-logo-light")} />
              )}
              {item.label}
              <i className="ticker-sep" aria-hidden="true" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Two endless rows under the hero: major skills, then clients. They slide in opposite directions with scroll. */
export default function TickerBand() {
  const [rows, setRows] = useState<TickerItem[][]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [skills, response] = await Promise.all([skillsRepo.getList(), fetch("/data/customers.json")]);
        const customers = ((await response.json()) as CustomerData).items;
        const skillItems: TickerItem[] = skills
          .filter((skill) => skill.isMajor)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((skill) => ({ key: skill.code, label: skill.title, image: skill.photoUrl }));
        const clientItems: TickerItem[] = await Promise.all(
          customers.map(async (customer) => {
            const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
            return {
              key: customer.code,
              label: company?.title ?? customer.companyCode ?? customer.code,
              image: company?.photoUrl,
              lightLogo: true,
            };
          }),
        );
        if (!cancelled) setRows([skillItems, clientItems]);
      } catch (error) {
        console.error("Failed to load ticker data:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return <div className="ticker min-h-[92px]" aria-hidden="true" />;

  return (
    <div className="ticker" role="region" aria-label="Core technologies and clients">
      <TickerRow items={rows[0]} direction={1} speed={24} />
      <TickerRow items={rows[1]} direction={-1} speed={20} />
    </div>
  );
}

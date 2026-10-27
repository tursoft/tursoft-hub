/**
 * Builds dist/llms-full.txt: the complete site content as plain Markdown for
 * AI crawlers and assistants, generated from the same JSON data the site renders.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL } from "./routes.mjs";

const DATA_DIR = "src/data";

function load(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}
function items(json) {
  if (Array.isArray(json)) return json;
  return Object.values(json).find(Array.isArray) || [];
}
function text(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function period(p) {
  if (!p) return "";
  const fmt = (d) => (d ? d.split(".").slice(1).reverse().join("-") : "present"); // dd.mm.yyyy -> yyyy-mm
  return `${fmt(p.startDate)} to ${fmt(p.endDate)}`;
}

export function generateLlmsFull(dist = "dist", buildDate = new Date().toISOString().slice(0, 10)) {
  const general = load("general.json").general || {};
  const companies = new Map(items(load("companies.json")).map((c) => [String(c.code).toUpperCase(), c]));
  const company = (code) => companies.get(String(code || "").toUpperCase());
  const companyLabel = (code) => {
    const c = company(code);
    if (!c) return code || "";
    const place = [c.city, c.country].filter(Boolean).join(", ");
    return place ? `${c.title} (${place})` : c.title;
  };

  const experiences = items(load("experiences.json")).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const education = items(load("education.json")).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const skills = items(load("skills.json"));
  const projects = items(load("projects.json")).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const customers = items(load("customers.json")).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const references = items(load("references.json")).filter((r) => r.isActive !== false);
  const domains = items(load("domains.json"));
  const faq = items(load("faq.json"));
  const stats = load("statistics.json");

  const out = [];
  out.push(`# Muhammet Turşak (Tursak) — AI-Enabled Senior Software Architect: full site content`);
  out.push("");
  out.push(`> ${text(general.biography)}`);
  out.push("");
  out.push(`Canonical site: ${SITE_URL}/  ·  Summary file: ${SITE_URL}/llms.txt  ·  Last updated: ${buildDate}`);
  out.push("");
  out.push("## Identity");
  out.push("");
  out.push(`- Name: Muhammet Turşak (also written Muhammet Tursak, Muhammet TURŞAK)`);
  out.push(`- Title: ${text(general.title)}`);
  out.push(`- Location: ${text(general.address_short)}`);
  out.push(`- Nationality: ${text(general.nationality)}`);
  out.push(`- Email: ${text(general.email)}`);
  out.push(`- Website: ${SITE_URL}/`);
  for (const c of general.contacts || []) {
    if (c.isactive === false || !c.value || c.code === "website" || c.code === "email") continue;
    out.push(`- ${c.code}: ${c.value}`);
  }
  out.push("");
  out.push("## Vision and mission");
  out.push("");
  out.push(`Vision: ${text(general.vision)}`);
  out.push("");
  out.push(`Mission: ${text(general.mission)}`);
  out.push("");

  out.push("## Statistics");
  out.push("");
  for (const s of stats.items || []) out.push(`- ${s.value}+ ${s.subTitle ? s.subTitle + " " : ""}${s.title}`.replace("+ years of", "+ years of"));
  for (const s of stats.subItems || []) out.push(`- ${s.value}+ ${s.title}`);
  out.push("");

  out.push("## Professional experience");
  out.push("");
  for (const exp of experiences) {
    const positions = (exp.positions || []).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    out.push(`### ${companyLabel(exp.companyCode)}`);
    out.push("");
    for (const p of positions) {
      out.push(`**${text(p.title)}** (${period({ startDate: p.startDate, endDate: p.endDate })})`);
      out.push("");
      const summary = text(p.summary);
      if (summary) out.push(summary.split("\n").filter(Boolean).map((l) => `- ${l.trim()}`).join("\n"));
      if (p.skillCodes?.length) out.push(`- Technologies: ${p.skillCodes.join(", ")}`);
      if (p.projectCodes?.length) out.push(`- Projects: ${p.projectCodes.join(", ")}`);
      out.push("");
    }
  }

  out.push("## Education");
  out.push("");
  for (const e of education) {
    out.push(`**${companyLabel(e.companyCode)}** — ${text(e.department)} (${text(e.level)}, ${text(e.period)})`);
    if (e.graduateScore) out.push(`Score: ${e.graduateScore}. Graduated ${text(e.graduateDate)}.`);
    const summary = text(e.summary);
    if (summary) out.push(summary);
    if (e.courses?.length) out.push(`Courses: ${e.courses.map((c) => text(c.title)).filter(Boolean).join(", ")}`);
    out.push("");
  }

  out.push("## Skills");
  out.push("");
  const groups = new Map();
  for (const s of skills) {
    const g = s.group || "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(s);
  }
  for (const [group, list] of groups) {
    const sorted = list.slice().sort((a, b) => (b.isMajor === true) - (a.isMajor === true) || (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
    out.push(`**${group}:** ` + sorted.map((s) => (s.yearsOfExperience ? `${s.title} (${s.yearsOfExperience} yrs)` : s.title)).join(", "));
    out.push("");
  }

  out.push("## Domains");
  out.push("");
  for (const d of domains) out.push(`- ${text(d.title)}`);
  out.push("");

  out.push("## Projects");
  out.push("");
  for (const p of projects) {
    const header = [p.group ? `[${p.group}]` : "", companyLabel(p.companyCode), period(p.datePeriod)].filter(Boolean).join(" · ");
    out.push(`### ${text(p.title)}`);
    out.push("");
    if (header) out.push(header);
    out.push("");
    const summary = text(p.summary);
    if (summary) out.push(summary);
    const full = text(p.fulltext);
    if (full && full !== summary) {
      out.push("");
      out.push(full);
    }
    const meta = [];
    if (p.domainCodes?.length) meta.push(`Domains: ${p.domainCodes.join(", ")}`);
    if (p.skillCodes?.length) meta.push(`Technologies: ${p.skillCodes.join(", ")}`);
    if (p.customerCodes?.length) meta.push(`Customers: ${p.customerCodes.join(", ")}`);
    if (meta.length) {
      out.push("");
      out.push(meta.map((m) => `- ${m}`).join("\n"));
    }
    out.push("");
  }

  out.push("## Clients and customers");
  out.push("");
  for (const c of customers) {
    const label = companyLabel(c.companyCode);
    const parts = [c.industry, c.location, c.relationship].map(text).filter(Boolean).join(" · ");
    out.push(`- **${label}**${parts ? ` (${parts})` : ""}: ${text(c.description)}`);
  }
  out.push("");

  out.push("## References and testimonials");
  out.push("");
  for (const r of references) {
    const who = [text(r.title), text(r.position), text(r.company)].filter(Boolean).join(", ");
    const t = text(r.testimonial);
    if (!t) continue;
    out.push(`- ${who}${r.date ? ` (${text(r.date)})` : ""}: "${t}"`);
  }
  out.push("");

  out.push("## FAQ");
  out.push("");
  for (const f of faq) {
    out.push(`**${f.question}**`);
    out.push("");
    out.push(f.answer);
    out.push("");
  }

  const result = out.join("\n");
  const file = join(dist, "llms-full.txt");
  writeFileSync(file, result);
  console.log(`llms-full: ${file} (${(result.length / 1024).toFixed(0)} KB, ${projects.length} projects)`);
}

if (process.argv[1]?.endsWith("generate-llms-full.mjs")) {
  generateLlmsFull();
}

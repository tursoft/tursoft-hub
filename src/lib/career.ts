import type { Experience, Position } from "@/models/Experience";
import { parseDate } from "./datetimeutils";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export interface CareerStats {
  companies: number;
  positions: number;
  years: number;
  projects: number;
}

/** Overall period of a company: earliest start, and latest end (null while any position is current). */
export interface Span {
  start: string;
  end: string | null;
}

const time = (value: string | null | undefined): number | undefined => parseDate(value)?.getTime();

/** Whole years since the first position started. */
export function careerYears(experiences: Experience[], now: Date = new Date()): number {
  let earliest = Number.POSITIVE_INFINITY;
  for (const experience of experiences) {
    for (const position of experience.positions ?? []) {
      const start = time(position.startDate);
      if (start !== undefined && start < earliest) earliest = start;
    }
  }
  if (!Number.isFinite(earliest)) return 0;
  return Math.max(0, Math.floor((now.getTime() - earliest) / YEAR_MS));
}

export function computeCareerStats(experiences: Experience[], projectCount: number, now: Date = new Date()): CareerStats {
  return {
    companies: experiences.length,
    positions: experiences.reduce((total, experience) => total + (experience.positions?.length ?? 0), 0),
    years: careerYears(experiences, now),
    projects: projectCount,
  };
}

/** Positions sorted newest first by start date (the input is not mutated). */
export function sortPositionsDesc(positions: Position[]): Position[] {
  return [...positions].sort((a, b) => (time(b.startDate) ?? 0) - (time(a.startDate) ?? 0));
}

const latestStart = (experience: Experience): number =>
  Math.max(0, ...(experience.positions ?? []).map((position) => time(position.startDate) ?? 0));

/** Experiences sorted by their most recent position start, newest first (the input is not mutated). */
export function sortExperiencesDesc(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => latestStart(b) - latestStart(a));
}

export function experienceSpan(experience: Experience): Span | null {
  let start: string | null = null;
  let startTime = Number.POSITIVE_INFINITY;
  let end: string | null = null;
  let endTime = Number.NEGATIVE_INFINITY;
  let current = false;

  for (const position of experience.positions ?? []) {
    const positionStart = time(position.startDate);
    if (positionStart !== undefined && positionStart < startTime) {
      startTime = positionStart;
      start = position.startDate;
    }
    if (!position.endDate) {
      current = true;
      continue;
    }
    const positionEnd = time(position.endDate);
    if (positionEnd !== undefined && positionEnd > endTime) {
      endTime = positionEnd;
      end = position.endDate;
    }
  }

  if (start === null) return null;
  return { start, end: current ? null : end };
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import skillsData from "../data/skills.json";
import { projectsRepo } from "../repositories/ProjectsRepo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get technology logo URL by skill code or title
 * @param identifier - Skill code or title to search for
 * @returns Logo URL if found, empty string otherwise
 */
export function getTechnologyLogo(identifier: string): string {
  if (!identifier) return "";
  
  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  // Find skill by code or title (case-insensitive)
  const skill = skillsData.items.find(item => 
    item.code.toLowerCase() === normalizedIdentifier || 
    item.title.toLowerCase() === normalizedIdentifier
  );
  
  return skill?.photoUrl || "";
}

/**
 * Get project logo URL by project name or code
 * Uses ProjectsRepo to fetch the project and return its photoUrl
 * @param identifier - Project name or code to search for
 * @returns Promise resolving to logo URL if found, empty string otherwise
 */
export async function getProjectLogo(identifier: string): Promise<string> {
  if (!identifier) return "";
  
  try {
    // First try to get by code
    const project = await projectsRepo.getByCode(identifier);
    if (project?.photoUrl) {
      return project.photoUrl;
    }
    
    // If not found by code, search by title/name
    const allProjects = await projectsRepo.getList();
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    const foundProject = allProjects.find(p => 
      p.title?.toLowerCase() === normalizedIdentifier ||
      p.code?.toLowerCase() === normalizedIdentifier
    );
    
    return foundProject?.photoUrl || "";
  } catch (error) {
    console.error("Error fetching project logo:", error);
    return "";
  }
}

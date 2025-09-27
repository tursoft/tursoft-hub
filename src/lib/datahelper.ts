import { CustomerData, ExperiencesData, ProjectEntry, ProjectsData } from "@/models";

export class DataHelper
{
    public customersData: CustomerData | null = null;
    public experiencesData: ExperiencesData | null = null;
    public projectsData: ProjectsData | null = null;
    
    constructor() {}

    async init() {
        // Load all three data files concurrently
        const [customersResponse, experiencesResponse, projectsResponse] = await Promise.all([
            fetch('/data/customers.json'),
            fetch('/data/experiences.json'),
            fetch('/data/projects.json')
        ]);

        const [customersData, experiencesData, projectsData] = await Promise.all([
            customersResponse.json() as Promise<CustomerData>,
            experiencesResponse.json() as Promise<ExperiencesData>,
            projectsResponse.json() as Promise<ProjectsData>
        ]);

        this.customersData = customersData;
        this.experiencesData = experiencesData;
        this.projectsData = projectsData;
    }
    
    getProjectsData(): ProjectsData {
        return this.projectsData;
    }

    // Helper to resolve project logo path (prefer projects.json data, fall back to map)
    resolveProjectLogo(projectName: string): string | null {
        console.log('resolveProjectLogo 1:', { projectName });

        if (!projectName) return null;

        try {
            const { projectsData } = this;
            const entries: ProjectEntry[] = (projectsData as ProjectsData).items;
            if (entries.length === 0) return null;

            const match = entries.find((p) => { return p.name.toUpperCase() === projectName.toUpperCase(); });
            console.log('resolveProjectLogo 2:', { projectName, entries, match });
            if (match?.icon) {
                const icon = match.icon;
                return icon.startsWith('/') ? icon : `/assets/files/projects/_logos/${icon}`;
            }
        } catch (err) {
            // ignore and return null if projects.json lookup fails
            return null;
        }

        // If no match found in projects.json, return null
        return null;
    };

    // Helper function to resolve company codes to company names
    resolveCompanyNames(companyCodes: string[] = []): string[] {
        const { experiencesData } = this;
        if (!experiencesData) return [];
        return companyCodes.map(code => {
            const experience = experiencesData.items.find(exp => exp.companyCode === code);
            return experience ? experience.companyName : code;
        });
    };

    // Helper function to resolve project names to project titles
    resolveProjectTitles (projectNames: string[] = []): string[] {
        const { projectsData } = this;
        if (!projectsData) return [];
        return projectNames.map(name => {
            const project = projectsData.items.find(proj => proj.name === name);
            return project ? project.title : name;
        });
    };

    // Helper function to resolve company logo paths
    resolveCompanyLogo(companyCode: string): string | null {
        // Map company codes to logo filenames
        const logoMap: { [key: string]: string } = {
                            'ERC': 'erc.png',
                            'DATASEL': 'datasel.png',
                            'jengai': 'jengai.png',
                            'gamyte': 'gamyte.png',
                            'FONET': 'fonet.png',
                            'JANDARMA': 'jandarma.egitim.png',
                            'HALICI': 'halici.png',
                            'LABRIS': 'labris.png',
                            'METU.CEIT': 'metu.ceit.png',
                            'METU.II': 'metu.ii.png',
                            'METU': 'metu.png'
                            };
        
        const logoFile = logoMap[companyCode];
        return logoFile ? `/assets/logos/companies/${logoFile}` : null;
    };

    // Helper function to resolve technology logo paths
    resolveTechnologyLogo (tech: string): string | null {
        // Map technology names to logo filenames (normalize to lowercase for matching)
        const techLogoMap: { [key: string]: string } = {
            '.net': 'net.png',
            'c#': 'csharp.png',
            'ms sql server': 'mssql.png',
            'mssql': 'mssql.png',
            'sql server': 'mssql.png',
            'asp.net': 'aspnet.png',
            'crystal reports': 'crystalreports.png',
            'oracle': 'oracle.png',
            'web services': 'soap.png',
            'javascript': 'js.png',
            'jquery': 'jquery.png',
            'html': 'html5.png',
            'css': 'css3.png',
            'bootstrap': 'bootstrap.png',
            'angular': 'angular.png',
            'react': 'js.png',
            'nodejs': 'nodejs.png',
            'node.js': 'nodejs.png',
            'typescript': 'typescript.png',
            'mysql': 'mysql.png',
            'postgresql': 'postgresql.png',
            'mongodb': 'mongodb.png',
            'docker': 'docker.png',
            'azure': 'azure.png',
            'aws': 'aws.png',
            'git': 'git.png',
            'visual studio': 'visualstudio.png',
            'vs code': 'vscode.png',
            'java': 'java.png',
            'python': 'python.png',
            'php': 'php.png'
        };
        
        const normalizedTech = tech.toLowerCase().trim();
        const logoFile = techLogoMap[normalizedTech];
        return logoFile ? `/assets/logos/technologies/small_50x50/${logoFile}` : null;
    };

    // Helper function to get partnership status color
    getPartnershipStatusColor (status?: string) {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    /**
     * Resolve the actual logo path for a project entry.
     * If entry.logo or entry.icon is provided as a relative filename the function
     * returns a prefixed path under /assets/files/projects/_logos/ otherwise returns as-is.
     */
    getProjectLogoPath(entry?: ProjectEntry | null): string | null {
        if (!entry) return null;
        const candidate = entry.logo || entry.icon || '';
        if (!candidate) return null;
        return candidate.startsWith('/') ? candidate : `/assets/files/projects/_logos/${candidate}`;
    }

    getProjectIconMap(projectsData: ProjectsData): { [key: string]: string } {
       
        // Create project icon map using direct asset paths
        const projectIcons: { [key: string]: string } = {};
        for (const project of projectsData.items) {
          if (project.icon) {
            // Use direct asset path for reliable loading in production
            projectIcons[project.name] = `/assets/files/projects/_logos/${project.icon}`;
          }
        }

        return projectIcons;
    }
}

// Export a singleton instance for app-wide usage
const dataHelper = new DataHelper();
export default dataHelper;
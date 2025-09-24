// Technology logo mapping utility
// Maps technology names to their corresponding logo file paths

interface TechnologyLogoMapping {
  [key: string]: string;
}

// Technology name mapping - maps various technology name variations to the correct logo filename
export const getTechnologyLogo = (technologyName: string): string | null => {
  const logoMapping: TechnologyLogoMapping = {
    // Programming Languages
    'C#': 'csharp.png',
    'C Sharp': 'csharp.png',
    'CSharp': 'csharp.png',
    'VB.NET': 'vbnet.png',
    'VB Net': 'vbnet.png',
    'Visual Basic .NET': 'visualbasicnet.png',
    'Visual Basic': 'visualbasic.png',
    'VBScript': 'vbscript.png',
    'Java': 'java.png',
    'JavaScript': 'js.png',
    'JS': 'js.png',
    'TypeScript': 'typescript.png',
    'TS': 'typescript.png',
    'Python': 'python.png',
    'PHP': 'php.png',
    'C++': 'cplusplus.png',
    'C': 'c.png',
    'Pascal': 'pascal.png',
    'Dark Basic': 'darkbasic.png',

    // Frameworks & Libraries
    '.NET': 'net.png',
    'Net': 'net.png',
    'DotNet': 'net.png',
    '.NET Core': 'netcore.png',
    'Net Core': 'netcore.png',
    'ASP.NET': 'aspnet.png',
    'ASP.NET MVC': 'aspnetmvc.png',
    'ASP.NET Core': 'aspnetcore.png',
    'ASP.NET Web API': 'aspnetwebapi.png',
    'Entity Framework': 'entityframework.png',
    'Entity Framework Core': 'entityframeworkcore.png',
    'WPF': 'wpf.png',
    'Windows Forms': 'windowsforms.png',
    'WinForms': 'windowsforms.png',
    'WCF': 'wcf.png',
    'Silverlight': 'silverlight.png',
    'Xamarin': 'xamarin.png',
    'XAML': 'xaml.png',

    // Web Technologies
    'Angular': 'angular.png',
    'AngularJS': 'angularjs.png',
    'Angular 2': 'angularjs2.png',
    'Angular Material': 'angularmaterial.png',
    'React': 'react.png',
    'ReactJS': 'react.png',
    'Node.js': 'nodejs.png',
    'NodeJS': 'nodejs.png',
    'Express': 'express.png',
    'ExpressJS': 'express.png',
    'jQuery': 'jquery.png',
    'HTML5': 'html5.png',
    'HTML': 'html5.png',
    'CSS3': 'css3.png',
    'CSS': 'css.png',
    'Bootstrap': 'bootstrap.png',
    'SASS': 'sass.png',
    'SCSS': 'sass.png',
    'LESS': 'less.png',
    'JSON': 'json.png',
    'XML': 'xml.png',
    'REST': 'rest.png',
    'SOAP': 'soap.png',
    'GraphQL': 'graphql.png',
    'JWT': 'jwt.png',
    'OAuth': 'oauth.png',

    // Mobile Technologies
    'Ionic': 'ionic.png',
    'Cordova': 'cordova.png',
    'JavaFX': 'javafx.png',
    'Swing': 'swing.png',

    // Databases
    'MS SQL': 'mssql.png',
    'MSSQL': 'mssql.png',
    'SQL Server': 'mssql.png',
    'MySQL': 'mysql.png',
    'Oracle': 'oracle.png',
    'PostgreSQL': 'postgresql.png',
    'MongoDB': 'mongodb.png',
    'Redis': 'redis.png',
    'Cassandra': 'cassandra.png',
    'DB2': 'db2.png',
    'MS Access': 'msaccess.png',
    'Hadoop': 'hadoop.png',

    // DevOps & Tools
    'Docker': 'docker.png',
    'Kubernetes': 'kubernetes.png',
    'Jenkins': 'jenkins.png',
    'Git': 'git.png',
    'GitHub': 'github.png',
    'GitLab': 'gitlab.png',
    'SVN': 'svn.png',
    'TFS': 'tfs.png',
    'Azure DevOps': 'azuredevops.png',
    'Mercurial': 'mercurial.png',
    'SourceTree': 'sourcetree.png',
    'TortoiseHg': 'tortoisehg.png',
    'Visual SourceSafe': 'visualsourcesafe.png',

    // Cloud & Services
    'AWS': 'aws.png',
    'Azure': 'azure.png',
    'Azure AD': 'azuread.png',
    'Google Cloud': 'googlecloud.png',
    'Alibaba Cloud': 'alibabacloud.png',
    'DigitalOcean': 'digitalocean.png',
    'Heroku': 'heroku.png',

    // IDEs & Editors
    'Visual Studio': 'visualstudio.png',
    'VS Code': 'vscode.png',
    'VSCode': 'vscode.png',
    'Visual Studio Code': 'vscode.png',
    'VS Code Insiders': 'vscodeinsiders.png',
    'Eclipse': 'eclipse.png',

    // Build Tools & Package Managers
    'Maven': 'maven.png',
    'Gradle': 'maven.png', // Using maven as fallback
    'npm': 'npm.png',
    'NPM': 'npm.png',
    'NuGet': 'nuget.png',
    'Apache Ant': 'apacheant.png',
    'Grunt': 'grunt.png',

    // Servers & Infrastructure
    'Apache Tomcat': 'apachetomcat.png',
    'Tomcat': 'apachetomcat.png',
    'Jetty': 'jetty.png',
    'IIS': 'iis.png',
    'nginx': 'nginx.png',
    'Nginx': 'nginx.png',

    // Reporting Tools
    'Crystal Reports': 'crystalreports.png',
    'Fast Reports': 'fastreports.png',
    'JasperReports': 'jasperreports.png',
    'Jasper BI': 'jasperbi.png',
    'JasperSoft': 'jaspersoft.png',
    'iReports': 'ireports.png',

    // UI Libraries & Controls
    'Telerik': 'telerik.png',
    'Telerik UI for Silverlight': 'telerikuiforsilverlight.png',
    'Infragistics': 'infragistics.png',
    'KendoUI': 'kendui.png',
    'Kendo UI': 'kendui.png',
    'PrimeNG': 'primeng.png',
    'Font Awesome': 'fontawesome.png',
    'Animate.css': 'animatecss.png',

    // Testing & Debugging Tools
    'SoapUI': 'soapui.png',
    'Fiddler': 'fiddler.png',

    // Messaging & Scheduling
    'RabbitMQ': 'rabbitmq.png',
    'Apache Kafka': 'apachekafka.png',
    'Kafka': 'kafka.png',
    'Hangfire': 'hangfire.png',
    'Quartz Scheduler': 'quartzscheduler.png',

    // Business Applications
    'Microsoft Dynamics NAV': 'microsoftdynamicsnav.png',
    'Dynamics NAV': 'microsoftdynamicsnav.png',
    'SAP': 'sap.png', // May need to add this logo

    // Virtualization
    'VMware': 'vmware.png',
    'Hyper-V': 'hyperv.png',
    'Virtualization': 'vmware.png',

    // Operating Systems
    'Ubuntu': 'ubuntu.png',
    'Linux': 'ubuntu.png', // Using ubuntu as fallback for linux

    // Other Tools & Technologies
    'PowerShell': 'powershell.png',
    'Unity': 'unity.png',
    'Photoshop': 'photoshop.png',
    '3ds Max': '3dsmax.png',
    'MS Project': 'msproject.png',
    'MS Blend': 'msblend.png',
    'Redmine': 'redmine.png',
    'WordPress': 'wordpress.png',
    'Portainer': 'portainer.png',
    'Nexus': 'nexus.png',
    'ProGet': 'proget.png',
    'Google Analytics': 'googleanalytics.png',
    'PayPal': 'paypal.png',
    'Adobe Flash': 'adobeflash.png',
    'Adobe Atmosphere': 'adobeatmosphere.png',
    'Adobe': 'adobe.png',
    'Active Directory': 'activedirectory.png',
    'Networking': 'networking.png',
    'OOP': 'oop.png',
    'Object-Oriented Programming': 'oop.png',
    'Design Patterns': 'designpatterns.png',
    'UML': 'uml.png',
    'MVVM': 'mvvm.png',
    'LINQ': 'linq.png',
    'SCORM': 'scorm.png',
    'Timeline.js': 'timelinejs3.png',
    'Moment.js': 'momentjs.png',
    'jsPDF': 'jspdf.png',
    'dom-to-image': 'domtoimage.png',
    'EJS': 'ejs.png',
    'APM': 'APM.png',
    'Application Performance Monitoring': 'APM.png',
    'Bash Scripting': 'bashscripting.png',
    'Bash': 'bashscripting.png',
    'Spring': 'spring.png',
    'Spring Boot': 'spring.png',
    'Hibernate': 'hibernate.png',
    'Oracle BI': 'oraclebi.png',
    'DBForge DB Compare': 'dbforgedbcompare.png',
    'PDF Writer': 'pdfwcore.png',
    'PDF Writer Core': 'pdfwcore.png',
    '1PDF WSL': '1PDFWSL.png'
  };

  // Normalize the input - trim whitespace and handle case variations
  const normalizedName = technologyName.trim();
  
  // Direct lookup first
  if (logoMapping[normalizedName]) {
    return `/assets/logos/technologies/small_50x50/${logoMapping[normalizedName]}`;
  }

  // Case-insensitive lookup
  const lowerCaseName = normalizedName.toLowerCase();
  for (const [key, value] of Object.entries(logoMapping)) {
    if (key.toLowerCase() === lowerCaseName) {
  return `/assets/logos/technologies/small_50x50/${value}`;
    }
  }

  // Partial match lookup for complex names
  for (const [key, value] of Object.entries(logoMapping)) {
    if (key.toLowerCase().includes(lowerCaseName) || lowerCaseName.includes(key.toLowerCase())) {
  return `/assets/logos/technologies/small_50x50/${value}`;
    }
  }

  // Return null if no logo found
  return null;
};

// Helper function to get technology logo with fallback
export const getTechnologyLogoWithFallback = (technologyName: string, fallbackIcon?: React.ReactNode): string | null => {
  return getTechnologyLogo(technologyName);
};
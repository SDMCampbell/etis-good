/*
 * Single source of truth for resume content.
 * The page renders from window.RESUME, so this is the only place to edit.
 *
 * Privacy note: street address and phone number from the PDF resume are
 * intentionally left out because this site is public.
 */
window.RESUME = {
  name: "Samuel Campbell",
  handle: "doog",
  title: "Full Stack Web Developer",
  location: "Lexington, SC",
  email: "SamuelDCampbell@gmail.com",
  summary:
    "I am a user-focused software and web engineer who loves creating real-world, high-quality products.",
  tagline: "I love climbing learning curves, especially for new languages and technologies.",

  skills: {
    "Languages": ["PHP", "JavaScript", "C++", ".NET", "C", "C#", "Java", "Python", "COBOL", "SQL"],
    "Frontend": ["HTML5", "CSS", "SCSS", "jQuery", "Bootstrap", "Angular", "Twig"],
    "CMS & Platforms": ["Drupal", "Kentico", "WordPress", "HubSpot"],
    "Data & Messaging": ["PostgreSQL", "SQL", "RabbitMQ", "XML", "JSON", "REST APIs"],
    "Tools & Process": ["Git", "SVN", "Kanban", "Scrum", "Agile", "A/B Testing", "Analytics"]
  },

  // Newest first. `id` is used as a slug / branch name.
  jobs: [
    {
      id: "agfirst-fullstack",
      role: "Full Stack Web Developer",
      company: "AgFirst Farm Credit Bank",
      location: "Columbia, SC",
      start: "Aug 2025",
      end: "Present",
      returning: true,
      tags: ["PHP", "JavaScript", "Drupal", "SCSS", "SQL"], // TODO: adjust to the stack you actually use now
      bullets: [
        // TODO: replace with real highlights from the current role
        "Back at AgFirst for round two, working across the full stack of the bank's web platforms."
      ]
    },
    {
      id: "marco-promos",
      role: "Web Developer / Webmaster",
      company: "MARCO Promos",
      start: "Jun 2023",
      end: "Aug 2025",
      tags: ["Bootstrap", "jQuery", ".NET", "Analytics"],
      bullets: [
        "Utilized Bootstrap and jQuery UI for frontend updates as well as .NET for critical fixes to the platform.",
        "Implemented multiple updates that improved homepage speed from failing to a 99% score.",
        "Designed and implemented multiple features to help identify and resolve user experience issues using heatmapping and analytics.",
        "Coordinated with an offshore development team to improve the efficiency of the ecommerce platform through consistent .NET maintenance and improvement."
      ],
      highlight: { label: "Homepage speed score", from: "failing", to: "99%" }
    },
    {
      id: "agfirst-senior",
      role: "Senior Web Developer – Supervisor of Web Development",
      company: "AgFirst Farm Credit Bank",
      location: "Columbia, SC",
      start: "2019",
      end: "2022",
      tags: ["Drupal", "PHP", "JavaScript", "Twig", "SCSS", "HubSpot", "A/B Testing"],
      bullets: [
        "Coordinated website changes for multiple large-scale customer mergers.",
        "Created and modified Drupal custom modules using a combination of PHP, JavaScript, Twig, SCSS, and HTML.",
        "Led the implementation of HubSpot simultaneously across multiple websites.",
        "Developed backend solutions using PHP to resolve customer issues.",
        "Redesigned and rebuilt websites while migrating from an outdated platform.",
        "Used custom modules to provide A/B testing functionality for each of our websites."
      ]
    },
    {
      id: "mindamp",
      role: "Principal Software Developer",
      company: "mindAmp",
      start: "2017",
      end: "2019",
      tags: ["Angular", "JavaScript", "jQuery", "PHP", "JSON", "REST APIs"],
      bullets: [
        "Developed new features for an enterprise-level web management application for a backup appliance (Angular/JavaScript/jQuery and HTML5/CSS on the front end, PHP/JSON REST APIs in the middleware).",
        "Modified the management application's interface to remove navigation issues and improve user experience.",
        "Developed a command-line disaster recovery tool to help users recover their files in critical situations."
      ]
    },
    {
      id: "xgrok",
      role: "Software Developer",
      company: "xGrok",
      start: "2016",
      end: "2017",
      tags: ["PHP", "PostgreSQL", "C++", "REST APIs", "JSON"],
      bullets: [
        "Developed middleware for a cloud-based web application for viewing and managing backup statistics.",
        "Designed PHP/JSON REST APIs and a PostgreSQL database to collect, send, and store information, plus APIs for managing users and feeding the front end.",
        "Built a graphical C++ application to parse offline Exchange 2013/2016 databases and browse their mailboxes, which required reverse-engineering the JET database layout."
      ]
    },
    {
      id: "southeastern-freight",
      role: "Junior Software Developer",
      company: "Southeastern Freight Lines",
      start: "2015",
      end: "2015",
      tags: ["COBOL"],
      bullets: [
        "Enhanced and maintained a major freight carrier's COBOL-based dock loading software, working directly with dock personnel to make sure features met their needs."
      ]
    },
    {
      id: "clemson-ccit",
      role: "Customer Service Technician / NOC Intern",
      company: "Clemson Computing and Information Technology",
      start: "2011",
      end: "2015",
      tags: ["Networking", "Documentation"],
      bullets: [
        "Monitored and maintained wired and wireless networks on and off campus, and documented the Network Operations Center's interfacing technologies.",
        "Helped develop applications used by CCIT employees to improve organization and workflow."
      ]
    },
    {
      id: "unitrends",
      role: "Software Life Cycle Intern (Summers)",
      company: "Unitrends",
      start: "2011",
      end: "2013",
      tags: ["JavaScript", "REST APIs"],
      bullets: [
        "Developed a JavaScript-based Spiceworks plug-in that used APIs to give users a summarized view of data sizes and application types across their network."
      ]
    }
  ]
};

import { InlineCode } from "@/once-ui/components";

const person = {
  firstName: "Chaz",
  lastName: "Merritt",
  get name() {
    return `${this.firstName} ${this.lastName}`;
  },
  role: "ML Research Assistant",
  avatar: "/images/avatar.jpg",
  location: "US/Eastern", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English", "Spanish"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter = {
  display: true,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: (
    <>
      I occasionally share my thoughts on AI, entrepreneurship, and leadership.
    </>
  ),
};

const social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/charlesmerritt",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/chaz-merritt/",
  },
  {
    name: "Email",
    icon: "email",
    link: "mailto:charles.merritt@uga.edu",
  },
];

const home = {
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>Research Assistant @ the <InlineCode>University of Georgia</InlineCode></>,
  subline: (
    <>
      I'm Chaz I am a student dedicated to developing solutions in the forestry space.
      After hours, I build web products and automation services for artists and small business owners.
    </>
  ),
};

const about = {
  label: "About",
  title: "About me",
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://outlook.office365.com/owa/calendar/WebsiteInterest@groups.uga.edu/bookings/",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
	I'm a lifelong learner, AI/ML researcher, and builder. My work bridges theory and application—
	designing intelligent systems that solve real problems at scale. I’m driven by curiosity, 
	committed to rigor, and always building toward what's next. Whether it's founding projects or 
	pushing the limits of machine learning, I stay hands-on, focused, and future-oriented.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "University of Georgia",
        timeframe: "2025 - Present",
        role: "Research Assistant",
        achievements: [
          <>
	    Presented research at 3 conferences: SOFORGIS '24, Artificial Intelligence and Other Advanced Technology Solutions for Eastern United States Forestry '25, and Society of American Foresters Conference '25 (Forthcoming).
          </>,
          <>
	    Worked on 3 forthcoming publications: Special Issue Review on AI & Forestry, ViT-GNN for Wildfire Prediction, and my thesis titled 'Harnessing Reinforcement Learning for Forest Growth Modeling Under Uncertainty'.
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "/images/projects/aidvisor/aidvisor_cover.png",
            alt: "AIDVISOR, my New Media Capstone Project.",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        company: "Northwest Management",
        timeframe: "Summer 2024",
        role: "Geospatial Analyst Internship",
        achievements: [
          <>
            Prototyped automation methods for forest stand delineation. 
          </>,
          <>
	    Utilized self-supervised learning techniques to generate "ground-truth" from unstructured image data. 
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "University of Georgia, MS in Artificial Intelligence, 2025",
        description: <>Completed my thesis titled 'Harnessing Reinforcement Learning 
	for Forest Growth Modeling Under Uncertainty' under the supervision of 
	Dr. Pete Bettinger, Dr. Frederick Maier, Dr. Bruno Kanieski da Silva, and Dr. Stephen Kinane.
        Graduated in one year with a 3.74</>,
      },
      {
        name: "University of Georgia, BA in Cognitive Science, minor in Computer Science, 2024",
        description: <>Studied a broad curriculum where I completed my foundation areas
	in Artificial Intelligence and Psychology. This was also the time when I first
	got involved with research in the forestry space on the PERSEUS project.</>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical skills",
    skills: [
      {
        title: "Python",
        description: <>Language of choice for data science and machine learning.</>,
        // optional: leave the array empty if you don't want to display images
        images: [
          // {
          //   src: "/images/projects/aidvisor/cover-02.jpg",
          //   alt: "Project image",
          //   width: 16,
          //   height: 9,
          // },
        ],
      },
      {
        title: "Next.js + Vercel",
        description: <>Building interactive apps with Next.js + Vercel + Supabase. Serverless ftw!</>,
        // optional: leave the array empty if you don't want to display images
        images: [
        ],
      },
      {
        title: "Django + PostgreSQL",
        description: <>Not a big fan of webapps, but I do like building APIs. I've worked with Django + PostgreSQL for a few projects.</>,'</>,
        // optional: leave the array empty if you don't want to display images
        images: [

        ],
      },
      {
        title: "Streamlit",
        description: <>Streamlit just makes interactive webapps for machine learning projects so easy.</>,
        // optional: leave the array empty if you don't want to display images
        images: [
        ],
      },
    ],
  },
};

const blog = {
  label: "Blog",
  title: "Writing about tech, academia, and my entrepreneurial endeavors...",
  description: `Read what ${person.name} has been up to recently`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work = {
  label: "Work",
  title: "My projects",
  description: `Design and dev projects by ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery = {
  label: "Gallery",
  title: "My photo gallery",
  description: `A photo collection by ${person.name}`,
  // Images from https://pexels.com
  images: [
    {
      src: "/images/gallery/img-01.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
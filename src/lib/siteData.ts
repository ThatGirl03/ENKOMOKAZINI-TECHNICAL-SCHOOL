export type TeamMember = {
  name: string;
  role: string;
  image?: string; // data URL or path
  imagePosition?: string;
  initials?: string;
};

export type Sponsor = {
  name: string;
  url?: string;
  image?: string;
};

export type SiteData = {
  schoolName: string;
  shortName?: string;
  tagline?: string;
  description?: string;
  address?: string;
  postal?: string;
  phone?: string;
  contactEmail?: string;
  principal?: string;
  deputyPrincipal?: string;
  passRate?: string;
  stats?: Array<{ label: string; value: string }>;
  services?: Array<{ category: string; streams?: string[]; subjects?: Array<{ name: string; passMark?: string }> }>;
  team: TeamMember[];
  sponsors: Sponsor[];
  heroImages?: string[]; // data URLs
  schoolImage?: string;
  ui?: {
    servicesPreviewCount?: number;
    badgeColor?: string;
    transitionMs?: number;
  };
};

const STORAGE_KEY = "enkomokazini_site_data_v1";

const DEFAULT: SiteData = {
  schoolName: "Enkomokazini Technical High School",
  shortName: "Enkomokazini",
  tagline: "THROUGH DIFFICULTIES WE SUCCEED",
  description:
    "Enkomokazini Technical High School is a purpose-driven institution committed to developing technically skilled, ethically grounded, and career-ready learners. Located in Loskop, Estcourt, the school balances practical, hands-on training with strong foundational knowledge, preparing students for both higher education and direct entry into technical fields. Our curriculum offers Science and Technical streams at FET level alongside comprehensive GET foundations to ensure every learner gains the knowledge and practical skills they need.\n\nOur mission is to empower learners through discipline, mutual trust, hard work, and exemplary leadership. We provide career-focused training alongside core subjects, emphasizing practical skills, critical thinking, and community engagement. With dedicated educators, industry partnerships, and a commitment to holistic development, Enkomokazini nurtures future professionals, innovators, and responsible citizens. Students also participate in a range of extracurricular activities, including soccer, netball, and chess, to support well-rounded development.",
  address: "Loskop Road,Loskop,Escourt,3310",
  postal: "P.O.Box 4050,Estcourt,3310",
  phone: "0726041779",
  contactEmail: "enkomokazinitechnical@gmail.com",
  principal: "Mr NT Mdluli",
  deputyPrincipal: "Mrs NP Mbongwa",
  passRate: "100%",
  stats: [
    { label: "Pass Rate", value: "100%" },
    { label: "Learners", value: "875" },
    { label: "Teachers", value: "25+" },
  ],
  services: [
    {
      category: "FET Phase (Grade 10-12) - Science Stream A1",
      subjects: [
        { name: "Mathematics", passMark: "50%" },
        { name: "Physical Science", passMark: "50%" },
        { name: "Life Science", passMark: "50%" },
        { name: "Consumer Studies", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
      ],
    },
    {
      category: "FET Phase (Grade 10-12) - Science Stream A2",
      subjects: [
        { name: "Mathematics", passMark: "50%" },
        { name: "Physical Science", passMark: "50%" },
        { name: "Engineering Graphics and Design", passMark: "50%" },
        { name: "Mechanical Technology / Civil Technology / Electrical Technology", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
      ],
    },
    {
      category: "FET Phase (Grade 10-12) - Technical Stream",
      subjects: [
        { name: "Technical Mathematics", passMark: "50%" },
        { name: "Technical Science", passMark: "50%" },
        { name: "Engineering Graphics and Design", passMark: "50%" },
        { name: "Mechanical Technology / Civil Technology / Electrical Technology", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
      ],
    },
    {
      category: "FET Phase (Grade 10-12) - Tourism Stream",
      subjects: [
        { name: "Mathematical Literacy", passMark: "50%" },
        { name: "Business Studies", passMark: "50%" },
        { name: "Tourism", passMark: "50%" },
        { name: "Consumer Studies / Computer Applications Technology", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
      ],
    },
    {
      category: "GET Phase (Grade 8-9) - GET 1",
      subjects: [
        { name: "Mathematics", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
        { name: "Natural Science", passMark: "50%" },
        { name: "Economic Management Sciences", passMark: "50%" },
        { name: "Social Science", passMark: "50%" },
        { name: "Technology", passMark: "50%" },
        { name: "Creative Arts", passMark: "50%" },
      ],
    },
    {
      category: "GET Phase (Grade 8-9) - GET 2",
      subjects: [
        { name: "Mathematics", passMark: "50%" },
        { name: "English First Additional", passMark: "50%" },
        { name: "IsiZulu Home Language", passMark: "50%" },
        { name: "Life Orientation", passMark: "50%" },
        { name: "Natural Science", passMark: "50%" },
        { name: "Economic Management Sciences", passMark: "50%" },
        { name: "Social Science", passMark: "50%" },
        { name: "Welding", passMark: "50%" },
        { name: "Carpentry", passMark: "50%" },
      ],
    },
  ],
  team: [
    { name: "Dr NT Mdluli", role: "Principal", image: "/assets/Team/Dr NT Mdluli.jpeg"  },
    { name: "Mrs NP Mbongwa", role: "Deputy Principal", image: "/assets/Team/Mrs NP Mbongwa.JPG" },

    // Department Heads
    { name: "Mrs NM Msibi", role: "Head of Languages", image: "/assets/Team/Mrs NM Msibi.JPG"  },
    { name: "Mrs PSN Strydom", role: "Head of Technical Subjects", image: "/assets/Team/Mrs PSN Strydom.jpeg"  },
    { name: "Mrs NG Sithole", role: "Head of Mathematics & Science", image: "/assets/Team/Mrs NG Sithole.jpeg"  },

    // Administration
    { name: "Ms PG Mbatha", role: "Administration Officer", image: "/assets/Team/Ms PG Mbatha.JPG"  },

    // Educators / Subject Teachers
    { name: "Ms NM Ndaba", role: "Consumer Studies", image: "/assets/Team/Ms NM Ndaba.jpg", imagePosition: "50% 30%"  },
    { name: "Ms NTO Mkhonto", role: "Tourism", image: "/assets/Team/Ms NTO Mkhonto.jpg"  },
    { name: "Ms SQ Mazibuko", role: "English", image: "/assets/Team/Ms SQ Mazibuko.jpg"  },
    { name: "Ms NF Mkhize", role: "English", image: "/assets/Team/Ms NF Mkhize.jpg"  },
    { name: "Ms TA Majola", role: "Life Orientation & Social Science", image: "/assets/Team/Ms TA Majola.jpeg"  },
    { name: "Ms TT Makhubo", role: "Technical Sciences", image: "/assets/Team/Ms TT Makhubo.jpg"  },
    { name: "Ms ZP Mkhize", role: "Business Studies & EMS", image: "/assets/Team/Ms ZP Mkhize.jpg"  },
    { name: "Mr PD Dlamini", role: "Mathematics (GET)", image: "/assets/Team/Mr PD Dlamini.jpeg"  },
    { name: "Mr KI Msomi", role: "Technical Mathematics (Best Teacher in the District)", image: "/assets/Team/Mr KI Msomi.jpg"  },
    { name: "Mr L Maphumulo", role: "Mathematics (FET)" },
    { name: "Mr MS Khumalo", role: "Mathematical Literacy", image: "/assets/Team/Mr MS Khumalo.jpg"  },
    { name: "Ms F Nhlapho", role: "Computer Applications Technology (CAT)", image: "/assets/Team/Ms F Nhlapho.jpg"  },
    { name: "Mr HO Mazibuko", role: "Life Sciences", image: "/assets/Team/Mr HO Mazibuko.jpg"  },
    { name: "Ms S Mlotshwa", role: "IsiZulu (Home Language)", image: "/assets/Team/Ms S Mlotshwa.jpeg"  },
    { name: "Mr SGI Mkhize", role: "Civil Technology & Carpentry", image: "/assets/Team/Mr SGI Mkhize.jpeg"  },
    { name: "Mr ST Makhize", role: "Mechanical Technology & Welding", image: "/assets/Team/Mr ST Makhize.jpeg"  },
    { name: "Mr TJ Mazibuko", role: "Electrical Technology", image: "/assets/Team/Mr TJ Mazibuko.jpeg"  },
    { name: "Mr SE Ngubane", role: "Engineering Graphics & Design", image: "/assets/Team/Mr SE Ngubane.jpeg"  },
    { name: "Ms PN Ndawonde", role: "Business Studies & Tourism", image: "/assets/Team/Ms PN Ndawonde.jpeg"  },

    // Support staff
    { name: "Mama Mswane", role: "Janitor" },
    { name: "Malume Ndumo", role: "Janitor" },
    { name: "Mr Khoza", role: "Security" },
  ],
  sponsors: [
    { name: "SINGAWE Innovative", url: "https://singaweinnovative.com", image: "/assets/SI LOGO.png" },
    { name: "SINGAWEB", url: "https://singaweinnovative.com", image: "/assets/SINGAWEB.png" },
    { name: "Sizwe Wifi", url: "https://projectisizwe.org/", image: "/assets/Isizwe.JPG" }
  ],
  heroImages: [],
  schoolImage: "",
  ui: {
    servicesPreviewCount: 6,
    badgeColor: "blue",
    transitionMs: 300,
  },
};

export function loadSiteData(): SiteData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as any;

    // Back-compat: if services use simple string arrays, convert to objects with default passMark
    if (parsed.services && Array.isArray(parsed.services)) {
      parsed.services = parsed.services.map((s: any) => {
        const subjects = s.subjects || [];
        const normalized = subjects.map((sub: any) => {
          if (typeof sub === "string") return { name: sub, passMark: "50%" };
          return sub;
        });
        return { ...s, subjects: normalized };
      });
    }

    // If parsed.team exists, ensure we merge it with DEFAULT.team so missing
    // default staff (e.g., Principal) are appended rather than completely overwritten.
    if (parsed.team && Array.isArray(parsed.team)) {
      const parsedNames = parsed.team.map((t: any) => (t.name || "").toLowerCase());
      const missingDefaults = DEFAULT.team.filter((d) => {
        const dn = (d.name || "").toLowerCase();
        return !parsedNames.includes(dn);
      });
      parsed.team = [...parsed.team, ...missingDefaults];
    }

    return { ...DEFAULT, ...parsed } as SiteData;
  } catch (e) {
    console.error("Failed to load site data", e);
    return DEFAULT;
  }
}

export function saveSiteData(data: Partial<SiteData>) {
  try {
    const current = loadSiteData();
    const next = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // notify other components
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: next }));
    return next;
  } catch (e) {
    console.error("Failed to save site data", e);
    return null;
  }
}

export function resetSiteData() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: DEFAULT }));
}

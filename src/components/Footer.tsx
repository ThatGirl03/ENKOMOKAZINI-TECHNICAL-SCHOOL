import { GraduationCap, Facebook, Twitter, Instagram, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSiteData } from "@/lib/siteData";

export const Footer = () => {
  const [schoolName, setSchoolName] = useState("Enkomokazini Technical High School");

  useEffect(() => {
    const normalize = (name?: string) => {
      if (!name) return "Enkomokazini Technical High School";
      const n = name.trim();
      const lower = n.toLowerCase();
      // legacy variants to replace
      const legacy = ["ephuthini", "phuthini", "ephuth", "phuth", "ephutini"];
      for (const l of legacy) {
        if (lower.includes(l)) return "Enkomokazini Technical High School";
      }
      return n;
    };

    const sd = loadSiteData();
    setSchoolName(normalize(sd.schoolName));
    const onUpdate = (e: any) => {
      const next = e?.detail || loadSiteData();
      setSchoolName(normalize(next.schoolName));
    };
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="font-serif font-bold">{schoolName}</p>
              <p className="text-sm text-background/60">THROUGH DIFFICULTIES WE SUCCEED</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="p-2 bg-background/10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Facebook size={20} />
            </a>
            <a
              href="#"
              className="p-2 bg-background/10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Twitter size={20} />
            </a>
            <a
              href="#"
              className="p-2 bg-background/10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background/20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/60">
          <p>© {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
          <a
            href="https://singaweinnovative.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-accent transition-colors font-medium"
          >
            <span>Developed by SINGAWE Innovative</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
};

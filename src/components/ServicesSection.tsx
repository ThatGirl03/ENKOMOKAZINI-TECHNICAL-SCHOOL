import { useEffect, useState } from "react";
import { loadSiteData } from "@/lib/siteData";
import { ChevronRight, Folder, Book } from "lucide-react";

export const ServicesSection = () => {
  const [services, setServices] = useState<{ category: string; subjects?: Array<{ name: string; passMark?: string }> }[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const sd = loadSiteData();
    setServices(sd.services || []);
    // update when site data changes, including UI settings
    const onUpdate = (e: any) => setServices((e?.detail || loadSiteData()).services || []);
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  return (
    <section id="services" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Education <span className="text-accent">Streams</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curriculum streams and the subjects offered in each.
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s, i) => {
            const subjects = (s.subjects || []) as Array<{ name: string; passMark?: string }>;
            const isOpen = expanded === i;
            const sd = loadSiteData();
            const previewCount = (sd.ui && sd.ui.servicesPreviewCount) || 6;
            const transitionMs = (sd.ui && sd.ui.transitionMs) || 300;
            const badgeColor = (sd.ui && sd.ui.badgeColor) || 'blue';
            const badgeMap: Record<string, { bg: string; border: string; text: string; textStrong: string }> = {
              blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', textStrong: 'text-blue-600' },
              green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', textStrong: 'text-green-600' },
              gray: { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-800', textStrong: 'text-gray-600' },
            };
            const badgeStyles = badgeMap[badgeColor] || badgeMap.blue;
            const preview = subjects.slice(0, previewCount);
            const more = subjects.length - preview.length;
            return (
              <div key={i} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left p-6 flex items-center gap-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                    <Folder className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold text-foreground">{s.category}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{subjects.length} subjects</p>
                  </div>
                  <div className={`transform transition-transform ${isOpen ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-5 h-5 text-accent" />
                  </div>
                </button>

                <div style={{ transition: `all ${transitionMs}ms ease` }} className={`px-6 overflow-hidden ${isOpen ? 'max-h-[1000px] py-4' : 'max-h-0'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(isOpen ? subjects : preview).map((sub, j) => (
                      <div key={j} className={`${badgeStyles.bg} ${badgeStyles.border} p-2 rounded-md flex items-center justify-start gap-3`}>
                        <p className={`text-sm font-medium ${badgeStyles.text}`}>{sub.name} <span className={`${badgeStyles.textStrong} font-bold ml-2`}>&gt; {sub.passMark || "50%"}</span></p>
                      </div>
                    ))}
                    {!isOpen && more > 0 && (
                      <div className="p-2 rounded-md bg-card border border-border flex items-center justify-center text-sm text-muted-foreground">
                        +{more} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { Award, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSiteData } from "@/lib/siteData";

// Fallback to the chosen image placed in public/assets
const aboutFallback = "/assets/N4.jpg";

export const AboutSection = () => {
  const [description, setDescription] = useState("");
  const [passRate, setPassRate] = useState("");

  useEffect(() => {
    const sd = loadSiteData();
    setDescription(sd.description || "");
    setPassRate(sd.passRate || (sd.stats && sd.stats[0] ? sd.stats[0].value : ""));

    const onUpdate = (e: any) => {
      const next = e?.detail || loadSiteData();
      setDescription(next.description || "");
      setPassRate(next.passRate || (next.stats && next.stats[0] ? next.stats[0].value : ""));
    };

    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            About <span className="text-accent">Us</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="prose max-w-none text-muted-foreground mb-8 text-justify leading-relaxed">
            <p>{description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-8">
            <div className="w-full h-full flex items-center justify-center">
              {/* left: picture (from site data heroImages or fallback) */}
              <div className="w-full h-full rounded-xl overflow-hidden border border-border bg-card">
                {/* image loaded from site data or fallback asset */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(loadSiteData().schoolImage && loadSiteData().schoolImage.length)
                    ? loadSiteData().schoolImage
                    : (loadSiteData().heroImages && loadSiteData().heroImages.length ? loadSiteData().heroImages[0] : aboutFallback)}
                  alt="School"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow min-h-[160px]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary rounded-lg">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-foreground mb-2">Our Vision</h4>
                    <p className="text-muted-foreground text-justify leading-relaxed">
                      Enkomokazini Technical High School envisions a future where learners are empowered to reach their full potential, particularly in technical and vocational fields, while also excelling in the broader academic curriculum.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow min-h-[160px]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary rounded-lg">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-foreground mb-2">Our Mission</h4>
                    <p className="text-muted-foreground text-justify leading-relaxed">
                      The school's mission is to provide a learning environment that fosters discipline, mutual trust, hard work, and exemplary leadership, all within the context of preparing learners for the South African workforce and contributing to the nation's development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


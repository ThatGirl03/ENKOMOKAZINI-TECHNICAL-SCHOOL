import { useEffect, useState } from "react";
import { loadSiteData, TeamMember } from "@/lib/siteData";

export const TeamSection = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);

  useEffect(() => {
    const sd = loadSiteData();
    setTeam(sd.team || []);
    setSponsors(sd.sponsors || []);

    const onUpdate = (e: any) => {
      const next = e?.detail || loadSiteData();
      setTeam(next.team || []);
      setSponsors(next.sponsors || []);
    };

    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  return (
    <section id="team" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our <span className="text-accent">Team</span>
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet our dedicated team of educators committed to shaping the future.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-all duration-300 text-center group"
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                {
                  (() => {
                    const toUrl = (val?: string) => {
                      if (!val) return undefined;
                      if (val.startsWith('/')) return val;
                      return `/assets/${val}`;
                    };

                    const primary = toUrl(member.image) || member.image;
                    const secondary = toUrl((member as any).secondaryImage) || (member as any).secondaryImage;

                    if (primary) {
                      return (
                        <>
                          <img
                            src={primary}
                            alt={member.name}
                            className="w-24 h-24 rounded-full shadow-card group-hover:scale-105 transition-transform"
                            style={{
                              objectFit: (member as any).imageFit || 'cover',
                              objectPosition: (member as any).imagePosition || 'center',
                            }}
                          />
                          {secondary ? (
                            <img
                              src={secondary}
                              alt={`${member.name} secondary`}
                              className="w-8 h-8 rounded-full object-cover shadow-sm absolute -right-1 bottom-0 border-2 border-background"
                            />
                          ) : null}
                        </>
                      );
                    }

                    return (
                      <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                        {member.initials || member.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                    );
                  })()
                }
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-1">
                {member.name}
              </h3>
              <p className="text-accent font-medium">{member.role}</p>
            </div>
          ))}
        </div>

        {/* Sponsors Section */}
        <div className="mt-12 text-center">
          <h3 className="font-serif text-2xl font-semibold text-foreground mb-4">Our Partners & Sponsors</h3>
          <p className="text-muted-foreground mb-6">We welcome partners and sponsors to support our mission. Become a sponsor today.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-center justify-center">
            {sponsors.map((sp, i) => (
              <a
                key={i}
                href={sp.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="bg-card rounded-lg p-8 border border-border flex items-center justify-center"
              >
                {sp.image ? (
                  <img
                    src={sp.image}
                    alt={sp.name}
                    className="max-h-36 md:max-h-44 w-auto max-w-full object-contain"
                    style={{ filter: 'contrast(1.05) saturate(1.12)' }}
                  />
                ) : (
                  <span className="font-medium">{sp.name}</span>
                )}
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">To become a sponsor or partner, contact the school office.</p>
        </div>
      </div>
    </section>
  );
};

import { useEffect, useState } from "react";
import { loadSiteData } from "@/lib/siteData";
import { SEOHead } from "@/components/SEOHead";

const AcademicsPage = () => {
  const [siteData, setSiteData] = useState(loadSiteData());

  useEffect(() => {
    const onUpdate = (e: any) => {
      setSiteData(e?.detail || loadSiteData());
    };
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  return (
    <>
      <SEOHead 
        data={siteData}
        pageTitle="Academic Programs"
        pageDescription="Explore technical and academic programs at Enkomokazini Technical High School. Science streams, technical subjects, and vocational training."
      />
      
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-center">Academic Programs</h1>
          <div className="max-w-4xl mx-auto">
            {siteData.services?.map((service, idx) => (
              <div key={idx} className="mb-8 bg-card p-6 rounded-xl border border-border">
                <h2 className="text-2xl font-bold mb-4 text-foreground">{service.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.subjects?.map((subject, subIdx) => (
                    <div key={subIdx} className="flex justify-between items-center p-3 bg-background rounded">
                      <span className="text-foreground">{subject.name}</span>
                      <span className="text-accent font-semibold">{subject.passMark}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AcademicsPage;

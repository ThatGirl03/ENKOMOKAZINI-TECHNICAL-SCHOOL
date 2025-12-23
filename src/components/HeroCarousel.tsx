import { useState, useEffect } from "react";
import { TrendingUp, Users, GraduationCap } from "lucide-react";
import { loadSiteData } from "@/lib/siteData";

// Use the three images placed in `public/assets` so they come from `/assets/...` at runtime.
const defaultImages = [
  "/assets/N1.jpg",
  "/assets/N2.jpg",
  "/assets/N3.jpg",
] as string[];

const defaultStats = [
  { icon: TrendingUp, value: "85%", label: "Pass Rate" },
  { icon: Users, value: "875", label: "Learners" },
  { icon: GraduationCap, value: "25+", label: "Teachers" },
];

export const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<string[]>(defaultImages);
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    // load images and stats from site data
    const sd = loadSiteData();
    // Use only configured hero images (or defaults). Do NOT include sponsor/partner images here.
    const heroImgs = sd.heroImages && sd.heroImages.length ? sd.heroImages : defaultImages;
    setImages(heroImgs.length ? heroImgs : defaultImages);
    if (sd.stats && sd.stats.length) {
      setStats(sd.stats.map((s) => ({ icon: TrendingUp, value: s.value, label: s.label })));
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const len = heroImgs.length || defaultImages.length;
        return len ? (prev + 1) % len : 0;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Background Images */}
      {(images.length ? images : []).map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={src}
            alt={`School life ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4 animate-fade-up">
          ENKOMOKAZINI TECHNICAL HIGH SCHOOL
        </h1>
        <p className="text-accent text-xl md:text-2xl font-semibold tracking-widest mb-12 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          THROUGH DIFFICULTIES WE SUCCEED
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-foreground/20 backdrop-blur-md border border-primary-foreground/20 rounded-xl px-6 py-4 md:px-10 md:py-6 min-w-[140px]"
              >
                <Icon className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-accent">{stat.value}</p>
                <p className="text-primary-foreground/80 text-sm mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-accent w-8"
                  : "bg-primary-foreground/50 hover:bg-primary-foreground/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

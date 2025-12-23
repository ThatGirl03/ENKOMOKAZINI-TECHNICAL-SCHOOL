import { useState } from "react";
import { X, Calendar } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const categories = ["All", "Awards", "Tours", "Sports", "Cultural", "Academic"];

const portfolio = [
  { src: "/assets/Portfolio/Annual School Awards.JPG", title: "INKOSI Langalibalele schools excellence awards", category: "Awards", date: "" },
  { src: "/assets/Portfolio/Johannesburg Educational Tour.JPG", title: "Nestlé Career workshop", category: "Academic", date: "2025-05-29" },
  { src: "/assets/Portfolio/Inter-School Athletics.JPG", title: "UThukela District Grade 12 career exhibition", category: "Academic", date: "2025-05-01" },
  { src: "/assets/Portfolio/Technology Awareness & Career Advisory.JPG", title: "Technology Awareness & Career Advisory", category: "Academic", date: "2025-07-30" },
  { src: "/assets/Portfolio/Natal sharks board.JPG", title: "Tourism Trip Natal Sharks Board", category: "Tours", date: "2025-03-27" },
  { src: "/assets/Portfolio/OX Mthethwa schools tournament.JPG", title: "OX Mthethwa Schools Tournament", category: "Sports", date: "2025-05-31" },
  { src: "/assets/Portfolio/Phezulu Safari Park.JPG", title: "Tourism Trip Phezulu Safari Park", category: "Tours", date: "2024-04-12" },
  { src: "/assets/Portfolio/Bata Shoe Factory.JPG", title: "Mechanical Technology visit to Bata Shoe Factory", category: "Tours", date: "" },
  { src: "/assets/Portfolio/Calculator Donation.JPG", title: "CALCULATOR DONATION", category: "Academic", date: "" },
  { src: "/assets/Portfolio/Durnacol skills center.jpeg", title: "Durnacol Skills Center", category: "Academic", date: "" },
  
];

export const PortfolioSection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPortfolio = activeCategory === "All" 
    ? portfolio 
    : portfolio.filter(item => item.category === activeCategory);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <section id="portfolio" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our <span className="text-accent">Portfolio</span>
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore moments from our vibrant school life through our gallery.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category
                  ? "bg-accent text-accent-foreground shadow-gold-glow"
                  : "bg-card text-muted-foreground border border-border hover:border-accent hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPortfolio.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer bg-card"
              onClick={() => setSelectedImage(item.src)}
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-4 border-t border-border">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full mb-2">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{formatDate(item.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPortfolio.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-foreground/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-primary text-primary-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            alt="Selected"
            className="max-w-full max-h-[90vh] rounded-xl shadow-elevated"
          />
        </div>
      )}
    </section>
  );
};

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, FolderOpen } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const years = ["2024", "2025", "2026"];
const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

interface GalleryImage {
  src: string;
  title: string;
}

interface GradeGallery {
  grade: string;
  images: GalleryImage[];
}

interface YearGallery {
  year: string;
  grades: GradeGallery[];
}

// If there are no dedicated PhotoGallery images yet, include portfolio images
// so the gallery shows content. The `public/assets/Portfolio` folder contains
// the main event images uploaded by the user.
const galleryData: YearGallery[] = years.map((year) => ({
  year,
  grades: (() => {
    const base = grades.map((grade) => ({
      grade,
      images: year === "2024" && grade === "Grade 12" ? [
        
      ] : year === "2024" && grade === "Grade 8" ? [
        { src: "/assets/PhotoGallery/G8.jpeg", title: "Grade 8 using Tablets for project" },
      ] : [],
    }));

    // Append a 'Staff' folder that appears next to Grade 12 in the UI
    base.push({
      grade: "Staff",
      images: year === "2024" ? [
        { src: "/assets/PhotoGallery/2024/Staff/S1.jpeg", title: "Principal Dr NT Mdluli (honoured for his academic achievement)" },
      ] as { src: string; title: string }[] : [],
    });

    return base;
  })(),
}));

export const GallerySection = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const currentYearData = galleryData.find(y => y.year === selectedYear);
  const currentGradeData = selectedGrade 
    ? currentYearData?.grades.find(g => g.grade === selectedGrade)
    : null;

  const yearIndex = years.indexOf(selectedYear);

  return (
    <section id="gallery" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Photo <span className="text-accent">Gallery</span>
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through our school memories organized by year and grade.
          </p>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <button
            onClick={() => yearIndex > 0 && setSelectedYear(years[yearIndex - 1])}
            disabled={yearIndex === 0}
            className="p-2 rounded-full bg-card border border-border hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setSelectedGrade(null);
                }}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  selectedYear === year
                    ? "bg-accent text-accent-foreground shadow-gold-glow"
                    : "bg-card text-muted-foreground border border-border hover:border-accent"
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <button
            onClick={() => yearIndex < years.length - 1 && setSelectedYear(years[yearIndex + 1])}
            disabled={yearIndex === years.length - 1}
            className="p-2 rounded-full bg-card border border-border hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Grade Selection */}
        {!selectedGrade ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {currentYearData?.grades.map((gradeData) => (
              <button
                key={gradeData.grade}
                onClick={() => setSelectedGrade(gradeData.grade)}
                className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated hover:border-accent transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center group-hover:bg-accent transition-colors">
                  <FolderOpen className="w-8 h-8 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {gradeData.grade}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {gradeData.images.length} {gradeData.images.length === 1 ? "photo" : "photos"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setSelectedGrade(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back to Grades</span>
            </button>

            <h3 className="font-serif text-2xl font-bold text-foreground mb-6">
              {selectedGrade} - {selectedYear}
            </h3>

            {currentGradeData && currentGradeData.images.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentGradeData.images.map((image, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer"
                    onClick={() => setSelectedImage(image.src)}
                  >
                    <img
                      src={image.src}
                      alt={image.title}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-primary-foreground font-medium">{image.title}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No photos available yet for {selectedGrade} in {selectedYear}.</p>
                <p className="text-sm text-muted-foreground mt-2">Check back later for updates!</p>
              </div>
            )}
          </>
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

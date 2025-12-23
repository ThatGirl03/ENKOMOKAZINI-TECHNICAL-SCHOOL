import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AboutSection } from "@/components/AboutSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ActivitiesSection } from "@/components/ActivitiesSection";
import { PortfolioSection } from "@/components/PortfolioSection";
import { GallerySection } from "@/components/GallerySection";
import { TeamSection } from "@/components/TeamSection";
import { ContactSection } from "@/components/ContactSection";
import { LoginModal } from "@/components/LoginModal";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLarge, setIsLarge] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 0;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const onResize = () => setIsLarge(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    onResize();
    const handleScroll = () => {
      const sections = ["home", "about", "services", "activities", "portfolio", "gallery", "team", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (isAdmin) {
    return <AdminDashboard onLogout={() => setIsAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onNavigate={scrollToSection}
        onLoginClick={() => setIsLoginOpen(true)}
        // Pass school logo here so sidebar shows it instead of the icon
        schoolLogo="/assets/School Logo.jpeg"
        collapsed={sidebarCollapsed}
        onCollapseToggle={(next) => setSidebarCollapsed(next)}
      />

      {/* Main Content - adjusts based on sidebar state */}
      <main
        className={"transition-all duration-300"}
        style={{
          marginLeft: isLarge ? (sidebarCollapsed ? 80 : 288) : 0,
          transition: "margin-left 300ms ease",
        }}
      >
        <HeroCarousel />
        <AboutSection />
        <ServicesSection />
        <ActivitiesSection />
        <PortfolioSection />
        <GallerySection />
        <TeamSection />
        <ContactSection />
        <Footer />
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
      />
    </div>
  );
};

export default Index;

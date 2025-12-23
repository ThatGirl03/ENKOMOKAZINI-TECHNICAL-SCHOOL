import { useState } from "react";
import { Home, Info, BookOpen, Activity, Briefcase, Users, Mail, LogIn, Menu, X, GraduationCap, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLoginClick: () => void;
  schoolLogo?: string;
  // Controlled collapse state (optional). If provided, parent controls collapse.
  collapsed?: boolean;
  // Called when user toggles collapse. Parent should update `collapsed` if controlling.
  onCollapseToggle?: (collapsed: boolean) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: Info },
  { id: "services", label: "Services", icon: BookOpen },
  { id: "activities", label: "Activities", icon: Activity },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "team", label: "Team", icon: Users },
  { id: "contact", label: "Contact", icon: Mail },
];

export const Sidebar = ({ activeSection, onNavigate, onLoginClick, schoolLogo, collapsed, onCollapseToggle }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // If `collapsed` prop is provided, treat as controlled. Otherwise use internal state.
  const isCollapsed = typeof collapsed === "boolean" ? collapsed : internalCollapsed;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-elevated lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-card shadow-elevated z-50 flex flex-col",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          width: isCollapsed ? 80 : 288,
          transition: "width 300ms ease",
        }}
      >
        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={() => {
            const next = !isCollapsed;
            if (onCollapseToggle) onCollapseToggle(next);
            else setInternalCollapsed(next);
          }}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-accent text-accent-foreground rounded-full items-center justify-center shadow-card hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section */}
        <div className={cn("p-6 border-b border-border", isCollapsed && "p-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-4")}>
            {schoolLogo ? (
              <div className={cn(
                "rounded-xl bg-primary flex items-center justify-center shadow-card p-1",
                isCollapsed ? "w-12 h-12" : "w-14 h-14"
              )}>
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className={cn(
                    "rounded-md object-contain",
                    isCollapsed ? "w-8 h-8" : "w-10 h-10"
                  )}
                />
              </div>
            ) : (
              <div className={cn(
                "rounded-xl bg-primary flex items-center justify-center shadow-card",
                isCollapsed ? "w-12 h-12" : "w-14 h-14"
              )}>
                <GraduationCap className={cn("text-accent", isCollapsed ? "w-6 h-6" : "w-8 h-8")} />
              </div>
            )}
            {!isCollapsed && (
              <div>
                  <h1 className="leading-tight">
                    <span className="block font-serif font-bold text-lg text-foreground">Enkomokazini</span>
                    <span className="block font-serif text-sm text-muted-foreground font-normal">Technical High School</span>
                  </h1>
                </div>
            )}
          </div>
          {!isCollapsed && (
            <p className="mt-3 text-sm font-serif tracking-wider text-accent">
                  THROUGH DIFFICULTIES WE SUCCEED
              </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center rounded-lg transition-all duration-200",
                      isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-card"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className={isActive ? "text-accent" : ""} />
                        {!isCollapsed && (
                      <>
                        <span className="font-serif font-medium">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Login Button */}
        <div className={cn("p-4 border-t border-border", isCollapsed && "p-2")}>
          <button
            onClick={onLoginClick}
            className={cn(
              "w-full flex items-center justify-center bg-accent text-accent-foreground rounded-lg font-semibold transition-all hover:shadow-gold-glow hover:scale-[1.02]",
              isCollapsed ? "p-3" : "gap-2 px-4 py-3"
            )}
            title={isCollapsed ? "Admin Login" : undefined}
          >
            <LogIn size={20} />
            {!isCollapsed && <span className="font-serif">Admin Login</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

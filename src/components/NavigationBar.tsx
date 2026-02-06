import { NavLink } from "./NavLinks";
import { Menu, X, Home, Info, BookOpen, Users, Contact } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { path: "/about", label: "About", icon: <Info className="w-5 h-5" /> },
    { path: "/academics", label: "Academics", icon: <BookOpen className="w-5 h-5" /> },
    { path: "/staff", label: "Staff", icon: <Users className="w-5 h-5" /> },
    { path: "/contact", label: "Contact", icon: <Contact className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-accent text-white shadow-md"
                  : "text-foreground hover:bg-accent/10 hover:text-accent"
              )
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-md text-foreground hover:bg-accent/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-card border-t border-border shadow-lg z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      isActive
                        ? "bg-accent text-white"
                        : "text-foreground hover:bg-accent/10 hover:text-accent"
                    )
                  }
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

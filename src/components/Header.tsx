import { Link } from "react-router-dom";
import { NavigationBar } from "./NavigationBar";
import { School } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20 group-hover:border-accent/40 transition-colors">
                <School className="w-6 h-6 text-accent" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg text-foreground leading-tight">
                Enkomokazini
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                Technical High School
              </div>
            </div>
            <div className="sm:hidden font-bold text-lg text-foreground">
              ETS
            </div>
          </Link>

          {/* Navigation */}
          <NavigationBar />
        </div>
      </div>
    </header>
  );
};

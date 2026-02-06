import { useEffect, useState } from "react";
import { loadSiteData } from "@/lib/siteData";
import { SEOHead } from "@/components/SEOHead";
import { Search, Filter, User, Briefcase, Award } from "lucide-react";

const StaffPage = () => {
  const [siteData, setSiteData] = useState(loadSiteData());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filteredTeam, setFilteredTeam] = useState(siteData.team || []);

  useEffect(() => {
    const onUpdate = (e: any) => {
      const data = e?.detail || loadSiteData();
      setSiteData(data);
      setFilteredTeam(data.team || []);
    };
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  useEffect(() => {
    let results = siteData.team || [];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(member => 
        member.name.toLowerCase().includes(term) || 
        member.role.toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (filterRole !== "all") {
      results = results.filter(member => {
        const role = member.role.toLowerCase();
        if (filterRole === "leadership") {
          return role.includes("principal") || role.includes("deputy") || role.includes("head");
        }
        if (filterRole === "teachers") {
          return !role.includes("principal") && !role.includes("deputy") && !role.includes("head") && 
                 !role.includes("janitor") && !role.includes("security") && !role.includes("administration");
        }
        if (filterRole === "support") {
          return role.includes("janitor") || role.includes("security") || role.includes("administration");
        }
        return true;
      });
    }
    
    setFilteredTeam(results);
  }, [searchTerm, filterRole, siteData.team]);

  // Group team by category for better organization
  const leadership = (siteData.team || []).filter(m => 
    m.role.toLowerCase().includes("principal") || m.role.toLowerCase().includes("deputy") || m.role.toLowerCase().includes("head")
  );
  
  const teachers = (siteData.team || []).filter(m => 
    !m.role.toLowerCase().includes("principal") && 
    !m.role.toLowerCase().includes("deputy") && 
    !m.role.toLowerCase().includes("head") &&
    !m.role.toLowerCase().includes("janitor") &&
    !m.role.toLowerCase().includes("security") &&
    !m.role.toLowerCase().includes("administration")
  );
  
  const support = (siteData.team || []).filter(m => 
    m.role.toLowerCase().includes("janitor") || 
    m.role.toLowerCase().includes("security") ||
    m.role.toLowerCase().includes("administration")
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <SEOHead 
        data={siteData}
        pageTitle="Our Staff & Faculty"
        pageDescription="Meet the dedicated staff and faculty of Enkomokazini Technical High School. Experienced educators and support staff committed to student success."
      />
      
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Our Staff & Faculty</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dedicated educators and support staff committed to student success
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Total Staff</h3>
              <p className="text-3xl font-bold text-accent">{siteData.team?.length || 0}</p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <User className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Teaching Faculty</h3>
              <p className="text-3xl font-bold text-accent">{teachers.length}</p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Leadership Team</h3>
              <p className="text-3xl font-bold text-accent">{leadership.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-12 bg-card rounded-xl p-6 border border-border">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search staff by name or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Staff</option>
                    <option value="leadership">Leadership</option>
                    <option value="teachers">Teaching Faculty</option>
                    <option value="support">Support Staff</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Grid */}
          {searchTerm || filterRole !== "all" ? (
            // Filtered view
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Search Results ({filteredTeam.length})
              </h2>
              {filteredTeam.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg text-muted-foreground">No staff members found matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTeam.map((member, index) => (
                    <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-elevated transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-accent/20"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                              <span className="text-xl font-bold text-accent">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
                          <p className="text-accent font-medium">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Categorized view (when no filters)
            <div className="space-y-16">
              {/* Leadership Team */}
              {leadership.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Leadership Team</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leadership.map((member, index) => (
                      <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-elevated transition-shadow">
                        <div className="flex flex-col items-center text-center">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-accent/20 mb-4"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center border-4 border-accent/20 mb-4">
                              <span className="text-2xl font-bold text-accent">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                          <h3 className="font-bold text-xl text-foreground mb-1">{member.name}</h3>
                          <p className="text-accent font-medium mb-3">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teaching Faculty */}
              {teachers.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Teaching Faculty</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {teachers.map((member, index) => (
                      <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-elevated transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-accent/20"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                                <span className="text-lg font-bold text-accent">
                                  {getInitials(member.name)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{member.name}</h3>
                            <p className="text-accent text-sm">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Staff */}
              {support.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Support Staff</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {support.map((member, index) => (
                      <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-elevated transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                              <User className="w-6 h-6 text-accent" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{member.name}</h3>
                            <p className="text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffPage;

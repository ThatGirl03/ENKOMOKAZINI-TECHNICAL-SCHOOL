import React, { useEffect, useState, useRef } from "react";
import { LogOut, Bell, Settings, Upload, X } from "lucide-react";
import { loadSiteData, saveSiteData, resetSiteData, SiteData } from "@/lib/siteData";
import { useToast } from "@/hooks/use-toast";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AboutSection } from "@/components/AboutSection";
import { TeamSection } from "@/components/TeamSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [serverToken, setServerToken] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const sponsorImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    // try to fetch server data if available and sync to localStorage
    (async () => {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const serverData = await res.json();
          if (serverData) {
            saveSiteData(serverData);
            setEditing(serverData);
            setData(serverData as SiteData);
            toast({
              title: "Data loaded from server",
              description: "Synced server data to local storage."
            });
          }
        }
      } catch (e) {
        console.log("No server available, using local data");
      }
    })();
  }, []);

  useEffect(() => {
    const onUpdate = (e: any) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Please upload JPG, PNG, GIF, WebP, or SVG files. Received: ${file.type}`,
        variant: "destructive"
      });
      return false;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is 5MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!validateImageFile(file)) {
      throw new Error("Invalid image file");
    }
    
    // try server upload first
    try {
      const fd = new FormData();
      fd.append("file", file);
      const headers: any = {};
      if (serverToken) headers["x-admin-token"] = serverToken;
      
      const res = await fetch("/api/upload", { 
        method: "POST", 
        body: fd, 
        headers 
      });
      
      if (res.ok) {
        const json = await res.json();
        if (json.url && (json.url.startsWith('http') || json.url.startsWith('data:'))) {
          return json.url;
        }
      }
    } catch (e) {
      console.log("Server upload failed, falling back to data URL");
    }
    
    // fallback to data URL
    return await fileToDataUrl(file);
  };

  const handleSave = async () => {
    setIsUploading(true);
    
    try {
      // Merge editing with current data
      const currentData = loadSiteData();
      const payload = { ...currentData, ...editing } as SiteData;
      
      // Clean up image arrays - remove any null/undefined/empty strings
      if (payload.heroImages) {
        payload.heroImages = payload.heroImages.filter(img => 
          img && img.trim().length > 0 && (img.startsWith('http') || img.startsWith('data:image'))
        );
      }
      
      if (payload.team) {
        payload.team = payload.team.map(member => ({
          ...member,
          image: member.image || member.initials || ''
        }));
      }
      
      if (payload.sponsors) {
        payload.sponsors = payload.sponsors.filter(sponsor => 
          sponsor.name.trim().length > 0
        );
      }
      
      // Save locally first for immediate feedback
      const savedLocal = saveSiteData(payload);
      if (savedLocal) {
        setData(savedLocal as SiteData);
        window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: savedLocal }));
        
        toast({ 
          title: "Saved locally", 
          description: "Changes saved to browser storage.",
          variant: "default"
        });
      }
      
      // Try to save to server
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (serverToken) headers["x-admin-token"] = serverToken;
        
        const res = await fetch("/api/data", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          const serverResponse = await res.json();
          // Sync with server response
          saveSiteData(serverResponse);
          window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: serverResponse }));
          setData(serverResponse as SiteData);
          setEditing(serverResponse);
          
          toast({ 
            title: "Saved to server", 
            description: "Changes synced to server.",
            variant: "default"
          });
        }
      } catch (serverError) {
        console.log("Server save optional - using local only");
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    resetSiteData();
    const sd = loadSiteData();
    setData(sd);
    setEditing(sd);
    toast({
      title: "Data reset",
      description: "All data has been reset to default values.",
      variant: "default"
    });
  };

  const handleHeroImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages: string[] = [...currentImages];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = await uploadImage(file);
        newImages.push(imageUrl);
      }
      
      setEditing({ ...editing, heroImages: newImages });
      
      toast({
        title: "Images uploaded",
        description: `Added ${files.length} image(s)`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some images. Please check file formats.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeHeroImage = (index: number) => {
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, heroImages: newImages });
  };

  // Team editors
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ name: "New Member", role: "Team Role", initials: "NM", image: "" });
    setEditing({ ...editing, team: t });
  };

  const updateTeamMember = (index: number, value: any) => {
    const t = editing.team ? [...editing.team] : [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
  };

  const removeTeamMember = (index: number) => {
    const t = editing.team ? [...editing.team] : [];
    t.splice(index, 1);
    setEditing({ ...editing, team: t });
  };

  const handleTeamImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      updateTeamMember(index, { image: imageUrl });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload team member image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Sponsors editors
  const addSponsor = () => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.push({ name: "New Sponsor", url: "https://example.com", image: "" });
    setEditing({ ...editing, sponsors: s });
  };

  const updateSponsor = (index: number, value: any) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, sponsors: s });
  };

  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.splice(index, 1);
    setEditing({ ...editing, sponsors: s });
  };

  const handleSponsorImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      updateSponsor(index, { image: imageUrl });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload sponsor image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Services editors (streams & subjects)
  const addService = () => {
    const s = editing.services ? [...editing.services] : [];
    s.push({ category: "New Stream", subjects: [{ name: "New Subject", passMark: "50%" }] });
    setEditing({ ...editing, services: s });
  };

  const updateService = (index: number, value: any) => {
    const s = editing.services ? [...editing.services] : [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, services: s });
  };

  const removeService = (index: number) => {
    const s = editing.services ? [...editing.services] : [];
    s.splice(index, 1);
    setEditing({ ...editing, services: s });
  };

  const addSubject = (serviceIndex: number) => {
    const s = editing.services ? [...editing.services] : [];
    const subjects = s[serviceIndex].subjects ? [...s[serviceIndex].subjects] : [];
    subjects.push({ name: "New Subject", passMark: "50%" });
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };

  const updateSubject = (serviceIndex: number, subjectIndex: number, value: any) => {
    const s = editing.services ? [...editing.services] : [];
    const subjects = s[serviceIndex].subjects ? [...(s[serviceIndex].subjects as any[])] : [];
    subjects[subjectIndex] = { ...subjects[subjectIndex], ...value };
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };

  const removeSubject = (serviceIndex: number, subjectIndex: number) => {
    const s = editing.services ? [...editing.services] : [];
    const subjects = s[serviceIndex].subjects ? [...(s[serviceIndex].subjects as any[])] : [];
    subjects.splice(subjectIndex, 1);
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };

  const handleSchoolImageUpload = async (file?: File) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      setEditing({ ...editing, schoolImage: imageUrl });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload school image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getImagePreview = (url: string | undefined, fallback?: string): string => {
    if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
      return url;
    }
    return fallback || '';
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-card">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Edit site content — changes save to local browser storage
            {isUploading && (
              <span className="ml-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                <span className="animate-spin mr-1">⟳</span> Uploading...
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Site Editor</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Server Token (optional)
                </label>
                <input
                  value={serverToken}
                  onChange={(e) => setServerToken(e.target.value)}
                  placeholder="x-admin-token for server"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only needed if you have a backend server with authentication
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  School Name
                </label>
                <input
                  value={editing.schoolName || ""}
                  onChange={(e) => setEditing({ ...editing, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tagline
                </label>
                <input
                  value={editing.tagline || ""}
                  onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Contact Email
                </label>
                <input
                  value={editing.contactEmail || ""}
                  onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone
                  </label>
                  <input
                    value={editing.phone || ""}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Postal
                  </label>
                  <input
                    value={editing.postal || ""}
                    onChange={(e) => setEditing({ ...editing, postal: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address
                </label>
                <input
                  value={editing.address || ""}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pass Rate
                </label>
                <input
                  value={editing.passRate || ""}
                  onChange={(e) => setEditing({ ...editing, passRate: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  placeholder="e.g., 95%"
                />
              </div>

              {/* Hero Images Section */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hero Images
                </label>
                <div className="mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleHeroImagesUpload}
                    className="hidden"
                    id="hero-images-upload"
                  />
                  <label
                    htmlFor="hero-images-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 cursor-pointer transition-colors"
                  >
                    <Upload size={18} />
                    Upload Images (JPG, PNG, GIF, WebP, SVG - max 5MB each)
                  </label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {(editing.heroImages || data.heroImages || []).map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video w-full rounded-lg border border-border overflow-hidden bg-gray-100">
                        <img
                          src={getImagePreview(url)}
                          alt={`Hero ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2Uge2luZGV4fTwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeHeroImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {editing.heroImages?.length || data.heroImages?.length || 0} images uploaded
                </p>
              </div>

              {/* School Image Section */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  School Image (About Section)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          await handleSchoolImageUpload(e.target.files[0]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-border rounded bg-background"
                    />
                  </div>
                  <div className="w-32 h-32 rounded-lg border border-border overflow-hidden bg-gray-100">
                    <img
                      src={getImagePreview(
                        editing.schoolImage || data.schoolImage,
                        editing.heroImages?.[0] || data.heroImages?.[0] || ''
                      )}
                      alt="School"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2Nob29sPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-foreground">
                    Team Members
                  </label>
                  <button
                    onClick={addTeamMember}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm"
                  >
                    Add Member
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editing.team || data.team || []).map((member, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-background/50">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-full border-2 border-accent overflow-hidden bg-gray-100 flex items-center justify-center">
                            {member.image ? (
                              <img
                                src={getImagePreview(member.image)}
                                alt={member.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+e21lbWJlci5pbml0aWFsc308L3RleHQ+PC9zdmc+";
                                }}
                              />
                            ) : (
                              <span className="text-lg font-bold text-gray-600">
                                {member.initials || member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                await handleTeamImageUpload(index, e.target.files[0]);
                              }
                            }}
                            className="mt-2 text-xs w-full"
                            ref={el => teamImageInputRefs.current[index] = el}
                          />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <input
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Role</label>
                            <input
                              value={member.role}
                              onChange={(e) => updateTeamMember(index, { role: e.target.value })}
                              className="w-full px-3 py-2 rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Initials (fallback)</label>
                            <input
                              value={member.initials || ""}
                              onChange={(e) => updateTeamMember(index, { initials: e.target.value })}
                              className="w-full px-3 py-2 rounded border border-border bg-background"
                              placeholder="e.g., JD"
                            />
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => removeTeamMember(index)}
                            className="px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sponsors Section */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-foreground">
                    Sponsors
                  </label>
                  <button
                    onClick={addSponsor}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm"
                  >
                    Add Sponsor
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editing.sponsors || data.sponsors || []).map((sponsor, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-background/50">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded border border-border overflow-hidden bg-gray-100 flex items-center justify-center">
                            {sponsor.image ? (
                              <img
                                src={getImagePreview(sponsor.image)}
                                alt={sponsor.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9nbzwvdGV4dD48L3N2Zz4=";
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">Logo</span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                await handleSponsorImageUpload(index, e.target.files[0]);
                              }
                            }}
                            className="mt-2 text-xs w-full"
                            ref={el => sponsorImageInputRefs.current[index] = el}
                          />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Sponsor Name</label>
                            <input
                              value={sponsor.name}
                              onChange={(e) => updateSponsor(index, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Website URL</label>
                            <input
                              value={sponsor.url || ""}
                              onChange={(e) => updateSponsor(index, { url: e.target.value })}
                              className="w-full px-3 py-2 rounded border border-border bg-background"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => removeSponsor(index)}
                            className="px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Section */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-foreground">
                    Services (Streams & Subjects)
                  </label>
                  <button
                    onClick={addService}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm"
                  >
                    Add Stream
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editing.services || data.services || []).map((service, serviceIndex) => (
                    <div key={serviceIndex} className="p-4 border border-border rounded-lg bg-background/50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Stream/Category</label>
                          <input
                            value={service.category}
                            onChange={(e) => updateService(serviceIndex, { category: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-border bg-background"
                          />
                        </div>
                        <button
                          onClick={() => removeService(serviceIndex)}
                          className="ml-3 px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm"
                        >
                          Remove Stream
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-muted-foreground">Subjects</label>
                          <button
                            onClick={() => addSubject(serviceIndex)}
                            className="px-2 py-1 bg-accent/20 text-accent-foreground rounded text-xs"
                          >
                            + Add Subject
                          </button>
                        </div>
                        
                        {(service.subjects || []).map((subject: any, subjectIndex: number) => (
                          <div key={subjectIndex} className="flex gap-2 items-center">
                            <div className="flex-1">
                              <input
                                value={subject.name}
                                onChange={(e) => updateSubject(serviceIndex, subjectIndex, { name: e.target.value })}
                                className="w-full px-3 py-2 rounded border border-border bg-background"
                                placeholder="Subject name"
                              />
                            </div>
                            <div className="w-28">
                              <input
                                value={subject.passMark}
                                onChange={(e) => updateSubject(serviceIndex, subjectIndex, { passMark: e.target.value })}
                                className="w-full px-3 py-2 rounded border border-border bg-background"
                                placeholder="Pass mark"
                              />
                            </div>
                            <button
                              onClick={() => removeSubject(serviceIndex, subjectIndex)}
                              className="px-2 py-2 bg-destructive/20 text-destructive-foreground rounded text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UI Settings */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  UI Settings
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Services Preview Count
                    </label>
                    <input
                      type="number"
                      value={(editing.ui && editing.ui.servicesPreviewCount) || (data.ui && data.ui.servicesPreviewCount) || 6}
                      onChange={(e) => setEditing({
                        ...editing,
                        ui: { ...(editing.ui || data.ui || {}), servicesPreviewCount: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 rounded border border-border bg-background"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Badge Color
                    </label>
                    <select
                      value={(editing.ui && editing.ui.badgeColor) || (data.ui && data.ui.badgeColor) || 'blue'}
                      onChange={(e) => setEditing({
                        ...editing,
                        ui: { ...(editing.ui || data.ui || {}), badgeColor: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded border border-border bg-background"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                      <option value="yellow">Yellow</option>
                      <option value="purple">Purple</option>
                      <option value="pink">Pink</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Transition (ms)
                    </label>
                    <input
                      type="number"
                      value={(editing.ui && editing.ui.transitionMs) || (data.ui && data.ui.transitionMs) || 300}
                      onChange={(e) => setEditing({
                        ...editing,
                        ui: { ...(editing.ui || data.ui || {}), transitionMs: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 rounded border border-border bg-background"
                      min="0"
                      max="5000"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border pt-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reset to Default
                  </button>
                  
                  <button
                    onClick={() => {
                      const testImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM2NjVlZiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3Q8L3RleHQ+PC9zdmc+';
                      setEditing({ ...editing, heroImages: [...(editing.heroImages || []), testImage] });
                      toast({
                        title: "Test image added",
                        description: "A test SVG image has been added to hero images",
                        variant: "default"
                      });
                    }}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Add Test Image
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  All changes are saved automatically to your browser's local storage.
                  Use the server token if you want to sync with a backend server.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="sticky top-6 bg-card rounded-xl p-4 shadow-card border border-border">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Live Preview
                </h2>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Auto-updating
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Preview updates automatically as you edit. Save changes to persist them.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <HeroCarousel />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <AboutSection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <TeamSection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <ContactSection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <Footer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

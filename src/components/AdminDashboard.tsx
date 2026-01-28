import React, { useEffect, useState } from "react";
import { LogOut, Bell, Settings } from "lucide-react";
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
          }
        }
      } catch (e) {
        // no server, continue with local data
      }
    })();
  }, []);

  useEffect(() => {
    const onUpdate = (e: any) => setData(e?.detail || loadSiteData());
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  const uploadImage = async (file: File, type: 'team' | 'sponsor' | 'hero' | 'school', name?: string): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Validate file exists and is an image
      if (!file || !file.type.startsWith('image/')) {
          console.error('Invalid file type. Please upload an image.');
          toast({
            title: "Invalid file",
            description: "Please upload an image file (JPG, PNG, GIF, etc.)",
            variant: "destructive"
          });
          return await fileToDataUrl(file);
      }
      
      // Check file size if needed (e.g., limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
          console.error('File too large. Maximum size is 5MB.');
          toast({
            title: "File too large",
            description: "Maximum file size is 5MB",
            variant: "destructive"
          });
          return await fileToDataUrl(file);
      }

      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      if (!validExtensions.includes(fileExt)) {
        toast({
          title: "Invalid file format",
          description: "Please upload JPG, PNG, GIF, WebP, or SVG files",
          variant: "destructive"
        });
        return await fileToDataUrl(file);
      }

      // Generate a safe filename
      let safeName = 'image';
      if (name) {
        // Remove special characters and spaces, convert to lowercase
        safeName = name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .substring(0, 50); // Limit length
      }
      
      // Create timestamp for uniqueness
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${safeName}_${timestamp}_${random}.${fileExt}`;
      
      // Determine folder based on type - UPDATED TO MATCH YOUR STRUCTURE
      let folderPath = '';
      switch(type) {
        case 'team':
          folderPath = '/assets/Team/';  // Your existing Team folder with capital T
          break;
        case 'sponsor':
          folderPath = '/assets/';  // Store sponsor logos in root of assets
          break;
        case 'hero':
          folderPath = '/assets/';  // Store hero images in root of assets (or create /assets/Hero/ later)
          break;
        case 'school':
          folderPath = '/assets/';  // Where School Logo.jpeg already is
          break;
        default:
          folderPath = '/assets/';
      }
      
      const filePath = `${folderPath}${fileName}`;

      // Convert file to base64 for the API
      const base64Data = await fileToDataUrl(file);
      
      // Try to upload to server API
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (serverToken) {
            headers["x-admin-token"] = serverToken;
        }
        
        const res = await fetch("/api/upload", { 
            method: "POST", 
            headers,
            body: JSON.stringify({
              imageData: base64Data,
              filename: fileName,
              folder: folderPath,
              type: type
            })
        });
        
        if (res.ok) {
            const json = await res.json();
            
            // Validate response has URL
            if (json && json.url) {
                toast({
                  title: "Upload successful",
                  description: `Image saved to ${folderPath}`,
                });
                return json.url as string;
            } else if (json && json.filePath) {
                // If server returns the file path, use it
                toast({
                  title: "Upload successful",
                  description: `Image saved to ${folderPath}`,
                });
                return json.filePath;
            } else {
                console.error('Server response missing URL/FilePath field:', json);
                throw new Error('Invalid server response');
            }
        } else {
            // Log server error details
            console.error(`Upload failed with status ${res.status}: ${res.statusText}`);
            const errorText = await res.text();
            console.error('Server error response:', errorText);
            
            // If server is not available, fall back to data URL but inform user
            toast({
              title: "Server upload failed",
              description: "Using temporary image storage (data URL). Images will not persist after page refresh.",
              variant: "destructive"
            });
            
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }
      } catch (e) {
          // fallback to data URL with timestamp to make it unique
          console.log('Upload failed, falling back to data URL:', e);
          const dataUrl = await fileToDataUrl(file);
          return dataUrl;
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    
    try {
      // ensure arrays
      const payload = { ...loadSiteData(), ...editing } as SiteData;
      const nextLocal = saveSiteData(payload);
      if (nextLocal) {
        setData(nextLocal as SiteData);
        // Update editing state to match saved data
        setEditing(nextLocal as SiteData);
      }

      // try to save to server
      try {
          const headers: any = { "Content-Type": "application/json" };
          if (serverToken) headers["x-admin-token"] = serverToken;
          const res = await fetch("/api/data", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
        if (res.ok) {
          toast({ title: "Saved", description: "Changes saved to server and local storage." });
          const next = await res.json();
          // sync
          saveSiteData(next);
          window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: next }));
          setData(next as SiteData);
          setEditing(next as SiteData);
        } else {
          toast({ title: "Saved locally", description: "Server not available, changes saved in browser." });
        }
      } catch (e) {
        toast({ title: "Saved locally", description: "Server not available, changes saved in browser." });
      }
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
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const currentImages = editing.heroImages || data.heroImages || [];
    const urls: string[] = [...currentImages];
    
    toast({
      title: "Uploading hero images...",
      description: `Uploading ${files.length} image(s) to /assets/ folder`,
    });
    
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        // Use index as name for hero images
        const url = await uploadImage(f, 'hero', `hero_${urls.length + i + 1}`);
        urls.push(url);
      }
      
      // Update both editing state and immediately save to local storage for preview
      setEditing({ ...editing, heroImages: urls });
      
      // Also immediately update the data state for preview
      const updatedData = { ...data, heroImages: urls };
      saveSiteData(updatedData);
      setData(updatedData);
      
      // Trigger update event for preview components
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      toast({
        title: "Hero images uploaded",
        description: `Added ${files.length} image(s) to /assets/ folder`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some hero images",
        variant: "destructive"
      });
    }
  };

  // Team editors
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ name: "New Member", role: "", initials: "", image: "" });
    setEditing({ ...editing, team: t });
  };
  
  const updateTeamMember = (index: number, value: any) => {
    const t = editing.team ? [...editing.team] : [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
    
    // Also update data state for immediate preview
    const updatedData = { ...data };
    if (!updatedData.team) updatedData.team = [];
    updatedData.team[index] = { ...updatedData.team[index], ...value };
    setData(updatedData);
  };
  
  const removeTeamMember = (index: number) => {
    const t = editing.team ? [...editing.team] : [];
    t.splice(index, 1);
    setEditing({ ...editing, team: t });
  };

  const handleTeamImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    
    const teamMember = editing.team?.[index] || data.team?.[index];
    const memberName = teamMember?.name || `member_${index + 1}`;
    
    try {
      const url = await uploadImage(file, 'team', memberName);
      updateTeamMember(index, { image: url });
      
      toast({
        title: "Team image uploaded",
        description: `Image uploaded to /assets/Team/ folder`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload team member image",
        variant: "destructive"
      });
    }
  };

  // Sponsors editors
  const addSponsor = () => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.push({ name: "New Sponsor", url: "", image: "" });
    setEditing({ ...editing, sponsors: s });
  };
  
  const updateSponsor = (index: number, value: any) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, sponsors: s });
    
    // Also update data state for immediate preview
    const updatedData = { ...data };
    if (!updatedData.sponsors) updatedData.sponsors = [];
    updatedData.sponsors[index] = { ...updatedData.sponsors[index], ...value };
    setData(updatedData);
  };
  
  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.splice(index, 1);
    setEditing({ ...editing, sponsors: s });
  };

  const handleSponsorImage = async (index: number, file?: File) => {
    if (!file) return;
    
    const sponsor = editing.sponsors?.[index] || data.sponsors?.[index];
    const sponsorName = sponsor?.name || `sponsor_${index + 1}`;
    
    try {
      const url = await uploadImage(file, 'sponsor', sponsorName);
      updateSponsor(index, { image: url });
      
      toast({
        title: "Sponsor logo uploaded",
        description: `Logo uploaded to /assets/ folder`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload sponsor logo",
        variant: "destructive"
      });
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

  const handleSchoolImage = async (file?: File) => {
    if (!file) return;
    
    try {
      const url = await uploadImage(file, 'school', 'school_image');
      setEditing({ ...editing, schoolImage: url });
      
      // Also immediately update the data state for preview
      const updatedData = { ...data, schoolImage: url };
      saveSiteData(updatedData);
      setData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      toast({
        title: "School image uploaded",
        description: "Image uploaded to /assets/ folder",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload school image",
        variant: "destructive"
      });
    }
  };

  // Helper function to get image source with fallback
  const getImageSrc = (url: string | undefined): string => {
    if (!url) return '';
    
    // If it's already a proper path (starts with /) or data URL, return as is
    if (url.startsWith('/') || url.startsWith('data:image') || url.startsWith('http')) {
      return url;
    }
    
    // If it's a relative path without leading slash, add it
    if (url.startsWith('assets/') || url.startsWith('public/')) {
      return `/${url}`;
    }
    
    return url;
  };

  // Helper to remove hero image
  const removeHeroImage = (index: number) => {
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, heroImages: newImages });
    
    // Also update data state
    const updatedData = { ...data, heroImages: newImages };
    saveSiteData(updatedData);
    setData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Server Token (optional)</label>
                <input 
                  value={serverToken} 
                  onChange={(e)=>setServerToken(e.target.value)} 
                  placeholder="x-admin-token for server" 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required for uploading images to server folders. 
                  {!serverToken && " Add a token to save images permanently."}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">School Name</label>
                <input value={editing.schoolName || ""} onChange={(e)=>setEditing({...editing, schoolName: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                <input value={editing.tagline || ""} onChange={(e)=>setEditing({...editing, tagline: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea value={editing.description || ""} onChange={(e)=>setEditing({...editing, description: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" rows={4} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contact Email</label>
                <input value={editing.contactEmail || ""} onChange={(e)=>setEditing({...editing, contactEmail: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input value={editing.phone || ""} onChange={(e)=>setEditing({...editing, phone: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Postal</label>
                  <input value={editing.postal || ""} onChange={(e)=>setEditing({...editing, postal: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input value={editing.address || ""} onChange={(e)=>setEditing({...editing, address: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pass Rate</label>
                <input value={editing.passRate || ""} onChange={(e)=>setEditing({...editing, passRate: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" placeholder="e.g., 95%" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Team Members</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Images saved to: /assets/Team/
                  {!serverToken && " (Add server token above to save permanently)"}
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {(editing.team || data.team || []).map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border border-border rounded">
                        <div className="w-12 h-12 rounded-full bg-primary overflow-hidden flex items-center justify-center flex-shrink-0">
                          {m.image ? (
                            <img 
                              src={getImageSrc(m.image)} 
                              alt={m.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If image fails to load, show initials
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  const initials = m.initials || m.name.split(' ').map(n=>n[0]).slice(0,2).join('');
                                  const span = document.createElement('span');
                                  span.className = 'text-accent-foreground font-bold';
                                  span.textContent = initials;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-accent-foreground font-bold">{m.initials || m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <input value={m.name} onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} className="w-full px-2 py-1 rounded border border-border bg-background" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Role</label>
                            <input value={m.role} onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} className="w-full px-2 py-1 rounded border border-border bg-background" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e)=>{ 
                              if(e.target.files && e.target.files[0]){ 
                                await handleTeamImageUpload(idx, e.target.files[0]); 
                              } 
                            }} 
                            className="text-xs w-32"
                            disabled={isUploading}
                          />
                          <button 
                            onClick={()=>removeTeamMember(idx)} 
                            className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                            disabled={isUploading}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={addTeamMember} 
                    className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded"
                    disabled={isUploading}
                  >
                    Add Member
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Sponsors</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Logos saved to: /assets/
                  {!serverToken && " (Add server token above to save permanently)"}
                </p>
                <div className="space-y-2">
                  {(editing.sponsors || data.sponsors || []).map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-2 border border-border rounded">
                      <div className="w-16 h-16 rounded border border-border overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {s.image ? (
                          <img 
                            src={getImageSrc(s.image)} 
                            alt={s.name} 
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent) {
                                const span = document.createElement('span');
                                span.className = 'text-gray-400 text-xs';
                                span.textContent = 'Logo';
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Logo</span>
                        )}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <input value={s.name} onChange={(e)=>updateSponsor(idx, { name: e.target.value })} className="w-full px-2 py-1 rounded border border-border bg-background" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Website</label>
                          <input value={s.url || ""} onChange={(e)=>updateSponsor(idx, { url: e.target.value })} className="w-full px-2 py-1 rounded border border-border bg-background" placeholder="https://..." />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e)=>{ 
                            if(e.target.files && e.target.files[0]) {
                              await handleSponsorImage(idx, e.target.files[0]); 
                            } 
                          }} 
                          className="text-xs w-32"
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeSponsor(idx)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                          disabled={isUploading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addSponsor} 
                    className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded"
                    disabled={isUploading}
                  >
                    Add Sponsor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hero Images (upload multiple)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Images saved to: /assets/
                  {!serverToken && " (Add server token above to save permanently)"}
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload} 
                  className="w-full"
                  disabled={isUploading}
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(editing.heroImages || data.heroImages || []).map((u, i)=> (
                    <div key={i} className="relative">
                      <img 
                        src={getImageSrc(u)} 
                        alt={`hero-${i}`} 
                        className="h-20 w-32 object-cover rounded border border-border"
                        onError={(e) => {
                          // If image fails to load, show a placeholder
                          const img = e.target as HTMLImageElement;
                          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2Uge2krMX08L3RleHQ+PC9zdmc+';
                        }}
                      />
                      <button
                        onClick={() => removeHeroImage(i)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                        disabled={isUploading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(editing.heroImages || data.heroImages || []).length} images
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">School Image (used in About)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Image saved to: /assets/
                  {!serverToken && " (Add server token above to save permanently)"}
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e)=>{ 
                    if(e.target.files && e.target.files[0]) {
                      await handleSchoolImage(e.target.files[0]); 
                    } 
                  }} 
                  className="w-full"
                  disabled={isUploading}
                />
                <div className="mt-2">
                  <img 
                    src={getImageSrc(
                      editing.schoolImage || data.schoolImage || (data.heroImages && data.heroImages[0])
                    )} 
                    alt="school" 
                    className="h-28 w-full object-cover rounded border border-border"
                    onError={(e) => {
                      // If image fails to load, show a placeholder
                      const img = e.target as HTMLImageElement;
                      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2Nob29sPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Services (Streams) — edit subjects and pass marks</label>
                <div className="space-y-3">
                  {(editing.services || data.services || []).map((svc, sIdx) => (
                    <div key={sIdx} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2">
                        <input 
                          value={svc.category} 
                          onChange={(e)=>updateService(sIdx, { category: e.target.value })} 
                          className="flex-1 px-2 py-2 rounded border border-border bg-background" 
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeService(sIdx)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded"
                          disabled={isUploading}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(svc.subjects || []).map((sub: any, subIdx: number) => (
                          <div key={subIdx} className="flex gap-2 items-center">
                            <input 
                              value={sub.name} 
                              onChange={(e)=>updateSubject(sIdx, subIdx, { name: e.target.value })} 
                              className="flex-1 px-2 py-2 rounded border border-border bg-background" 
                              disabled={isUploading}
                            />
                            <input 
                              value={sub.passMark} 
                              onChange={(e)=>updateSubject(sIdx, subIdx, { passMark: e.target.value })} 
                              className="w-28 px-2 py-2 rounded border border-border bg-background" 
                              disabled={isUploading}
                            />
                            <button 
                              onClick={()=>removeSubject(sIdx, subIdx)} 
                              className="px-2 py-1 bg-destructive text-destructive-foreground rounded"
                              disabled={isUploading}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div className="mt-2">
                          <button 
                            onClick={()=>addSubject(sIdx)} 
                            className="px-3 py-2 bg-accent text-accent-foreground rounded"
                            disabled={isUploading}
                          >
                            Add Subject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button 
                      onClick={addService} 
                      className="px-3 py-2 bg-accent text-accent-foreground rounded"
                      disabled={isUploading}
                    >
                      Add Stream
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Services UI Settings</label>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="number" 
                    value={(editing.ui && editing.ui.servicesPreviewCount) || (data.ui && data.ui.servicesPreviewCount) || 6} 
                    onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), servicesPreviewCount: Number(e.target.value)}})} 
                    className="px-2 py-2 rounded border border-border bg-background" 
                    disabled={isUploading}
                  />
                  <input 
                    value={(editing.ui && editing.ui.badgeColor) || (data.ui && data.ui.badgeColor) || 'blue'} 
                    onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), badgeColor: e.target.value}})} 
                    className="px-2 py-2 rounded border border-border bg-background" 
                    disabled={isUploading}
                  />
                  <input 
                    type="number" 
                    value={(editing.ui && editing.ui.transitionMs) || (data.ui && data.ui.transitionMs) || 300} 
                    onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), transitionMs: Number(e.target.value)}})} 
                    className="px-2 py-2 rounded border border-border bg-background" 
                    disabled={isUploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Preview count, badge color (name), and transition duration (ms)</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleSave} 
                  className="px-4 py-2 bg-accent text-accent-foreground rounded"
                  disabled={isUploading}
                >
                  {isUploading ? "Saving..." : "Save"}
                </button>
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
                  disabled={isUploading}
                >
                  Reset
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Important Note:</h3>
                <p className="text-xs text-blue-700">
                  To save images permanently (not just as temporary data URLs), you need to:
                </p>
                <ol className="text-xs text-blue-700 mt-1 ml-4 list-decimal">
                  <li>Add a server token above</li>
                  <li>Create the API endpoint at <code className="bg-blue-100 px-1">/pages/api/upload.ts</code></li>
                  <li>Install dependencies if needed (formidable)</li>
                </ol>
                <p className="text-xs text-blue-700 mt-2">
                  Without the API, images will only be saved temporarily in your browser.
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

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

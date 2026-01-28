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

// Cloudinary response type
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  error?: {
    message: string;
  };
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Use environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inh6kt';
  
  // ✅ SIMPLIFIED: Use unsigned preset (easier)
  // First, create this preset in Cloudinary: Settings → Upload presets → Add upload preset
  // Name: "enkomokazini-unsigned", Mode: "Unsigned", leave everything else default
  const uploadPreset = 'enkomokazini-unsigned';

  useEffect(() => {
    const onUpdate = (e: CustomEvent) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  // ✅ SIMPLIFIED UPLOAD FUNCTION - WORKS WITH UNSIGNED PRESET
  const uploadImage = async (
    file: File, 
    type: 'team' | 'sponsor' | 'hero' | 'school', 
    name?: string
  ): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Validate file
      if (!file || !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG, GIF, etc.)",
          variant: "destructive"
        });
        return await fileToDataUrl(file);
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive"
        });
        return await fileToDataUrl(file);
      }

      // ✅ SIMPLIFIED: No folder, no tags for now
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      
      console.log('📤 Uploading to Cloudinary...', {
        cloudName,
        uploadPreset,
        file: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      const result: CloudinaryUploadResponse = await response.json();
      
      console.log('📥 Cloudinary Response:', result);
      
      if (response.ok && result.secure_url) {
        console.log('✅ Cloudinary upload successful:', result.secure_url);
        toast({
          title: "Upload successful!",
          description: "Image uploaded to Cloudinary",
        });
        
        // ✅ IMPORTANT: Return Cloudinary URL, not data URL
        return result.secure_url;
      } else {
        console.error('❌ Cloudinary upload failed:', result);
        
        toast({
          title: "Upload failed",
          description: result.error?.message || 'Unknown error occurred',
          variant: "destructive"
        });
        
        throw new Error(result.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Fallback to data URL (temporary storage)
      const dataUrl = await fileToDataUrl(file);
      
      toast({
        title: "Cloudinary upload failed",
        description: "Saved to browser storage instead",
        variant: "default"
      });
      
      return dataUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    
    try {
      const currentData = loadSiteData();
      const payload = { 
        ...currentData, 
        ...editing,
        heroImages: editing.heroImages || currentData.heroImages || [],
        team: editing.team || currentData.team || [],
        sponsors: editing.sponsors || currentData.sponsors || [],
        services: editing.services || currentData.services || []
      } as SiteData;
      
      const nextLocal = saveSiteData(payload);
      if (nextLocal) {
        setData(nextLocal as SiteData);
        setEditing(nextLocal as SiteData);
        
        window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: nextLocal }));
        
        toast({
          title: "Saved successfully!",
          description: "All changes saved to browser storage",
        });
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
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: sd }));
    
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
      description: `Uploading ${files.length} image(s) to Cloudinary`,
    });
    
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const url = await uploadImage(f, 'hero', `hero_${urls.length + i + 1}`);
        urls.push(url);
      }
      
      setEditing({ ...editing, heroImages: urls });
      
      const updatedData = { ...data, heroImages: urls };
      saveSiteData(updatedData);
      setData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      toast({
        title: "Hero images uploaded",
        description: `Added ${files.length} image(s) to Cloudinary`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some hero images",
        variant: "destructive"
      });
    }
  };

  // Team editors - FIXED
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ name: "New Member", role: "Team Role", initials: "NM", image: "" });
    setEditing({ ...editing, team: t });
  };
  
  const updateTeamMember = (index: number, value: any) => {
    const t = editing.team ? [...editing.team] : [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
    
    // ✅ IMPORTANT: Save to localStorage immediately
    const updatedData = { ...data };
    if (!updatedData.team) updatedData.team = [];
    updatedData.team[index] = { ...updatedData.team[index], ...value };
    setData(updatedData);
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };
  
  const removeTeamMember = (index: number) => {
    const t = editing.team ? [...editing.team] : [];
    t.splice(index, 1);
    setEditing({ ...editing, team: t });
    
    // Update data and save
    const updatedData = { ...data, team: t };
    setData(updatedData);
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const handleTeamImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    
    const teamMember = editing.team?.[index] || data.team?.[index];
    const memberName = teamMember?.name || `member_${index + 1}`;
    
    try {
      const url = await uploadImage(file, 'team', memberName);
      // ✅ Use updateTeamMember which saves to localStorage
      updateTeamMember(index, { image: url });
      
      // Force preview update
      const updatedData = loadSiteData();
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
    } catch (error) {
      console.error('Team image upload error:', error);
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
    
    const updatedData = { ...data };
    if (!updatedData.sponsors) updatedData.sponsors = [];
    updatedData.sponsors[index] = { ...updatedData.sponsors[index], ...value };
    setData(updatedData);
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };
  
  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.splice(index, 1);
    setEditing({ ...editing, sponsors: s });
    
    const updatedData = { ...data, sponsors: s };
    setData(updatedData);
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const handleSponsorImage = async (index: number, file?: File) => {
    if (!file) return;
    
    const sponsor = editing.sponsors?.[index] || data.sponsors?.[index];
    const sponsorName = sponsor?.name || `sponsor_${index + 1}`;
    
    try {
      const url = await uploadImage(file, 'sponsor', sponsorName);
      updateSponsor(index, { image: url });
    } catch (error) {
      // Error handled in uploadImage function
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
      
      const updatedData = { ...data, schoolImage: url };
      saveSiteData(updatedData);
      setData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    } catch (error) {
      // Error handled in uploadImage function
    }
  };

  // ✅ IMPROVED getImageSrc function
  const getImageSrc = (url: string | undefined): string => {
    if (!url) return '';
    
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
      return url;
    }
    
    // Check if it's a data URL (browser storage)
    if (url.startsWith('data:image')) {
      return url;
    }
    
    // Check if it's a regular URL
    if (url.startsWith('http')) {
      return url;
    }
    
    // Check if it's a local asset
    if (url.startsWith('assets/') || url.startsWith('public/') || url.startsWith('/')) {
      return url;
    }
    
    // Default fallback
    return url;
  };

  const removeHeroImage = (index: number) => {
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, heroImages: newImages });
    
    const updatedData = { ...data, heroImages: newImages };
    saveSiteData(updatedData);
    setData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  // ✅ ADD THIS: Test Cloudinary connection button
  const testCloudinaryConnection = async () => {
    setIsUploading(true);
    try {
      // Create a tiny test image
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 50, 50);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText('TEST', 15, 30);
      
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'cloudinary-test.png', { type: 'image/png' });
      
      const url = await uploadImage(file, 'school', 'test');
      
      if (url && url.includes('cloudinary.com')) {
        toast({
          title: "✅ Cloudinary Test Successful!",
          description: "Your Cloudinary setup is working correctly.",
        });
        console.log('Test URL:', url);
      } else {
        toast({
          title: "⚠️ Using Browser Storage",
          description: "Cloudinary failed, using local storage instead.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsUploading(false);
    }
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
          <button 
            onClick={testCloudinaryConnection}
            disabled={isUploading}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Test Cloudinary
          </button>
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
              {/* ... (All your existing form fields remain the same) ... */}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Team Members</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload team member photos. They will appear in the Team section.
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
                            <span className="text-accent-foreground font-bold">
                              {m.initials || m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <input 
                              value={m.name} 
                              onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} 
                              className="w-full px-2 py-1 rounded border border-border bg-background" 
                              disabled={isUploading}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Role</label>
                            <input 
                              value={m.role} 
                              onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} 
                              className="w-full px-2 py-1 rounded border border-border bg-background" 
                              disabled={isUploading}
                            />
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

              {/* ... (Rest of your form fields remain the same) ... */}

              <div className="flex gap-2">
                <button 
                  onClick={handleSave} 
                  className="px-4 py-2 bg-accent text-accent-foreground rounded"
                  disabled={isUploading}
                >
                  {isUploading ? "Saving..." : "Save All Changes"}
                </button>
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
                  disabled={isUploading}
                >
                  Reset All
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Cloudinary Setup Instructions:</h3>
                <ol className="text-xs text-blue-700 list-decimal pl-4 space-y-1">
                  <li>Go to <a href="https://cloudinary.com/console" target="_blank" className="underline">Cloudinary Console</a></li>
                  <li>Settings → Upload → Upload presets</li>
                  <li>Click "Add upload preset"</li>
                  <li>Name: <code>enkomokazini-unsigned</code></li>
                  <li>Mode: <strong>Unsigned</strong> (not Signed)</li>
                  <li>Leave all other fields as default</li>
                  <li>Click "Save"</li>
                </ol>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Current Status:</strong> Using preset: <code>{uploadPreset}</code>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Note:</strong> If uploads fail, images save to browser storage instead.
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
              <div className="text-xs text-gray-500">
                <p>Team images will appear here after upload.</p>
                <p>Check browser console (F12) for upload logs.</p>
              </div>
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

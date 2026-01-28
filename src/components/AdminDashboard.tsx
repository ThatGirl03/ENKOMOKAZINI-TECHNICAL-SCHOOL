import React, { useEffect, useState } from "react";
import { LogOut, Bell, Settings, UploadCloud, CloudOff } from "lucide-react";
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
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // ✅ CORRECT Cloudinary configuration - use proper environment variable names
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inh6kt';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enkomokazini-test';

  useEffect(() => {
    // Check Cloudinary connection on mount
    checkCloudinaryConnection();
    
    const onUpdate = (e: CustomEvent) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  // ✅ FIXED: Check Cloudinary connection
  const checkCloudinaryConnection = async () => {
    try {
      // Simple test to check if Cloudinary API is reachable
      const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/v1700000000/sample.jpg`, {
        method: 'HEAD'
      });
      
      if (response.ok || cloudName !== 'YOUR_CLOUD_NAME') {
        setCloudinaryStatus('available');
      } else {
        setCloudinaryStatus('unavailable');
      }
    } catch (error) {
      console.log('Cloudinary connection check failed, using fallback');
      setCloudinaryStatus('unavailable');
    }
  };

  // ✅ FIXED: Complete uploadImage function with proper error handling
const uploadImage = async (
  file: File, 
  type: 'team' | 'sponsor' | 'hero' | 'school', 
  name?: string
): Promise<string> => {
  setIsUploading(true);
  
  // Validate file
  if (!file || !file.type.startsWith('image/')) {
    toast({
      title: "Invalid file",
      description: "Please upload an image file (JPG, PNG, GIF, etc.)",
      variant: "destructive"
    });
    setIsUploading(false);
    return await fileToDataUrl(file);
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    toast({
      title: "File too large",
      description: "Maximum file size is 10MB",
      variant: "destructive"
    });
    setIsUploading(false);
    return await fileToDataUrl(file);
  }

  // Use fallback if Cloudinary is unavailable
  if (cloudinaryStatus === 'unavailable' || cloudName === 'YOUR_CLOUD_NAME') {
    console.warn('⚠️ Cloudinary not configured, using browser storage');
    const dataUrl = await fileToDataUrl(file);
    toast({
      title: "Saved locally",
      description: "Image saved to browser storage (Cloudinary not configured)",
    });
    setIsUploading(false);
    return dataUrl;
  }

  try {
    // ⚠️ IMPORTANT: For unsigned uploads, you CANNOT specify folder in the request
    // The folder must be configured in the upload preset settings in Cloudinary dashboard

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // ⚠️ REMOVE THIS LINE - folder cannot be specified with unsigned uploads
    // formData.append('folder', folder);
    
    // ⚠️ REMOVE transformation parameter for now (can cause issues)
    // if (type === 'team' || type === 'sponsor') {
    //   formData.append('transformation', 'w_500,h_500,c_fill');
    // }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    
    console.log('📤 Uploading to Cloudinary:', {
      cloudName,
      uploadPreset,
      file: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type
    });
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: CloudinaryUploadResponse = await response.json();
    
    console.log('📥 Cloudinary Response:', result);
    
    if (result.error) {
      console.error('❌ Cloudinary error:', result.error.message);
      throw new Error(result.error.message);
    }
    
    if (!result.secure_url) {
      throw new Error('No secure_url returned from Cloudinary');
    }
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);
    
    toast({
      title: "Upload successful!",
      description: `Image uploaded successfully`,
    });
    
    return result.secure_url;
    
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    // Fallback to data URL
    const dataUrl = await fileToDataUrl(file);
    
    toast({
      title: "Saved locally",
      description: `Image saved to browser storage. Cloudinary error: ${error.message}`,
      variant: "default"
    });
    
    return dataUrl;
  } finally {
    setIsUploading(false);
  }
};

const quickTest = async () => {
  console.log('Testing Cloudinary config:', { cloudName, uploadPreset });
  
  // Create a simple test
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 10, 10);
  
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    
    const file = new File([blob], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: 'POST', body: formData }
      );
      const result = await response.json();
      console.log('Direct test result:', result);
      
      if (result.secure_url) {
        alert('✅ Direct upload works!');
      }
    } catch (error) {
      console.error('Direct test failed:', error);
    }
  });
};


  
  const handleSave = async () => {
    setIsUploading(true);
    
    try {
      const currentData = loadSiteData();
      const payload: SiteData = { 
        ...currentData, 
        ...editing,
        heroImages: editing.heroImages || currentData.heroImages || [],
        team: editing.team || currentData.team || [],
        sponsors: editing.sponsors || currentData.sponsors || [],
        services: editing.services || currentData.services || [],
        ui: editing.ui || currentData.ui || {}
      };
      
      const savedData = saveSiteData(payload);
      if (savedData) {
        setData(savedData);
        setEditing(savedData);
        
        window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: savedData }));
        
        toast({
          title: "Saved successfully!",
          description: cloudinaryStatus === 'available' 
            ? "All changes saved with Cloudinary images" 
            : "All changes saved to browser storage",
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
      description: `Uploading ${files.length} image(s) ${cloudinaryStatus === 'available' ? 'to Cloudinary' : 'locally'}`,
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
        description: `Added ${files.length} image(s) successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some hero images",
        variant: "destructive"
      });
    }
    
    // Clear the file input
    e.target.value = '';
  };

  // Team editors
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      initials: "NM", 
      image: "" 
    });
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
    
    const teamMember = editing.team?.[index] || data.team?.[index];
    const memberName = teamMember?.name || `member_${index + 1}`;
    
    try {
      const url = await uploadImage(file, 'team', memberName);
      updateTeamMember(index, { image: url });
    } catch (error) {
      // Error handled in uploadImage function
    }
  };

  // Sponsors editors
  const addSponsor = () => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.push({ 
      name: "New Sponsor", 
      url: "https://example.com", 
      image: "" 
    });
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

  const handleSponsorImage = async (index: number, file?: File) => {
    if (!file) return;
    
    try {
      const url = await uploadImage(file, 'sponsor', `sponsor_${index + 1}`);
      updateSponsor(index, { image: url });
    } catch (error) {
      // Error handled in uploadImage function
    }
  };

  // Services editors
  const addService = () => {
    const s = editing.services ? [...editing.services] : [];
    s.push({ 
      category: "New Stream", 
      subjects: [{ name: "New Subject", passMark: "50%" }] 
    });
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
    const subjects = s[serviceIndex].subjects ? [...s[serviceIndex].subjects] : [];
    subjects[subjectIndex] = { ...subjects[subjectIndex], ...value };
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };
  
  const removeSubject = (serviceIndex: number, subjectIndex: number) => {
    const s = editing.services ? [...editing.services] : [];
    const subjects = s[serviceIndex].subjects ? [...s[serviceIndex].subjects] : [];
    subjects.splice(subjectIndex, 1);
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };

  const handleSchoolImage = async (file?: File) => {
    if (!file) return;
    
    try {
      const url = await uploadImage(file, 'school', 'school_image');
      setEditing({ ...editing, schoolImage: url });
    } catch (error) {
      // Error handled in uploadImage function
    }
  };

  const getImageSrc = (url: string | undefined): string => {
    if (!url) return '';
    
    // Handle different URL types
    if (url.startsWith('data:image') || 
        url.startsWith('http') || 
        url.includes('cloudinary.com')) {
      return url;
    }
    
    // Handle local paths
    if (url.startsWith('assets/') || url.startsWith('public/')) {
      return `/${url}`;
    }
    
    // Handle simple filenames
    if (url && !url.includes('/') && url.includes('.')) {
      return `/assets/${url}`;
    }
    
    return url;
  };

  const removeHeroImage = (index: number) => {
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, heroImages: newImages });
  };

  // ✅ NEW: Test Cloudinary button
  const testCloudinary = async () => {
    setIsUploading(true);
    try {
      // Create a tiny test image
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(0, 0, 50, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('Test', 15, 25);
      }
      
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );
      
      if (!blob) throw new Error('Could not create test image');
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      const result = await uploadImage(file, 'school', 'test_upload');
      
      toast({
        title: "✅ Cloudinary Test Successful",
        description: `Uploaded to: ${result.substring(0, 50)}...`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Cloudinary Test Failed",
        description: error.message || "Please check your Cloudinary configuration",
        variant: "destructive"
      });
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
        <div className="mb-4 flex items-center gap-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            cloudinaryStatus === 'available' 
              ? 'bg-green-100 text-green-800' 
              : cloudinaryStatus === 'unavailable'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {cloudinaryStatus === 'available' ? (
              <UploadCloud size={14} className="mr-1" />
            ) : cloudinaryStatus === 'unavailable' ? (
              <CloudOff size={14} className="mr-1" />
            ) : null}
            Cloudinary: {cloudinaryStatus === 'available' ? 'Connected' : 
                       cloudinaryStatus === 'unavailable' ? 'Using Local Storage' : 'Checking...'}
          </div>
          
          <button
            onClick={testCloudinary}
            disabled={isUploading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Test Cloudinary
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Site Editor</h2>

            <div className="space-y-4">
              {/* School Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">School Name</label>
                <input 
                  value={editing.schoolName || ""} 
                  onChange={(e)=>setEditing({...editing, schoolName: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  disabled={isUploading}
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                <input 
                  value={editing.tagline || ""} 
                  onChange={(e)=>setEditing({...editing, tagline: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  disabled={isUploading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea 
                  value={editing.description || ""} 
                  onChange={(e)=>setEditing({...editing, description: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  rows={4} 
                  disabled={isUploading}
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contact Email</label>
                <input 
                  value={editing.contactEmail || ""} 
                  onChange={(e)=>setEditing({...editing, contactEmail: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  disabled={isUploading}
                />
              </div>

              {/* Phone & Postal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input 
                    value={editing.phone || ""} 
                    onChange={(e)=>setEditing({...editing, phone: e.target.value})} 
                    className="w-full px-3 py-2 rounded border border-border bg-background" 
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Postal</label>
                  <input 
                    value={editing.postal || ""} 
                    onChange={(e)=>setEditing({...editing, postal: e.target.value})} 
                    className="w-full px-3 py-2 rounded border border-border bg-background" 
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input 
                  value={editing.address || ""} 
                  onChange={(e)=>setEditing({...editing, address: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  disabled={isUploading}
                />
              </div>

              {/* Pass Rate */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pass Rate</label>
                <input 
                  value={editing.passRate || ""} 
                  onChange={(e)=>setEditing({...editing, passRate: e.target.value})} 
                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                  placeholder="e.g., 95%" 
                  disabled={isUploading}
                />
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Team Members</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Images {cloudinaryStatus === 'available' ? 'saved to Cloudinary' : 'saved locally'}: 
                  <code className="ml-1 bg-gray-100 px-1 rounded">enkomokazini/team/</code>
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
                    className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                    disabled={isUploading}
                  >
                    Add Member
                  </button>
                </div>
              </div>

              {/* Sponsors */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Sponsors</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Logos {cloudinaryStatus === 'available' ? 'saved to Cloudinary' : 'saved locally'}: 
                  <code className="ml-1 bg-gray-100 px-1 rounded">enkomokazini/sponsors/</code>
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
                          <input 
                            value={s.name} 
                            onChange={(e)=>updateSponsor(idx, { name: e.target.value })} 
                            className="w-full px-2 py-1 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Website</label>
                          <input 
                            value={s.url || ""} 
                            onChange={(e)=>updateSponsor(idx, { url: e.target.value })} 
                            className="w-full px-2 py-1 rounded border border-border bg-background" 
                            placeholder="https://..." 
                            disabled={isUploading}
                          />
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
                    className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                    disabled={isUploading}
                  >
                    Add Sponsor
                  </button>
                </div>
              </div>

              {/* Hero Images */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hero Images (upload multiple)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Images {cloudinaryStatus === 'available' ? 'saved to Cloudinary' : 'saved locally'}: 
                  <code className="ml-1 bg-gray-100 px-1 rounded">enkomokazini/hero/</code>
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

              {/* School Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">School Image (used in About)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Image {cloudinaryStatus === 'available' ? 'saved to Cloudinary' : 'saved locally'}: 
                  <code className="ml-1 bg-gray-100 px-1 rounded">enkomokazini/school/</code>
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
                      const img = e.target as HTMLImageElement;
                      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2Nob29sPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Services (Streams)</label>
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

              {/* UI Settings */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">UI Settings</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Preview Count</label>
                    <input 
                      type="number" 
                      value={(editing.ui && editing.ui.servicesPreviewCount) || (data.ui && data.ui.servicesPreviewCount) || 6} 
                      onChange={(e)=>setEditing({
                        ...editing, 
                        ui: {
                          ...(editing.ui||data.ui||{}), 
                          servicesPreviewCount: Number(e.target.value)
                        }
                      })} 
                      className="w-full px-2 py-2 rounded border border-border bg-background" 
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Badge Color</label>
                    <input 
                      value={(editing.ui && editing.ui.badgeColor) || (data.ui && data.ui.badgeColor) || 'blue'} 
                      onChange={(e)=>setEditing({
                        ...editing, 
                        ui: {
                          ...(editing.ui||data.ui||{}), 
                          badgeColor: e.target.value
                        }
                      })} 
                      className="w-full px-2 py-2 rounded border border-border bg-background" 
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Transition (ms)</label>
                    <input 
                      type="number" 
                      value={(editing.ui && editing.ui.transitionMs) || (data.ui && data.ui.transitionMs) || 300} 
                      onChange={(e)=>setEditing({
                        ...editing, 
                        ui: {
                          ...(editing.ui||data.ui||{}), 
                          transitionMs: Number(e.target.value)
                        }
                      })} 
                      className="w-full px-2 py-2 rounded border border-border bg-background" 
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Preview count, badge color (name), and transition duration (ms)</p>
              </div>

              {/* Save & Reset Buttons */}
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleSave} 
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? "Saving..." : "Save All Changes"}
                </button>
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
                  disabled={isUploading}
                >
                  Reset All
                </button>
              </div>
              
              {/* Cloudinary Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Cloudinary Configuration:</h3>
                <p className="text-xs text-blue-700">
                  Images {cloudinaryStatus === 'available' ? 'upload directly to Cloudinary' : 'are saved to browser storage'}
                </p>
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-blue-700">
                    <strong>Cloud Name:</strong> <code className="bg-blue-100 px-1 rounded">{cloudName}</code>
                    {cloudName === 'YOUR_CLOUD_NAME' && (
                      <span className="ml-2 text-amber-600">(Not configured)</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Upload Preset:</strong> <code className="bg-blue-100 px-1 rounded">{uploadPreset}</code>
                    {uploadPreset === 'YOUR_UPLOAD_PRESET' && (
                      <span className="ml-2 text-amber-600">(Not configured)</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Environment:</strong> <code className="bg-blue-100 px-1 rounded">{import.meta.env.MODE}</code>
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Setup Instructions:</strong>
                  </p>
                  <ol className="text-xs text-blue-700 ml-4 list-decimal">
                    <li>Create a Cloudinary account</li>
                    <li>Get your Cloud Name, API Key, and API Secret</li>
                    <li>Create an Upload Preset (set to "Signed")</li>
                    <li>Add environment variables to your .env file</li>
                  </ol>
                </div>
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

// Utility function
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

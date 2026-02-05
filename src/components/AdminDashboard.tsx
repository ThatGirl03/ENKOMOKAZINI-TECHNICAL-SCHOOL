import React, { useEffect, useState } from "react";
import { LogOut, Bell, Settings, UploadCloud, CloudOff, RefreshCw } from "lucide-react";
import { loadSiteData, saveSiteData, resetSiteData, SiteData } from "@/lib/siteData";
import { useToast } from "@/hooks/use-toast";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AboutSection } from "@/components/AboutSection";
import { TeamSection } from "@/components/TeamSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";

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

interface TeamMember {
  name: string;
  role: string;
  image: string;
  initials?: string;
  secondaryImage?: string;
}

interface Sponsor {
  name: string;
  url: string;
  image: string;
}

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

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // ✅ USING YOUR PRESET EVERYWHERE: enkomokazini-test
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inhi6kt';
  const uploadPreset = 'enkomokazini-test'; // Using your preset directly everywhere

  useEffect(() => {
    console.log('🔧 Cloudinary Config:', {
      cloudName,
      uploadPreset,
      hasCloudName: !!cloudName,
      mode: import.meta.env.MODE
    });
    
    // Test Cloudinary connection on load
    testCloudinaryConnection();
    
    const onUpdate = (e: CustomEvent) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  // ✅ SIMPLE CLOUDINARY CONNECTION TEST
  const testCloudinaryConnection = async () => {
    try {
      console.log('🔍 Testing Cloudinary connection with preset:', uploadPreset);
      
      // Create a tiny test image
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(0, 0, 2, 2);
      }
      
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );
      
      if (!blob) throw new Error('Could not create test image');
      
      const formData = new FormData();
      formData.append('file', blob, 'test.png');
      formData.append('upload_preset', uploadPreset); // Using your preset
      formData.append('tags', 'enkomokazini_connection_test');
      
      console.log('Testing with preset:', uploadPreset);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok && result.secure_url) {
        console.log('✅ Cloudinary connected! URL:', result.secure_url);
        setCloudinaryStatus('connected');
        
        toast({
          title: "Cloudinary Connected",
          description: `Using preset: ${uploadPreset}`,
        });
      } else {
        console.error('❌ Cloudinary test failed:', result);
        setCloudinaryStatus('disconnected');
        
        let errorMessage = result.error?.message || 'Connection failed';
        if (errorMessage.includes('unsigned')) {
          errorMessage = `Preset "${uploadPreset}" is in unsigned mode or doesn't exist.`;
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = `Invalid preset "${uploadPreset}". Check Cloudinary settings.`;
        }
        
        toast({
          title: "Cloudinary Disconnected",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('❌ Cloudinary connection error:', error);
      setCloudinaryStatus('disconnected');
      
      toast({
        title: "Cloudinary Error",
        description: error.message || "Cannot connect to Cloudinary",
        variant: "destructive"
      });
    }
  };

  // ✅ UNIFIED UPLOAD FUNCTION USING YOUR PRESET
  const uploadImage = async (
    file: File, 
    category: 'team' | 'sponsor' | 'hero' | 'school' | 'gallery', 
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
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive"
        });
        return await fileToDataUrl(file);
      }

      // If Cloudinary is disconnected, use local storage
      if (cloudinaryStatus === 'disconnected') {
        console.warn('Cloudinary disconnected, using local storage');
        const dataUrl = await fileToDataUrl(file);
        
        toast({
          title: "Saved locally",
          description: "Image saved to browser storage",
        });
        
        return dataUrl;
      }

      // Define folder structure
      const folder = `enkomokazini/${category}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset); // Using your preset
      formData.append('folder', folder);
      
      console.log('📤 Uploading to Cloudinary:', {
        cloudName,
        uploadPreset,
        file: file.name,
        folder,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result: CloudinaryUploadResponse = await response.json();
      
      console.log('📥 Cloudinary Response:', result);
      
      if (response.ok && result.secure_url) {
        console.log('✅ Upload successful:', result.secure_url);
        
        toast({
          title: "Upload successful!",
          description: `Image uploaded to ${folder} using ${uploadPreset}`,
        });
        
        return result.secure_url;
      } else {
        console.error('❌ Upload failed:', result);
        
        let errorMessage = result.error?.message || 'Upload failed';
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Fallback to data URL
        return await fileToDataUrl(file);
      }
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      
      // Fallback to data URL
      const dataUrl = await fileToDataUrl(file);
      
      toast({
        title: "Saved locally",
        description: "Image saved to browser storage",
      });
      
      return dataUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ QUICK TEST FUNCTION
  const quickTest = async () => {
    console.log('🧪 Quick Cloudinary test with preset:', uploadPreset);
    
    setIsUploading(true);
    
    try {
      // Create a test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 100, 100);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(0.5, '#10B981');
        gradient.addColorStop(1, '#F59E0B');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 100, 100);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST', 50, 50);
        ctx.font = '10px Arial';
        ctx.fillText(uploadPreset, 50, 70);
      }
      
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );
      
      if (!blob) throw new Error('Could not create test image');
      
      const file = new File([blob], `test-${Date.now()}.png`, { type: 'image/png' });
      
      toast({
        title: "Testing Cloudinary...",
        description: `Using preset: ${uploadPreset}`,
      });
      
      const imageUrl = await uploadImage(file, 'school', 'test_image');
      
      // Verify the URL
      const img = new Image();
      img.onload = () => {
        toast({
          title: "✅ Test Successful",
          description: `Preset "${uploadPreset}" is working!`,
        });
        console.log('Test image URL:', imageUrl);
        
        // Open in new tab to verify
        window.open(imageUrl, '_blank');
      };
      
      img.onerror = () => {
        throw new Error('Uploaded image not accessible');
      };
      
      img.src = imageUrl;
      
    } catch (error: any) {
      console.error('Test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.message || "Cannot connect to Cloudinary",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    
    try {
      const currentData = loadSiteData();
      const payload: SiteData = { 
        ...currentData, 
        ...editing,
        heroImages: editing.heroImages || currentData.heroImages || [],
        team: (editing.team || currentData.team || []).map(member => ({
          ...member,
          image: member.image || ''
        })),
        sponsors: (editing.sponsors || currentData.sponsors || []).map(sponsor => ({
          ...sponsor,
          image: sponsor.image || ''
        })),
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
          description: cloudinaryStatus === 'connected' 
            ? `All changes saved with Cloudinary (${uploadPreset})` 
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

  // ✅ HERO IMAGES UPLOAD
  const handleHeroImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    toast({
      title: "Uploading hero images...",
      description: `Uploading ${files.length} image(s) using ${uploadPreset}`,
    });
    
    try {
      const currentImages = editing.heroImages || data.heroImages || [];
      const updatedImages = [...currentImages];
      
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], 'hero', `hero_${updatedImages.length + i + 1}`);
        updatedImages.push(url);
      }
      
      setEditing({ ...editing, heroImages: updatedImages });
      
      const updatedData = { ...data, heroImages: updatedImages };
      saveSiteData(updatedData);
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
    
    e.target.value = '';
  };

  // ✅ TEAM MEMBER HANDLERS
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      image: "",
      secondaryImage: ""
    });
    setEditing({ ...editing, team: t });
  };
  
  const updateTeamMember = (index: number, value: Partial<TeamMember>) => {
    const t = editing.team ? [...editing.team] : [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
    
    const updatedData = { ...data };
    if (!updatedData.team) updatedData.team = [];
    updatedData.team[index] = { ...updatedData.team[index], ...value };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
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
      // Error already handled in uploadImage
    }
  };

  // ✅ SPONSOR HANDLERS
  const addSponsor = () => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.push({ 
      name: "New Sponsor", 
      url: "https://example.com", 
      image: "" 
    });
    setEditing({ ...editing, sponsors: s });
  };
  
  const updateSponsor = (index: number, value: Partial<Sponsor>) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, sponsors: s });
    
    const updatedData = { ...data };
    if (!updatedData.sponsors) updatedData.sponsors = [];
    updatedData.sponsors[index] = { ...updatedData.sponsors[index], ...value };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
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
    } catch (error) {
      // Error already handled in uploadImage
    }
  };

  // ✅ SERVICES HANDLERS
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
      
      const updatedData = { ...data, schoolImage: url };
      saveSiteData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    } catch (error) {
      // Error already handled in uploadImage
    }
  };

  // ✅ GALLERY IMAGES UPLOAD
  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    toast({
      title: "Uploading gallery images...",
      description: `Uploading ${files.length} image(s) using ${uploadPreset}`,
    });
    
    try {
      const currentGallery = editing.galleryImages || data.galleryImages || [];
      const updatedGallery = [...currentGallery];
      
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], 'gallery', `gallery_${updatedGallery.length + i + 1}`);
        updatedGallery.push({ src: url, title: `Gallery Image ${updatedGallery.length + i + 1}` });
      }
      
      setEditing({ ...editing, galleryImages: updatedGallery });
      
      const updatedData = { ...data, galleryImages: updatedGallery };
      saveSiteData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      toast({
        title: "Gallery images uploaded",
        description: `Added ${files.length} image(s) successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some gallery images",
        variant: "destructive"
      });
    }
    
    e.target.value = '';
  };

  const getImageSrc = (url: string | undefined): string => {
    if (!url) return '';
    
    // already a data URL (base64), return as-is
    if (url.startsWith("data:")) return url;
    // absolute URLs
    if (/^https?:\/\//i.test(url)) return url;
    // already an absolute path on site
    if (url.startsWith('/')) return url;
    // relative paths that explicitly point to assets
    if (url.startsWith('./') || url.startsWith('../')) return url;
    // if it already begins with 'assets/', prefix a leading slash
    if (url.startsWith('assets/')) return `/${url}`;
    // otherwise assume it's a filename inside /assets/
    return `/assets/${url}`;
  };

  const removeHeroImage = (index: number) => {
    const currentImages = editing.heroImages || data.heroImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, heroImages: newImages });
    
    const updatedData = { ...data, heroImages: newImages };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const removeGalleryImage = (index: number) => {
    const currentImages = editing.galleryImages || data.galleryImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setEditing({ ...editing, galleryImages: newImages });
    
    const updatedData = { ...data, galleryImages: newImages };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const refreshCloudinaryConnection = async () => {
    setCloudinaryStatus('checking');
    await testCloudinaryConnection();
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
        {/* Cloudinary Status Bar */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-blue-800">Cloudinary Status</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshCloudinaryConnection}
                disabled={isUploading}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw size={14} className={cloudinaryStatus === 'checking' ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={quickTest}
                disabled={isUploading}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 disabled:opacity-50"
              >
                Test Upload
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              cloudinaryStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : cloudinaryStatus === 'disconnected'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {cloudinaryStatus === 'connected' ? (
                <UploadCloud size={16} className="mr-2" />
              ) : cloudinaryStatus === 'disconnected' ? (
                <CloudOff size={16} className="mr-2" />
              ) : (
                <RefreshCw size={16} className="animate-spin mr-2" />
              )}
              Status: {cloudinaryStatus === 'connected' ? 'CONNECTED' : 
                      cloudinaryStatus === 'disconnected' ? 'DISCONNECTED' : 'CHECKING...'}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-blue-700">
                Cloud Name: <code className="ml-1 bg-blue-100 px-2 py-1 rounded text-xs">{cloudName}</code>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Upload Preset: <code className="ml-1 bg-blue-100 px-2 py-1 rounded text-xs">{uploadPreset}</code>
              </p>
            </div>
          </div>
          
          {cloudinaryStatus === 'disconnected' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Setup Required:</h3>
              <div className="text-sm text-amber-700 space-y-2">
                <p>1. In Cloudinary Dashboard:</p>
                <ul className="ml-4 list-disc text-xs">
                  <li>Go to <strong>Settings → Upload</strong></li>
                  <li>Find preset <code>{uploadPreset}</code></li>
                  <li>Ensure it's <strong>enabled</strong></li>
                  <li>Set to <strong>Unsigned</strong> mode</li>
                  <li>Enable "Auto-create folders"</li>
                </ul>
                <p>2. Current configuration:</p>
                <pre className="mt-1 p-2 bg-amber-100 text-amber-800 rounded text-xs overflow-x-auto">
{`Cloud Name: ${cloudName}
Upload Preset: ${uploadPreset}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
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

              {/* Team Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Team Members</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {(editing.team || data.team || []).map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border border-border rounded">
                        <div className="w-12 h-12 rounded-full bg-primary overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                          {((): React.ReactNode => {
                            const resolveImageUrl = (val?: string) => {
                              if (!val) return undefined;
                              // already a data URL (base64), return as-is
                              if (val.startsWith("data:")) return val;
                              // absolute URLs
                              if (/^https?:\/\//i.test(val)) return val;
                              // already an absolute path on site
                              if (val.startsWith('/')) return val;
                              // relative paths that explicitly point to assets
                              if (val.startsWith('./') || val.startsWith('../')) return val;
                              // if it already begins with 'assets/', prefix a leading slash
                              if (val.startsWith('assets/')) return `/${val}`;
                              // otherwise assume it's a filename inside /assets/
                              return `/assets/${val}`;
                            };

                            const primary = resolveImageUrl(m.image) || m.image;
                            const secondary = resolveImageUrl(m.secondaryImage) || m.secondaryImage;

                            if (primary) {
                              return (
                                <>
                                  <img 
                                    src={primary} 
                                    alt={m.name} 
                                    className="w-full h-full object-cover"
                                    style={{
                                      objectFit: (m as any).imageFit || 'cover',
                                      objectPosition: (m as any).imagePosition || 'center',
                                    }}
                                  />
                                  {secondary ? (
                                    <img
                                      src={secondary}
                                      alt={`${m.name} secondary`}
                                      className="w-4 h-4 rounded-full object-cover shadow-sm absolute -right-0 -bottom-0 border border-background"
                                      style={{
                                        position: 'absolute',
                                        right: '0',
                                        bottom: '0',
                                      }}
                                    />
                                  ) : null}
                                </>
                              );
                            }

                            return (
                              <span className="text-accent-foreground font-bold">
                                {m.initials || m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                              </span>
                            );
                          })()}
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

              {/* Sponsors Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Sponsors</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
                <div className="space-y-2">
                  {(editing.sponsors || data.sponsors || []).map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-2 border border-border rounded">
                      <div className="w-16 h-16 rounded border border-border overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {s.image ? (
                          <img 
                            src={s.image}
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

              {/* Hero Images Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Hero Images (upload multiple)</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleHeroImagesUpload} 
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

              {/* Gallery Images Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Gallery Images (upload multiple)</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleGalleryImagesUpload} 
                  className="w-full"
                  disabled={isUploading}
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(editing.galleryImages || data.galleryImages || []).map((image, i)=> (
                    <div key={i} className="relative">
                      <img 
                        src={getImageSrc(image.src)} 
                        alt={`gallery-${i}`} 
                        className="h-20 w-32 object-cover rounded border border-border"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2FsbGVyeSB7aSsxfTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      <button
                        onClick={() => removeGalleryImage(i)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                        disabled={isUploading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(editing.galleryImages || data.galleryImages || []).length} gallery images
                </p>
              </div>

              {/* School Image Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">School Image (used in About)</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
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
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="sticky top-6 bg-card rounded-xl p-4 shadow-card border border-border">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Live Preview
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Auto-updating
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'connected' ? 'Cloudinary' : 'Local Storage'}
                  </span>
                </div>
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
              <GallerySection />
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

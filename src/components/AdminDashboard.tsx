import React, { useEffect, useState } from "react";
import { LogOut, Bell, Settings, UploadCloud, CloudOff, RefreshCw } from "lucide-react";
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

interface TeamMember {
  name: string;
  role: string;
  image: string;
  initials?: string;
}

interface Sponsor {
  name: string;
  url: string;
  image: string;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [uploadHistory, setUploadHistory] = useState<Array<{url: string, time: Date, category: string}>>([]);

  // ✅ USING YOUR PRESET: enkomokazini-test
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inhi6kt';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enkomokazini-test';

  useEffect(() => {
    console.log('🔧 Cloudinary Config:', {
      cloudName,
      uploadPreset,
      hasCloudName: !!cloudName,
      hasUploadPreset: !!uploadPreset,
      mode: import.meta.env.MODE,
      envVars: {
        CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      }
    });
    
    checkCloudinaryConnection();
    
    const onUpdate = (e: CustomEvent) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  // ✅ ENHANCED: Cloudinary connection check
  const checkCloudinaryConnection = async () => {
    try {
      if (!cloudName) {
        console.warn('⚠️ Cloudinary cloud name not set');
        toast({
          title: "Cloudinary Configuration Missing",
          description: "Please set VITE_CLOUDINARY_CLOUD_NAME in your .env file",
          variant: "destructive"
        });
        setCloudinaryStatus('unavailable');
        return;
      }
      
      if (!uploadPreset) {
        console.warn('⚠️ Cloudinary upload preset not set');
        toast({
          title: "Upload Preset Missing",
          description: "Please set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file",
          variant: "destructive"
        });
        setCloudinaryStatus('unavailable');
        return;
      }
      
      console.log('🔍 Testing Cloudinary connection...');
      
      // Test 1: Check if cloud exists
      const testResponse = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/v1700000000/sample.jpg`, {
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (testResponse.ok || testResponse.status === 404) {
        console.log('✅ Cloudinary cloud accessible');
        
        // Test 2: Test upload preset with a tiny image
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
        formData.append('upload_preset', uploadPreset);
        formData.append('tags', 'enkomokazini_test_connection');
        
        console.log('Testing upload preset:', uploadPreset);
        
        const testUpload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (testUpload.ok) {
          const result = await testUpload.json();
          console.log('✅ Upload preset working:', result.secure_url);
          setCloudinaryStatus('available');
          
          toast({
            title: "Cloudinary Connected",
            description: `Using preset: ${uploadPreset}`,
          });
        } else {
          const errorText = await testUpload.text();
          console.error('❌ Upload preset test failed:', testUpload.status, errorText);
          
          let errorMessage = `Upload preset "${uploadPreset}" failed`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorMessage;
          } catch {}
          
          throw new Error(errorMessage);
        }
      } else {
        throw new Error(`Cloud check failed: ${testResponse.status}`);
      }
      
    } catch (error: any) {
      console.error('❌ Cloudinary connection check failed:', error);
      setCloudinaryStatus('unavailable');
      
      toast({
        title: "Cloudinary Unavailable",
        description: error.message || "Using local storage for images",
        variant: "destructive"
      });
    }
  };

  // ✅ CONSISTENT & RELIABLE: Unified file upload handler
  const uploadFile = async (
    file: File,
    category: 'team' | 'sponsor' | 'hero' | 'school',
    fileName?: string
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
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      setIsUploading(false);
      return await fileToDataUrl(file);
    }

    // Use fallback if Cloudinary is unavailable
    if (cloudinaryStatus === 'unavailable') {
      console.warn('⚠️ Cloudinary not available, using browser storage');
      const dataUrl = await fileToDataUrl(file);
      toast({
        title: "Saved locally",
        description: "Image saved to browser storage",
      });
      setIsUploading(false);
      return dataUrl;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      // Add folder organization based on category
      formData.append('folder', `enkomokazini/${category}`);
      formData.append('tags', `enkomokazini,${category}`);
      
      // Add public ID for easier reference
      const publicId = `${category}_${Date.now()}_${fileName || file.name.replace(/\.[^/.]+$/, "")}`;
      formData.append('public_id', publicId);
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      
      console.log('📤 Uploading to Cloudinary:', {
        cloudName,
        uploadPreset,
        file: file.name,
        category,
        fileName,
        publicId,
        uploadUrl
      });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          
          // Handle specific Cloudinary errors
          if (errorJson.error && errorJson.error.message.includes('Upload preset')) {
            errorMessage = `Upload preset "${uploadPreset}" not found or misconfigured`;
          }
        } catch {}
        
        toast({
          title: "Cloudinary Upload Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Fallback to data URL
        const dataUrl = await fileToDataUrl(file);
        return dataUrl;
      }
      
      const result: CloudinaryUploadResponse = await response.json();
      
      if (result.error) {
        console.error('❌ Cloudinary error:', result.error.message);
        throw new Error(result.error.message);
      }
      
      if (!result.secure_url) {
        throw new Error('No secure_url returned from Cloudinary');
      }
      
      console.log('✅ Cloudinary upload successful:', result.secure_url);
      
      // Add to upload history
      setUploadHistory(prev => [{
        url: result.secure_url,
        time: new Date(),
        category
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "Upload successful!",
        description: `Uploaded to Cloudinary using preset: ${uploadPreset}`,
      });
      
      return result.secure_url;
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      
      // Fallback to data URL
      const dataUrl = await fileToDataUrl(file);
      
      toast({
        title: "Saved locally",
        description: `Image saved to browser storage. ${error.message}`,
        variant: "default"
      });
      
      return dataUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ CONSISTENT: File upload handler for all components
  const handleImageUpload = async (
    type: 'team' | 'sponsor' | 'hero' | 'school',
    file: File,
    index?: number,
    name?: string
  ) => {
    try {
      const imageUrl = await uploadFile(file, type, name);
      
      switch (type) {
        case 'team':
          if (index !== undefined) {
            updateTeamMember(index, { image: imageUrl });
          }
          break;
          
        case 'sponsor':
          if (index !== undefined) {
            updateSponsor(index, { image: imageUrl });
          }
          break;
          
        case 'hero':
          const currentImages = editing.heroImages || data.heroImages || [];
          const updatedImages = [...currentImages, imageUrl];
          setEditing({ ...editing, heroImages: updatedImages });
          
          const updatedData = { ...data, heroImages: updatedImages };
          saveSiteData(updatedData);
          window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
          break;
          
        case 'school':
          setEditing({ ...editing, schoolImage: imageUrl });
          const updatedSchoolData = { ...data, schoolImage: imageUrl };
          saveSiteData(updatedSchoolData);
          window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedSchoolData }));
          break;
      }
      
      toast({
        title: "Image uploaded",
        description: "Image has been successfully saved",
      });
      
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
    }
  };

  // ✅ TEST: Cloudinary upload test
  const quickTest = async () => {
    console.log('🧪 Testing Cloudinary with preset:', uploadPreset);
    
    if (!cloudName || !uploadPreset) {
      toast({
        title: "❌ Configuration missing",
        description: "Please set Cloudinary environment variables",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a colorful test pattern
        const gradient = ctx.createLinearGradient(0, 0, 100, 100);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(0.5, '#10B981');
        gradient.addColorStop(1, '#F59E0B');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 100, 100);
        
        // Add text
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
      
      const imageUrl = await uploadFile(file, 'school', 'test_image');
      
      // Verify the URL is accessible
      const verifyResponse = await fetch(imageUrl, { method: 'HEAD' });
      
      if (verifyResponse.ok) {
        toast({
          title: "✅ Cloudinary Test Successful",
          description: `Preset "${uploadPreset}" is working!`,
        });
        console.log('Test image URL:', imageUrl);
        
        // Open image in new tab for verification
        setTimeout(() => {
          window.open(imageUrl, '_blank');
        }, 500);
      } else {
        throw new Error('Uploaded image not accessible');
      }
      
    } catch (error: any) {
      console.error('Test failed:', error);
      toast({
        title: "❌ Test failed",
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
          description: cloudinaryStatus === 'available' 
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

  // ✅ CONSISTENT: Hero images upload (multiple)
  const handleHeroImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    toast({
      title: "Uploading hero images...",
      description: `Uploading ${files.length} image(s) using ${uploadPreset}`,
    });
    
    try {
      for (let i = 0; i < files.length; i++) {
        await handleImageUpload('hero', files[i]);
      }
      
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

  // Team member handlers
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      image: ""
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

  // Sponsor handlers
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

  // Services handlers
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

  const getImageSrc = (url: string | undefined): string => {
    if (!url) return '';
    
    if (url.startsWith('data:image') || 
        url.startsWith('http') || 
        url.includes('cloudinary.com')) {
      return url;
    }
    
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    
    if (url && !url.includes('/') && url.includes('.')) {
      return `/assets/${url}`;
    }
    
    return url || '';
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

  const refreshCloudinaryConnection = async () => {
    setCloudinaryStatus('checking');
    await checkCloudinaryConnection();
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
        {/* Cloudinary Status Panel */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
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
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                cloudinaryStatus === 'available' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : cloudinaryStatus === 'unavailable'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {cloudinaryStatus === 'available' ? (
                  <UploadCloud size={16} className="mr-2" />
                ) : cloudinaryStatus === 'unavailable' ? (
                  <CloudOff size={16} className="mr-2" />
                ) : (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                )}
                Status: {cloudinaryStatus === 'available' ? 'CONNECTED' : 
                        cloudinaryStatus === 'unavailable' ? 'LOCAL STORAGE' : 'CHECKING...'}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Cloud Name:</span>
                  <code className="bg-white px-2 py-1 rounded text-sm border border-blue-200">
                    {cloudName}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Upload Preset:</span>
                  <code className="bg-white px-2 py-1 rounded text-sm border border-blue-200">
                    {uploadPreset}
                  </code>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Statistics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600">Total Images</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {(
                      (editing.heroImages?.length || 0) + 
                      (editing.team?.filter(m => m.image).length || 0) + 
                      (editing.sponsors?.filter(s => s.image).length || 0) + 
                      (editing.schoolImage ? 1 : 0)
                    )}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600">Recent Uploads</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {uploadHistory.length}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={quickTest}
                  disabled={isUploading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Cloudinary Connection
                </button>
                {cloudinaryStatus === 'unavailable' && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>Note:</strong> Using local storage. Check your .env file and Cloudinary settings.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {cloudinaryStatus === 'unavailable' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Setup Required:</h3>
              <div className="text-sm text-amber-700 space-y-2">
                <p>1. Ensure your <code>.env</code> file has:</p>
                <pre className="mt-1 p-2 bg-amber-100 text-amber-800 rounded text-xs overflow-x-auto">
{`VITE_CLOUDINARY_CLOUD_NAME=dn2inhi6kt
VITE_CLOUDINARY_UPLOAD_PRESET=enkomokazini-test`}
                </pre>
                <p>2. Verify in Cloudinary Dashboard:</p>
                <ul className="ml-4 list-disc text-xs">
                  <li>Go to Settings → Upload</li>
                  <li>Find preset "<code>enkomokazini-test</code>"</li>
                  <li>Ensure it's enabled and "unsigned"</li>
                  <li>Check folder permissions</li>
                </ul>
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
                    cloudinaryStatus === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'available' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
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
                                  const initials = m.name.split(' ').map(n=>n[0]).slice(0,2).join('');
                                  const span = document.createElement('span');
                                  span.className = 'text-accent-foreground font-bold';
                                  span.textContent = initials;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-accent-foreground font-bold">
                              {m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
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
                                await handleImageUpload('team', e.target.files[0], idx, m.name); 
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
                    cloudinaryStatus === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'available' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
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
                              await handleImageUpload('sponsor', e.target.files[0], idx, s.name); 
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
                    cloudinaryStatus === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'available' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
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

              {/* School Image Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">School Image (used in About)</label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cloudinaryStatus === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'available' ? `Cloudinary (${uploadPreset})` : 'Local Storage'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e)=>{ 
                    if(e.target.files && e.target.files[0]) {
                      await handleImageUpload('school', e.target.files[0]); 
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
                    cloudinaryStatus === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cloudinaryStatus === 'available' ? 'Cloudinary' : 'Local Storage'}
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

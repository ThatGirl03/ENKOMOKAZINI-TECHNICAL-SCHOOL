import React, { useEffect, useState } from "react";
import { 
  LogOut, Bell, Settings, UploadCloud, CloudOff, RefreshCw, 
  FolderPlus, FolderMinus, ImagePlus, Calendar, MapPin, Clock, 
  GraduationCap, ExternalLink, Plus, Trash2, Edit, X, FolderOpen, 
  ChevronLeft, ChevronRight, Save
} from "lucide-react";
import { loadSiteData, saveSiteData, resetSiteData, SiteData } from "@/lib/siteData";
import { useToast } from "@/hooks/use-toast";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AboutSection } from "@/components/AboutSection";
import { TeamSection } from "@/components/TeamSection";
import { PortfolioSection } from "@/components/PortfolioSection";
import { GallerySection } from "@/components/GallerySection";
import { ActivitiesSection } from "@/components/ActivitiesSection";
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
  secondaryImage?: string;
}

interface Sponsor {
  name: string;
  url: string;
  image: string;
}

interface PortfolioItem {
  id: string;
  src: string;
  title: string;
  category: string;
  date: string;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category?: string;
  season?: string;
}

interface GalleryImage {
  id: string;
  src: string;
  title: string;
}

interface GalleryFolder {
  name: string;
  images: GalleryImage[];
}

interface GalleryYear {
  year: string;
  folders: GalleryFolder[];
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [selectedGalleryYear, setSelectedGalleryYear] = useState<string>("");
  const [selectedGalleryFolder, setSelectedGalleryFolder] = useState<string>("");
  const [galleryUploadFolder, setGalleryUploadFolder] = useState<string>("");

  // ✅ USING YOUR PRESET EVERYWHERE: enkomokazini-test
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inhi6kt';
  const uploadPreset = 'enkomokazini-test';

  useEffect(() => {
    console.log('🔧 Cloudinary Config:', {
      cloudName,
      uploadPreset,
      hasCloudName: !!cloudName,
      mode: import.meta.env.MODE
    });
    
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
      formData.append('tags', 'enkomokazini_connection_test');
      
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

  // ✅ UNIFIED UPLOAD FUNCTION
  const uploadImage = async (
    file: File, 
    category: 'team' | 'sponsor' | 'hero' | 'school' | 'gallery' | 'portfolio' | 'activities', 
    name?: string,
    folderPath?: string
  ): Promise<string> => {
    setIsUploading(true);
    
    try {
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

      if (cloudinaryStatus === 'disconnected') {
        console.warn('Cloudinary disconnected, using local storage');
        const dataUrl = await fileToDataUrl(file);
        
        toast({
          title: "Saved locally",
          description: "Image saved to browser storage",
        });
        
        return dataUrl;
      }

      const folder = folderPath ? `enkomokazini/${folderPath}` : `enkomokazini/${category}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
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
        
        return await fileToDataUrl(file);
      }
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      
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
      
      const img = new Image();
      img.onload = () => {
        toast({
          title: "✅ Test Successful",
          description: `Preset "${uploadPreset}" is working!`,
        });
        console.log('Test image URL:', imageUrl);
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
        ui: editing.ui || currentData.ui || {},
        portfolio: editing.portfolio || currentData.portfolio || [],
        activities: editing.activities || currentData.activities || [],
        gallery: editing.gallery || currentData.gallery || []
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

  // ✅ GALLERY MANAGEMENT
  const addGalleryYear = () => {
    const year = prompt("Enter year (e.g., 2024):");
    if (!year) return;
    
    const gallery = editing.gallery || data.gallery || [];
    if (gallery.some(y => y.year === year)) {
      toast({
        title: "Year exists",
        description: `Year ${year} already exists`,
        variant: "destructive"
      });
      return;
    }
    
    const updatedGallery = [...gallery, { year, folders: [] }];
    setEditing({ ...editing, gallery: updatedGallery });
    
    const updatedData = { ...data, gallery: updatedGallery };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    setSelectedGalleryYear(year);
    
    toast({
      title: "Year added",
      description: `Added year ${year}`,
    });
  };

  const removeGalleryYear = (year: string) => {
    if (!confirm(`Delete year ${year} and all its folders?`)) return;
    
    const gallery = editing.gallery || data.gallery || [];
    const updatedGallery = gallery.filter(y => y.year !== year);
    setEditing({ ...editing, gallery: updatedGallery });
    
    const updatedData = { ...data, gallery: updatedGallery };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    if (selectedGalleryYear === year) {
      setSelectedGalleryYear("");
      setSelectedGalleryFolder("");
    }
    
    toast({
      title: "Year removed",
      description: `Removed year ${year}`,
    });
  };

  const addGalleryFolder = () => {
    if (!selectedGalleryYear) {
      toast({
        title: "Select year",
        description: "Please select a year first",
        variant: "destructive"
      });
      return;
    }
    
    const folderName = prompt("Enter folder name (e.g., Grade 8, Staff):");
    if (!folderName) return;
    
    const gallery = editing.gallery || data.gallery || [];
    const yearIndex = gallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    const updatedGallery = [...gallery];
    if (!updatedGallery[yearIndex].folders.some(f => f.name === folderName)) {
      updatedGallery[yearIndex].folders.push({ name: folderName, images: [] });
      setEditing({ ...editing, gallery: updatedGallery });
      
      const updatedData = { ...data };
      if (!updatedData.gallery) updatedData.gallery = [];
      const dataYearIndex = updatedData.gallery.findIndex(y => y.year === selectedGalleryYear);
      if (dataYearIndex !== -1) {
        updatedData.gallery[dataYearIndex].folders.push({ name: folderName, images: [] });
      }
      saveSiteData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      setSelectedGalleryFolder(folderName);
      
      toast({
        title: "Folder added",
        description: `Added folder ${folderName} to ${selectedGalleryYear}`,
      });
    } else {
      toast({
        title: "Folder exists",
        description: `Folder ${folderName} already exists in ${selectedGalleryYear}`,
        variant: "destructive"
      });
    }
  };

  const removeGalleryFolder = (folderName: string) => {
    if (!selectedGalleryYear) return;
    
    if (!confirm(`Delete folder ${folderName} and all its images?`)) return;
    
    const gallery = editing.gallery || data.gallery || [];
    const yearIndex = gallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    const updatedGallery = [...gallery];
    updatedGallery[yearIndex].folders = updatedGallery[yearIndex].folders.filter(f => f.name !== folderName);
    setEditing({ ...editing, gallery: updatedGallery });
    
    const updatedData = { ...data };
    if (!updatedData.gallery) updatedData.gallery = [];
    const dataYearIndex = updatedData.gallery.findIndex(y => y.year === selectedGalleryYear);
    if (dataYearIndex !== -1) {
      updatedData.gallery[dataYearIndex].folders = updatedData.gallery[dataYearIndex].folders.filter(f => f.name !== folderName);
    }
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    if (selectedGalleryFolder === folderName) {
      setSelectedGalleryFolder("");
    }
    
    toast({
      title: "Folder removed",
      description: `Removed folder ${folderName}`,
    });
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderName?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const targetFolder = folderName || galleryUploadFolder;
    if (!targetFolder) {
      toast({
        title: "Select folder",
        description: "Please select a folder for upload",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedGalleryYear) {
      toast({
        title: "Select year",
        description: "Please select a year first",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Uploading gallery images...",
      description: `Uploading ${files.length} image(s) to ${targetFolder} in ${selectedGalleryYear}`,
    });
    
    try {
      const gallery = editing.gallery || data.gallery || [];
      const yearIndex = gallery.findIndex(y => y.year === selectedGalleryYear);
      
      if (yearIndex === -1) return;
      
      const folderIndex = gallery[yearIndex].folders.findIndex(f => f.name === targetFolder);
      if (folderIndex === -1) return;
      
      const updatedGallery = [...gallery];
      const currentImages = [...updatedGallery[yearIndex].folders[folderIndex].images];
      
      for (let i = 0; i < files.length; i++) {
        const folderPath = `gallery/${selectedGalleryYear}/${targetFolder}`;
        const url = await uploadImage(files[i], 'gallery', `gallery_${Date.now()}`, folderPath);
        const title = prompt(`Enter title for image ${i + 1}:`, files[i].name.replace(/\.[^/.]+$/, ""));
        currentImages.push({ id: `img_${Date.now()}_${i}`, src: url, title: title || files[i].name });
      }
      
      updatedGallery[yearIndex].folders[folderIndex].images = currentImages;
      setEditing({ ...editing, gallery: updatedGallery });
      
      const updatedData = { ...data };
      if (!updatedData.gallery) updatedData.gallery = [];
      const dataYearIndex = updatedData.gallery.findIndex(y => y.year === selectedGalleryYear);
      if (dataYearIndex !== -1) {
        const dataFolderIndex = updatedData.gallery[dataYearIndex].folders.findIndex(f => f.name === targetFolder);
        if (dataFolderIndex !== -1) {
          updatedData.gallery[dataYearIndex].folders[dataFolderIndex].images = currentImages;
        }
      }
      saveSiteData(updatedData);
      window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
      
      toast({
        title: "Gallery images uploaded",
        description: `Added ${files.length} image(s) to ${targetFolder}`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload gallery images",
        variant: "destructive"
      });
    }
    
    e.target.value = '';
  };

  const removeGalleryImage = (folderName: string, imageIndex: number) => {
    if (!selectedGalleryYear) return;
    
    if (!confirm("Delete this image?")) return;
    
    const gallery = editing.gallery || data.gallery || [];
    const yearIndex = gallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    const folderIndex = gallery[yearIndex].folders.findIndex(f => f.name === folderName);
    if (folderIndex === -1) return;
    
    const updatedGallery = [...gallery];
    const images = [...updatedGallery[yearIndex].folders[folderIndex].images];
    images.splice(imageIndex, 1);
    updatedGallery[yearIndex].folders[folderIndex].images = images;
    setEditing({ ...editing, gallery: updatedGallery });
    
    const updatedData = { ...data };
    if (!updatedData.gallery) updatedData.gallery = [];
    const dataYearIndex = updatedData.gallery.findIndex(y => y.year === selectedGalleryYear);
    if (dataYearIndex !== -1) {
      const dataFolderIndex = updatedData.gallery[dataYearIndex].folders.findIndex(f => f.name === folderName);
      if (dataFolderIndex !== -1) {
        updatedData.gallery[dataYearIndex].folders[dataFolderIndex].images = images;
      }
    }
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Image removed",
      description: "Gallery image removed",
    });
  };

  // ✅ PORTFOLIO MANAGEMENT
  const addPortfolioItem = () => {
    const portfolio = editing.portfolio || data.portfolio || [];
    const newItem: PortfolioItem = {
      id: `portfolio_${Date.now()}`,
      src: "",
      title: "New Portfolio Item",
      category: "All",
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedPortfolio = [...portfolio, newItem];
    setEditing({ ...editing, portfolio: updatedPortfolio });
    
    const updatedData = { ...data, portfolio: updatedPortfolio };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Portfolio item added",
      description: "New portfolio item added",
    });
  };

  const updatePortfolioItem = (id: string, value: Partial<PortfolioItem>) => {
    const portfolio = editing.portfolio || data.portfolio || [];
    const updatedPortfolio = portfolio.map(item => 
      item.id === id ? { ...item, ...value } : item
    );
    setEditing({ ...editing, portfolio: updatedPortfolio });
    
    const updatedData = { ...data };
    if (!updatedData.portfolio) updatedData.portfolio = [];
    const dataIndex = updatedData.portfolio.findIndex(item => item.id === id);
    if (dataIndex !== -1) {
      updatedData.portfolio[dataIndex] = { ...updatedData.portfolio[dataIndex], ...value };
    }
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const removePortfolioItem = (id: string) => {
    const portfolio = editing.portfolio || data.portfolio || [];
    const updatedPortfolio = portfolio.filter(item => item.id !== id);
    setEditing({ ...editing, portfolio: updatedPortfolio });
    
    const updatedData = { ...data, portfolio: updatedPortfolio };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Portfolio item removed",
      description: "Portfolio item removed",
    });
  };

  const handlePortfolioImageUpload = async (id: string, file?: File) => {
    if (!file) return;
    
    try {
      const url = await uploadImage(file, 'portfolio', `portfolio_${Date.now()}`);
      updatePortfolioItem(id, { src: url });
    } catch (error) {
      // Error already handled in uploadImage
    }
  };

  // ✅ ACTIVITIES MANAGEMENT
  const addActivity = () => {
    const activities = editing.activities || data.activities || [];
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      title: "New Activity",
      date: "January (TBC)",
      time: "T.B.C",
      location: "Enkomokazini Technical High School",
      description: "",
      category: "main"
    };
    
    const updatedActivities = [...activities, newActivity];
    setEditing({ ...editing, activities: updatedActivities });
    
    const updatedData = { ...data, activities: updatedActivities };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Activity added",
      description: "New activity added",
    });
  };

  const updateActivity = (id: string, value: Partial<Activity>) => {
    const activities = editing.activities || data.activities || [];
    const updatedActivities = activities.map(activity => 
      activity.id === id ? { ...activity, ...value } : activity
    );
    setEditing({ ...editing, activities: updatedActivities });
    
    const updatedData = { ...data };
    if (!updatedData.activities) updatedData.activities = [];
    const dataIndex = updatedData.activities.findIndex(activity => activity.id === id);
    if (dataIndex !== -1) {
      updatedData.activities[dataIndex] = { ...updatedData.activities[dataIndex], ...value };
    }
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };

  const removeActivity = (id: string) => {
    const activities = editing.activities || data.activities || [];
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setEditing({ ...editing, activities: updatedActivities });
    
    const updatedData = { ...data, activities: updatedActivities };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Activity removed",
      description: "Activity removed",
    });
  };

  // ✅ EXTRACURRICULAR ACTIVITIES
  const addExtracurricularActivity = () => {
    const activities = editing.activities || data.activities || [];
    const newActivity: Activity = {
      id: `extracurricular_${Date.now()}`,
      title: "New Extracurricular Activity",
      description: "Activity description",
      date: "All year round",
      time: "",
      location: "Enkomokazini Technical High School",
      category: "extracurricular",
      season: "year_round"
    };
    
    const updatedActivities = [...activities, newActivity];
    setEditing({ ...editing, activities: updatedActivities });
    
    const updatedData = { ...data, activities: updatedActivities };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
    
    toast({
      title: "Extracurricular activity added",
      description: "New extracurricular activity added",
    });
  };

  // ✅ TEAM MEMBER HANDLERS
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      image: "",
      secondaryImage: ""
    });
    setEditing({ ...editing, team: t });
  };
  
  const updateTeamMember = (index: number, value: Partial<TeamMember>) => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
    
    const updatedData = { ...data };
    if (!updatedData.team) updatedData.team = [];
    updatedData.team[index] = { ...updatedData.team[index], ...value };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };
  
  const removeTeamMember = (index: number) => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t.splice(index, 1);
    setEditing({ ...editing, team: t });
    
    const updatedData = { ...data, team: t };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
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
    const s = editing.sponsors ? [...editing.sponsors] : data.sponsors || [];
    s.push({ 
      name: "New Sponsor", 
      url: "https://example.com", 
      image: "" 
    });
    setEditing({ ...editing, sponsors: s });
  };
  
  const updateSponsor = (index: number, value: Partial<Sponsor>) => {
    const s = editing.sponsors ? [...editing.sponsors] : data.sponsors || [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, sponsors: s });
    
    const updatedData = { ...data };
    if (!updatedData.sponsors) updatedData.sponsors = [];
    updatedData.sponsors[index] = { ...updatedData.sponsors[index], ...value };
    saveSiteData(updatedData);
    window.dispatchEvent(new CustomEvent("siteDataUpdated", { detail: updatedData }));
  };
  
  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : data.sponsors || [];
    s.splice(index, 1);
    setEditing({ ...editing, sponsors: s });
    
    const updatedData = { ...data, sponsors: s };
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
      // Error already handled in uploadImage
    }
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

  // ✅ SERVICES HANDLERS
  const addService = () => {
    const s = editing.services ? [...editing.services] : data.services || [];
    s.push({ 
      category: "New Stream", 
      subjects: [{ name: "New Subject", passMark: "50%" }] 
    });
    setEditing({ ...editing, services: s });
  };
  
  const updateService = (index: number, value: any) => {
    const s = editing.services ? [...editing.services] : data.services || [];
    s[index] = { ...s[index], ...value };
    setEditing({ ...editing, services: s });
  };
  
  const removeService = (index: number) => {
    const s = editing.services ? [...editing.services] : data.services || [];
    s.splice(index, 1);
    setEditing({ ...editing, services: s });
  };

  const addSubject = (serviceIndex: number) => {
    const s = editing.services ? [...editing.services] : data.services || [];
    const subjects = s[serviceIndex].subjects ? [...s[serviceIndex].subjects] : [];
    subjects.push({ name: "New Subject", passMark: "50%" });
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };
  
  const updateSubject = (serviceIndex: number, subjectIndex: number, value: any) => {
    const s = editing.services ? [...editing.services] : data.services || [];
    const subjects = s[serviceIndex].subjects ? [...s[serviceIndex].subjects] : [];
    subjects[subjectIndex] = { ...subjects[subjectIndex], ...value };
    s[serviceIndex] = { ...s[serviceIndex], subjects };
    setEditing({ ...editing, services: s });
  };
  
  const removeSubject = (serviceIndex: number, subjectIndex: number) => {
    const s = editing.services ? [...editing.services] : data.services || [];
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
    await testCloudinaryConnection();
  };

  // Get data
  const galleryData = editing.gallery || data.gallery || [];
  const portfolioData = editing.portfolio || data.portfolio || [];
  const activitiesData = editing.activities || data.activities || [];
  const mainActivities = activitiesData.filter(a => a.category !== 'extracurricular');
  const extracurricularActivities = activitiesData.filter(a => a.category === 'extracurricular');

  // Default extracurricular activities
  useEffect(() => {
    if (extracurricularActivities.length === 0) {
      const defaultActivities: Activity[] = [
        {
          id: 'chess',
          title: 'Enkomokazini Chess Club',
          description: 'A strategic club that builds critical thinking and focus. Weekly practice and friendly competitions, all learners welcome.',
          date: 'All year round',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'year_round'
        },
        {
          id: 'debate',
          title: 'Debating Society',
          description: 'Public speaking and debating practice and competitions.',
          date: 'All year round',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'year_round'
        },
        {
          id: 'gospel',
          title: 'Gospel',
          description: 'Choir and contemporary gospel music activities. Rehearse regularly and perform uplifting sets for assemblies, services and special events.',
          date: 'All year round',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'year_round'
        },
        {
          id: 'ingoma',
          title: 'Ingoma',
          description: 'Ingoma is a percussive and vocal traditional performances that celebrate our musical heritage. Join rehearsals to learn rhythms, singing techniques and stage performance.',
          date: 'June - September',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'july_september'
        },
        {
          id: 'amahubo',
          title: 'Amahubo',
          description: 'Amahubo, a choir-style group focusing on hymns and praise songs. Perform at school events and community gatherings; all voices welcome, no prior experience required.',
          date: 'June - September',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'july_september'
        },
        {
          id: 'umshado',
          title: 'Umshado',
          description: 'Umshado, traditional wedding dance and performance group that explores cultural choreography and costume. Learn steps, teamwork and perform at cultural showcases.',
          date: 'June - September',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'july_september'
        },
        {
          id: 'soccer',
          title: 'Soccer',
          description: 'Teams: U/14, U/15, U/16 & 17, U/19. Regular training and fixtures, trials at term start; all skill levels welcome.',
          date: 'All year round',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'year_round'
        },
        {
          id: 'netball',
          title: 'Netball',
          description: 'Teams: U/14, U/16/17, U/19. Coached training and inter-school matches, attend trials or see the sports coordinator to join.',
          date: 'All year round',
          time: '',
          location: 'Enkomokazini Technical High School',
          category: 'extracurricular',
          season: 'year_round'
        }
      ];
      
      const updatedActivities = [...activitiesData, ...defaultActivities];
      setEditing({ ...editing, activities: updatedActivities });
    }
  }, []);

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

              {/* Portfolio Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Portfolio Items</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addPortfolioItem}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {portfolioData.map((item) => (
                    <div key={item.id} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          value={item.title} 
                          onChange={(e)=>updatePortfolioItem(item.id, { title: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Title"
                          disabled={isUploading}
                        />
                        <select 
                          value={item.category} 
                          onChange={(e)=>updatePortfolioItem(item.id, { category: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background"
                          disabled={isUploading}
                        >
                          <option value="All">All</option>
                          <option value="Awards">Awards</option>
                          <option value="Tours">Tours</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Academic">Academic</option>
                        </select>
                        <button 
                          onClick={()=>removePortfolioItem(item.id)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
                          disabled={isUploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input 
                          type="date"
                          value={item.date} 
                          onChange={(e)=>updatePortfolioItem(item.id, { date: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background" 
                          disabled={isUploading}
                        />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e)=>{ 
                            if(e.target.files && e.target.files[0]){ 
                              await handlePortfolioImageUpload(item.id, e.target.files[0]); 
                            } 
                          }} 
                          className="text-sm"
                          disabled={isUploading}
                        />
                      </div>
                      {item.src && (
                        <img 
                          src={getImageSrc(item.src)} 
                          alt={item.title} 
                          className="h-20 w-full object-cover rounded border border-border mt-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">School Activities</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addActivity}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {mainActivities.map((activity) => (
                    <div key={activity.id} className="border border-border rounded p-3 bg-background">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input 
                          value={activity.title} 
                          onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Title"
                          disabled={isUploading}
                        />
                        <input 
                          value={activity.date} 
                          onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Date"
                          disabled={isUploading}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input 
                          value={activity.time} 
                          onChange={(e)=>updateActivity(activity.id, { time: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Time"
                          disabled={isUploading}
                        />
                        <input 
                          value={activity.location} 
                          onChange={(e)=>updateActivity(activity.id, { location: e.target.value })} 
                          className="px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Location"
                          disabled={isUploading}
                        />
                      </div>
                      <div className="flex gap-2">
                        <textarea 
                          value={activity.description} 
                          onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Description"
                          rows={2}
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeActivity(activity.id)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
                          disabled={isUploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracurricular Activities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Extracurricular Activities</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addExtracurricularActivity}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {extracurricularActivities.map((activity) => (
                    <div key={activity.id} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          value={activity.title} 
                          onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Title"
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeActivity(activity.id)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
                          disabled={isUploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea 
                        value={activity.description} 
                        onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                        className="w-full px-2 py-1 rounded border border-border bg-background mb-2" 
                        placeholder="Description"
                        rows={2}
                        disabled={isUploading}
                      />
                      <div className="flex gap-2">
                        <input 
                          value={activity.date} 
                          onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Date/Season"
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery Management */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Gallery Management</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addGalleryYear}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Year
                    </button>
                  </div>
                </div>
                
                {/* Year Selection */}
                <div className="mb-3">
                  <label className="block text-xs text-muted-foreground mb-1">Select Year</label>
                  <div className="flex flex-wrap gap-1">
                    {galleryData.map((year) => (
                      <button
                        key={year.year}
                        onClick={() => {
                          setSelectedGalleryYear(year.year);
                          setSelectedGalleryFolder("");
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          selectedGalleryYear === year.year
                            ? "bg-accent text-accent-foreground"
                            : "bg-background border border-border"
                        }`}
                        disabled={isUploading}
                      >
                        {year.year}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGalleryYear(year.year);
                          }}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedGalleryYear && (
                  <>
                    {/* Folder Management */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs text-muted-foreground">Folders in {selectedGalleryYear}</label>
                        <button 
                          onClick={addGalleryFolder}
                          className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-xs hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <FolderPlus size={12} /> Add Folder
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {galleryData.find(y => y.year === selectedGalleryYear)?.folders.map((folder) => (
                          <button
                            key={folder.name}
                            onClick={() => {
                              setSelectedGalleryFolder(folder.name);
                              setGalleryUploadFolder(folder.name);
                            }}
                            className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                              selectedGalleryFolder === folder.name
                                ? "bg-accent text-accent-foreground"
                                : "bg-background border border-border"
                            }`}
                            disabled={isUploading}
                          >
                            <FolderOpen size={12} />
                            {folder.name}
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              {folder.images.length} photo{folder.images.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeGalleryFolder(folder.name);
                              }}
                              className="ml-1 text-xs hover:text-destructive"
                            >
                              ×
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Upload for Selected Folder */}
                    {selectedGalleryFolder && (
                      <div className="mb-3">
                        <label className="block text-xs text-muted-foreground mb-1">
                          Upload to {selectedGalleryFolder}
                        </label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => handleGalleryImageUpload(e, selectedGalleryFolder)} 
                          className="w-full text-sm"
                          disabled={isUploading}
                        />
                      </div>
                    )}

                    {/* Folder Images Display */}
                    {selectedGalleryFolder && (
                      <div className="mt-3">
                        <label className="block text-xs text-muted-foreground mb-1">
                          Images in {selectedGalleryFolder}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {galleryData.find(y => y.year === selectedGalleryYear)
                            ?.folders.find(f => f.name === selectedGalleryFolder)
                            ?.images.map((image, idx) => (
                              <div key={image.id} className="relative">
                                <img 
                                  src={getImageSrc(image.src)} 
                                  alt={image.title} 
                                  className="h-20 w-full object-cover rounded border border-border"
                                />
                                <div className="text-xs mt-1 truncate">{image.title}</div>
                                <button
                                  onClick={() => removeGalleryImage(selectedGalleryFolder, idx)}
                                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                                  disabled={isUploading}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Team Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Team Members</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addTeamMember}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(editing.team || data.team || []).map((m, idx) => (
                    <div key={idx} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          value={m.name} 
                          onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Name"
                          disabled={isUploading}
                        />
                        <input 
                          value={m.role} 
                          onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Role"
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeTeamMember(idx)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
                          disabled={isUploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e)=>{ 
                            if(e.target.files && e.target.files[0]){ 
                              await handleTeamImageUpload(idx, e.target.files[0]); 
                            } 
                          }} 
                          className="text-sm flex-1"
                          placeholder="Profile Image"
                          disabled={isUploading}
                        />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e)=>{ 
                            if(e.target.files && e.target.files[0]){ 
                              const url = await uploadImage(e.target.files[0], 'team', `secondary_${m.name}`);
                              updateTeamMember(idx, { secondaryImage: url });
                            } 
                          }} 
                          className="text-sm flex-1"
                          placeholder="Secondary Image"
                          disabled={isUploading}
                        />
                      </div>
                      {(m.image || m.secondaryImage) && (
                        <div className="flex gap-2 mt-2">
                          {m.image && (
                            <img 
                              src={getImageSrc(m.image)} 
                              alt={m.name} 
                              className="h-20 w-20 object-cover rounded border border-border"
                            />
                          )}
                          {m.secondaryImage && (
                            <img 
                              src={getImageSrc(m.secondaryImage)} 
                              alt={`${m.name} secondary`} 
                              className="h-20 w-20 object-cover rounded border border-border"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sponsors Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Sponsors</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={addSponsor}
                      className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(editing.sponsors || data.sponsors || []).map((s, idx) => (
                    <div key={idx} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          value={s.name} 
                          onChange={(e)=>updateSponsor(idx, { name: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Name"
                          disabled={isUploading}
                        />
                        <input 
                          value={s.url} 
                          onChange={(e)=>updateSponsor(idx, { url: e.target.value })} 
                          className="flex-1 px-2 py-1 rounded border border-border bg-background" 
                          placeholder="Website URL"
                          disabled={isUploading}
                        />
                        <button 
                          onClick={()=>removeSponsor(idx)} 
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
                          disabled={isUploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e)=>{ 
                            if(e.target.files && e.target.files[0]) {
                              await handleSponsorImage(idx, e.target.files[0]); 
                            } 
                          }} 
                          className="text-sm flex-1"
                          disabled={isUploading}
                        />
                      </div>
                      {s.image && (
                        <img 
                          src={getImageSrc(s.image)} 
                          alt={s.name} 
                          className="h-20 w-full object-contain rounded border border-border mt-2 bg-gray-50 p-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Images Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Hero Images</label>
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
                  <label className="block text-sm font-medium text-foreground">School Image</label>
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
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
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
                              className="px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                              disabled={isUploading}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div className="mt-2">
                          <button 
                            onClick={()=>addSubject(sIdx)} 
                            className="px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
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
                      className="px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Save size={18} />
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
              <PortfolioSection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <GallerySection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <TeamSection />
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <ActivitiesSection />
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

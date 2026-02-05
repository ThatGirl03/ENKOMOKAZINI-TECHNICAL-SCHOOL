import React, { useEffect, useState } from "react";
import { 
  LogOut, Bell, Settings, UploadCloud, CloudOff, RefreshCw, 
  FolderPlus, FolderMinus, ImagePlus, Calendar, MapPin, Clock, 
  GraduationCap, ExternalLink, Plus, Trash2, Edit, X, FolderOpen, 
  ChevronLeft, ChevronRight, Save, Loader2, Eye, Grid, List, 
  Filter, Users, Trophy, Music, Gamepad2, Mic, BookOpen, 
  Camera, Home, Briefcase, Heart
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
  bio?: string;
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
  description?: string;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category?: string; // "main" or "extracurricular"
  season?: string;
  customSeason?: string;
}

interface GalleryImage {
  id: string;
  src: string;
  title: string;
  description?: string;
}

interface GalleryFolder {
  id: string;
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
  const [activeTab, setActiveTab] = useState<'basic' | 'portfolio' | 'activities' | 'gallery' | 'team' | 'sponsors' | 'hero'>('basic');
  const [selectedGalleryYear, setSelectedGalleryYear] = useState<string>("");
  const [selectedGalleryFolder, setSelectedGalleryFolder] = useState<string>("");
  const [galleryUploadFolder, setGalleryUploadFolder] = useState<string>("");
  const [portfolioFilter, setPortfolioFilter] = useState<string>("All");
  const [editActivityId, setEditActivityId] = useState<string | null>(null);
  const [editPortfolioId, setEditPortfolioId] = useState<string | null>(null);

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

  // ✅ GALLERY MANAGEMENT - CLEANER VERSION
  const galleryData = editing.gallery || data.gallery || [];
  
  const addGalleryYear = () => {
    const year = prompt("Enter year (e.g., 2024):");
    if (!year) return;
    
    const updatedGallery = [...galleryData, { year, folders: [] }];
    setEditing({ ...editing, gallery: updatedGallery });
    setSelectedGalleryYear(year);
    
    toast({
      title: "Year added",
      description: `Added year ${year}`,
    });
  };

  const removeGalleryYear = (year: string) => {
    if (!confirm(`Delete year ${year} and all its folders?`)) return;
    
    const updatedGallery = galleryData.filter(y => y.year !== year);
    setEditing({ ...editing, gallery: updatedGallery });
    
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
    
    const updatedGallery = [...galleryData];
    const yearIndex = updatedGallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    if (!updatedGallery[yearIndex].folders.some(f => f.name === folderName)) {
      updatedGallery[yearIndex].folders.push({ 
        id: `folder_${Date.now()}`, 
        name: folderName, 
        images: [] 
      });
      setEditing({ ...editing, gallery: updatedGallery });
      
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
    
    const updatedGallery = [...galleryData];
    const yearIndex = updatedGallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    updatedGallery[yearIndex].folders = updatedGallery[yearIndex].folders.filter(f => f.name !== folderName);
    setEditing({ ...editing, gallery: updatedGallery });
    
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
      const updatedGallery = [...galleryData];
      const yearIndex = updatedGallery.findIndex(y => y.year === selectedGalleryYear);
      
      if (yearIndex === -1) return;
      
      const folderIndex = updatedGallery[yearIndex].folders.findIndex(f => f.name === targetFolder);
      if (folderIndex === -1) return;
      
      const currentImages = [...updatedGallery[yearIndex].folders[folderIndex].images];
      
      for (let i = 0; i < files.length; i++) {
        const folderPath = `gallery/${selectedGalleryYear}/${targetFolder}`;
        const url = await uploadImage(files[i], 'gallery', `gallery_${Date.now()}`, folderPath);
        const title = prompt(`Enter title for image ${i + 1}:`, files[i].name.replace(/\.[^/.]+$/, ""));
        currentImages.push({ 
          id: `img_${Date.now()}_${i}`, 
          src: url, 
          title: title || files[i].name 
        });
      }
      
      updatedGallery[yearIndex].folders[folderIndex].images = currentImages;
      setEditing({ ...editing, gallery: updatedGallery });
      
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
    
    const updatedGallery = [...galleryData];
    const yearIndex = updatedGallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    const folderIndex = updatedGallery[yearIndex].folders.findIndex(f => f.name === folderName);
    if (folderIndex === -1) return;
    
    const images = [...updatedGallery[yearIndex].folders[folderIndex].images];
    images.splice(imageIndex, 1);
    updatedGallery[yearIndex].folders[folderIndex].images = images;
    setEditing({ ...editing, gallery: updatedGallery });
    
    toast({
      title: "Image removed",
      description: "Gallery image removed",
    });
  };

  const updateGalleryImageTitle = (folderName: string, imageIndex: number, title: string) => {
    if (!selectedGalleryYear) return;
    
    const updatedGallery = [...galleryData];
    const yearIndex = updatedGallery.findIndex(y => y.year === selectedGalleryYear);
    
    if (yearIndex === -1) return;
    
    const folderIndex = updatedGallery[yearIndex].folders.findIndex(f => f.name === folderName);
    if (folderIndex === -1) return;
    
    const images = [...updatedGallery[yearIndex].folders[folderIndex].images];
    images[imageIndex] = { ...images[imageIndex], title };
    updatedGallery[yearIndex].folders[folderIndex].images = images;
    setEditing({ ...editing, gallery: updatedGallery });
  };

  // ✅ PORTFOLIO MANAGEMENT - CLEANER VERSION
  const portfolioData = editing.portfolio || data.portfolio || [];
  
  const addPortfolioItem = () => {
    const newItem: PortfolioItem = {
      id: `portfolio_${Date.now()}`,
      src: "",
      title: "New Portfolio Item",
      category: "All",
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedPortfolio = [...portfolioData, newItem];
    setEditing({ ...editing, portfolio: updatedPortfolio });
    setEditPortfolioId(newItem.id);
    
    toast({
      title: "Portfolio item added",
      description: "New portfolio item added",
    });
  };

  const updatePortfolioItem = (id: string, value: Partial<PortfolioItem>) => {
    const updatedPortfolio = portfolioData.map(item => 
      item.id === id ? { ...item, ...value } : item
    );
    setEditing({ ...editing, portfolio: updatedPortfolio });
  };

  const removePortfolioItem = (id: string) => {
    const updatedPortfolio = portfolioData.filter(item => item.id !== id);
    setEditing({ ...editing, portfolio: updatedPortfolio });
    
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

  // ✅ ACTIVITIES MANAGEMENT - CLEANER VERSION
  const activitiesData = editing.activities || data.activities || [];
  
  const addActivity = () => {
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      title: "New Activity",
      date: "January (TBC)",
      time: "T.B.C",
      location: "Enkomokazini Technical High School",
      description: "",
      category: "main"
    };
    
    const updatedActivities = [...activitiesData, newActivity];
    setEditing({ ...editing, activities: updatedActivities });
    setEditActivityId(newActivity.id);
    
    toast({
      title: "Activity added",
      description: "New activity added",
    });
  };

  const updateActivity = (id: string, value: Partial<Activity>) => {
    const updatedActivities = activitiesData.map(activity => 
      activity.id === id ? { ...activity, ...value } : activity
    );
    setEditing({ ...editing, activities: updatedActivities });
  };

  const removeActivity = (id: string) => {
    const updatedActivities = activitiesData.filter(activity => activity.id !== id);
    setEditing({ ...editing, activities: updatedActivities });
    
    toast({
      title: "Activity removed",
      description: "Activity removed",
    });
  };

  // ✅ EXTRACURRICULAR ACTIVITIES - Using same activities array with category
  const extracurricularActivities = activitiesData.filter(a => a.category === 'extracurricular');
  const mainActivities = activitiesData.filter(a => a.category === 'main');

  const addExtracurricularActivity = () => {
    const newActivity: Activity = {
      id: `extracurricular_${Date.now()}`,
      title: "New Extracurricular Activity",
      date: "All year round",
      time: "",
      location: "Enkomokazini Technical High School",
      description: "Activity description",
      category: "extracurricular",
      season: "year_round"
    };
    
    const updatedActivities = [...activitiesData, newActivity];
    setEditing({ ...editing, activities: updatedActivities });
    setEditActivityId(newActivity.id);
    
    toast({
      title: "Extracurricular activity added",
      description: "New extracurricular activity added",
    });
  };

  // ✅ TEAM MEMBER HANDLERS - CLEANER VERSION
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      image: "",
      bio: "Member biography here..."
    });
    setEditing({ ...editing, team: t });
  };
  
  const updateTeamMember = (index: number, value: Partial<TeamMember>) => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t[index] = { ...t[index], ...value };
    setEditing({ ...editing, team: t });
  };
  
  const removeTeamMember = (index: number) => {
    const t = editing.team ? [...editing.team] : data.team || [];
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

  // ✅ SPONSOR HANDLERS - CLEANER VERSION
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
  };
  
  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : data.sponsors || [];
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
  };

  const refreshCloudinaryConnection = async () => {
    setCloudinaryStatus('checking');
    await testCloudinaryConnection();
  };

  // Season options for activities
  const seasonOptions = [
    { value: 'january', label: 'January (TBC)' },
    { value: 'february', label: 'February' },
    { value: 'march', label: 'March' },
    { value: 'april', label: 'April (TBC)' },
    { value: 'may', label: 'May' },
    { value: 'june', label: 'June' },
    { value: 'july_september', label: 'July - September' },
    { value: 'october', label: 'October' },
    { value: 'november', label: 'November' },
    { value: 'december', label: 'December' },
    { value: 'year_round', label: 'All year round' },
    { value: 'custom', label: 'Custom' }
  ];

  // Portfolio category options
  const portfolioCategories = ["All", "Awards", "Tours", "Sports", "Cultural", "Academic"];

  // Default extracurricular activities from screenshots
  const defaultExtracurricular = [
    {
      id: 'chess',
      title: 'Enkomokazini Chess Club',
      description: 'A strategic club that builds critical thinking and focus. Weekly practice and friendly competitions, all learners welcome.',
      date: 'All year round',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'year_round'
    },
    {
      id: 'debate',
      title: 'Debating Society',
      description: 'Public speaking and debating practice and competitions.',
      date: 'All year round',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'year_round'
    },
    {
      id: 'gospel',
      title: 'Gospel',
      description: 'Choir and contemporary gospel music activities. Rehearse regularly and perform uplifting sets for assemblies, services and special events.',
      date: 'All year round',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'year_round'
    },
    {
      id: 'ingoma',
      title: 'Ingoma',
      description: 'Ingoma is a percussive and vocal traditional performances that celebrate our musical heritage. Join rehearsals to learn rhythms, singing techniques and stage performance.',
      date: 'June - September',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'july_september'
    },
    {
      id: 'amahubo',
      title: 'Amahubo',
      description: 'Amahubo, a choir-style group focusing on hymns and praise songs. Perform at school events and community gatherings; all voices welcome, no prior experience required.',
      date: 'June - September',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'july_september'
    },
    {
      id: 'umshado',
      title: 'Umshado',
      description: 'Umshado, traditional wedding dance and performance group that explores cultural choreography and costume. Learn steps, teamwork and perform at cultural showcases.',
      date: 'June - September',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'july_september'
    },
    {
      id: 'soccer',
      title: 'Soccer',
      description: 'Teams: U/14, U/15, U/16 & 17, U/19. Regular training and fixtures, trials at term start; all skill levels welcome.',
      date: 'All year round',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'year_round'
    },
    {
      id: 'netball',
      title: 'Netball',
      description: 'Teams: U/14, U/16/17, U/19. Coached training and inter-school matches, attend trials or see the sports coordinator to join.',
      date: 'All year round',
      time: '',
      location: 'Enkomokazini Technical High School',
      category: 'extracurricular' as const,
      season: 'year_round'
    }
  ];

  // Initialize default extracurricular activities if empty
  useEffect(() => {
    if (extracurricularActivities.length === 0) {
      const updatedActivities = [...activitiesData, ...defaultExtracurricular];
      setEditing({ ...editing, activities: updatedActivities });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-800">Enkomokazini Technical High School - Admin</h1>
          <p className="text-gray-600 text-sm">
            Edit school website content
            {isUploading && (
              <span className="ml-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                <Loader2 size={12} className="animate-spin mr-1" /> Uploading...
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
            <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <UploadCloud size={20} /> Cloudinary Status
            </h2>
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
            
            <div className="text-right text-sm">
              <p className="text-blue-700">
                Cloud Name: <code className="ml-1 bg-blue-100 px-2 py-1 rounded">{cloudName}</code>
              </p>
              <p className="text-blue-700 mt-1">
                Upload Preset: <code className="ml-1 bg-blue-100 px-2 py-1 rounded">{uploadPreset}</code>
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'basic'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Home size={16} className="inline mr-2" />
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'portfolio'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Briefcase size={16} className="inline mr-2" />
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'activities'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar size={16} className="inline mr-2" />
                  Activities
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'gallery'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Camera size={16} className="inline mr-2" />
                  Gallery
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'team'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  Team
                </button>
                <button
                  onClick={() => setActiveTab('sponsors')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'sponsors'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Heart size={16} className="inline mr-2" />
                  Sponsors
                </button>
                <button
                  onClick={() => setActiveTab('hero')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'hero'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ImagePlus size={16} className="inline mr-2" />
                  Hero Images
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic School Information</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                      <input 
                        value={editing.schoolName || ""} 
                        onChange={(e)=>setEditing({...editing, schoolName: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        disabled={isUploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                      <input 
                        value={editing.tagline || ""} 
                        onChange={(e)=>setEditing({...editing, tagline: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={editing.description || ""} 
                      onChange={(e)=>setEditing({...editing, description: e.target.value})} 
                      className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                      rows={3}
                      disabled={isUploading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input 
                        value={editing.contactEmail || ""} 
                        onChange={(e)=>setEditing({...editing, contactEmail: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        disabled={isUploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        value={editing.phone || ""} 
                        onChange={(e)=>setEditing({...editing, phone: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input 
                        value={editing.address || ""} 
                        onChange={(e)=>setEditing({...editing, address: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        disabled={isUploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pass Rate</label>
                      <input 
                        value={editing.passRate || ""} 
                        onChange={(e)=>setEditing({...editing, passRate: e.target.value})} 
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                        placeholder="e.g., 95%" 
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e)=>{ 
                        if(e.target.files && e.target.files[0]) {
                          await handleSchoolImage(e.target.files[0]); 
                        } 
                      }} 
                      className="w-full text-sm"
                      disabled={isUploading}
                    />
                    {editing.schoolImage || data.schoolImage ? (
                      <img 
                        src={getImageSrc(editing.schoolImage || data.schoolImage)} 
                        alt="school" 
                        className="h-32 w-full object-cover rounded border border-gray-300 mt-2"
                      />
                    ) : null}
                  </div>
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Portfolio Management</h2>
                    <button 
                      onClick={addPortfolioItem}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {/* Portfolio Filters */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {portfolioCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => setPortfolioFilter(category)}
                        className={`px-3 py-1 rounded text-sm ${
                          portfolioFilter === category
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Portfolio Items */}
                  <div className="space-y-3">
                    {portfolioData
                      .filter(item => portfolioFilter === "All" || item.category === portfolioFilter)
                      .map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded p-4">
                        {editPortfolioId === item.id ? (
                          <div className="space-y-3">
                            <input 
                              value={item.title} 
                              onChange={(e)=>updatePortfolioItem(item.id, { title: e.target.value })} 
                              className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                              placeholder="Title"
                              disabled={isUploading}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select 
                                value={item.category} 
                                onChange={(e)=>updatePortfolioItem(item.id, { category: e.target.value })} 
                                className="px-3 py-2 rounded border border-gray-300 bg-white"
                                disabled={isUploading}
                              >
                                {portfolioCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <input 
                                type="date"
                                value={item.date} 
                                onChange={(e)=>updatePortfolioItem(item.id, { date: e.target.value })} 
                                className="px-3 py-2 rounded border border-gray-300 bg-white" 
                                disabled={isUploading}
                              />
                            </div>
                            <div className="flex gap-2">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={async (e)=>{ 
                                  if(e.target.files && e.target.files[0]){ 
                                    await handlePortfolioImageUpload(item.id, e.target.files[0]); 
                                  } 
                                }} 
                                className="flex-1 text-sm"
                                disabled={isUploading}
                              />
                              <button 
                                onClick={() => setEditPortfolioId(null)}
                                className="px-3 py-2 bg-gray-600 text-white rounded text-sm"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.src && (
                                <img 
                                  src={getImageSrc(item.src)} 
                                  alt={item.title} 
                                  className="h-16 w-16 object-cover rounded border border-gray-300"
                                />
                              )}
                              <div>
                                <h3 className="font-medium text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.category} • {item.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditPortfolioId(item.id)}
                                className="p-1 text-gray-500 hover:text-blue-600"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={()=>removePortfolioItem(item.id)} 
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">School Activities</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={addActivity}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        disabled={isUploading}
                      >
                        <Plus size={14} /> Add Activity
                      </button>
                      <button 
                        onClick={addExtracurricularActivity}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        disabled={isUploading}
                      >
                        <Plus size={14} /> Add Extracurricular
                      </button>
                    </div>
                  </div>

                  {/* Main Activities */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Main School Activities</h3>
                    <div className="space-y-3">
                      {mainActivities.map((activity) => (
                        <div key={activity.id} className="border border-gray-200 rounded p-4">
                          {editActivityId === activity.id ? (
                            <div className="space-y-3">
                              <input 
                                value={activity.title} 
                                onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                placeholder="Activity Title"
                                disabled={isUploading}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <select 
                                  value={activity.season || 'january'} 
                                  onChange={(e)=>updateActivity(activity.id, { 
                                    season: e.target.value,
                                    date: e.target.value === 'custom' ? activity.date : seasonOptions.find(s => s.value === e.target.value)?.label || ''
                                  })} 
                                  className="px-3 py-2 rounded border border-gray-300 bg-white"
                                  disabled={isUploading}
                                >
                                  {seasonOptions.map(season => (
                                    <option key={season.value} value={season.value}>{season.label}</option>
                                  ))}
                                </select>
                                <input 
                                  value={activity.location} 
                                  onChange={(e)=>updateActivity(activity.id, { location: e.target.value })} 
                                  className="px-3 py-2 rounded border border-gray-300 bg-white" 
                                  placeholder="Location"
                                  disabled={isUploading}
                                />
                              </div>
                              {activity.season === 'custom' && (
                                <input 
                                  value={activity.date} 
                                  onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                  placeholder="Custom date/season"
                                  disabled={isUploading}
                                />
                              )}
                              <textarea 
                                value={activity.description} 
                                onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                placeholder="Description"
                                rows={2}
                                disabled={isUploading}
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setEditActivityId(null)}
                                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={()=>removeActivity(activity.id)} 
                                  className="px-3 py-2 bg-red-600 text-white rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-800">{activity.title}</h3>
                                <p className="text-sm text-gray-600">{activity.date} • {activity.location}</p>
                                {activity.description && (
                                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setEditActivityId(activity.id)}
                                  className="p-1 text-gray-500 hover:text-blue-600"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={()=>removeActivity(activity.id)} 
                                  className="p-1 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracurricular Activities */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Extracurricular Activities</h3>
                    <div className="space-y-3">
                      {extracurricularActivities.map((activity) => (
                        <div key={activity.id} className="border border-gray-200 rounded p-4">
                          {editActivityId === activity.id ? (
                            <div className="space-y-3">
                              <input 
                                value={activity.title} 
                                onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                placeholder="Activity Title"
                                disabled={isUploading}
                              />
                              <select 
                                value={activity.season || 'year_round'} 
                                onChange={(e)=>updateActivity(activity.id, { 
                                  season: e.target.value,
                                  date: e.target.value === 'custom' ? activity.date : seasonOptions.find(s => s.value === e.target.value)?.label || ''
                                })} 
                                className="w-full px-3 py-2 rounded border border-gray-300 bg-white"
                                disabled={isUploading}
                              >
                                {seasonOptions.map(season => (
                                  <option key={season.value} value={season.value}>{season.label}</option>
                                ))}
                              </select>
                              {activity.season === 'custom' && (
                                <input 
                                  value={activity.date} 
                                  onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                  placeholder="Custom date/season"
                                  disabled={isUploading}
                                />
                              )}
                              <textarea 
                                value={activity.description} 
                                onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-gray-300 bg-white" 
                                placeholder="Description"
                                rows={3}
                                disabled={isUploading}
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setEditActivityId(null)}
                                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={()=>removeActivity(activity.id)} 
                                  className="px-3 py-2 bg-red-600 text-white rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-800">{activity.title}</h3>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {activity.date}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{activity.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setEditActivityId(activity.id)}
                                  className="p-1 text-gray-500 hover:text-blue-600"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={()=>removeActivity(activity.id)} 
                                  className="p-1 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Photo Gallery</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={addGalleryYear}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        disabled={isUploading}
                      >
                        <Plus size={14} /> Add Year
                      </button>
                    </div>
                  </div>

                  {/* Year Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                    <div className="flex flex-wrap gap-2">
                      {galleryData.map((year) => (
                        <button
                          key={year.year}
                          onClick={() => {
                            setSelectedGalleryYear(year.year);
                            setSelectedGalleryFolder("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            selectedGalleryYear === year.year
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          disabled={isUploading}
                        >
                          {year.year}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGalleryYear(year.year);
                            }}
                            className="text-xs hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedGalleryYear && (
                    <>
                      {/* Folder Management */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Folders in {selectedGalleryYear}
                          </label>
                          <button 
                            onClick={addGalleryFolder}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            disabled={isUploading}
                          >
                            <FolderPlus size={12} /> Add Folder
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {galleryData.find(y => y.year === selectedGalleryYear)?.folders.map((folder) => (
                            <button
                              key={folder.name}
                              onClick={() => {
                                setSelectedGalleryFolder(folder.name);
                                setGalleryUploadFolder(folder.name);
                              }}
                              className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                                selectedGalleryFolder === folder.name
                                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                              disabled={isUploading}
                            >
                              <FolderOpen size={14} />
                              {folder.name}
                              <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                {folder.images.length} photo{folder.images.length !== 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGalleryFolder(folder.name);
                                }}
                                className="text-xs text-gray-500 hover:text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedGalleryFolder && (
                        <>
                          {/* Image Upload */}
                          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Upload to <span className="font-bold">{selectedGalleryFolder}</span>
                            </label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              onChange={(e) => handleGalleryImageUpload(e, selectedGalleryFolder)} 
                              className="w-full text-sm mb-2"
                              disabled={isUploading}
                            />
                            <p className="text-xs text-blue-600">Select multiple images to upload at once</p>
                          </div>

                          {/* Existing Images */}
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              Images in {selectedGalleryFolder} ({galleryData.find(y => y.year === selectedGalleryYear)
                                ?.folders.find(f => f.name === selectedGalleryFolder)?.images.length || 0})
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {galleryData.find(y => y.year === selectedGalleryYear)
                                ?.folders.find(f => f.name === selectedGalleryFolder)
                                ?.images.map((image, idx) => (
                                  <div key={image.id} className="border border-gray-200 rounded p-2">
                                    <div className="relative mb-2">
                                      <img 
                                        src={getImageSrc(image.src)} 
                                        alt={image.title} 
                                        className="h-24 w-full object-cover rounded border border-gray-300"
                                      />
                                      <button
                                        onClick={() => removeGalleryImage(selectedGalleryFolder, idx)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                                        disabled={isUploading}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <input 
                                      value={image.title} 
                                      onChange={(e) => updateGalleryImageTitle(selectedGalleryFolder, idx, e.target.value)} 
                                      className="w-full px-2 py-1 text-sm rounded border border-gray-300" 
                                      placeholder="Image title"
                                      disabled={isUploading}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
                    <button 
                      onClick={addTeamMember}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add Member
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editing.team || data.team || []).map((member, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-300 flex items-center justify-center">
                              {member.image ? (
                                <img 
                                  src={getImageSrc(member.image)} 
                                  alt={member.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400 font-medium text-lg">
                                  {member.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                                </span>
                              )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={async (e)=>{ 
                                if(e.target.files && e.target.files[0]){ 
                                  await handleTeamImageUpload(idx, e.target.files[0]); 
                                } 
                              }} 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={isUploading}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <input 
                                  value={member.name} 
                                  onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} 
                                  className="text-lg font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                                  disabled={isUploading}
                                />
                                <input 
                                  value={member.role} 
                                  onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} 
                                  className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 p-0 mt-1" 
                                  disabled={isUploading}
                                />
                              </div>
                              <button 
                                onClick={()=>removeTeamMember(idx)} 
                                className="p-1 text-gray-400 hover:text-red-600"
                                disabled={isUploading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <textarea 
                              value={member.bio || ""} 
                              onChange={(e)=>updateTeamMember(idx, { bio: e.target.value })} 
                              className="w-full text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0 mt-1" 
                              placeholder="Member biography..."
                              rows={2}
                              disabled={isUploading}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors Tab */}
              {activeTab === 'sponsors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Sponsors</h2>
                    <button 
                      onClick={addSponsor}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={isUploading}
                    >
                      <Plus size={14} /> Add Sponsor
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editing.sponsors || data.sponsors || []).map((sponsor, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-16 h-16 rounded bg-gray-50 border border-gray-300 overflow-hidden flex items-center justify-center">
                              {sponsor.image ? (
                                <img 
                                  src={getImageSrc(sponsor.image)} 
                                  alt={sponsor.name} 
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">Logo</span>
                              )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={async (e)=>{ 
                                if(e.target.files && e.target.files[0]) {
                                  await handleSponsorImage(idx, e.target.files[0]); 
                                } 
                              }} 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={isUploading}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <input 
                                  value={sponsor.name} 
                                  onChange={(e)=>updateSponsor(idx, { name: e.target.value })} 
                                  className="text-lg font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                                  disabled={isUploading}
                                />
                                <input 
                                  value={sponsor.url} 
                                  onChange={(e)=>updateSponsor(idx, { url: e.target.value })} 
                                  className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 p-0 mt-1" 
                                  placeholder="https://..."
                                  disabled={isUploading}
                                />
                              </div>
                              <button 
                                onClick={()=>removeSponsor(idx)} 
                                className="p-1 text-gray-400 hover:text-red-600"
                                disabled={isUploading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero Images Tab */}
              {activeTab === 'hero' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Hero Images</h2>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Upload Hero Images (appears in slideshow)
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleHeroImagesUpload} 
                      className="w-full text-sm"
                      disabled={isUploading}
                    />
                    <p className="text-xs text-blue-600 mt-1">Upload multiple images for the slideshow</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(editing.heroImages || data.heroImages || []).map((url, i)=> (
                      <div key={i} className="relative">
                        <img 
                          src={getImageSrc(url)} 
                          alt={`hero-${i}`} 
                          className="h-32 w-full object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => removeHeroImage(i)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                          disabled={isUploading}
                        >
                          ×
                        </button>
                        <div className="text-xs text-gray-500 mt-1 text-center">Image {i + 1}</div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 text-center">
                    {(editing.heroImages || data.heroImages || []).length} hero images
                  </p>
                </div>
              )}

              {/* Save & Reset Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleSave} 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save All Changes
                    </>
                  )}
                </button>
                <button 
                  onClick={handleReset} 
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="sticky top-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200 z-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Eye size={20} /> Live Preview
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
              <p className="text-sm text-gray-600">
                Preview updates automatically as you edit. Click "Save All Changes" to persist.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <HeroCarousel />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <AboutSection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <PortfolioSection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <GallerySection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <TeamSection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <ActivitiesSection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <ContactSection />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
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

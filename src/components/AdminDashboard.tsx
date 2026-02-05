import React, { useEffect, useState } from "react";
import { 
  LogOut, Bell, Settings, UploadCloud, CloudOff, RefreshCw, 
  FolderPlus, FolderMinus, ImagePlus, Calendar, MapPin, Clock, 
  GraduationCap, ExternalLink, Plus, Trash2, Edit, X, FolderOpen, 
  ChevronLeft, ChevronRight, Save, Home, Users, Briefcase, Camera, 
  Image as ImageIcon, Trophy, Heart, BookOpen, Activity, Menu, X as XIcon,
  UserCircle, Mail, Phone, MapPin as MapPinIcon
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

type ActiveSection = 'basic' | 'portfolio' | 'activities' | 'extracurricular' | 'gallery' | 'team' | 'sponsors' | 'hero' | 'services';

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [data, setData] = useState<SiteData>(loadSiteData());
  const [editing, setEditing] = useState<Partial<SiteData>>(data);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [selectedGalleryYear, setSelectedGalleryYear] = useState<string>("");
  const [selectedGalleryFolder, setSelectedGalleryFolder] = useState<string>("");
  const [galleryUploadFolder, setGalleryUploadFolder] = useState<string>("");
  const [activeSection, setActiveSection] = useState<ActiveSection>('basic');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editTeamIndex, setEditTeamIndex] = useState<number | null>(null);

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
  };

  const removePortfolioItem = (id: string) => {
    const portfolio = editing.portfolio || data.portfolio || [];
    const updatedPortfolio = portfolio.filter(item => item.id !== id);
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
  };

  const removeActivity = (id: string) => {
    const activities = editing.activities || data.activities || [];
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setEditing({ ...editing, activities: updatedActivities });
    
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
    
    toast({
      title: "Extracurricular activity added",
      description: "New extracurricular activity added",
    });
  };

  // ✅ TEAM MEMBER HANDLERS - IMPROVED
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : data.team || [];
    t.push({ 
      name: "New Member", 
      role: "Team Role", 
      image: ""
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

  // Get data
  const galleryData = editing.gallery || data.gallery || [];
  const portfolioData = editing.portfolio || data.portfolio || [];
  const activitiesData = editing.activities || data.activities || [];
  const mainActivities = activitiesData.filter(a => a.category !== 'extracurricular');
  const extracurricularActivities = activitiesData.filter(a => a.category === 'extracurricular');

  // Navigation sections
  const navSections = [
    { id: 'basic', label: 'Basic Info', icon: Home },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'activities', label: 'Activities', icon: Calendar },
    { id: 'extracurricular', label: 'Extracurricular', icon: Activity },
    { id: 'gallery', label: 'Gallery', icon: Camera },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'sponsors', label: 'Sponsors', icon: Heart },
    { id: 'hero', label: 'Hero Images', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: BookOpen },
  ];

  // Render specific preview section
  const renderPreview = () => {
    switch (activeSection) {
      case 'basic':
        return <AboutSection />;
      case 'portfolio':
        return <PortfolioSection />;
      case 'activities':
        return <ActivitiesSection />;
      case 'extracurricular':
        return <ActivitiesSection />;
      case 'gallery':
        return <GallerySection />;
      case 'team':
        return <TeamSection />;
      case 'sponsors':
        return null; // Sponsors are shown in footer
      case 'hero':
        return <HeroCarousel />;
      case 'services':
        return null; // Services are shown in About section
      default:
        return <AboutSection />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isMobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
          </button>
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Edit site content
              {isUploading && (
                <span className="ml-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  <span className="animate-spin mr-1">⟳</span> Uploading...
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity text-sm md:text-base"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex">
        {/* Navigation Sidebar */}
        <div className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} 
          md:block w-full md:w-64 bg-card border-r border-border h-[calc(100vh-64px)] overflow-y-auto fixed md:static z-20
        `}>
          <div className="p-4">
            <h2 className="font-semibold text-foreground mb-4 text-lg">Sections</h2>
            <nav className="space-y-1">
              {navSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id as ActiveSection);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/10'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Cloudinary Status */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {cloudinaryStatus === 'connected' ? (
                  <UploadCloud size={16} className="text-green-600" />
                ) : cloudinaryStatus === 'disconnected' ? (
                  <CloudOff size={16} className="text-amber-600" />
                ) : (
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {cloudinaryStatus === 'connected' ? 'Connected' : 
                   cloudinaryStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                </span>
              </div>
              <button
                onClick={refreshCloudinaryConnection}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50 mt-2"
                disabled={isUploading}
              >
                <RefreshCw size={14} />
                Refresh Connection
              </button>
            </div>

            {/* Save & Reset Buttons */}
            <div className="mt-6 space-y-2">
              <button 
                onClick={handleSave} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50"
                disabled={isUploading}
              >
                <Save size={18} />
                {isUploading ? "Saving..." : "Save All"}
              </button>
              <button 
                onClick={handleReset} 
                className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
                disabled={isUploading}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Fixed layout to use full width */}
        <div className="flex-1 w-full md:w-[calc(100%-16rem)]">
          <div className="p-4 md:p-6 w-full">
            {/* Cloudinary Status Bar - Mobile */}
            <div className="md:hidden mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-blue-800">Cloudinary Status</h2>
                <button
                  onClick={refreshCloudinaryConnection}
                  disabled={isUploading}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={cloudinaryStatus === 'checking' ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  cloudinaryStatus === 'connected' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : cloudinaryStatus === 'disconnected'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  Status: {cloudinaryStatus === 'connected' ? 'CONNECTED' : 
                          cloudinaryStatus === 'disconnected' ? 'DISCONNECTED' : 'CHECKING...'}
                </div>
              </div>
            </div>

            {/* Two Column Layout with full width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Editor Panel - Takes full left side */}
              <div className="bg-card rounded-xl p-4 md:p-6 shadow-card border border-border h-full">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                  {navSections.find(s => s.id === activeSection)?.label}
                </h2>

                <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                  {/* Basic Info Section */}
                  {activeSection === 'basic' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">School Name</label>
                          <input 
                            value={editing.schoolName || ""} 
                            onChange={(e)=>setEditing({...editing, schoolName: e.target.value})} 
                            className="w-full px-3 py-2 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                          <input 
                            value={editing.tagline || ""} 
                            onChange={(e)=>setEditing({...editing, tagline: e.target.value})} 
                            className="w-full px-3 py-2 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <textarea 
                          value={editing.description || ""} 
                          onChange={(e)=>setEditing({...editing, description: e.target.value})} 
                          className="w-full px-3 py-2 rounded border border-border bg-background" 
                          rows={3}
                          disabled={isUploading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Contact Email</label>
                          <input 
                            value={editing.contactEmail || ""} 
                            onChange={(e)=>setEditing({...editing, contactEmail: e.target.value})} 
                            className="w-full px-3 py-2 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                          <input 
                            value={editing.phone || ""} 
                            onChange={(e)=>setEditing({...editing, phone: e.target.value})} 
                            className="w-full px-3 py-2 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                          <input 
                            value={editing.address || ""} 
                            onChange={(e)=>setEditing({...editing, address: e.target.value})} 
                            className="w-full px-3 py-2 rounded border border-border bg-background" 
                            disabled={isUploading}
                          />
                        </div>
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
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">School Image</label>
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
                        {(editing.schoolImage || data.schoolImage) && (
                          <img 
                            src={getImageSrc(editing.schoolImage || data.schoolImage)} 
                            alt="school" 
                            className="h-32 w-full object-cover rounded border border-border mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Section */}
                  {activeSection === 'portfolio' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addPortfolioItem}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Portfolio Item
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {portfolioData.map((item) => (
                          <div key={item.id} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <input 
                                  value={item.title} 
                                  onChange={(e)=>updatePortfolioItem(item.id, { title: e.target.value })} 
                                  className="w-full text-lg font-medium text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                                  placeholder="Title"
                                  disabled={isUploading}
                                />
                              </div>
                              <button 
                                onClick={()=>removePortfolioItem(item.id)} 
                                className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                disabled={isUploading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Category</label>
                                <select 
                                  value={item.category} 
                                  onChange={(e)=>updatePortfolioItem(item.id, { category: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-border bg-background"
                                  disabled={isUploading}
                                >
                                  <option value="All">All</option>
                                  <option value="Awards">Awards</option>
                                  <option value="Tours">Tours</option>
                                  <option value="Sports">Sports</option>
                                  <option value="Cultural">Cultural</option>
                                  <option value="Academic">Academic</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                                <input 
                                  type="date"
                                  value={item.date} 
                                  onChange={(e)=>updatePortfolioItem(item.id, { date: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                                  disabled={isUploading}
                                />
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <label className="block text-xs text-muted-foreground mb-1">Image</label>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={async (e)=>{ 
                                  if(e.target.files && e.target.files[0]){ 
                                    await handlePortfolioImageUpload(item.id, e.target.files[0]); 
                                  } 
                                }} 
                                className="w-full text-sm"
                                disabled={isUploading}
                              />
                            </div>
                            
                            {item.src && (
                              <div className="mt-3">
                                <img 
                                  src={getImageSrc(item.src)} 
                                  alt={item.title} 
                                  className="h-40 w-full object-cover rounded border border-border"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities Section */}
                  {activeSection === 'activities' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addActivity}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Activity
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {mainActivities.map((activity) => (
                          <div key={activity.id} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-start justify-between mb-3">
                              <input 
                                value={activity.title} 
                                onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                                className="flex-1 text-lg font-medium text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                                placeholder="Activity Title"
                                disabled={isUploading}
                              />
                              <button 
                                onClick={()=>removeActivity(activity.id)} 
                                className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                disabled={isUploading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                                <input 
                                  value={activity.date} 
                                  onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                                  placeholder="Date"
                                  disabled={isUploading}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Time</label>
                                <input 
                                  value={activity.time} 
                                  onChange={(e)=>updateActivity(activity.id, { time: e.target.value })} 
                                  className="w-full px-3 py-2 rounded border border-border bg-background" 
                                  placeholder="Time"
                                  disabled={isUploading}
                                />
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <label className="block text-xs text-muted-foreground mb-1">Location</label>
                              <input 
                                value={activity.location} 
                                onChange={(e)=>updateActivity(activity.id, { location: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-border bg-background" 
                                placeholder="Location"
                                disabled={isUploading}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Description</label>
                              <textarea 
                                value={activity.description} 
                                onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-border bg-background" 
                                placeholder="Description"
                                rows={2}
                                disabled={isUploading}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracurricular Section */}
                  {activeSection === 'extracurricular' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addExtracurricularActivity}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Extracurricular
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {extracurricularActivities.map((activity) => (
                          <div key={activity.id} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-start justify-between mb-3">
                              <input 
                                value={activity.title} 
                                onChange={(e)=>updateActivity(activity.id, { title: e.target.value })} 
                                className="flex-1 text-lg font-medium text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                                placeholder="Activity Title"
                                disabled={isUploading}
                              />
                              <button 
                                onClick={()=>removeActivity(activity.id)} 
                                className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                disabled={isUploading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            <div className="mb-3">
                              <label className="block text-xs text-muted-foreground mb-1">Date/Season</label>
                              <input 
                                value={activity.date} 
                                onChange={(e)=>updateActivity(activity.id, { date: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-border bg-background" 
                                placeholder="e.g., All year round"
                                disabled={isUploading}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Description</label>
                              <textarea 
                                value={activity.description} 
                                onChange={(e)=>updateActivity(activity.id, { description: e.target.value })} 
                                className="w-full px-3 py-2 rounded border border-border bg-background" 
                                placeholder="Description"
                                rows={3}
                                disabled={isUploading}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gallery Section */}
                  {activeSection === 'gallery' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addGalleryYear}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Year
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">Select Year</label>
                        <div className="flex flex-wrap gap-2">
                          {galleryData.map((year) => (
                            <button
                              key={year.year}
                              onClick={() => {
                                setSelectedGalleryYear(year.year);
                                setSelectedGalleryFolder("");
                              }}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                selectedGalleryYear === year.year
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-background border border-border text-foreground"
                              }`}
                              disabled={isUploading}
                            >
                              {year.year}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGalleryYear(year.year);
                                }}
                                className="text-xs hover:text-destructive"
                              >
                                <Trash2 size={14} />
                              </button>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedGalleryYear && (
                        <>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-foreground">Folders in {selectedGalleryYear}</label>
                              <button 
                                onClick={addGalleryFolder}
                                className="flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90"
                                disabled={isUploading}
                              >
                                <FolderPlus size={14} />
                                Add Folder
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
                                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    selectedGalleryFolder === folder.name
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-background border border-border text-foreground"
                                  }`}
                                  disabled={isUploading}
                                >
                                  <FolderOpen size={14} />
                                  {folder.name}
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                    {folder.images.length}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeGalleryFolder(folder.name);
                                    }}
                                    className="text-xs hover:text-destructive"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </button>
                              ))}
                            </div>
                          </div>

                          {selectedGalleryFolder && (
                            <>
                              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <label className="block text-sm font-medium text-blue-800 mb-2">
                                  Upload to {selectedGalleryFolder}
                                </label>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple 
                                  onChange={(e) => handleGalleryImageUpload(e, selectedGalleryFolder)} 
                                  className="w-full"
                                  disabled={isUploading}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Images in {selectedGalleryFolder}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  {galleryData.find(y => y.year === selectedGalleryYear)
                                    ?.folders.find(f => f.name === selectedGalleryFolder)
                                    ?.images.map((image, idx) => (
                                      <div key={image.id} className="relative">
                                        <img 
                                          src={getImageSrc(image.src)} 
                                          alt={image.title} 
                                          className="h-32 w-full object-cover rounded border border-border"
                                        />
                                        <div className="mt-2 text-sm truncate">{image.title}</div>
                                        <button
                                          onClick={() => removeGalleryImage(selectedGalleryFolder, idx)}
                                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                                          disabled={isUploading}
                                        >
                                          ×
                                        </button>
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

                  {/* Team Section - IMPROVED */}
                  {activeSection === 'team' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addTeamMember}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Team Member
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(editing.team || data.team || []).map((member, idx) => (
                          <div key={idx} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-primary overflow-hidden flex items-center justify-center border-2 border-border">
                                  {member.image ? (
                                    <img 
                                      src={getImageSrc(member.image)} 
                                      alt={member.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <UserCircle size={40} className="text-muted-foreground" />
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
                                {member.image && (
                                  <button
                                    onClick={() => updateTeamMember(idx, { image: '' })}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                                    disabled={isUploading}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <input 
                                      value={member.name} 
                                      onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} 
                                      className="text-xl font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full" 
                                      placeholder="Full Name"
                                      disabled={isUploading}
                                    />
                                    <input 
                                      value={member.role} 
                                      onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} 
                                      className="text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full mt-1" 
                                      placeholder="Position/Role"
                                      disabled={isUploading}
                                    />
                                  </div>
                                  <button 
                                    onClick={()=>removeTeamMember(idx)} 
                                    className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                    disabled={isUploading}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sponsors Section */}
                  {activeSection === 'sponsors' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addSponsor}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Sponsor
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(editing.sponsors || data.sponsors || []).map((sponsor, idx) => (
                          <div key={idx} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center">
                                  {sponsor.image ? (
                                    <img 
                                      src={getImageSrc(sponsor.image)} 
                                      alt={sponsor.name} 
                                      className="w-full h-full object-contain p-2"
                                    />
                                  ) : (
                                    <div className="text-muted-foreground text-xs text-center p-2">
                                      Sponsor Logo
                                    </div>
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
                                {sponsor.image && (
                                  <button
                                    onClick={() => updateSponsor(idx, { image: '' })}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                                    disabled={isUploading}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <input 
                                      value={sponsor.name} 
                                      onChange={(e)=>updateSponsor(idx, { name: e.target.value })} 
                                      className="text-lg font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full" 
                                      placeholder="Sponsor Name"
                                      disabled={isUploading}
                                    />
                                    <input 
                                      value={sponsor.url} 
                                      onChange={(e)=>updateSponsor(idx, { url: e.target.value })} 
                                      className="text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full mt-1" 
                                      placeholder="https://example.com"
                                      disabled={isUploading}
                                    />
                                  </div>
                                  <button 
                                    onClick={()=>removeSponsor(idx)} 
                                    className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                    disabled={isUploading}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hero Images Section */}
                  {activeSection === 'hero' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Upload Hero Images (Slideshow)
                        </label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handleHeroImagesUpload} 
                          className="w-full"
                          disabled={isUploading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Current Hero Images ({(editing.heroImages || data.heroImages || []).length})
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(editing.heroImages || data.heroImages || []).map((url, i)=> (
                            <div key={i} className="relative">
                              <img 
                                src={getImageSrc(url)} 
                                alt={`hero-${i}`} 
                                className="h-32 w-full object-cover rounded-lg border border-border"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                Image {i + 1}
                              </div>
                              <button
                                onClick={() => removeHeroImage(i)}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                                disabled={isUploading}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services Section */}
                  {activeSection === 'services' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={addService}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                          Add Stream
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(editing.services || data.services || []).map((svc, sIdx) => (
                          <div key={sIdx} className="border border-border rounded-lg p-4 bg-background">
                            <div className="flex items-center justify-between mb-3">
                              <input 
                                value={svc.category} 
                                onChange={(e)=>updateService(sIdx, { category: e.target.value })} 
                                className="text-lg font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 p-0 flex-1" 
                                placeholder="Stream Name"
                                disabled={isUploading}
                              />
                              <button 
                                onClick={()=>removeService(sIdx)} 
                                className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                                disabled={isUploading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {(svc.subjects || []).map((sub: any, subIdx: number) => (
                                <div key={subIdx} className="flex items-center gap-2">
                                  <input 
                                    value={sub.name} 
                                    onChange={(e)=>updateSubject(sIdx, subIdx, { name: e.target.value })} 
                                    className="flex-1 px-3 py-2 rounded border border-border bg-background" 
                                    placeholder="Subject Name"
                                    disabled={isUploading}
                                  />
                                  <input 
                                    value={sub.passMark} 
                                    onChange={(e)=>updateSubject(sIdx, subIdx, { passMark: e.target.value })} 
                                    className="w-24 px-3 py-2 rounded border border-border bg-background" 
                                    placeholder="Pass Mark"
                                    disabled={isUploading}
                                  />
                                  <button 
                                    onClick={()=>removeSubject(sIdx, subIdx)} 
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded"
                                    disabled={isUploading}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={()=>addSubject(sIdx)} 
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded hover:bg-accent/20"
                                disabled={isUploading}
                              >
                                <Plus size={14} />
                                Add Subject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Panel - Takes full right side */}
              <div className="space-y-6">
                <div className="sticky top-6 bg-card rounded-xl p-4 shadow-card border border-border z-10">
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
                  <p className="text-sm text-muted-foreground">
                    Preview updates automatically as you edit.
                  </p>
                </div>
                
                <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                  {renderPreview()}
                </div>
                
                {/* Always show footer in preview */}
                <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                  <Footer />
                </div>
              </div>
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

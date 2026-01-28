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

  // ✅ Use environment variables instead of hardcoding
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dn2inh6kt';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enkomokazini-signed-upload';

  useEffect(() => {
    const onUpdate = (e: CustomEvent) => {
      const updatedData = e?.detail || loadSiteData();
      setData(updatedData);
      setEditing(updatedData);
    };
    
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

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

      // Generate a unique public ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      let safeName = 'image';
      
      if (name) {
        safeName = name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .substring(0, 50);
      }
      
      // Determine folder based on type
      const folders = {
        team: 'enkomokazini/team/',
        sponsor: 'enkomokazini/sponsors/',
        hero: 'enkomokazini/hero/',
        school: 'enkomokazini/'
      };
      
      const folder = folders[type] || 'enkomokazini/';
      
      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      
      // For signed uploads, you can also add tags
      formData.append('tags', `enkomokazini_${type}`);
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      
      console.log('📤 Uploading to Cloudinary...', {
        cloudName,
        uploadPreset,
        file: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        folder
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
          description: `Image uploaded to Cloudinary ${folder}`,
        });
        
        return result.secure_url;
      } else {
        console.error('❌ Cloudinary upload failed:', result);
        
        // Check specific error types
        if (result.error?.message?.includes('unsigned')) {
          toast({
            title: "Upload preset configuration issue",
            description: "Please ensure your Cloudinary preset is set to 'Signed' mode",
            variant: "destructive"
          });
        } else if (result.error?.message?.includes('limit')) {
          toast({
            title: "Storage limit reached",
            description: "Your Cloudinary storage may be full",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Upload failed",
            description: result.error?.message || 'Unknown error occurred',
            variant: "destructive"
          });
        }
        
        throw new Error(result.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Fallback to data URL
      toast({
        title: "Cloudinary upload failed",
        description: "Using browser storage as fallback",
        variant: "default"
      });
      
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

  // ... rest of your component functions remain similar ...

  // Update the Cloudinary info display
  return (
    <div className="min-h-screen bg-secondary">
      {/* ... rest of your JSX ... */}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Cloudinary Info:</h3>
        <p className="text-xs text-blue-700">
          Images upload directly to Cloudinary. Check browser console (F12) for upload logs.
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Cloud Name: <code className="bg-blue-100 px-1">{cloudName}</code>
          {cloudName === 'dn2inh6kt' && (
            <span className="ml-2 text-amber-600 text-xs">(Using default)</span>
          )}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Upload Preset: <code className="bg-blue-100 px-1">{uploadPreset}</code>
          {uploadPreset === 'enkomokazini-signed-upload' && (
            <span className="ml-2 text-amber-600 text-xs">(Using default)</span>
          )}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          <strong>Environment:</strong> {import.meta.env.MODE}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          <strong>IMPORTANT:</strong> Make sure your preset is set to "Signed" mode in Cloudinary settings.
        </p>
      </div>
      
      {/* ... rest of your JSX ... */}
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

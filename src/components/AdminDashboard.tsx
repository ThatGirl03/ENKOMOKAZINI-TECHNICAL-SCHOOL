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

const uploadImage = async (file: File) => {
    // Validate file exists and is an image
    if (!file || !file.type.startsWith('image/')) {
        console.error('Invalid file type. Please upload an image.');
        return await fileToDataUrl(file);
    }
    
    // Check file size if needed (e.g., limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        console.error('File too large. Maximum size is 5MB.');
        return await fileToDataUrl(file);
    }

    // try server upload first
    try {
        const fd = new FormData();
        fd.append("file", file);
        
        const headers: Record<string, string> = {};
        if (serverToken) {
            headers["x-admin-token"] = serverToken;
        }
        
        // Add content-type for FormData (browser will set this automatically with boundary)
        // headers["Content-Type"] = "multipart/form-data"; // Don't set this manually
        
        const res = await fetch("/api/upload", { 
            method: "POST", 
            body: fd, 
            headers 
        });
        
        if (res.ok) {
            const json = await res.json();
            
            // Validate response has URL
            if (json && json.url) {
                return json.url as string;
            } else {
                console.error('Server response missing URL field:', json);
                throw new Error('Invalid server response');
            }
        } else {
            // Log server error details
            console.error(`Upload failed with status ${res.status}: ${res.statusText}`);
            const errorText = await res.text();
            console.error('Server error response:', errorText);
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        // fallback to data URL
        console.error('Upload failed, falling back to data URL:', e);
        return await fileToDataUrl(file);
    }
};

  const handleSave = async () => {
    // ensure arrays
    const payload = { ...loadSiteData(), ...editing } as SiteData;
    const nextLocal = saveSiteData(payload);
    if (nextLocal) setData(nextLocal as SiteData);

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
      } else {
        toast({ title: "Saved locally", description: "Server not available, changes saved in browser." });
      }
    } catch (e) {
      toast({ title: "Saved locally", description: "Server not available, changes saved in browser." });
    }
  };

  const handleReset = () => {
    resetSiteData();
    const sd = loadSiteData();
    setData(sd);
    setEditing(sd);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      urls.push(await uploadImage(f));
    }
    setEditing({ ...editing, heroImages: urls });
  };

  // Team editors
  const addTeamMember = () => {
    const t = editing.team ? [...editing.team] : [];
    t.push({ name: "New Member", role: "", initials: "" });
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
  };
  const removeSponsor = (index: number) => {
    const s = editing.sponsors ? [...editing.sponsors] : [];
    s.splice(index, 1);
    setEditing({ ...editing, sponsors: s });
  };

  const handleSponsorImage = async (index: number, file?: File) => {
    if (!file) return;
    const url = await uploadImage(file);
    updateSponsor(index, { image: url });
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
    const url = await uploadImage(file);
    setEditing({ ...editing, schoolImage: url });
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-card">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Edit site content — changes save to local browser storage</p>
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
                <input value={serverToken} onChange={(e)=>setServerToken(e.target.value)} placeholder="x-admin-token for server" className="w-full px-3 py-2 rounded border border-border bg-background" />
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
                <input value={editing.passRate || ""} onChange={(e)=>setEditing({...editing, passRate: e.target.value})} className="w-full px-3 py-2 rounded border border-border bg-background" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Team Members</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {(editing.team || data.team || []).map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary overflow-hidden flex items-center justify-center">
                          {m.image ? (
                            <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-accent-foreground font-bold">{m.initials || m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input value={m.name} onChange={(e)=>updateTeamMember(idx, { name: e.target.value })} className="px-2 py-2 rounded border border-border bg-background" />
                          <input value={m.role} onChange={(e)=>updateTeamMember(idx, { role: e.target.value })} className="px-2 py-2 rounded border border-border bg-background" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="file" accept="image/*" onChange={async (e)=>{ if(e.target.files && e.target.files[0]){ const url = await uploadImage(e.target.files[0]); updateTeamMember(idx, { image: url }); } }} />
                          <button onClick={()=>removeTeamMember(idx)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={addTeamMember} className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded">Add Member</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Sponsors</label>
                <div className="space-y-2">
                  {(editing.sponsors || data.sponsors || []).map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={s.name} onChange={(e)=>updateSponsor(idx, { name: e.target.value })} className="flex-1 px-2 py-2 rounded border border-border bg-background" />
                      <input value={s.url || ""} onChange={(e)=>updateSponsor(idx, { url: e.target.value })} className="w-48 px-2 py-2 rounded border border-border bg-background" />
                      <input type="file" accept="image/*" onChange={async (e)=>{ if(e.target.files && e.target.files[0]) await handleSponsorImage(idx, e.target.files[0]); }} />
                      <button onClick={()=>removeSponsor(idx)} className="px-3 py-2 bg-destructive text-destructive-foreground rounded">Remove</button>
                    </div>
                  ))}
                  <button onClick={addSponsor} className="mt-2 px-3 py-2 bg-accent text-accent-foreground rounded">Add Sponsor</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hero Images (upload multiple)</label>
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(editing.heroImages || data.heroImages || []).map((u, i)=> (
                    <img key={i} src={u} alt={`hero-${i}`} className="h-20 object-cover rounded" />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">School Image (used in About)</label>
                <input type="file" accept="image/*" onChange={async (e)=>{ if(e.target.files && e.target.files[0]) await handleSchoolImage(e.target.files[0]); }} />
                <div className="mt-2">
                  <img src={editing.schoolImage || data.schoolImage || (data.heroImages && data.heroImages[0]) || ''} alt="school" className="h-28 object-cover rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Services (Streams) — edit subjects and pass marks</label>
                <div className="space-y-3">
                  {(editing.services || data.services || []).map((svc, sIdx) => (
                    <div key={sIdx} className="border border-border rounded p-3 bg-background">
                      <div className="flex items-center gap-2">
                        <input value={svc.category} onChange={(e)=>updateService(sIdx, { category: e.target.value })} className="flex-1 px-2 py-2 rounded border border-border bg-background" />
                        <button onClick={()=>removeService(sIdx)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded">Remove</button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(svc.subjects || []).map((sub: any, subIdx: number) => (
                          <div key={subIdx} className="flex gap-2 items-center">
                            <input value={sub.name} onChange={(e)=>updateSubject(sIdx, subIdx, { name: e.target.value })} className="flex-1 px-2 py-2 rounded border border-border bg-background" />
                            <input value={sub.passMark} onChange={(e)=>updateSubject(sIdx, subIdx, { passMark: e.target.value })} className="w-28 px-2 py-2 rounded border border-border bg-background" />
                            <button onClick={()=>removeSubject(sIdx, subIdx)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded">Remove</button>
                          </div>
                        ))}
                        <div className="mt-2">
                          <button onClick={()=>addSubject(sIdx)} className="px-3 py-2 bg-accent text-accent-foreground rounded">Add Subject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button onClick={addService} className="px-3 py-2 bg-accent text-accent-foreground rounded">Add Stream</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Services UI Settings</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={(editing.ui && editing.ui.servicesPreviewCount) || (data.ui && data.ui.servicesPreviewCount) || 6} onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), servicesPreviewCount: Number(e.target.value)}})} className="px-2 py-2 rounded border border-border bg-background" />
                  <input value={(editing.ui && editing.ui.badgeColor) || (data.ui && data.ui.badgeColor) || 'blue'} onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), badgeColor: e.target.value}})} className="px-2 py-2 rounded border border-border bg-background" />
                  <input type="number" value={(editing.ui && editing.ui.transitionMs) || (data.ui && data.ui.transitionMs) || 300} onChange={(e)=>setEditing({...editing, ui: {...(editing.ui||data.ui||{}), transitionMs: Number(e.target.value)}})} className="px-2 py-2 rounded border border-border bg-background" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Preview count, badge color (name), and transition duration (ms)</p>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-accent text-accent-foreground rounded">Save</button>
                <button onClick={handleReset} className="px-4 py-2 bg-destructive text-destructive-foreground rounded">Reset</button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
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
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

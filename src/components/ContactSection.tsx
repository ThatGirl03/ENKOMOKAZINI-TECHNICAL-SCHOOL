import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadSiteData } from "@/lib/siteData";

export const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const sd = loadSiteData();
    setPhone(sd.phone || "");
    setAddress(sd.address || "");
    setPostal(sd.postal || "");
    setSchoolName(sd.schoolName || "");

    const onUpdate = (e: any) => {
      const next = e?.detail || loadSiteData();
      setPhone(next.phone || "");
      setAddress(next.address || "");
      setPostal(next.postal || "");
      setSchoolName(next.schoolName || "");
    };
    window.addEventListener("siteDataUpdated", onUpdate as EventListener);
    return () => window.removeEventListener("siteDataUpdated", onUpdate as EventListener);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Open user's mail client with prefilled recipient, fixed subject,
    // message body containing only the message and the sender's name at the end.
    const recipients = ['enkomokazinitechnical@gmail.com'];
    const subject = encodeURIComponent('COLLABORATION/SPONSORSHIP OPPORTUNITY');
    const bodyLines = [
      formData.message || '',
      '',
      'Kind regards,',
      formData.name || '',
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailto = `mailto:${recipients.join(',')}?subject=${subject}&body=${body}`;
    // Open the mail client. Use window.location to trigger default mail app.
    window.location.href = mailto;
    // Clear the form so the user's input disappears once they go to their email client.
    setFormData({ name: '', email: '', message: '' });
    // Notify the user the mail client is opening.
    toast({ title: 'Opening mail app', description: 'Your email client will open so you can review and send the message.' });
  };

  return (
    <section id="contact" className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Contact <span className="text-accent">Us</span>
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info & Map */}
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-accent mb-6">
                Get in Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Administration Officer: Ms PG Mbatha </p>
                    <p className="text-primary-foreground/80">+27 72 604 1779</p>
                    <p className="text-primary-foreground/60 text-sm">enkomokazinitechnical@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                      <p className="font-semibold">School Email</p>
                      <p className="text-primary-foreground/80">{loadSiteData().contactEmail}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-primary-foreground/80">Enkomokazini Technical High School</p>
                    <p className="text-primary-foreground/60 text-sm">Loskop Road,Loskop,Escourt,3310</p>
                    <p className="text-primary-foreground/60 text-sm">P.O.Box 4050,Estcourt,3310</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="rounded-xl overflow-hidden shadow-elevated border-2 border-accent/30">
              <iframe
                src="https://www.google.com/maps?q=Enkomokazini%20Technical%20High%20School%20Loskop%20Road%20Estcourt&output=embed"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Enkomokazini Technical High School Location"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card text-card-foreground rounded-xl p-8 shadow-elevated">
            <h3 className="font-serif text-2xl font-semibold text-accent mb-6">
              Send Us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name and Surname
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold transition-all hover:shadow-gold-glow hover:scale-[1.02]"
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

import { SEOHead } from '../components/SEOHead';
import { SiteData } from '../types/siteData';
import { Award, Target, Users, BookOpen, MapPin, Phone, Mail } from "lucide-react";

export function AboutPage({ data }: { data: SiteData }) {
  return (
    <>
      <SEOHead 
        data={data}
        pageTitle="About Our School"
        pageDescription={`Learn about ${data.schoolName} - our mission, vision, history, and achievements as a leading technical school in Estcourt, KwaZulu-Natal.`}
      />
      
      <div className="about-page min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="text-accent">{data.shortName || data.schoolName}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {data.tagline}
            </p>
          </div>

          {/* School Description */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="prose prose-lg max-w-none bg-card rounded-2xl p-8 shadow-card border border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Our School</h2>
              {data.description?.split('\n\n').map((para, idx) => (
                <p key={idx} className="mb-4 text-justify leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-card rounded-xl p-6 text-center border border-border hover:shadow-elevated transition-shadow">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Pass Rate</h3>
              <p className="text-3xl font-bold text-accent">{data.passRate || "100%"}</p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border hover:shadow-elevated transition-shadow">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Total Learners</h3>
              <p className="text-3xl font-bold text-accent">
                {data.stats?.find(s => s.label.includes("Learner"))?.value || "875"}
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border hover:shadow-elevated transition-shadow">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <BookOpen className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Teaching Staff</h3>
              <p className="text-3xl font-bold text-accent">
                {data.stats?.find(s => s.label.includes("Teacher"))?.value || "25+"}
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border hover:shadow-elevated transition-shadow">
              <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                <Target className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Founded</h3>
              <p className="text-3xl font-bold text-accent">2013</p>
            </div>
          </div>

          {/* Mission & Vision Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Enkomokazini Technical High School envisions a future where learners are empowered to reach their full potential, particularly in technical and vocational fields, while also excelling in the broader academic curriculum.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To provide a learning environment that fosters discipline, mutual trust, hard work, and exemplary leadership, all within the context of preparing learners for the South African workforce and contributing to the nation's development.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-2xl p-8 border border-border max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Address</h3>
                  <p className="text-muted-foreground">{data.address}</p>
                  <p className="text-muted-foreground">{data.postal}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <p className="text-muted-foreground">{data.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="text-muted-foreground">{data.contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Leadership</h3>
                  <p className="text-muted-foreground">Principal: {data.principal}</p>
                  <p className="text-muted-foreground">Deputy Principal: {data.deputyPrincipal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

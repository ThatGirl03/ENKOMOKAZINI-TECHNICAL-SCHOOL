import { Calendar, MapPin, Clock } from "lucide-react";

// Activities supplied by the school — keep layout unchanged
const activities = [
  { title: "School re-opening", date: "14 January", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Registration Finalization", date: "12 - 14 January", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Grade 8 Orientation", date: "January (TBC)", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Grade 12 Parents meeting", date: "January (TBC)", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Athletics season", date: "February - April", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Sports season", date: "April - October", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Culture", date: "June - September", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Chess", date: "All year round", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Debate", date: "All year round", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Grade 10 Tourism Trip", date: "April (TBC)", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
  { title: "Grade 11 Tourism Trip", date: "June (TBC)", time: "T.B.C", location: "Enkomokazini Technical High School", description: "" },
];

export const ActivitiesSection = () => {
  return (
    <section id="activities" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            School <span className="text-accent">Activities</span>
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto rounded-full" />
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our upcoming events and activities throughout the academic year.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {activities.map((activity, index) => {
            const parts = activity.date ? activity.date.split(" ") : ["T.B.C"];
            const first = parts[0] || "";
            const rest = parts.slice(1).join(" ") || "";
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-primary rounded-xl flex flex-col items-center justify-center" style={{ color: '#D4AF37' }}>
                    <span className="text-[10px] font-semibold leading-tight text-center">{first}</span>
                    <span className="text-[10px] font-semibold leading-tight text-center">{rest}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">{activity.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-accent" />
                        {activity.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-accent" />
                        {activity.location}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Extracurricular Activities */}
        <div className="mt-12 text-center">
          <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Extracurricular <span className="text-accent">Activities</span>
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            We provide a variety of extracurricular programmes, sports, culture and clubs, designed to build skills, teamwork and confidence. All learners are encouraged to take part; visit the sports or co-curricular office to sign up or try a session.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-6">
            {/* Chess Club */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border group">
              <img src="/assets/Activities/CA5.jpeg" alt="Chess Club" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Enkomokazini Chess Club</h4>
              <p className="text-sm text-muted-foreground">A strategic club that builds critical thinking and focus. Weekly practice and friendly competitions, all learners welcome.</p>
            </div>

           {/* Debating Society */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border group">
              <img src="/assets/Activities/CA7.jpeg" alt="Debating Society" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Debating Society</h4>
              <p className="text-sm text-muted-foreground">Public speaking and debating practice and competitions.</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA3.jpeg" alt="Gospel" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Gospel</h4>
              <p className="text-sm text-muted-foreground">Choir and contemporary gospel music activities. Rehearse regularly and perform uplifting sets for assemblies, services and special events.</p>
            </div>

            {/* Culture sub-activities - ordered: Ingoma, Amahubo, Umshado, Gospel */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA1.jpeg" alt="Ingoma" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Ingoma</h4>
              <p className="text-sm text-muted-foreground">Ingoma is a percussive and vocal traditional performances that celebrate our musical heritage. Join rehearsals to learn rhythms, singing techniques and stage performance.</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA2.jpeg" alt="Amahubo" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Amahubo</h4>
              <p className="text-sm text-muted-foreground">Amahubo, a choir-style group focusing on hymns and praise songs. Perform at school events and community gatherings; all voices welcome, no prior experience required.</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA6.jpeg" alt="Umshado" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Umshado</h4>
              <p className="text-sm text-muted-foreground">Umshado, traditional wedding dance and performance group that explores cultural choreography and costume. Learn steps, teamwork and perform at cultural showcases.</p>
            </div>

          {/* Soccer */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA4.jpeg" alt="Soccer" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Soccer</h4>
              <p className="text-sm text-muted-foreground">Teams: U/14, U/15, U/16 &amp; 17, U/19. Regular training and fixtures, trials at term start; all skill levels welcome.</p>
            </div>

           {/* Netball */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border group relative overflow-hidden hover:shadow-elevated transition-all">
              <img src="/assets/Activities/CA3.jpeg" alt="Netball" loading="lazy" className="w-full h-48 object-cover rounded-md mb-4 relative z-0 group-hover:z-20 group-hover:scale-105 transform transition-all duration-300" />
              <h4 className="font-semibold text-lg mb-2">Netball</h4>
              <p className="text-sm text-muted-foreground">Teams: U/14, U/16/17, U/19. Coached training and inter-school matches, attend trials or see the sports coordinator to join.</p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

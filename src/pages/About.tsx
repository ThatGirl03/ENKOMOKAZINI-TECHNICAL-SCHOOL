import { SEOHead } from '../components/SEOHead';
import { SiteData } from '../types/siteData';

export function AboutPage({ data }: { data: SiteData }) {
  return (
    <>
      <SEOHead 
        data={data}
        pageTitle="About Our School"
        pageDescription={`Learn about ${data.schoolName} - our mission, vision, and history as a leading technical school in Estcourt, KwaZulu-Natal.`}
      />
      
      <div className="about-page">
        <h1>About {data.schoolName}</h1>
        <div className="school-description">
          {data.description?.split('\n\n').map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
        
        {/* School Stats */}
        <div className="school-stats">
          <h2>School Statistics</h2>
          <div className="stats-grid">
            {data.stats?.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Leadership */}
        <div className="leadership-section">
          <h2>School Leadership</h2>
          <div className="leaders">
            <div className="leader">
              <h3>Principal</h3>
              <p>{data.principal}</p>
            </div>
            <div className="leader">
              <h3>Deputy Principal</h3>
              <p>{data.deputyPrincipal}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

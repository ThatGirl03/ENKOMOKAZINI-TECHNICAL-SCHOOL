import { SiteData } from '../types/siteData';

interface SEOHeadProps {
  data: SiteData;
  pageTitle?: string;
  pageDescription?: string;
}

export function SEOHead({ data, pageTitle, pageDescription }: SEOHeadProps) {
  const fullTitle = pageTitle 
    ? `${pageTitle} | ${data.schoolName}`
    : `${data.schoolName} | ${data.tagline}`;
    
  const fullDescription = pageDescription || data.description || '';
  
  return (
    <>
      {/* Dynamic Title */}
      <title>{fullTitle}</title>
      
      {/* Dynamic Description */}
      <meta name="description" content={fullDescription.substring(0, 160)} />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://enkomokazinitech.co.za" />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription.substring(0, 160)} />
      <meta property="og:url" content="https://enkomokazinitech.co.za" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={data.schoolName} />
      
      {/* Structured Data - JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HighSchool",
          "name": data.schoolName,
          "alternateName": data.shortName,
          "description": data.description?.substring(0, 200),
          "url": "https://enkomokazinitech.co.za",
          "logo": "https://enkomokazinitech.co.za/assets/School-Logo.jpeg",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Loskop Road",
            "addressLocality": "Estcourt",
            "addressRegion": "KwaZulu-Natal",
            "postalCode": "3310",
            "addressCountry": "ZA"
          },
          "telephone": data.phone,
          "email": data.contactEmail,
          "foundingDate": "2013",
          "slogan": data.tagline,
          "passRate": data.passRate,
          "employee": data.team.map(member => ({
            "@type": "Person",
            "name": member.name,
            "jobTitle": member.role
          })).slice(0, 10) // Limit to first 10 staff
        })}
      </script>
    </>
  );
}

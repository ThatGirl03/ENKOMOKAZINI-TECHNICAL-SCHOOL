// src/utils/sitemap.ts
export function generateSitemap(): string {
  const baseUrl = 'https://enkomokazinitech.co.za';
  const today = new Date().toISOString().split('T')[0];
  
  // For single-page app, only list the homepage
  const pages = [
    { 
      loc: '/', 
      lastmod: today, 
      priority: '1.0' 
    }
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;
}

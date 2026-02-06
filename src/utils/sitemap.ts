import { SiteData } from '../types/siteData';

export function generateSitemap(siteData: SiteData): string {
  const baseUrl = 'https://enkomokazinitech.co.za';
  const pages = [
    { loc: '/', lastmod: new Date().toISOString().split('T')[0], priority: '1.0' },
    { loc: '/about', priority: '0.9' },
    { loc: '/academics', priority: '0.9' },
    { loc: '/admissions', priority: '0.8' },
    { loc: '/contact', priority: '0.7' },
    { loc: '/staff', priority: '0.7' },
    { loc: '/programs', priority: '0.8' },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;
}

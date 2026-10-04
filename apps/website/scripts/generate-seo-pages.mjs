import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '../..');
const publicRoot = path.join(appRoot, 'public');
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, 'content/content-registry.json'), 'utf8'));
const origin = 'https://dmelania.github.io';
const basePath = '/singulary-institute/';
const siteUrl = `${origin}${basePath}`;
const symbolPath = `${siteUrl}assets/singulary-symbol.png`;

const typeLabels = {
  framework: 'Framework',
  'research-brief': 'Research Brief',
  'methodology-note': 'Methodology Note',
  explainer: 'Explainer',
};

const visiblePublications = registry.publications.filter((publication) => (
  publication.public === true
  && publication.visibility === 'public'
  && publication.websiteStatus === 'visible'
  && publication.type !== 'working-paper'
));

const categories = registry.publicationCategories.filter((category) => (
  visiblePublications.some((publication) => publication.type === category.type)
));

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function routeUrl(route = '') {
  return `${siteUrl}${route}`.replace(/([^:]\/)\/+/g, '$1');
}

function writeFile(route, html) {
  const dir = path.join(publicRoot, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function pageShell({ title, description, canonicalPath, h1, lead, body, jsonLd }) {
  const canonical = routeUrl(canonicalPath);
  const schema = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="${symbolPath}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Singulary Institute">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${symbolPath}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${symbolPath}">
  ${schema}
  <style>
    :root{color-scheme:dark;--bg:#030711;--panel:#07111f;--line:#162946;--text:#f6f8ff;--muted:#a9b7ca;--blue:#5f8dff}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 70% 8%,#0a1730 0,#030711 42%,#02050b 100%);font-family:Inter,system-ui,sans-serif;color:var(--text);line-height:1.6}
    header,main,footer{max-width:1120px;margin:0 auto;padding:28px 24px}header{display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:1px solid rgba(119,151,210,.18)}
    .brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px}.brand img{width:40px;height:40px;filter:drop-shadow(0 0 12px #2f6bff)}.brand em{font-style:normal;color:var(--blue);font-weight:500}
    nav{display:flex;gap:20px;flex-wrap:wrap}a{color:var(--blue);text-decoration:none}h1{font-size:44px;line-height:1.08;margin:42px 0 18px}h2{margin-top:34px}.lead{max-width:720px;color:#c0ccdb;font-size:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:28px}.card{background:rgba(8,18,32,.88);border:1px solid var(--line);border-radius:8px;padding:20px}.card p{color:var(--muted)}small{color:#62d7cf;text-transform:uppercase;font-weight:800}.back{display:inline-block;margin-top:26px}
    footer{border-top:1px solid rgba(119,151,210,.18);color:var(--muted)}
  </style>
</head>
<body>
  <header>
    <a class="brand" href="${siteUrl}"><img src="${symbolPath}" alt=""><span>Singulary <em>Research</em></span></a>
    <nav aria-label="Primary">
      <a href="${routeUrl('publications/')}">Publications</a>
      <a href="${routeUrl('research-areas/')}">Research Areas</a>
      <a href="${routeUrl('about/')}">About</a>
    </nav>
  </header>
  <main>
    <h1>${esc(h1)}</h1>
    <p class="lead">${esc(lead)}</p>
    ${body}
  </main>
  <footer>Singulary Institute publishes structured public research outputs on AI, institutions, risk, and decision-making.</footer>
</body>
</html>`;
}

function articleSchema(publication, canonicalPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publication.title,
    description: publication.summary,
    mainEntityOfPage: routeUrl(canonicalPath),
    publisher: {
      '@type': 'Organization',
      name: 'Singulary Institute',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: symbolPath,
      },
    },
    articleSection: typeLabels[publication.type] || 'Publication',
  };
}

function webPageSchema(name, description, canonicalPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: routeUrl(canonicalPath),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Singulary Institute',
      url: siteUrl,
    },
  };
}

function publicationCard(publication) {
  return `<article class="card">
    <small>${esc(typeLabels[publication.type] || 'Publication')}</small>
    <h2><a href="${routeUrl(`publications/${publication.slug}/`)}">${esc(publication.title)}</a></h2>
    <p>${esc(publication.summary)}</p>
  </article>`;
}

function areaCard(area) {
  return `<article class="card">
    <h2><a href="${routeUrl(`research-areas/${area.slug}/`)}">${esc(area.title)}</a></h2>
    <p>${esc(area.summary)}</p>
  </article>`;
}

const urls = [
  '',
  'publications/',
  'research-areas/',
  'about/',
  'methodology/',
  'archive/',
];

writeFile('publications', pageShell({
  title: 'Research Publications | Singulary Institute',
  description: 'Public frameworks, research briefs, explainers, and methodology notes from Singulary Institute.',
  canonicalPath: 'publications/',
  h1: 'Research publications',
  lead: 'Public frameworks, research briefs, explainers, and methodology notes from Singulary Institute.',
  body: `<section class="grid">${visiblePublications.map(publicationCard).join('\n')}</section>`,
  jsonLd: webPageSchema('Research Publications', 'Public research outputs from Singulary Institute.', 'publications/'),
}));

for (const category of categories) {
  urls.push(`publications/category/${category.type}/`);
  const publications = visiblePublications.filter((publication) => publication.type === category.type);
  writeFile(`publications/category/${category.type}`, pageShell({
    title: `${category.title} | Singulary Institute`,
    description: category.summary,
    canonicalPath: `publications/category/${category.type}/`,
    h1: category.title,
    lead: category.summary,
    body: `<section class="grid">${publications.map(publicationCard).join('\n')}</section>`,
    jsonLd: webPageSchema(category.title, category.summary, `publications/category/${category.type}/`),
  }));
}

for (const publication of visiblePublications) {
  const area = registry.researchAreas.find((item) => item.slug === publication.researchArea);
  const canonicalPath = `publications/${publication.slug}/`;
  urls.push(canonicalPath);
  writeFile(`publications/${publication.slug}`, pageShell({
    title: `${publication.title} | Singulary Institute`,
    description: publication.summary,
    canonicalPath,
    h1: publication.title,
    lead: publication.summary,
    body: `<article class="card">
      <small>${esc(typeLabels[publication.type] || 'Publication')}${area ? ` · ${esc(area.title)}` : ''}</small>
      <h2>Central idea</h2>
      <p>${esc(publication.purpose)}</p>
      <h2>What this output explores</h2>
      <p>${esc(publication.coverage)}</p>
      <h2>Current scope</h2>
      <p>${esc(publication.currentScope)}</p>
      <a class="back" href="${routeUrl('publications/')}">Back to publications</a>
    </article>`,
    jsonLd: articleSchema(publication, canonicalPath),
  }));
}

writeFile('research-areas', pageShell({
  title: 'Research Areas | Singulary Institute',
  description: 'Public thematic lenses for Singulary Institute publications and research outputs.',
  canonicalPath: 'research-areas/',
  h1: 'Research areas',
  lead: 'Public thematic lenses for Singulary Institute publications and research outputs.',
  body: `<section class="grid">${registry.researchAreas.map(areaCard).join('\n')}</section>`,
  jsonLd: webPageSchema('Research Areas', 'Public thematic lenses for Singulary Institute.', 'research-areas/'),
}));

for (const area of registry.researchAreas) {
  const related = visiblePublications.filter((publication) => publication.researchArea === area.slug);
  const canonicalPath = `research-areas/${area.slug}/`;
  urls.push(canonicalPath);
  writeFile(`research-areas/${area.slug}`, pageShell({
    title: `${area.title} | Singulary Institute`,
    description: area.summary,
    canonicalPath,
    h1: area.title,
    lead: area.overview,
    body: `<article class="card">
      <h2>Why this area matters</h2>
      <p>${esc(area.why_it_matters)}</p>
      <h2>Methodological note</h2>
      <p>${esc(area.methodological_note)}</p>
    </article>
    <section class="grid">${related.length ? related.map(publicationCard).join('\n') : '<p>No public output is currently listed for this area.</p>'}</section>`,
    jsonLd: webPageSchema(area.title, area.summary, canonicalPath),
  }));
}

writeFile('about', pageShell({
  title: 'About Singulary Institute',
  description: 'Singulary publishes structured research outputs on signal, institutional context, decision-making, and public-interest technology questions.',
  canonicalPath: 'about/',
  h1: 'About Singulary Research',
  lead: 'Singulary publishes structured research outputs on signal, institutional context, decision-making, and public-interest technology questions.',
  body: `<section class="grid">
    <article class="card"><h2>Signal</h2><p>We identify weak signals across technology, institutions, society, work, and plausible futures.</p></article>
    <article class="card"><h2>Interpretation</h2><p>We add context, boundaries, and human judgement so noise becomes research intelligence.</p></article>
    <article class="card"><h2>Decision and consequence</h2><p>We connect analysis to institutional decisions and the consequences those decisions create.</p></article>
  </section>`,
  jsonLd: webPageSchema('About Singulary Institute', 'About Singulary Institute public research.', 'about/'),
}));

writeFile('methodology', pageShell({
  title: 'Methodology | Singulary Institute',
  description: 'Public methodology notes on how Singulary separates signals, interpretation, scope, and decision relevance.',
  canonicalPath: 'methodology/',
  h1: 'Methodology',
  lead: 'Singulary separates signals, interpretation, scope, and decision relevance in public research outputs.',
  body: `<article class="card"><p>Public methodology material clarifies how Singulary frames research boundaries, avoids unsupported claims, and distinguishes early public outputs from completed research.</p></article>`,
  jsonLd: webPageSchema('Methodology', 'Public methodology notes from Singulary Institute.', 'methodology/'),
}));

writeFile('archive', pageShell({
  title: 'Archive | Singulary Institute',
  description: 'Public archive index for Singulary Institute research outputs.',
  canonicalPath: 'archive/',
  h1: 'Archive',
  lead: 'The public archive keeps Singulary research outputs discoverable over time.',
  body: `<section class="grid">${visiblePublications.map(publicationCard).join('\n')}</section>`,
  jsonLd: webPageSchema('Archive', 'Public archive index for Singulary Institute.', 'archive/'),
}));

fs.writeFileSync(path.join(publicRoot, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${routeUrl('sitemap.xml')}
`);

const uniqueUrls = [...new Set(urls)];
const now = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(publicRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url>
    <loc>${routeUrl(url)}</loc>
    <lastmod>${now}</lastmod>
  </url>`).join('\n')}
</urlset>
`);

fs.writeFileSync(path.join(publicRoot, 'site.webmanifest'), JSON.stringify({
  name: 'Singulary Institute',
  short_name: 'Singulary',
  start_url: basePath,
  display: 'minimal-ui',
  background_color: '#030711',
  theme_color: '#030711',
  icons: [
    {
      src: `${basePath}assets/singulary-symbol.png`,
      sizes: '512x512',
      type: 'image/png',
    },
  ],
}, null, 2));

console.log(`Generated ${uniqueUrls.length} SEO URLs.`);

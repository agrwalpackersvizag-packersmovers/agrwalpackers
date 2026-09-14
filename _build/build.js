#!/usr/bin/env node
/**
 * Agarwal Packers Movers India — static site builder.
 *
 *   node _build/build.js
 *
 * Reads page content fragments from _src/pages/**, wraps them in the shared
 * layout, generates meta tags, JSON-LD, breadcrumbs, FAQ blocks and sitemap.xml,
 * and writes plain static .html files to the web root.
 *
 * WHY A BUILD STEP: the header, footer, schema and CTA blocks live in exactly one
 * file each. Adding a new city later means adding one content file — not copying
 * a 400-line template and hoping every link and canonical was updated.
 *
 * Output is 100% static HTML. No PHP or JS is needed to render any page.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, '_src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const site = require(path.join(SRC, 'site.js'));

const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* ── helpers ─────────────────────────────────────────────────────────────── */
const read = (p) => fs.readFileSync(p, 'utf8');
const partial = (name) => read(path.join(PARTIALS, name + '.html'));
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const jsonEsc = (s) => JSON.stringify(String(s)).slice(1, -1);
const abs = (u) => (/^https?:/.test(u) ? u : site.origin + u);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

/* ── shared fragments ────────────────────────────────────────────────────── */
const LAYOUT = partial('layout');
const HEADER = partial('header');
const FOOTER = partial('footer');
const STICKY = partial('sticky-cta');
const FORM_FULL = partial('quote-form');
const FORM_COMPACT = partial('quote-form-compact');
const REVIEWS = partial('reviews');
const CTA = partial('cta');
const TRUST = partial('trust');

const WHATSAPP_URL =
  'https://wa.me/' + site.whatsappNumber + '?text=' + encodeURIComponent(site.whatsappText);

/* ── placeholder renderers (never invent data) ───────────────────────────── */
function statValue(v) {
  return v === null || v === undefined
    ? '<span class="placeholder">[X]+</span>'
    : esc(v) + '+';
}
function gbpLink(key, label) {
  const url = site.gbp[key];
  return url
    ? '<a href="' + esc(url) + '" target="_blank" rel="noopener" data-track="gbp_click" data-location="' +
      key + '">' + esc(label) + '</a>'
    : '<span class="placeholder">[Add verified Google Business Profile link &mdash; ' + esc(label) + ']</span>';
}

/* ── FAQ: one source of truth for the visible list AND the FAQPage schema ── */
function renderFaq(faq, heading, lead) {
  if (!faq || !faq.length) return '';
  const items = faq.map((f, i) => `
        <li class="faq-item">
          <details${i === 0 ? ' open' : ''}>
            <summary><h3>${f.q}</h3></summary>
            <div class="faq-answer">${f.a}</div>
          </details>
        </li>`).join('');
  return `<section class="section section-faq" id="faq" aria-labelledby="faq-heading">
    <div class="container container-narrow">
      <h2 id="faq-heading">${heading || 'Frequently Asked Questions'}</h2>
      ${lead ? `<p class="section-lead">${lead}</p>` : ''}
      <ul class="faq-list" role="list">${items}
      </ul>
    </div>
  </section>`;
}

/* Strip tags for schema text — schema answers must match the visible answer. */
function plain(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── breadcrumbs ─────────────────────────────────────────────────────────── */
function renderBreadcrumbs(crumbs) {
  if (!crumbs || !crumbs.length) return '';
  const trail = [{ name: 'Home', url: '/' }].concat(crumbs);
  const items = trail.map((c, i) => {
    const last = i === trail.length - 1;
    if (last || !c.url) {
      return `<li class="crumb" aria-current="page"><span>${esc(c.name)}</span></li>`;
    }
    return `<li class="crumb"><a href="${esc(c.url)}">${esc(c.name)}</a></li>`;
  }).join('');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <div class="container"><ol class="crumbs" role="list">${items}</ol></div>
</nav>`;
}

function breadcrumbSchema(crumbs, canonical) {
  if (!crumbs || !crumbs.length) return null;
  const trail = [{ name: 'Home', url: '/' }].concat(crumbs);
  return {
    '@type': 'BreadcrumbList',
    '@id': canonical + '#breadcrumb',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url ? abs(c.url) : canonical
    }))
  };
}

/* ── organisation schema ─────────────────────────────────────────────────────
   Only verifiable facts are emitted. telephone / address / openingHours /
   aggregateRating are deliberately ABSENT until real data exists — publishing
   placeholder contact data as structured data is misleading markup.
   ─────────────────────────────────────────────────────────────────────────── */
function organizationNode() {
  const node = {
    '@type': ['MovingCompany', 'Organization'],
    '@id': site.origin + '/#organization',
    name: site.name,
    url: site.origin + '/',
    description:
      'Packers and movers offering household shifting, office relocation, car and bike transportation, packing, loading, unloading and storage in Jodhpur, Noida, Visakhapatnam and Bengaluru, with intercity moves across India.',
    logo: {
      '@type': 'ImageObject',
      '@id': site.origin + '/#logo',
      url: abs(site.logo),
      contentUrl: abs(site.logo),
      caption: site.name
    },
    image: { '@id': site.origin + '/#logo' },
    telephone: site.phoneHref,
    knowsLanguage: ['en-IN', 'hi-IN'],
    areaServed: [
      { '@type': 'City', name: 'Jodhpur' },
      { '@type': 'City', name: 'Noida' },
      { '@type': 'City', name: 'Visakhapatnam' },
      { '@type': 'City', name: 'Bengaluru' },
      { '@type': 'Country', name: 'India' }
    ]
  };
  if (site.sameAs && site.sameAs.length) node.sameAs = site.sameAs;
  if (site.hoursSchema) node.openingHours = site.hoursSchema;
  return node;
}

function localBusinessNode(cityKey, canonical) {
  const c = site.cities[cityKey];
  if (!c) return null;
  const address = {
    '@type': 'PostalAddress',
    addressLocality: c.name,
    addressRegion: c.region,
    addressCountry: 'IN'
  };
  if (c.streetAddress) address.streetAddress = c.streetAddress;
  if (c.postalCode) address.postalCode = c.postalCode;

  const node = {
    '@type': 'MovingCompany',
    '@id': canonical + '#localbusiness',
    name: site.name + ' — ' + c.name,
    url: canonical,
    parentOrganization: { '@id': site.origin + '/#organization' },
    telephone: c.phoneDisplay || site.phoneHref,
    address,
    areaServed: { '@type': 'City', name: c.name },
    image: { '@id': site.origin + '/#logo' }
  };
  if (c.geo) node.geo = { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng };
  if (site.gbp[cityKey]) node.sameAs = [site.gbp[cityKey]];
  if (site.hoursSchema) node.openingHours = site.hoursSchema;
  return node;
}

function serviceNode(meta, canonical) {
  const s = meta.service;
  if (!s) return null;
  const node = {
    '@type': 'Service',
    '@id': canonical + '#service',
    name: s.name,
    serviceType: s.serviceType || s.name,
    description: s.description || meta.description,
    provider: { '@id': site.origin + '/#organization' },
    url: canonical,
    areaServed: (s.areaServed || ['Jodhpur', 'Noida', 'Visakhapatnam']).map((n) => ({
      '@type': 'City', name: n
    }))
  };
  if (s.offers) {
    node.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: s.name,
      itemListElement: s.offers.map((o) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: o }
      }))
    };
  }
  return node;
}

function buildSchema(meta, canonical, faqHtmlPresent) {
  const graph = [];
  graph.push(organizationNode());
  graph.push({
    '@type': 'WebSite',
    '@id': site.origin + '/#website',
    url: site.origin + '/',
    name: site.name,
    publisher: { '@id': site.origin + '/#organization' },
    inLanguage: 'en-IN'
  });

  const webPageType = meta.pageType === 'article' ? 'Article' : 'WebPage';
  const webPage = {
    '@type': meta.pageType === 'faq' ? 'FAQPage' : webPageType,
    '@id': canonical + '#webpage',
    url: canonical,
    name: meta.ogTitle || meta.title,
    description: meta.description,
    isPartOf: { '@id': site.origin + '/#website' },
    about: { '@id': site.origin + '/#organization' },
    inLanguage: 'en-IN'
  };
  if (meta.breadcrumbs && meta.breadcrumbs.length) {
    webPage.breadcrumb = { '@id': canonical + '#breadcrumb' };
  }
  if (meta.pageType === 'article') {
    webPage['@type'] = 'BlogPosting';
    webPage.headline = meta.h1 || meta.ogTitle || meta.title;
    webPage.datePublished = meta.datePublished || BUILD_DATE;
    webPage.dateModified = meta.dateModified || BUILD_DATE;
    webPage.author = { '@id': site.origin + '/#organization' };
    webPage.publisher = { '@id': site.origin + '/#organization' };
    webPage.mainEntityOfPage = canonical;
    webPage.image = abs(meta.ogImage || site.defaultOgImage);
  }
  graph.push(webPage);

  const bc = breadcrumbSchema(meta.breadcrumbs, canonical);
  if (bc) graph.push(bc);

  if (meta.cityKey) {
    const lb = localBusinessNode(meta.cityKey, canonical);
    if (lb) graph.push(lb);
  }

  const svc = serviceNode(meta, canonical);
  if (svc) graph.push(svc);

  /* FAQPage is emitted ONLY when the same Q&A is visible on the page. */
  if (faqHtmlPresent && meta.faq && meta.faq.length && meta.pageType !== 'faq') {
    graph.push({
      '@type': 'FAQPage',
      '@id': canonical + '#faq',
      mainEntity: meta.faq.map((f) => ({
        '@type': 'Question',
        name: plain(f.q),
        acceptedAnswer: { '@type': 'Answer', text: plain(f.a) }
      }))
    });
  } else if (faqHtmlPresent && meta.faq && meta.faq.length && meta.pageType === 'faq') {
    webPage.mainEntity = meta.faq.map((f) => ({
      '@type': 'Question',
      name: plain(f.q),
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a) }
    }));
  }

  const doc = { '@context': 'https://schema.org', '@graph': graph };
  return (
    '<!-- Structured data. Contact details, opening hours, ratings and reviews are\n' +
    '     intentionally omitted until verified business data exists. After adding\n' +
    '     real values to _src/site.js (phone, address, hoursSchema, gbp links),\n' +
    '     rebuild and they will be emitted automatically. Never add aggregateRating\n' +
    '     or Review nodes for reviews you have not genuinely received. -->\n' +
    '<script type="application/ld+json">' +
    JSON.stringify(doc, null, 2) +
    '</script>'
  );
}

/* ── page rendering ──────────────────────────────────────────────────────── */
const pages = [];
const files = walk(PAGES).sort();

for (const file of files) {
  const raw = read(file);
  const m = raw.match(/^<!--META([\s\S]*?)META-->\s*/);
  if (!m) {
    console.error('SKIP (no META block): ' + path.relative(ROOT, file));
    continue;
  }
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (e) {
    console.error('META JSON error in ' + path.relative(ROOT, file) + ': ' + e.message);
    process.exitCode = 1;
    continue;
  }
  let body = raw.slice(m[0].length);
  const canonical = abs(meta.url);
  const outFile = path.join(ROOT, meta.out);

  /* content-level tokens */
  const faqHtml = renderFaq(meta.faq, meta.faqHeading, meta.faqLead);
  body = body
    .replace(/\{\{FAQ\}\}/g, faqHtml)
    .replace(/\{\{QUOTE_FORM\}\}/g, FORM_FULL)
    .replace(/\{\{QUOTE_FORM_COMPACT\}\}/g, FORM_COMPACT)
    .replace(/\{\{TRUST\}\}/g, TRUST)
    .replace(/\{\{REVIEWS\}\}/g, REVIEWS)
    .replace(/\{\{CTA\}\}/g, CTA);

  let html = LAYOUT
    .replace('{{HEADER}}', HEADER)
    .replace('{{FOOTER}}', FOOTER)
    .replace('{{STICKY_CTA}}', STICKY)
    .replace('{{BREADCRUMBS}}', renderBreadcrumbs(meta.breadcrumbs))
    .replace('{{CONTENT}}', body)
    .replace('{{SCHEMA}}', meta.noSchema ? '' : buildSchema(meta, canonical, !!faqHtml));

  const ogImage = abs(meta.ogImage || site.defaultOgImage);
  const map = {
    TITLE: esc(meta.title),
    DESCRIPTION: esc(meta.description),
    CANONICAL: canonical,
    ROBOTS: meta.robots || 'index, follow',
    OG_TYPE: meta.pageType === 'article' ? 'article' : 'website',
    OG_TITLE: esc(meta.ogTitle || meta.title),
    OG_DESCRIPTION: esc(meta.ogDescription || meta.description),
    OG_IMAGE: ogImage,
    OG_IMAGE_ALT: esc(meta.ogImageAlt || (site.name + ' relocation services')),
    HEAD_EXTRA: meta.headExtra || '',
    BODY_CLASS: meta.bodyClass ? ' class="' + esc(meta.bodyClass) + '"' : '',
    FORM_SOURCE: esc(meta.url),
    PHONE_HREF: site.phoneHref,
    PHONE_DISPLAY: esc(site.phoneDisplay),
    WHATSAPP_URL: WHATSAPP_URL,
    EMAIL: esc(site.email),
    HOURS: esc(site.hours),
    NAME: esc(site.name),
    YEAR: String(new Date().getFullYear()),
    STAT_MOVES: statValue(site.stats.moves),
    STAT_CITIES: statValue(site.stats.cities),
    STAT_YEARS: statValue(site.stats.years),
    STAT_CUSTOMERS: statValue(site.stats.customers),
    GBP_JODHPUR: gbpLink('jodhpur', 'Jodhpur'),
    GBP_NOIDA: gbpLink('noida', 'Noida'),
    GBP_VISAKHAPATNAM: gbpLink('visakhapatnam', 'Visakhapatnam'),
    GBP_REVIEW_LINK: meta.cityKey
      ? gbpLink(meta.cityKey, site.cities[meta.cityKey].name + ' profile')
      : '<span class="placeholder">[Add verified Google Business Profile review link]</span>',
    REVIEWS_HEADING: meta.reviewsHeading || 'What our customers say',
    REVIEWS_LEAD: meta.reviewsLead ||
      'We publish reviews exactly as customers write them. This section is ready for verified reviews.',
    TRUST_HEADING: meta.trustHeading || 'Why people trust us with their move',
    TRUST_LEAD: meta.trustLead ||
      'Relocation is a business built on turning up on time and handing back what you were given. Here is how we hold ourselves to that.',
    CTA_TITLE: meta.ctaTitle || 'Ready to plan your move?',
    CTA_TEXT: meta.ctaText ||
      'Tell us what you are moving and where it needs to go. We will come back with a written estimate and a realistic timeline.'
  };

  for (const [k, v] of Object.entries(map)) {
    html = html.split('{{' + k + '}}').join(v);
  }

  ensureDir(outFile);
  fs.writeFileSync(outFile, html, 'utf8');
  pages.push({ meta, canonical, outFile, html, src: path.relative(ROOT, file) });
}

/* ── sitemap.xml ─────────────────────────────────────────────────────────── */
const indexable = pages.filter(
  (p) => !/noindex/i.test(p.meta.robots || '') && p.meta.sitemap !== false
);
const order = (u) => (u === '/' ? 0 : u.split('/').length);
indexable.sort((a, b) => order(a.meta.url) - order(b.meta.url) || a.meta.url.localeCompare(b.meta.url));

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  indexable
    .map((p) => '  <url>\n    <loc>' + p.canonical + '</loc>\n    <lastmod>' +
      (p.meta.dateModified || BUILD_DATE) + '</lastmod>\n  </url>')
    .join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log('Built ' + pages.length + ' pages (' + indexable.length + ' indexable) → sitemap.xml');

/* ── self-audit ──────────────────────────────────────────────────────────── */
const problems = [];
const seen = { title: new Map(), desc: new Map(), url: new Map(), out: new Map() };

for (const p of pages) {
  const { meta, html } = p;
  const t = meta.title, d = meta.description;

  if (!t) problems.push(p.src + ': missing title');
  if (!d) problems.push(p.src + ': missing meta description');
  if (t && t.length > 62) problems.push(p.src + ': title ' + t.length + ' chars (>62): ' + t);
  if (t && t.length < 25) problems.push(p.src + ': title only ' + t.length + ' chars');
  if (d && (d.length > 165 || d.length < 70)) {
    problems.push(p.src + ': meta description ' + d.length + ' chars (aim 70-165)');
  }
  for (const key of ['title', 'desc', 'url', 'out']) {
    const val = { title: t, desc: d, url: meta.url, out: meta.out }[key];
    if (!val) continue;
    const norm = key === 'title' || key === 'desc' ? val.toLowerCase() : val;
    if (seen[key].has(norm)) problems.push('DUPLICATE ' + key + ': ' + p.src + ' vs ' + seen[key].get(norm) + ' → ' + val);
    else seen[key].set(norm, p.src);
  }

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) problems.push(p.src + ': found ' + h1s.length + ' <h1> (expected exactly 1)');

  /* heading order: no level skipped */
  const levels = (html.match(/<h([1-6])[\s>]/g) || []).map((s) => +s.match(/\d/)[0]);
  const bodyStart = levels.indexOf(1);
  for (let i = Math.max(bodyStart, 1); i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      problems.push(p.src + ': heading jumps h' + levels[i - 1] + ' → h' + levels[i]);
      break;
    }
  }

  if (/\{\{[A-Z_]+\}\}/.test(html)) {
    problems.push(p.src + ': unreplaced token ' + html.match(/\{\{[A-Z_]+\}\}/)[0]);
  }
  /* images must declare dimensions + alt */
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\salt=/.test(img)) problems.push(p.src + ': <img> without alt → ' + img.slice(0, 90));
    if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) {
      problems.push(p.src + ': <img> without width/height (CLS risk) → ' + img.slice(0, 90));
    }
  }
}

/* internal link integrity */
const known = new Set(pages.map((p) => p.meta.url));
known.add('/sitemap.xml');
for (const p of pages) {
  const hrefs = [...p.html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)].map((m) => m[1]);
  for (const href of new Set(hrefs)) {
    if (/^\/(css|js|images|assets|forms)\//.test(href)) {
      if (!fs.existsSync(path.join(ROOT, href.replace(/^\//, '')))) {
        problems.push(p.src + ': missing asset ' + href);
      }
      continue;
    }
    if (href === '/site.webmanifest') continue;
    if (!known.has(href)) problems.push(p.src + ': internal link to unknown page ' + href);
  }
}

if (problems.length) {
  console.log('\n── SEO / build audit: ' + problems.length + ' issue(s) ──');
  problems.forEach((x) => console.log('  ! ' + x));
  process.exitCode = 1;
} else {
  console.log('SEO / build audit: no issues found.');
}

/**
 * Agarwal Packers Movers India — single source of truth for site-wide data.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  SETUP: replace every value marked PLACEHOLDER with verified business data,
 *  then run `node _build/build.js` to regenerate all HTML.
 *  Nothing here is invented — unknown values are left as obvious placeholders.
 * ────────────────────────────────────────────────────────────────────────────
 */
module.exports = {
  name: 'Agarwal Packers Movers India',
  shortName: 'Agarwal Packers Movers India',
  domain: 'agarwalpackersmoversindia.com',
  origin: 'https://agarwalpackersmoversindia.com',
  tagline: 'Professional Packers & Movers for Safe & Reliable Relocation',
  logo: '/images/agarwal-packers-movers-india-logo.svg',
  defaultOgImage: '/images/og/agarwal-packers-movers-india-relocation-services.png',

  // ── NAP — PLACEHOLDERS. Do not publish until replaced with real data. ──────
  phoneDisplay: '+91 XXXXX XXXXX',      // PLACEHOLDER
  phoneHref: '+91XXXXXXXXXX',           // PLACEHOLDER (E.164, no spaces)
  whatsappNumber: '91XXXXXXXXXX',       // PLACEHOLDER (country code + number)
  whatsappText: 'Hi, I would like a free moving quote from Agarwal Packers Movers India.',
  email: 'ADD-BUSINESS-EMAIL@agarwalpackersmoversindia.com', // PLACEHOLDER
  hours: '[Add business hours — e.g. Mon–Sun, 8:00 AM – 8:00 PM]',   // PLACEHOLDER
  hoursSchema: null, // e.g. ['Mo-Su 08:00-20:00'] — leave null until verified

  // Trust numbers — leave as null until the business supplies verified figures.
  // The build renders a clearly-marked placeholder for any null value.
  stats: {
    moves: null,        // e.g. '12,000'
    cities: null,       // e.g. '80'
    years: null,        // e.g. '15'
    customers: null     // e.g. '10,000'
  },

  // Google Business Profile links — add ONLY when a real, verified profile exists.
  gbp: {
    jodhpur: null,        // PLACEHOLDER — paste verified GBP share URL
    noida: null,          // PLACEHOLDER
    visakhapatnam: null   // PLACEHOLDER
  },

  // Per-city NAP. streetAddress/postalCode stay null until verified; schema
  // omits them rather than inventing them.
  cities: {
    jodhpur: {
      name: 'Jodhpur', region: 'Rajasthan', regionCode: 'RJ',
      slug: 'packers-movers-jodhpur',
      streetAddress: null,  // PLACEHOLDER
      postalCode: null,     // PLACEHOLDER
      phoneDisplay: null,   // PLACEHOLDER — set if this branch has its own line
      geo: null             // PLACEHOLDER — { lat, lng } once the address is verified
    },
    noida: {
      name: 'Noida', region: 'Uttar Pradesh', regionCode: 'UP',
      slug: 'packers-movers-noida',
      streetAddress: null, postalCode: null, phoneDisplay: null, geo: null
    },
    visakhapatnam: {
      name: 'Visakhapatnam', region: 'Andhra Pradesh', regionCode: 'AP',
      slug: 'packers-movers-visakhapatnam',
      streetAddress: null, postalCode: null, phoneDisplay: null, geo: null
    }
  },

  // Social / citation profiles — add real URLs only. Empty array = omitted from schema.
  sameAs: []
};

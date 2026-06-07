import Link from "next/link";

// ── SEO Metadata (server-rendered, fully readable by Google) ──────────────────
export const metadata = {
  title: "Cleaning Chemicals in Ghana | Direct from Manufacturer | Neat Brand Trade",
  description:
    "Buy high-quality cleaning chemicals in Ghana directly from the manufacturer. Bulk detergents, degreasers, and liquid soaps for commercial and industrial use.",
  keywords: [
    "cleaning chemicals Ghana",
    "cleaning chemical suppliers Ghana",
    "buy cleaning chemicals online",
    "bulk cleaning products Ghana",
    "cleaning product manufacturers in Ghana",
    "Neat Brand Trade chemicals",
  ],
  openGraph: {
    title: "Cleaning Chemicals in Ghana | Neat Brand Trade",
    description:
      "Cut out the middlemen. Buy your bulk cleaning chemicals directly from the factory. Supplied across Ghana for commercial, hospitality, and industrial use.",
    url: "https://neatbrandtrade.com/cleaning-chemicals-ghana",
    siteName: "Neat Brand Trade",
    images: [{ url: "https://neatbrandtrade.com/NBT%20Logo_.png", width: 800, height: 600 }],
    locale: "en_GH",
    type: "website",
  },
  alternates: {
    canonical: "https://neatbrandtrade.com/cleaning-chemicals-ghana",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const products = [
  {
    icon: "🧪",
    name: "Industrial Degreasers",
    desc: "Highly concentrated solutions for heavy grease, oil, and carbon buildup.",
  },
  {
    icon: "🧴",
    name: "Commercial Liquid Soaps",
    desc: "Bulk hand washes, dishwashing liquids, and multi-surface cleaners.",
  },
  {
    icon: "🧺",
    name: "Laundry Chemicals",
    desc: "High-efficiency detergents, stain removers, and premium fabric softeners.",
  },
  {
    icon: "🛡️",
    name: "Sanitizers & Disinfectants",
    desc: "Hospital-grade protection against bacteria and viruses for facilities.",
  },
];

const benefits = ["Direct factory pricing", "Available in 5L, 25L, and 1000L", "Nationwide distribution"];

const sectors = [
  "Cleaning Contractors",
  "Facilities Management",
  "Factories",
  "Hospitals",
  "Hotels",
  "Wholesale Distributors",
];

const stats = [
  { number: "15+", label: "Product Lines" },
  { number: "Direct", label: "Manufacturer" },
  { number: "100%", label: "Ghanaian Owned" },
];

const faqs = [
  {
    q: "Where is your cleaning chemical manufacturing plant located?",
    a: "Our state-of-the-art manufacturing plant is located in Ghana, allowing us to rapidly supply the local market without the delays of importing finished products.",
  },
  {
    q: "Do you supply wholesale cleaning chemicals for resale?",
    a: "Yes. We work with distributors and retailers who want to sell high-quality cleaning products under the Neat, Deva, or NBT Global brands.",
  },
  {
    q: "Can I buy directly from you instead of a supermarket?",
    a: "Absolutely. We encourage commercial businesses like hotels, hospitals, and cleaning agencies to buy directly from us to access bulk wholesale pricing.",
  },
  {
    q: "Do you offer technical data sheets (TDS) for your chemicals?",
    a: "Yes, we can provide Technical Data Sheets and Material Safety Data Sheets (MSDS) for all our industrial and commercial chemical products upon request.",
  },
];

// ── Page Component ────────────────────────────────────────────────────────────
export default function CleaningChemicalsGhana() {
  return (
    <>
      <style>{`
        .dg-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 92vh;
          overflow: hidden;
        }
        .dg-left {
          background: #0b1f2e;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 5vw 80px 5vw;
          position: relative;
        }
        .dg-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(13,126,110,0.18) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(13,126,110,0.08) 0%, transparent 40%);
          pointer-events: none;
        }
        .dg-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #14a891;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }
        .dg-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: #14a891;
        }
        .dg-h1 {
          font-size: clamp(2.2rem, 4vw, 3.4rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .dg-h1 em {
          font-style: italic;
          font-weight: 300;
          color: #14a891;
        }
        .dg-sub {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,0.6);
          max-width: 420px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .dg-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .dg-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0d7e6e;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .dg-btn-primary:hover { background: #14a891; transform: translateY(-1px); color: #fff; }
        .dg-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: rgba(255,255,255,0.75);
          font-size: 15px;
          font-weight: 500;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.2);
          transition: border-color 0.2s, color 0.2s, transform 0.15s;
        }
        .dg-btn-secondary:hover {
          border-color: rgba(255,255,255,0.45);
          color: #fff;
          transform: translateY(-1px);
        }
        .dg-stats {
          display: flex;
          gap: 28px;
          margin-top: 52px;
          padding-top: 36px;
          border-top: 1px solid rgba(255,255,255,0.1);
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }
        .dg-stat-number {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          display: block;
        }
        .dg-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .dg-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.12);
          align-self: center;
        }
        .dg-right {
          background: #e8f7f5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 5vw;
          overflow: hidden;
          position: relative;
        }
        .dg-right::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: rgba(13,126,110,0.12);
          pointer-events: none;
        }
        .dg-right::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(13,126,110,0.08);
          pointer-events: none;
        }
        .dg-section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d7e6e;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .dg-product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }
        .dg-product-card {
          background: #fff;
          border-radius: 12px;
          padding: 22px 20px;
          border: 1px solid rgba(13,126,110,0.12);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .dg-product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(13,126,110,0.12);
          border-color: rgba(13,126,110,0.3);
        }
        .dg-product-icon {
          width: 40px; height: 40px;
          background: #e8f7f5;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 14px;
        }
        .dg-product-name {
          font-size: 15px;
          font-weight: 700;
          color: #0b1f2e;
          margin-bottom: 5px;
          letter-spacing: -0.02em;
        }
        .dg-product-desc {
          font-size: 12px;
          color: #6b8496;
          line-height: 1.5;
        }
        .dg-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }
        .dg-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1px solid rgba(13,126,110,0.2);
          color: #0d7e6e;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 100px;
        }
        .dg-pill-dot {
          width: 16px; height: 16px;
          background: #0d7e6e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dg-sector-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .dg-sector-tag {
          background: rgba(13,126,110,0.1);
          color: #0d7e6e;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 12px;
          border-radius: 6px;
        }

        /* ── Why Us section ── */
        .dg-why {
          background: #fff;
          padding: 80px 5vw;
        }
        .dg-why-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .dg-why h2 {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #0b1f2e;
          margin-bottom: 12px;
        }
        .dg-why-lead {
          font-size: 16px;
          color: #3d5566;
          margin-bottom: 48px;
          max-width: 560px;
          line-height: 1.7;
        }
        .dg-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .dg-why-card {
          background: #faf8f4;
          border-radius: 12px;
          padding: 28px 24px;
          border: 1px solid rgba(13,126,110,0.1);
        }
        .dg-why-icon {
          font-size: 28px;
          margin-bottom: 16px;
        }
        .dg-why-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0b1f2e;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .dg-why-card p {
          font-size: 14px;
          color: #6b8496;
          line-height: 1.6;
        }

        /* ── FAQ section ── */
        .dg-faq {
          background: #faf8f4;
          padding: 80px 5vw;
        }
        .dg-faq-inner {
          max-width: 760px;
          margin: 0 auto;
        }
        .dg-faq h2 {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #0b1f2e;
          margin-bottom: 40px;
        }
        .dg-faq-item {
          border-bottom: 1px solid rgba(13,126,110,0.12);
          padding: 24px 0;
        }
        .dg-faq-item:first-of-type { border-top: 1px solid rgba(13,126,110,0.12); }
        .dg-faq-q {
          font-size: 16px;
          font-weight: 600;
          color: #0b1f2e;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .dg-faq-a {
          font-size: 15px;
          color: #3d5566;
          line-height: 1.7;
        }

        /* ── CTA Banner ── */
        .dg-cta-banner {
          background: #0b1f2e;
          padding: 80px 5vw;
          text-align: center;
        }
        .dg-cta-banner h2 {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .dg-cta-banner p {
          font-size: 16px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 36px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }
        .dg-cta-group {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .dg-hero { grid-template-columns: 1fr; min-height: auto; }
          .dg-left { padding: 100px 6vw 60px; }
          .dg-right { padding: 48px 6vw 64px; }
          .dg-why-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .dg-product-grid { grid-template-columns: 1fr; }
          .dg-stats { gap: 20px; }
          .dg-stat-divider { display: none; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="dg-hero">

        {/* Left: Headline + CTA */}
        <div className="dg-left">
          <span className="dg-eyebrow">Chemicals Manufacturer Ghana</span>

          <h1 className="dg-h1">
            Cut out the middlemen.<br />
            Buy directly from the <em>factory</em>.
          </h1>

          <p className="dg-sub">
            Neat Brand Trade is a leading manufacturer of premium cleaning chemicals in Ghana. We supply commercial, industrial, and retail clients nationwide.
          </p>

          <div className="dg-ctas">
            <Link href="/products" className="dg-btn-primary">
              View Product Catalog →
            </Link>
            <Link href="/bulk-orders" className="dg-btn-secondary">
              Request Bulk Quote
            </Link>
          </div>

          <div className="dg-stats">
            {stats.map((s, i) => (
              <div key={`stat-${i}`} style={{ display: 'flex', gap: '28px' }}>
                {i > 0 && <div className="dg-stat-divider" />}
                <div>
                  <span className="dg-stat-number">{s.number}</span>
                  <span className="dg-stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product cards */}
        <div className="dg-right">
          <p className="dg-section-label">Chemical product lines</p>

          <div className="dg-product-grid">
            {products.map((p) => (
              <div key={p.name} className="dg-product-card">
                <div className="dg-product-icon">{p.icon}</div>
                <div className="dg-product-name">{p.name}</div>
                <div className="dg-product-desc">{p.desc}</div>
              </div>
            ))}
          </div>

          <div className="dg-pills">
            {benefits.map((b) => (
              <span key={b} className="dg-pill">
                <span className="dg-pill-dot">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {b}
              </span>
            ))}
          </div>

          <p className="dg-section-label">Supplying to</p>
          <div className="dg-sector-tags">
            {sectors.map((s) => (
              <span key={s} className="dg-sector-tag">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NEAT BRAND TRADE ── */}
      <section className="dg-why">
        <div className="dg-why-inner">
          <h2>Why buy direct from Neat Brand Trade?</h2>
          <p className="dg-why-lead">
            Whether you run a cleaning agency or a wholesale distribution business, buying directly from our manufacturing plant offers massive advantages.
          </p>
          <div className="dg-why-grid">
            {[
              { icon: "💰", title: "Unbeatable pricing", body: "Skip the supermarket markups. By purchasing directly from the manufacturer, your business can significantly reduce its operational costs." },
              { icon: "📦", title: "Scalable volumes", body: "Need 5L for an office or 1000L for a factory? We handle orders of all sizes with the same attention to quality." },
              { icon: "🧪", title: "Quality assurance", body: "Every batch is formulated and tested in our facility to ensure consistent active ingredients and pH levels." },
              { icon: "🇬🇭", title: "Made in Ghana", body: "We are proudly Ghanaian owned. By buying local, you avoid the supply chain delays associated with imported chemicals." },
              { icon: "🤝", title: "B2B partnerships", body: "We partner with cleaning agencies and facilities management companies to be their exclusive chemical supplier." },
              { icon: "🚚", title: "Nationwide reach", body: "Our logistics network allows us to deliver wholesale cleaning chemicals to businesses across all regions of Ghana." },
            ].map((c) => (
              <div key={c.title} className="dg-why-card">
                <div className="dg-why-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="dg-faq">
        <div className="dg-faq-inner">
          <h2>Frequently asked questions</h2>
          {faqs.map((f) => (
            <div key={f.q} className="dg-faq-item">
              <div className="dg-faq-q">{f.q}</div>
              <div className="dg-faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="dg-cta-banner">
        <h2>Start saving on cleaning supplies</h2>
        <p>
          Browse our product catalog or contact our sales team to discuss wholesale pricing for your business.
        </p>
        <div className="dg-cta-group">
          <Link href="/products" className="dg-btn-primary">
            Explore Catalog →
          </Link>
          <a href="https://wa.me/233246272115" className="dg-btn-secondary" target="_blank" rel="noopener noreferrer">
            WhatsApp 0246272115
          </a>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";

// ── SEO Metadata (server-rendered, fully readable by Google) ──────────────────
export const metadata = {
  title: "Industrial Cleaning Products in Ghana | Factory Degreasers | Neat Brand Trade",
  description:
    "Buy heavy-duty industrial cleaning products in Ghana. Factory degreasers, machinery cleaners, and bulk chemical supplies. Order 25L to 1000L volumes. Call 0246272115.",
  keywords: [
    "industrial cleaning products Ghana",
    "factory degreasers Ghana",
    "heavy duty cleaners Ghana",
    "bulk cleaning chemicals",
    "machinery cleaners",
    "industrial floor cleaners Ghana",
    "Neat Brand Trade industrial",
  ],
  openGraph: {
    title: "Industrial Cleaning Products in Ghana | Neat Brand Trade",
    description:
      "Tackle heavy grease and industrial grime with our concentrated chemical solutions. Supplied in bulk for factories and plants across Ghana.",
    url: "https://neatbrandtrade.com/industrial-cleaning-products-ghana",
    siteName: "Neat Brand Trade",
    images: [{ url: "https://neatbrandtrade.com/NBT%20Logo_.png", width: 800, height: 600 }],
    locale: "en_GH",
    type: "website",
  },
  alternates: {
    canonical: "https://neatbrandtrade.com/industrial-cleaning-products-ghana",
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
    icon: "⚙️",
    name: "Heavy-Duty Degreasers",
    desc: "Cuts through thick grease, oil, and carbon buildup on industrial machinery.",
  },
  {
    icon: "🏭",
    name: "Industrial Floor Cleaners",
    desc: "Formulated for factory floors, workshops, and warehouse environments.",
  },
  {
    icon: "🔧",
    name: "Machinery & Parts Cleaners",
    desc: "Safe for metals and engineered to remove stubborn industrial residues.",
  },
  {
    icon: "🛢️",
    name: "Bulk Acidic & Alkaline Solutions",
    desc: "Customizable pH-specific chemical solutions for precise industrial needs.",
  },
];

const benefits = ["Available in 25L & IBC Tanks", "Custom Formulations", "Nationwide Logistics"];

const sectors = [
  "Manufacturing Plants",
  "Automotive Garages",
  "Mining Sites",
  "Warehouses",
  "Construction",
  "Food Processing Facilities",
];

const stats = [
  { number: "25L+", label: "Bulk Volumes" },
  { number: "48hr", label: "Nationwide Freight" },
  { number: "Direct", label: "Manufacturer Pricing" },
];

const faqs = [
  {
    q: "Do you supply cleaning chemicals in 1000L IBC tanks?",
    a: "Yes, we handle large wholesale supplies including IBC tanks and regular 25L drums for all our industrial formulations. Contact our procurement team for contract pricing.",
  },
  {
    q: "Are your degreasers safe for food processing machinery?",
    a: "We offer specific food-grade and non-toxic industrial cleaners designed strictly for food and beverage manufacturing facilities. Please specify your industry when requesting a quote.",
  },
  {
    q: "Can you create custom chemical formulations for our factory?",
    a: "Absolutely. As direct manufacturers, we can adjust active concentrations and pH levels to suit the specific grime or machinery in your facility.",
  },
  {
    q: "How do you handle delivery outside of Accra?",
    a: "We have established logistics networks capable of delivering heavy bulk chemical orders to mining sites, factories, and warehouses anywhere in Ghana.",
  },
];

// ── Page Component ────────────────────────────────────────────────────────────
export default function IndustrialCleaningGhana() {
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
          <span className="dg-eyebrow">Industrial Cleaners Ghana</span>

          <h1 className="dg-h1">
            Engineered for heavy<br />
            <em>industrial grease</em><br />
            and machinery.
          </h1>

          <p className="dg-sub">
            Neat Brand Trade manufactures and supplies high-concentration chemical cleaners, degreasers, and acidic solutions for factories and heavy industries across Ghana.
          </p>

          <div className="dg-ctas">
            <Link href="/contact" className="dg-btn-primary">
              Request a Bulk Quote →
            </Link>
            <a href="https://wa.me/233246272115" className="dg-btn-secondary" target="_blank" rel="noopener noreferrer">
              WhatsApp Us
            </a>
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
          <p className="dg-section-label">Our industrial range</p>

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

          <p className="dg-section-label">Serving these sectors</p>
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
          <h2>The preferred choice for Ghanaian industry</h2>
          <p className="dg-why-lead">
            From mining sites to food processing plants, heavy industry relies on our consistent active concentrations and robust supply chain.
          </p>
          <div className="dg-why-grid">
            {[
              { icon: "🏭", title: "Direct from manufacturer", body: "We manufacture our own product lines under the Neat, Deva, and NBT Global brands — no middlemen, which means better prices for you." },
              { icon: "📦", title: "Bulk & wholesale supply", body: "Order in 25L drums or full 1000L IBC tanks. We handle recurring industrial orders with consistent stock and reliable reorder timelines." },
              { icon: "🚚", title: "Heavy freight logistics", body: "We coordinate freight and delivery to industrial zones and remote mining sites across the entire country." },
              { icon: "💬", title: "Dedicated account support", body: "Work directly with our team to secure long-term pricing contracts and ensure your supply chain never breaks." },
              { icon: "✅", title: "Proven formulations", body: "Our chemicals are formulated to cut through the specific types of heavy oil, carbon, and grime found in heavy industry." },
              { icon: "🔄", title: "Customizable pH", body: "Need a specific alkaline or acidic cleaner for a unique manufacturing process? We can customize formulations for bulk clients." },
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
        <h2>Need heavy-duty cleaning power?</h2>
        <p>
          Contact our procurement specialists for a custom bulk quote for your factory or industrial site.
        </p>
        <div className="dg-cta-group">
          <Link href="/bulk-orders" className="dg-btn-primary">
            Request a Bulk Quote →
          </Link>
          <a href="https://wa.me/233246272115" className="dg-btn-secondary" target="_blank" rel="noopener noreferrer">
            WhatsApp 0246272115
          </a>
        </div>
      </section>
    </>
  );
}

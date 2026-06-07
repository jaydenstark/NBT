import Link from "next/link";

// ── SEO Metadata (server-rendered, fully readable by Google) ──────────────────
export const metadata = {
  title: "Hotel Cleaning Supplies in Ghana | Hospitality Hygiene | Neat Brand Trade",
  description:
    "Buy premium hotel cleaning supplies in Ghana. Bulk laundry detergents, fabric softeners, room air fresheners, and bathroom cleaners. Fast delivery for hospitality businesses.",
  keywords: [
    "hotel cleaning supplies Ghana",
    "hospitality hygiene products Ghana",
    "bulk laundry detergent Ghana",
    "hotel room air fresheners",
    "hotel bathroom cleaners",
    "bulk fabric softener",
    "Neat Brand Trade hotels",
  ],
  openGraph: {
    title: "Hotel Cleaning Supplies in Ghana | Neat Brand Trade",
    description:
      "Maintain five-star cleanliness in your hotel or resort. Premium bulk detergents, softeners, and room fragrances supplied across Ghana.",
    url: "https://neatbrandtrade.com/hotel-cleaning-supplies-ghana",
    siteName: "Neat Brand Trade",
    images: [{ url: "https://neatbrandtrade.com/NBT%20Logo_.png", width: 800, height: 600 }],
    locale: "en_GH",
    type: "website",
  },
  alternates: {
    canonical: "https://neatbrandtrade.com/hotel-cleaning-supplies-ghana",
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
    icon: "🧺",
    name: "Bulk Laundry Detergents",
    desc: "Tough on stains but gentle on luxury hotel linens and towels.",
  },
  {
    icon: "🌸",
    name: "Fabric Softeners",
    desc: "Leaves bedding feeling luxurious and smelling fresh for arriving guests.",
  },
  {
    icon: "🌬️",
    name: "Room Air Fresheners",
    desc: "Long-lasting premium fragrances to elevate the guest room experience.",
  },
  {
    icon: "🛁",
    name: "Bathroom & Tile Cleaners",
    desc: "Removes hard water stains and sanitizes hotel bathrooms effortlessly.",
  },
];

const benefits = ["Five-star fragrances", "Consistent bulk supply", "Hospitality-grade formulas"];

const sectors = [
  "Boutique Hotels",
  "Luxury Resorts",
  "Guest Houses",
  "Serviced Apartments",
  "Conference Centers",
  "Airbnbs",
];

const stats = [
  { number: "200+", label: "Hotels Supplied" },
  { number: "100%", label: "Consistency" },
  { number: "5L/25L", label: "Bulk Options" },
];

const faqs = [
  {
    q: "Do you supply laundry detergent in bulk for hotel washing machines?",
    a: "Yes. We supply high-efficiency liquid laundry detergents in 5L and 25L drums specifically formulated for high-turnover hotel laundries.",
  },
  {
    q: "Can we get matching fragrances across different cleaning products?",
    a: "We offer coordinated fragrance profiles (like our popular 'Spring Fresh' or 'Lavender' lines) across air fresheners, floor cleaners, and softeners to maintain a consistent scent throughout your hotel.",
  },
  {
    q: "Do you offer wholesale pricing for hospitality businesses?",
    a: "Absolutely. We work directly with hotel procurement managers to offer heavily discounted wholesale pricing on recurring bulk orders.",
  },
  {
    q: "How quickly can you restock our housekeeping department in Accra?",
    a: "We understand hotels can't run out of supplies. We offer same-day or next-day restocking for our hospitality clients in Accra and Greater Accra.",
  },
];

// ── Page Component ────────────────────────────────────────────────────────────
export default function HotelCleaningGhana() {
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
          <span className="dg-eyebrow">Hotel Supplies Ghana</span>

          <h1 className="dg-h1">
            Five-star cleanliness<br />
            for your <em>hospitality</em><br />
            business.
          </h1>

          <p className="dg-sub">
            Neat Brand Trade supplies premium bulk laundry detergents, fabric softeners, and luxurious room fragrances to hotels and resorts across Ghana.
          </p>

          <div className="dg-ctas">
            <Link href="/contact" className="dg-btn-primary">
              Contact Procurement →
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
          <p className="dg-section-label">Hospitality collection</p>

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
          <h2>Elevating the guest experience</h2>
          <p className="dg-why-lead">
            From the moment guests step into the lobby to when they slip into bed, our products ensure your hotel smells and feels impeccably clean.
          </p>
          <div className="dg-why-grid">
            {[
              { icon: "🌸", title: "Premium fragrances", body: "We use high-end, long-lasting fragrances in our softeners and air fresheners that leave a lasting positive impression on guests." },
              { icon: "🧺", title: "Linen protection", body: "Our liquid laundry detergents are formulated to remove tough stains while protecting the fibers of your expensive hotel linens and towels." },
              { icon: "💰", title: "Wholesale savings", body: "By buying directly from the manufacturer, your hotel can significantly reduce its monthly housekeeping and laundry overheads." },
              { icon: "🧴", title: "Elegant hand washes", body: "We supply beautifully fragranced, moisturizing hand washes in bulk to refill your public washroom and guest room dispensers." },
              { icon: "🚚", title: "Reliable restocking", body: "We offer scheduled, automated delivery drops so your housekeeping department never faces a shortage of critical supplies." },
              { icon: "✨", title: "Streak-free finishes", body: "Our specialized glass and multi-surface cleaners guarantee streak-free mirrors and polished lobbies." },
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
        <h2>Upgrade your hotel's hygiene standards</h2>
        <p>
          Partner with Neat Brand Trade for consistent, premium, and affordable hospitality cleaning supplies.
        </p>
        <div className="dg-cta-group">
          <Link href="/bulk-orders" className="dg-btn-primary">
            Get a Wholesale Quote →
          </Link>
          <a href="https://wa.me/233246272115" className="dg-btn-secondary" target="_blank" rel="noopener noreferrer">
            WhatsApp 0246272115
          </a>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Food-Safe Cleaning Chemicals for Restaurants | Neat Brand Trade",
  description:
    "Keep your commercial kitchen spotless with our food-safe degreasers, dishwashing liquids, and surface sanitizers designed for restaurants and cafes in Ghana.",
};

const products = [
  { icon: "🍽️", name: "Dishwashing Liquids", desc: "Cuts through tough kitchen grease while being gentle on hands." },
  { icon: "🍳", name: "Kitchen Degreasers", desc: "Removes baked-on carbon and oil from ovens and grills." },
  { icon: "🧴", name: "Food-Safe Sanitizers", desc: "Disinfect prep areas and dining tables safely and effectively." },
  { icon: "✨", name: "Floor Cleaners", desc: "Eliminate slip hazards in commercial kitchens and dining rooms." },
];

export default function RestaurantsIndustryPage() {
  return (
    <>
      <style>{`
        .ind-hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 80vh; overflow: hidden; }
        .ind-left { background: #0b1f2e; display: flex; flex-direction: column; justify-content: center; padding: 80px 5vw; position: relative; }
        .ind-left::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 30%, rgba(13,126,110,0.18) 0%, transparent 50%); pointer-events: none; }
        .ind-h1 { font-size: clamp(2.2rem, 4vw, 3.4rem); font-weight: 700; line-height: 1.1; color: #ffffff; margin-bottom: 20px; position: relative; z-index: 1; }
        .ind-h1 em { font-style: italic; font-weight: 300; color: #14a891; }
        .ind-sub { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.6); max-width: 420px; margin-bottom: 40px; position: relative; z-index: 1; }
        .ind-btn { display: inline-flex; align-items: center; gap: 8px; background: #0d7e6e; color: #fff; font-size: 15px; font-weight: 500; padding: 14px 28px; border-radius: 8px; text-decoration: none; transition: background 0.2s, transform 0.15s; width: max-content; position: relative; z-index: 1; }
        .ind-btn:hover { background: #14a891; transform: translateY(-1px); color: #fff; }
        .ind-right { background: #e8f7f5; display: flex; flex-direction: column; justify-content: center; padding: 80px 5vw; overflow: hidden; position: relative; }
        .ind-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; position: relative; z-index: 1; }
        .ind-card { background: #fff; border-radius: 12px; padding: 22px 20px; border: 1px solid rgba(13,126,110,0.12); }
        .ind-icon { width: 40px; height: 40px; background: #e8f7f5; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
        .ind-card-title { font-size: 15px; font-weight: 700; color: #0b1f2e; margin-bottom: 5px; }
        .ind-card-desc { font-size: 12px; color: #6b8496; line-height: 1.5; }
        @media (max-width: 860px) { .ind-hero { grid-template-columns: 1fr; min-height: auto; } .ind-left { padding: 100px 6vw 60px; } .ind-right { padding: 48px 6vw 64px; } }
        @media (max-width: 480px) { .ind-grid { grid-template-columns: 1fr; } }
      `}</style>

      <section className="ind-hero">
        <div className="ind-left">
          <h1 className="ind-h1">Commercial cleaning for <em>Restaurants & Cafes</em></h1>
          <p className="ind-sub">
            Maintain a spotless, food-safe environment. We supply powerful degreasers, dishwashing liquids, and sanitizers directly to restaurants, food courts, and catering businesses.
          </p>
          <Link href="/cleaning-chemicals-ghana" className="ind-btn">
            View Kitchen Chemical Range →
          </Link>
        </div>

        <div className="ind-right">
          <div className="ind-grid">
            {products.map((p) => (
              <div key={p.name} className="ind-card">
                <div className="ind-icon">{p.icon}</div>
                <div className="ind-card-title">{p.name}</div>
                <div className="ind-card-desc">{p.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/bulk-orders" style={{ color: '#0d7e6e', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            Request Wholesale Kitchen Pricing <span>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

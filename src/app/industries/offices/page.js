import Link from "next/link";

export const metadata = {
  title: "Heavy-Duty Degreasers for Offices & Plants | Neat Brand Trade",
  description:
    "Direct manufacturer of heavy-duty industrial degreasers and cleaning chemicals. We supply offices and warehouses across Ghana in bulk 25L to 1000L volumes.",
};

const products = [
  { icon: "⚙️", name: "Heavy-Duty Degreasers", desc: "Cuts through thick oil, grease, and industrial residues." },
  { icon: "🏭", name: "Floor Cleaners", desc: "Formulated for office floors, workshops, and large warehouses." },
  { icon: "🔧", name: "Machinery Cleaners", desc: "Safe for metals; engineered to remove stubborn carbon buildup." },
  { icon: "🛢️", name: "Bulk Chemical Solutions", desc: "Custom pH solutions supplied in 25L drums or IBC tanks." },
];

export default function FactoriesIndustryPage() {
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
          <h1 className="ind-h1">Industrial strength for <em>Factories & Plants</em></h1>
          <p className="ind-sub">
            Heavy industry requires heavy-duty solutions. As a local manufacturer, we supply highly concentrated degreasers and industrial cleaners in bulk to manufacturing plants, mining sites, and warehouses nationwide.
          </p>
          <Link href="/industrial-cleaning-products-ghana" className="ind-btn">
            View Industrial Chemicals →
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
            Request an Industrial Supply Contract <span>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

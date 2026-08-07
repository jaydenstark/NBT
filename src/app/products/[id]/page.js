import ProductDetailClientPage from './ProductDetailClientPage';
import Papa from 'papaparse';

const getProductImage = (name) => {
  const lowerName = name.toLowerCase();
  
  // BRAND DEVA
  if (lowerName.includes('deva')) {
    if (lowerName.includes('softener') || lowerName.includes('softner')) {
      if (lowerName.includes('sensitive')) return '/PRODUCTS/Deva/soft-1L-sensitive-371x1024.png';
      if (lowerName.includes('lavender') || lowerName.includes('lavanta')) return '/PRODUCTS/Deva/soft-1L-lavender-374x1024.png';
      return '/PRODUCTS/Deva/soft-1L-floral-1-365x1024.png';
    }
    if (lowerName.includes('airfresh') || lowerName.includes('air fresh')) {
      if (lowerName.includes('empress')) return '/PRODUCTS/Deva/Air-Freshener-Empress-393x1024.png';
      if (lowerName.includes('melon')) return '/PRODUCTS/Deva/Air-Freshener-Melon.png';
      return '/PRODUCTS/Deva/Air-Freshener-Paradise-425x1024.png';
    }
    if (lowerName.includes('antiseptic') || lowerName.includes('disinfectant') || lowerName.includes('disfectant')) {
      return '/PRODUCTS/Deva/Disinfectant-530x1024.png';
    }
    if (lowerName.includes('sanitizer')) {
      if (lowerName.includes('5l')) return '/PRODUCTS/Deva/Sanitizer 5Lt.png';
      return '/PRODUCTS/Deva/Sanitizer-200-ml-462x1024.png';
    }
    if (lowerName.includes('bleach')) {
      if (lowerName.includes('2l')) return '/PRODUCTS/Deva/power-bleach-2L-371x1024.png';
      if (lowerName.includes('5l')) return '/PRODUCTS/Deva/power-bleach-5L-2-1-755x1024.png';
      return '/PRODUCTS/Deva/power-bleach-1L-414x1024.png';
    }
    if (lowerName.includes('hand wash') || lowerName.includes('hand soap') || lowerName.includes('hansoap') || lowerName.includes('handsoap')) {
      if (lowerName.includes('aloe')) return '/PRODUCTS/Deva/deva_handsoap_aloevera-669x1024.png';
      if (lowerName.includes('strawberry')) return '/PRODUCTS/Deva/deva_handsoap_straweberry-676x1024.png';
      return '/PRODUCTS/Deva/deva_hansoap_citrus-805x1024.png';
    }
    if (lowerName.includes('dish')) {
      if (lowerName.includes('lemon')) return '/PRODUCTS/Deva/Dish-Washing-Soap-Lemon-400ml-491x1024.png';
      return '/PRODUCTS/Deva/Dish-Washing-Soap-400ml-380x1024.png';
    }
    if (lowerName.includes('surface cleaner') || lowerName.includes('yuzey')) {
      if (lowerName.includes('lavender') || lowerName.includes('lavanta')) return '/PRODUCTS/Deva/Surface Cleaner Lavender .jpg.png';
      if (lowerName.includes('lime')) return '/PRODUCTS/Deva/Surface Cleaner Lime.png';
      if (lowerName.includes('floral')) return '/PRODUCTS/Deva/Surface Cleaner Floral.png';
      if (lowerName.includes('sensitive')) return '/PRODUCTS/Deva/Surface Cleaner Sensitive.png';
      if (lowerName.includes('pine')) return '/PRODUCTS/Deva/Surface Cleaner Pine.png';
      return '/PRODUCTS/Deva/Surface Cleaner Ocean.png';
    }
    if (lowerName.includes('glass cleaner')) {
      return '/PRODUCTS/Deva/Glass-Cleaner-604x1024.png';
    }
    if (lowerName.includes('cream cleaner')) {
      return '/PRODUCTS/Deva/Cream-Cleaner-396x1024.png';
    }
    if (lowerName.includes('washing powder') || lowerName.includes('powder')) {
      return '/PRODUCTS/Deva/WASHING-POWDER-3kg-919x1024.png';
    }
    if (lowerName.includes('wc')) {
      if (lowerName.includes('lemon')) return '/PRODUCTS/Deva/WC Block Lemon.png';
      if (lowerName.includes('pine')) return '/PRODUCTS/Deva/WC Block Pine.png';
      return '/PRODUCTS/Deva/WC Block Ocean.png';
    }
    if (lowerName.includes('wipe')) {
      return '/PRODUCTS/Deva/Wipe.png';
    }
    return '/PRODUCTS/Deva/All Products 1024x517.png';
  }

  // BRAND NEAT
  if (lowerName.includes('bleach')) return '/PRODUCTS/Neat/neat-bleach.png';
  if (lowerName.includes('glass cleaner')) return '/PRODUCTS/Neat/neat-glass-cleaner-750ml.png';
  if (lowerName.includes('laundry')) return '/PRODUCTS/Neat/all-neat-laundry-detergent-colors-2l.png';
  if (lowerName.includes('fabric softener') || lowerName.includes('softener')) {
    if (lowerName.includes('sensitive')) return '/PRODUCTS/Neat/neat-fabric-softener-sensitive.png';
    if (lowerName.includes('spring')) return '/PRODUCTS/Neat/neat-fabric-softener-springfresh.png';
    return '/PRODUCTS/Neat/neat-fabric-softener-luxury.png';
  }
  if (lowerName.includes('shower gel')) {
    if (lowerName.includes('carrot')) return '/PRODUCTS/Neat/all-neat-shower-gel-carrot-milk-800ml.png';
    if (lowerName.includes('lemon')) return '/PRODUCTS/Neat/all-neat-shower-gel-sweet-lemon-800ml.png';
    return '/PRODUCTS/Neat/all-neat-shower-gel-charming-800ml.png';
  }
  if (lowerName.includes('hand wash') || lowerName.includes('handwash')) {
    if (lowerName.includes('lemon')) return '/PRODUCTS/Neat/neat-hand-wash-lemon-500ml.png';
    if (lowerName.includes('rose')) return '/PRODUCTS/Neat/neat-hand-wash-rose-300ml.png';
    return '/PRODUCTS/Neat/neat-hand-wash-aloevera-500ml.png';
  }
  if (lowerName.includes('dish')) {
    if (lowerName.includes('lemon')) return '/PRODUCTS/Neat/all-neat-dish-wash-lemon-400ml.png';
    if (lowerName.includes('rose')) return '/PRODUCTS/Neat/all-neat-dish-wash-rose-400ml.png';
    return '/PRODUCTS/Neat/all-neat-dish-wash-lavender-400ml.png';
  }
  if (lowerName.includes('all-purpose') || lowerName.includes('all purpose')) {
    if (lowerName.includes('citrus')) return '/PRODUCTS/Neat/neat-all-purpose-cleaner-citrus-2l.png';
    if (lowerName.includes('jasmine')) return '/PRODUCTS/Neat/neat-all-purpose-cleaner-jasmine-2l.png';
    return '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png';
  }

  return '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png';
};

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1pHzmSNsXpPdrJcGQ5kI4ZNsAaUNVeXt6knle7C_sNG0/export?format=csv&gid=1847675030';
    const response = await fetch(sheetUrl, { next: { revalidate: 60 } });
    const csvText = await response.text();
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return results.data
      .filter(row => row.Name)
      .map(row => ({
        id: encodeURIComponent(row.Name.replace(/\s+/g, '-').toLowerCase()),
      }));
  } catch {
    return [];
  }
}

async function getAllProducts() {
  try {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1pHzmSNsXpPdrJcGQ5kI4ZNsAaUNVeXt6knle7C_sNG0/export?format=csv&gid=1847675030';
    const response = await fetch(sheetUrl, { next: { revalidate: 60 } });
    const csvText = await response.text();
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const products = [];
    for (const row of results.data) {
      if (!row.Name) continue;
      const isNeatProduct = row.Name.toLowerCase().startsWith('neat');
      products.push({
        id: `sheet_${row.Name}_${row.Size}`,
        slug: row.Name.replace(/\s+/g, '-').toLowerCase(),
        name: row.Name,
        brand: row.Brand || 'Neat Product',
        supplier: isNeatProduct ? 'Daisy Hotel Amenities' : null,
        type: row.Type?.toLowerCase() === 'industrial' ? 'industrial' : 'retail',
        category: row.Category || 'General',
        description: row.Description || '',
        image: row.Image || getProductImage(row.Name),
        sizes: [{ size: row.Size || '1L', price: parseFloat(row.Price) || 0, qtyInBox: parseInt(row.QtyInBox) || 1 }],
      });
    }
    return products;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const products = await getAllProducts();
  const decoded = decodeURIComponent(id).replace(/-/g, ' ');
  const product = products.find(p => p.slug === decodeURIComponent(id)) ||
    products.find(p => p.name.toLowerCase() === decoded.toLowerCase());
  if (!product) return { title: 'Product | Neat Brand Trade' };
  return {
    title: `${product.name} | ${product.brand} | Neat Brand Trade`,
    description: product.description || `Buy ${product.name} by ${product.brand}. Premium cleaning & hygiene formulation available in multiple sizes.`,
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const allProducts = await getAllProducts();
  const decoded = decodeURIComponent(id).replace(/-/g, ' ');
  const product = allProducts.find(p => p.slug === decodeURIComponent(id)) ||
    allProducts.find(p => p.name.toLowerCase() === decoded.toLowerCase()) ||
    null;

  // Related: same category, excluding self
  const related = product
    ? allProducts.filter(p => p.category === product.category && p.slug !== product.slug).slice(0, 4)
    : [];

  return <ProductDetailClientPage product={product} allProducts={allProducts} related={related} />;
}

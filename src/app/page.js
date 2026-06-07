import ClientPage from './ClientPage';
import Papa from 'papaparse';

// Revalidate the data every 60 seconds (incremental static regeneration)
export const revalidate = 60;

export default async function Page() {
  let initialProducts = [];

  try {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1pHzmSNsXpPdrJcGQ5kI4ZNsAaUNVeXt6knle7C_sNG0/export?format=csv&gid=1847675030';
    
    // Fetch the CSV text on the server
    const response = await fetch(sheetUrl, { next: { revalidate: 60 } });
    const csvText = await response.text();

    // Parse the CSV
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Map product names to exact image files in the public/PRODUCTS/Neat/ directory
    const getProductImage = (name) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('bleach')) return '/PRODUCTS/Neat/neat-bleach.png';
      if (lowerName.includes('glass cleaner')) return '/PRODUCTS/Neat/neat-glass-cleaner-750ml.png';
      if (lowerName.includes('laundry')) return '/PRODUCTS/Neat/all-neat-laundry-detergent-colors-2l.png';
      if (lowerName.includes('fabric softener') && lowerName.includes('sensitive')) return '/PRODUCTS/Neat/neat-fabric-softener-sensitive.png';
      if (lowerName.includes('fabric softener') && lowerName.includes('spring')) return '/PRODUCTS/Neat/neat-fabric-softener-springfresh.png';
      if (lowerName.includes('fabric softener')) return '/PRODUCTS/Neat/neat-fabric-softener-luxury.png';
      if (lowerName.includes('shower gel') && lowerName.includes('carrot')) return '/PRODUCTS/Neat/all-neat-shower-gel-carrot-milk-800ml.png';
      if (lowerName.includes('shower gel') && lowerName.includes('lemon')) return '/PRODUCTS/Neat/all-neat-shower-gel-sweet-lemon-800ml.png';
      if (lowerName.includes('shower gel')) return '/PRODUCTS/Neat/all-neat-shower-gel-charming-800ml.png';
      if (lowerName.includes('hand wash') && lowerName.includes('lemon')) return '/PRODUCTS/Neat/neat-hand-wash-lemon-500ml.png';
      if (lowerName.includes('hand wash') && lowerName.includes('rose')) return '/PRODUCTS/Neat/neat-hand-wash-rose-300ml.png';
      if (lowerName.includes('hand wash')) return '/PRODUCTS/Neat/neat-hand-wash-aloevera-500ml.png';
      if (lowerName.includes('dish') && lowerName.includes('lemon')) return '/PRODUCTS/Neat/all-neat-dish-wash-lemon-400ml.png';
      if (lowerName.includes('dish') && lowerName.includes('rose')) return '/PRODUCTS/Neat/all-neat-dish-wash-rose-400ml.png';
      if (lowerName.includes('dish')) return '/PRODUCTS/Neat/all-neat-dish-wash-lavender-400ml.png';
      if (lowerName.includes('all-purpose') || lowerName.includes('all purpose')) {
        if (lowerName.includes('citrus')) return '/PRODUCTS/Neat/neat-all-purpose-cleaner-citrus-2l.png';
        if (lowerName.includes('jasmine')) return '/PRODUCTS/Neat/neat-all-purpose-cleaner-jasmine-2l.png';
        return '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png';
      }
      return '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png'; // ultimate fallback
    };

    for (const row of results.data) {
      if (!row.Name) continue;
      const isNeatProduct = row.Name.toLowerCase().startsWith('neat');
      initialProducts.push({
        id: `sheet_${row.Name}_${row.Size}`,
        name: row.Name,
        brand: row.Brand || 'Neat Product',
        supplier: isNeatProduct ? 'Daisy Hotel Amenities' : null,
        type: row.Type?.toLowerCase() === 'industrial' ? 'industrial' : 'retail',
        category: row.Category || 'General',
        description: row.Description || '',
        image: row.Image || getProductImage(row.Name),
        sizes: [
          {
            size: row.Size || '1L',
            price: parseFloat(row.Price) || 0,
            qtyInBox: parseInt(row.QtyInBox) || 1
          }
        ]
      });
    }
  } catch (error) {
    console.error("Failed to fetch initial products from Google Sheets:", error);
  }

  return <ClientPage initialProducts={initialProducts} />;
}

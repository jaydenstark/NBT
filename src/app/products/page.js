import ProductsClientPage from './ProductsClientPage';

export const metadata = {
  title: 'Chemical Catalog | Buy Premium Cleaning & Industrial Chemicals | Neat Brand Trade',
  description: 'Browse our complete catalog of precision-formulated cleaning products and raw industrial chemicals. Filter by brand (Neat, Deva, NBT Global) or category.',
  keywords: 'cleaning product catalog, industrial chemical catalog, liquid detergents, disinfectants, laundry detergents, household cleaners, Neat, Deva, NBT Global',
};

export default async function ProductsPage() {
  return <ProductsClientPage initialProducts={[]} />;
}

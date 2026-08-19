import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const baseProductsPath = fileURLToPath(new URL('./src/data/products.json', import.meta.url));
const extraProductsPath = fileURLToPath(new URL('./src/data/products-extra.json', import.meta.url));
const replacementProductsPath = fileURLToPath(new URL('./src/data/products-replacements.json', import.meta.url));
const pinsPath = fileURLToPath(new URL('./src/data/products-pins.json', import.meta.url));
const discontinuedProductIds = new Set(['qrio-lock-q-sl2']);
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const applyPins = (product) => pins[product.id]
  ? { ...product, rakuten: { ...product.rakuten, ...pins[product.id] } }
  : product;
const extraProducts = JSON.parse(readFileSync(extraProductsPath, 'utf8'));
const mergedProducts = [
  ...JSON.parse(readFileSync(baseProductsPath, 'utf8')),
  ...extraProducts.filter((product) => !discontinuedProductIds.has(product.id)),
  ...JSON.parse(readFileSync(replacementProductsPath, 'utf8'))
].map(applyPins);
const VIRTUAL_CATALOG_ID = '\0uchimamo-product-catalog';

function productCatalogPlugin() {
  return {
    name: 'uchimamo-product-catalog',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!importer) return null;
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('products.json')) return null;
      const cleanImporter = importer.split('?')[0];
      const resolved = path.resolve(path.dirname(cleanImporter), cleanId);
      return resolved === baseProductsPath ? VIRTUAL_CATALOG_ID : null;
    },
    load(id) {
      if (id !== VIRTUAL_CATALOG_ID) return null;
      return `export default ${JSON.stringify(mergedProducts)};`;
    }
  };
}

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [productCatalogPlugin(), tailwindcss()]
  }
});

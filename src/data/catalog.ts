import baseProductsJson from './products.json';
import extraProductsJson from './products-extra.json';
import type { Product } from '../types/product';

export const products = [...baseProductsJson, ...extraProductsJson] as Product[];

export default products;

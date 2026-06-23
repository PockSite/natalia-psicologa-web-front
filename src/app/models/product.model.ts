import { ProductType } from './product-type.model';

export interface Product {
  id: string;
  psychologistId: string;
  name: string;
  price: number;
  type: ProductType;
  image: string;
  short: string;
  description: string;
  features: string[];
  format?: string;
  category?: string;
  rating?: string;
  language?: string;
  guarantee?: string;
}

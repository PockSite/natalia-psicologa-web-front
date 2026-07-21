import { ProductType } from './product-type.model';
import { Psychologist } from './psychologist.model';

export interface Product {
  id: string;
  name: string;
  price: number;
  type: ProductType;
  psychologists: Psychologist[];
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

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
  /**
   * Personas que asisten a la sesión (2 = terapia de pareja).
   * El precio es el mismo: cubre la sesión completa, no se multiplica.
   */
  attendeesCount: number;
}

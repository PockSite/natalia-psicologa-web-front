export type ProductType = 'producto' | 'servicio';

export interface Product {
  id: string;
  name: string;
  price: number;
  psychologistId: string;
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

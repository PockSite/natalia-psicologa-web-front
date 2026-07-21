import { DocumentType } from './document-type.model';

export interface Client {
  id: string;
  fullName: string;
  documentType: DocumentType;
  document: string;
  email?: string;
  whatsappNumber?: string;
}

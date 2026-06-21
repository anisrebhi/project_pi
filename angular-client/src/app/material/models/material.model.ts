export interface Material {
  _id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  quantity: number;
  status: MaterialStatus;
  category: { _id: string; name: string; color?: string };
  project?: { _id: string; name: string; status?: string };
  purchaseDate?: string;
  purchasePrice?: number;
  location?: string;
  condition?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaterialStatus = 'disponible' | 'en-utilisation' | 'en-maintenance' | 'hors-service' | 'retire';

export const MATERIAL_STATUSES: MaterialStatus[] = [
  'disponible', 'en-utilisation', 'en-maintenance', 'hors-service', 'retire',
];

export const STATUS_LABELS: Record<MaterialStatus, string> = {
  'disponible': 'Disponible',
  'en-utilisation': 'En utilisation',
  'en-maintenance': 'En maintenance',
  'hors-service': 'Hors service',
  'retire': 'Retiré',
};

export interface MaterialFormData {
  name: string;
  description?: string;
  serialNumber?: string;
  quantity: number;
  status: MaterialStatus;
  category: string;
  project?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  location?: string;
  condition?: string;
  notes?: string;
}

export interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Category {
  _id: string;
  name: string;
  color?: string;
}

export interface Project {
  _id: string;
  name: string;
  status?: string;
}

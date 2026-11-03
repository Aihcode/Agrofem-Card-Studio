export interface Employee {
  id: string;
  codigo: string;
  nombre: string;
  puesto: string;
  empresa: string;
  fotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  codigo: string;
  nombre: string;
  puesto: string;
  empresa: string;
  fotoUrl: string | null;
}

export type CardSide = 'front' | 'back' | 'both';

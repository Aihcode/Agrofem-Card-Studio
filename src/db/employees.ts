import { db } from './index.ts';
import { employees, type Employee, type NewEmployee } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  } catch (error) {
    console.error('Failed to query employees:', error);
    throw new Error('Database query failed for employees list', { cause: error });
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const results = await db.select().from(employees).where(eq(employees.id, id));
    return results[0] || null;
  } catch (error) {
    console.error(`Failed to query employee by id ${id}:`, error);
    throw new Error(`Database query failed for employee ${id}`, { cause: error });
  }
}

export async function getEmployeeByCodigo(codigo: string): Promise<Employee | null> {
  try {
    const results = await db.select().from(employees).where(eq(employees.codigo, codigo));
    return results[0] || null;
  } catch (error) {
    console.error(`Failed to query employee by codigo ${codigo}:`, error);
    throw new Error(`Database query failed for employee code ${codigo}`, { cause: error });
  }
}

export async function createEmployee(data: {
  codigo: string;
  nombre: string;
  puesto: string;
  empresa?: string;
  fotoUrl?: string | null;
}): Promise<Employee> {
  try {
    const results = await db.insert(employees).values({
      codigo: data.codigo.trim().toUpperCase(),
      nombre: data.nombre.trim(),
      puesto: data.puesto.trim(),
      empresa: data.empresa?.trim() || 'Agrofem S,A',
      fotoUrl: data.fotoUrl || null,
      updatedAt: new Date(),
    }).returning();
    return results[0];
  } catch (error) {
    console.error('Failed to insert employee:', error);
    throw new Error('Failed to create employee record in database', { cause: error });
  }
}

export async function updateEmployee(
  id: string,
  data: {
    codigo?: string;
    nombre?: string;
    puesto?: string;
    empresa?: string;
    fotoUrl?: string | null;
  }
): Promise<Employee | null> {
  try {
    const updatePayload: Partial<NewEmployee> = {
      updatedAt: new Date(),
    };
    if (data.codigo !== undefined) updatePayload.codigo = data.codigo.trim().toUpperCase();
    if (data.nombre !== undefined) updatePayload.nombre = data.nombre.trim();
    if (data.puesto !== undefined) updatePayload.puesto = data.puesto.trim();
    if (data.empresa !== undefined) updatePayload.empresa = data.empresa.trim() || 'Agrofem S,A';
    if (data.fotoUrl !== undefined) updatePayload.fotoUrl = data.fotoUrl;

    const results = await db
      .update(employees)
      .set(updatePayload)
      .where(eq(employees.id, id))
      .returning();
    return results[0] || null;
  } catch (error) {
    console.error(`Failed to update employee ${id}:`, error);
    throw new Error(`Failed to update employee ${id}`, { cause: error });
  }
}

export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const results = await db.delete(employees).where(eq(employees.id, id)).returning({ id: employees.id });
    return results.length > 0;
  } catch (error) {
    console.error(`Failed to delete employee ${id}:`, error);
    throw new Error(`Failed to delete employee ${id}`, { cause: error });
  }
}

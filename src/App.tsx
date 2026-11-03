import React, { useState, useEffect, useCallback } from 'react';
import type { Employee, EmployeeFormData } from './types.ts';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { BadgePrintPage } from './components/BadgePrintPage.tsx';
import { EmployeeModal } from './components/EmployeeModal.tsx';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRoute, setActiveRoute] = useState<{ view: 'dashboard' | 'carnet'; id?: string }>({
    view: 'dashboard',
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Sync route from URL path
  const syncRouteFromPath = useCallback(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/carnet\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setActiveRoute({ view: 'carnet', id: match[1] });
    } else {
      setActiveRoute({ view: 'dashboard' });
    }
  }, []);

  useEffect(() => {
    syncRouteFromPath();
    window.addEventListener('popstate', syncRouteFromPath);
    return () => window.removeEventListener('popstate', syncRouteFromPath);
  }, [syncRouteFromPath]);

  // Load employees from PostgreSQL backend API
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Navigate to /carnet/[id]
  const navigateToCard = (id: string) => {
    window.history.pushState({}, '', `/carnet/${id}`);
    setActiveRoute({ view: 'carnet', id });
  };

  // Navigate back to Dashboard
  const navigateToDashboard = () => {
    window.history.pushState({}, '', '/');
    setActiveRoute({ view: 'dashboard' });
    fetchEmployees();
  };

  // Handle Save (Create or Update)
  const handleSaveEmployee = async (formData: EmployeeFormData, id?: string) => {
    const endpoint = id ? `/api/employees/${id}` : '/api/employees';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al guardar empleado');
    }

    showToast(
      id
        ? `Credencial de ${formData.nombre} actualizada correctamente.`
        : `Empleado ${formData.nombre} registrado con éxito.`
    );

    setRefreshTrigger((prev) => prev + 1);
    await fetchEmployees();
  };

  // Handle Delete
  const handleDeleteEmployee = async (id: string) => {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al eliminar');
    }
    showToast('Empleado eliminado del sistema.');
    await fetchEmployees();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="no-print print:hidden fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Switching */}
      {activeRoute.view === 'carnet' && activeRoute.id ? (
        <BadgePrintPage
          employeeId={activeRoute.id}
          refreshTrigger={refreshTrigger}
          onBack={navigateToDashboard}
          onEditEmployee={(emp) => {
            setEditingEmployee(emp);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <AdminDashboard
          employees={employees}
          isLoading={isLoading}
          onRefresh={fetchEmployees}
          onOpenCreateModal={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          onOpenEditModal={(emp) => {
            setEditingEmployee(emp);
            setIsModalOpen(true);
          }}
          onDeleteEmployee={handleDeleteEmployee}
          onNavigateToCard={navigateToCard}
        />
      )}

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        editingEmployee={editingEmployee}
      />
    </div>
  );
}

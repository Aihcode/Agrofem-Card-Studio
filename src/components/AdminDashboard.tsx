import React, { useState, useMemo } from 'react';
import type { Employee } from '../types.ts';
import {
  Printer,
  Plus,
  Search,
  Trash2,
  Edit,
  Sparkles,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  Download,
  FileCode,
  AlertTriangle,
  X,
} from 'lucide-react';
import { BadgeCanvas } from './BadgeCanvas.tsx';
import { downloadCsdFile } from '../lib/csdExport.ts';

interface AdminDashboardProps {
  employees: Employee[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => Promise<void>;
  onNavigateToCard: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteEmployee,
  onNavigateToCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [quickPreviewEmployee, setQuickPreviewEmployee] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastInfo, setToastInfo] = useState<string | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.nombre.toLowerCase().includes(q) ||
        emp.codigo.toLowerCase().includes(q) ||
        emp.puesto.toLowerCase().includes(q);

      const matchesCompany =
        filterCompany === 'ALL' ||
        (filterCompany === 'Cerdos' && emp.empresa.toLowerCase().includes('cerdos')) ||
        (filterCompany === 'Agrofem' && emp.empresa.toLowerCase().includes('agrofem'));

      return matchesSearch && matchesCompany;
    });
  }, [employees, searchQuery, filterCompany]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteEmployee(employeeToDelete.id);
      showToast(`Empleado ${employeeToDelete.nombre} eliminado exitosamente.`);
      setEmployeeToDelete(null);
    } catch (err: any) {
      showToast(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastInfo(msg);
    setTimeout(() => setToastInfo(null), 3000);
  };

  const handleDownloadCsd = (emp: Employee) => {
    downloadCsdFile(emp);
    showToast(`Archivo .csd descargado para ${emp.nombre}`);
  };

  const handleDownloadBaseTemplate = () => {
    downloadCsdFile(null, 'Plantilla_Oficial_Agrofem_SMART51');
    showToast('Plantilla base .csd descargada.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastInfo && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4" />
          {toastInfo}
        </div>
      )}

      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950 font-bold overflow-hidden p-1">
              <img
                src="/assets/agrofem_logo.png"
                alt="Agrofem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Agrofem <span className="text-amber-400 font-normal">CardStudio</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 rounded-full">
                  IDP SMART-51
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diseño CR80, Edición y Exportación .csd / Impresión Directa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Download Base .csd Template */}
            <button
              onClick={handleDownloadBaseTemplate}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Descargar archivo plantilla .csd para SMART iDesigner o Zebra CardStudio"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Plantilla Base</span> .csd
            </button>

            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title="Recargar base de datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Carnet</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hardware Status & Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Credenciales Activas
              </p>
              <h3 className="text-2xl font-black text-white">{employees.length}</h3>
              <p className="text-[11px] text-amber-400 font-medium">PostgreSQL Relational DB</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Exportación .CSD
              </p>
              <h3 className="text-sm font-bold text-white">Listo</h3>
              <p className="text-[11px] text-slate-400">CardStudio & iDesigner</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Impresora SMART-51
              </p>
              <h3 className="text-sm font-black text-white font-mono">CR80 (54×85.6mm)</h3>
              <p className="text-[11px] text-slate-400">Diálogo directo sin reverso</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gestión de Fichas
              </p>
              <h3 className="text-sm font-black text-white">Edición & Borrado</h3>
              <p className="text-[11px] text-slate-400">Actualización en tiempo real</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre (ej. Juanito Santana), cargo o código..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:border-amber-500 transition"
            >
              <option value="ALL">Todas las plantas</option>
              <option value="Cerdos">Procesadora de Cerdos</option>
              <option value="Agrofem">Agrofem S,A</option>
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-amber-950/60 border border-amber-500/40 px-4 py-1.5 rounded-xl text-xs font-semibold text-amber-300 animate-fade-in">
              <span>{selectedIds.length} seleccionados</span>
              <button
                onClick={() => {
                  if (selectedIds[0]) onNavigateToCard(selectedIds[0]);
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Abrir Carnet
              </button>
            </div>
          )}
        </div>

        {/* Modern Table Layout */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredEmployees.length > 0 &&
                        selectedIds.length === filteredEmployees.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Empleado / Foto
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Código Token
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Cargo / Puesto
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Planta / Empresa
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Vista
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Acciones de Edición & Impresión
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                      Cargando registros...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                      <p className="text-base font-bold text-slate-200">No se encontraron empleados</p>
                      <button
                        onClick={onOpenCreateModal}
                        className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Crear Nuevo Carnet
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.includes(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-slate-800/40 transition group ${
                          isSelected ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(emp.id)}
                            className="rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                          />
                        </td>

                        {/* Photo Thumbnail + Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setQuickPreviewEmployee(emp)}
                              className="w-[30px] h-[36px] bg-white rounded border border-slate-700 overflow-hidden shrink-0 shadow-xs cursor-pointer hover:border-amber-400 transition flex items-center justify-center relative group/pic"
                              title="Click para vista previa"
                            >
                              {emp.fotoUrl ? (
                                <img
                                  src={emp.fotoUrl}
                                  alt={emp.nombre}
                                  className="w-full h-full object-cover object-top"
                                />
                              ) : (
                                <Users className="w-4 h-4 text-slate-500" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pic:opacity-100 flex items-center justify-center transition">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-sm font-segoe-black tracking-tight uppercase group-hover:text-amber-300 transition">
                                {emp.nombre}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ID: {emp.codigo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Código Token */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-black/60 text-amber-400 border border-amber-400/30">
                            {emp.codigo}
                          </span>
                        </td>

                        {/* Puesto */}
                        <td className="px-4 py-3.5">
                          <span className="inline-block bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-md font-semibold uppercase tracking-wide">
                            {emp.puesto}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td className="px-4 py-3.5 text-xs text-slate-300 font-bold uppercase">
                          {emp.empresa || 'PROCESADORA DE CERDOS'}
                        </td>

                        {/* Quick Preview */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setQuickPreviewEmployee(emp)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                            title="Inspeccionar diseño"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Download .csd Button */}
                            <button
                              onClick={() => handleDownloadCsd(emp)}
                              className="px-2.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              title="Descargar archivo de diseño .csd para CardStudio / SMART iDesigner"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-400" />
                              <span>.csd</span>
                            </button>

                            {/* Primary Web Print Button */}
                            <button
                              onClick={() => onNavigateToCard(emp.id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
                              title="Abrir e imprimir en formato exacto para SMART-51"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Imprimir Web</span>
                            </button>

                            {/* Edit Button with explicit label */}
                            <button
                              onClick={() => onOpenEditModal(emp)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Editar empleado (nombre, cargo, planta, foto)"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-400" />
                              <span>Editar</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setEmployeeToDelete(emp)}
                              className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                              title="Eliminar este carnet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* In-App Delete Confirmation Modal (Safe for iFrame - no window.confirm) */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="relative bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">¿Eliminar este empleado?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Se eliminará permanentemente la credencial de{' '}
                  <strong className="text-white uppercase">{employeeToDelete.nombre}</strong> (Código:{' '}
                  <span className="text-amber-400 font-mono font-bold">
                    {employeeToDelete.codigo}
                  </span>
                  ) de la base de datos PostgreSQL.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Badge Inspection Modal (Single-sided, exact SMART iDesigner model) */}
      {quickPreviewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in no-print">
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col items-center max-w-sm w-full">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Modelo SMART iDesigner (CR80)</h3>
                <p className="text-[11px] text-slate-400">{quickPreviewEmployee.nombre}</p>
              </div>
              <button
                onClick={() => setQuickPreviewEmployee(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Preview */}
            <div className="my-2 transform scale-110">
              <BadgeCanvas employee={quickPreviewEmployee} />
            </div>

            {/* Modal Bottom Actions */}
            <div className="w-full mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const emp = quickPreviewEmployee;
                  setQuickPreviewEmployee(null);
                  onOpenEditModal(emp);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-amber-400" /> Editar
              </button>

              <button
                onClick={() => handleDownloadCsd(quickPreviewEmployee)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> .csd
              </button>

              <button
                onClick={() => {
                  const id = quickPreviewEmployee.id;
                  setQuickPreviewEmployee(null);
                  onNavigateToCard(id);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

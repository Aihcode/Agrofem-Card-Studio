import React, { useState, useEffect } from 'react';
import type { Employee } from '../types.ts';
import { BadgeCanvas } from './BadgeCanvas.tsx';
import { downloadCsdFile } from '../lib/csdExport.ts';
import {
  Printer,
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Edit,
  FileCode,
} from 'lucide-react';

interface BadgePrintPageProps {
  employeeId: string;
  onBack: () => void;
  onEditEmployee?: (employee: Employee) => void;
  refreshTrigger?: number;
}

export const BadgePrintPage: React.FC<BadgePrintPageProps> = ({
  employeeId,
  onBack,
  onEditEmployee,
  refreshTrigger = 0,
}) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.35);
  const [showRuler, setShowRuler] = useState<boolean>(true);

  useEffect(() => {
    async function loadEmployee() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/employees/${employeeId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Empleado no encontrado');
        }
        setEmployee(data.employee);
      } catch (err: any) {
        console.error('Failed to load employee for badge:', err);
        setError(err.message || 'Error al obtener datos del carnet');
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [employeeId, refreshTrigger]);

  // The print button ONLY triggers the native browser print dialog immediately
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsd = () => {
    if (!employee) return;
    downloadCsdFile(employee);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Cargando Carnet Agrofem...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Preparando diseño para IDP SMART-51
        </p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl max-w-md">
          <h2 className="text-lg font-bold text-red-200">Error al cargar carnet</h2>
          <p className="text-sm text-red-300 mt-2">{error || 'El empleado solicitado no existe.'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Tablero
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* =========================================================================
          CONTROL BAR (HIDDEN IN PRINT VIA TAILWIND UTILITIES)
          ========================================================================= */}
      <header className="no-print print:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Volver al panel"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {employee.codigo}
                </span>
                <span className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-[320px]">
                  {employee.nombre}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Modelo Oficial Agrofem • CR80 (54mm × 85.6mm) • Anverso Único
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit, Download .CSD & Direct Browser Print */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inspection Zoom */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                title="Reducir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="ml-1 text-[10px] text-emerald-400 hover:underline px-1 cursor-pointer"
                title="Escala 1:1 física exacta"
              >
                1:1 Real
              </button>
            </div>

            {/* Edit Button */}
            {onEditEmployee && (
              <button
                onClick={() => onEditEmployee(employee)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Editar datos de este carnet (Nombre, Cargo, Planta, Foto)"
              >
                <Edit className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar Ficha</span>
              </button>
            )}

            {/* DOWNLOAD .CSD BUTTON */}
            <button
              onClick={handleDownloadCsd}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950 flex items-center gap-1.5 transition cursor-pointer"
              title="Descargar archivo .csd para CardStudio / SMART iDesigner"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .csd</span>
            </button>

            {/* PRINT BUTTON: ONLY OPENS BROWSER PRINT DIALOG DIRECTLY */}
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition cursor-pointer transform active:scale-95"
              title="Abre el cuadro de diálogo de impresión del navegador"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir en SMART-51</span>
            </button>
          </div>
        </div>

        {/* Technical Info Bar */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Formato CR80 configurado (54mm × 85.6mm)
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline font-mono">
              Margen 0mm • Print-color-adjust exact • Sin reverso
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
                className="rounded text-emerald-500 bg-slate-950 border-slate-700"
              />
              <span>Guías milimétricas</span>
            </label>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CANVAS WORKSPACE
          ========================================================================= */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center p-6 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Card Stage Container */}
        <div
          className="relative transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Millimeter Inspection Ruler Overlay (Screen Only, matches SMART iDesigner ruler) */}
          {showRuler && (
            <div className="no-print print:hidden absolute -top-6 left-0 right-0 h-4 border-b border-emerald-500/50 flex justify-between text-[7px] font-mono text-emerald-400 px-0 pointer-events-none select-none">
              <span>0mm</span>
              <span>10mm</span>
              <span>20mm</span>
              <span>30mm</span>
              <span>40mm</span>
              <span>54mm</span>
            </div>
          )}

          {showRuler && (
            <div className="no-print print:hidden absolute -left-8 top-0 bottom-0 w-6 border-r border-emerald-500/50 flex flex-col justify-between text-[7px] font-mono text-emerald-400 py-0 pointer-events-none select-none text-right pr-1">
              <span>0mm</span>
              <span>20mm</span>
              <span>40mm</span>
              <span>60mm</span>
              <span>85.6mm</span>
            </div>
          )}

          {/* Exact Card Target (CR80 Vertical 54mm x 85.6mm) */}
          <div className="print-badge-container relative">
            <BadgeCanvas employee={employee} isPrintMode={true} />
          </div>

          {/* Subtle Card Stand Glow (Screen Only) */}
          <div className="no-print print:hidden absolute -bottom-4 left-4 right-4 h-4 bg-emerald-500/10 blur-md rounded-full pointer-events-none" />
        </div>

        {/* Quick Options Box below card */}
        <div className="no-print print:hidden mt-10 max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Formato .csd para CardStudio</div>
              <div className="text-[11px] text-slate-400">
                Compatible con SMART iDesigner y Zebra CardStudio
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadCsd}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition text-xs shrink-0 cursor-pointer"
          >
            Descargar
          </button>
        </div>
      </main>
    </div>
  );
};

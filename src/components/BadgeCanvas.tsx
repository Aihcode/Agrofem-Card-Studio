import React, { useEffect, useState } from 'react';
import type { Employee } from '../types.ts';
import { generateQrDataUrl } from '../lib/qr.ts';
import { User } from 'lucide-react';

interface BadgeCanvasProps {
  employee: Employee;
  isPrintMode?: boolean;
}

export const BadgeCanvas: React.FC<BadgeCanvasProps> = ({
  employee,
  isPrintMode = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate high-density verification QR code encoding the employee token and details
    const payload = `${employee.codigo || 'AGF-001'}|${employee.nombre}|${employee.puesto}|${employee.empresa || 'PROCESADORA DE CERDOS'}`;
    generateQrDataUrl(payload).then((url) => {
      setQrCodeUrl(url);
    });
  }, [employee.codigo, employee.nombre, employee.puesto, employee.empresa]);

  // Dynamic font sizing for employee name to guarantee zero overflow inside 54mm width
  const getNameFontSize = (name: string) => {
    const len = (name || '').trim().length;
    if (len > 28) return 'text-[10px] leading-[11.5px]';
    if (len > 21) return 'text-[11px] leading-[12.5px]';
    if (len > 16) return 'text-[12.5px] leading-[14px]';
    return 'text-[14px] leading-[15.5px]';
  };

  const getSubFontSize = (text: string) => {
    const len = (text || '').trim().length;
    if (len > 26) return 'text-[9.5px] leading-[11px]';
    if (len > 20) return 'text-[11px] leading-[12.5px]';
    return 'text-[12px] leading-[13.5px]';
  };

  return (
    <div
      className={`cr80-card-canvas bg-white text-black flex flex-col items-center justify-between select-none relative overflow-hidden ${
        isPrintMode ? 'print-badge-container' : 'shadow-2xl rounded-sm border border-slate-400/60'
      }`}
      style={{
        width: '54mm',
        height: '85.6mm',
        minWidth: '54mm',
        minHeight: '85.6mm',
        maxWidth: '54mm',
        maxHeight: '85.6mm',
        padding: '2.5mm 3mm 2.5mm 3mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. AGROFEM LOGO (Exact match to SMART iDesigner template) */}
      <div className="w-full flex items-center justify-center pt-[0.5mm] h-[18.5mm] shrink-0">
        <img
          src="/assets/agrofem_logo.png"
          alt="Agrofem Logo"
          className="max-w-[37mm] max-h-[18mm] object-contain block select-none pointer-events-none"
          onError={(e) => {
            // Fallback to stylized SVG header if image load is pending
            const target = e.target as HTMLElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* 2. EMPLOYEE PHOTO (Centered variable portrait, matches 26mm x 34mm standard) */}
      <div className="w-full flex items-center justify-center my-[0.5mm] shrink-0">
        <div
          className="relative bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shadow-xs"
          style={{
            width: '24mm',
            height: '29mm',
            minWidth: '24mm',
            minHeight: '29mm',
            boxSizing: 'border-box',
          }}
        >
          {employee.fotoUrl ? (
            <img
              src={employee.fotoUrl}
              alt={employee.nombre}
              className="w-full h-full object-cover object-top block"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <User className="w-[8mm] h-[8mm] text-slate-400" />
              <span className="text-[6px] font-bold text-slate-500 uppercase mt-0.5">FOTO</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. THREE-LINE TYPOGRAPHY BLOCK (Bold high-weight uppercase black font) */}
      <div className="w-full flex flex-col items-center justify-center text-center my-[0.5mm] px-[1mm] shrink-0">
        {/* Line 1: Nombre (JUANITO SANTANA) */}
        <div
          className={`font-segoe-black uppercase text-black font-black tracking-tight text-center w-full break-words ${getNameFontSize(
            employee.nombre
          )}`}
          style={{
            fontFamily: "'Segoe UI Black', 'Arial Black', -apple-system, sans-serif",
            fontWeight: 900,
            color: '#000000',
          }}
        >
          {employee.nombre || 'JUANITO SANTANA'}
        </div>

        {/* Line 2: Puesto (SEGURIDAD) */}
        <div
          className={`font-segoe-black uppercase text-black font-black tracking-tight text-center w-full mt-[1.2mm] break-words ${getSubFontSize(
            employee.puesto
          )}`}
          style={{
            fontFamily: "'Segoe UI Black', 'Arial Black', -apple-system, sans-serif",
            fontWeight: 900,
            color: '#000000',
          }}
        >
          {employee.puesto || 'SEGURIDAD'}
        </div>

        {/* Line 3: Empresa / Planta (PROCESADORA DE CERDOS) */}
        <div
          className={`font-segoe-black uppercase text-black font-black tracking-tight text-center w-full mt-[1.2mm] break-words ${getSubFontSize(
            employee.empresa
          )}`}
          style={{
            fontFamily: "'Segoe UI Black', 'Arial Black', -apple-system, sans-serif",
            fontWeight: 900,
            color: '#000000',
          }}
        >
          {employee.empresa || 'PROCESADORA DE CERDOS'}
        </div>
      </div>

      {/* 4. LARGE CENTERED QR CODE */}
      <div className="w-full flex items-center justify-center pb-[0.5mm] shrink-0">
        <div
          className="bg-white flex items-center justify-center"
          style={{
            width: '18.5mm',
            height: '18.5mm',
            boxSizing: 'border-box',
          }}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Verification QR"
              className="w-full h-full object-contain block"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 animate-pulse rounded-xs" />
          )}
        </div>
      </div>
    </div>
  );
};

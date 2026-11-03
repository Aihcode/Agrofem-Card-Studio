import React, { useState, useEffect, useRef } from 'react';
import type { Employee, EmployeeFormData } from '../types.ts';
import {
  X,
  Upload,
  Camera,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Building,
  Briefcase,
  User,
  Hash,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: EmployeeFormData, id?: string) => Promise<void>;
  editingEmployee?: Employee | null;
}

const COMMON_POSITIONS = [
  'SEGURIDAD',
  'OPERARIO DE PLANTA',
  'SUPERVISOR DE LINEA',
  'CONTROL DE CALIDAD',
  'TECNICO DE MANTENIMIENTO',
  'JEFE DE TURNO',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEmployee,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    codigo: '',
    nombre: '',
    puesto: '',
    empresa: 'PROCESADORA DE CERDOS',
    fotoUrl: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        codigo: editingEmployee.codigo,
        nombre: editingEmployee.nombre,
        puesto: editingEmployee.puesto,
        empresa: editingEmployee.empresa || 'PROCESADORA DE CERDOS',
        fotoUrl: editingEmployee.fotoUrl,
      });
      setPreviewUrl(editingEmployee.fotoUrl);
    } else {
      // Auto generate a standard Agrofem ID code for convenience
      const randomCode = `AGF-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        codigo: randomCode,
        nombre: '',
        puesto: 'SEGURIDAD',
        empresa: 'PROCESADORA DE CERDOS',
        fotoUrl: null,
      });
      setPreviewUrl(null);
    }
    setUploadError(null);
    stopCamera();
  }, [editingEmployee, isOpen]);

  // Cleanup camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setUploadError('No se pudo acceder a la cámara. Compruebe los permisos del navegador.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Crop to 26:34 portrait ratio
    const video = videoRef.current;
    const targetRatio = 26 / 34; // ~0.764
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    let sx = 0;
    let sy = 0;

    if (sw / sh > targetRatio) {
      // Video is wider than target
      const newWidth = sh * targetRatio;
      sx = (sw - newWidth) / 2;
      sw = newWidth;
    } else {
      const newHeight = sw / targetRatio;
      sy = (sh - newHeight) / 2;
      sh = newHeight;
    }

    canvas.width = 416; // 26 * 16
    canvas.height = 544; // 34 * 16
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      uploadImageToServer(dataUrl, `webcam_${formData.codigo || 'photo'}`);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      uploadImageToServer(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToServer = async (dataUrl: string, originalName: string) => {
    try {
      setUploadError(null);
      setPreviewUrl(dataUrl); // optimistic local preview

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          filename: originalName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo al procesar imagen en servidor');
      }

      setFormData((prev) => ({ ...prev, fotoUrl: data.url }));
      setPreviewUrl(data.url);
    } catch (err: any) {
      console.error('Upload failed:', err);
      // Keep dataUrl as fallback so user can still see and save badge
      setFormData((prev) => ({ ...prev, fotoUrl: dataUrl }));
      setUploadError('Imagen guardada en memoria local temporal.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.puesto.trim()) {
      setUploadError('Código, Nombre y Puesto son campos obligatorios.');
      return;
    }

    try {
      setIsSaving(true);
      setUploadError(null);
      await onSave(formData, editingEmployee?.id);
      stopCamera();
      onClose();
    } catch (err: any) {
      console.error('Error saving employee:', err);
      setUploadError(err.message || 'Error al guardar el empleado.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingEmployee ? 'Editar Ficha de Empleado' : 'Registrar Nuevo Empleado'}
              </h2>
              <p className="text-xs text-slate-400">
                Configuración de credencial para impresión en IDP SMART-51
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {uploadError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Top Section: Form Fields & Photo Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Input fields (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Código */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    Código Empleado *
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = `AGF-${Math.floor(1000 + Math.random() * 9000)}`;
                      setFormData((p) => ({ ...p, codigo: code }));
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-generar
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))
                  }
                  placeholder="Ej. AGF-1042"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-sm rounded-xl px-3.5 py-2.5 font-mono uppercase tracking-wider transition"
                />
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nombre: e.target.value.toUpperCase() }))
                  }
                  placeholder="Ej. CARLOS MENDOZA SILVA"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-sm rounded-xl px-3.5 py-2.5 font-bold uppercase transition"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Se imprimirá en tipografía Segoe UI Black en el carnet CR80.
                </span>
              </div>

              {/* Puesto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  Puesto / Cargo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.puesto}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, puesto: e.target.value.toUpperCase() }))
                  }
                  placeholder="Ej. DIRECTOR DE OPERACIONES"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-sm rounded-xl px-3.5 py-2.5 font-semibold uppercase transition"
                />

                {/* Suggestions pill */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_POSITIONS.slice(0, 4).map((pos) => (
                    <button
                      type="button"
                      key={pos}
                      onClick={() => setFormData((p) => ({ ...p, puesto: pos.toUpperCase() }))}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 transition"
                    >
                      + {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData((p) => ({ ...p, empresa: e.target.value }))}
                  placeholder="Agrofem S,A"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-sm rounded-xl px-3.5 py-2.5 transition"
                />
              </div>
            </div>

            {/* Right: Photo Frame & Upload (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-start bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                Fotografía (26mm × 34mm)
              </span>

              {/* Live Camera View or Photo Preview Box */}
              <div
                className="cr80-photo-frame bg-slate-900 border-2 border-dashed border-emerald-500/50 rounded-lg overflow-hidden relative flex items-center justify-center shadow-lg my-1"
                style={{ width: '26mm', height: '34mm' }}
              >
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-500 flex flex-col items-center">
                    <User className="w-6 h-6 mb-1 text-slate-600" />
                    <span className="text-[7px] leading-tight font-mono">FOTO CR80</span>
                    <span className="text-[6px] text-slate-600">26 × 34 mm</span>
                  </div>
                )}
              </div>

              {/* Camera Actions */}
              {isCameraActive ? (
                <div className="flex gap-2 mt-3 w-full">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Capturar
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-3 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Cargar Archivo
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    Tomar con Cámara
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFormData((p) => ({ ...p, fotoUrl: null }));
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 text-center hover:underline pt-1"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
              )}

              <span className="text-[10px] text-slate-500 text-center mt-3 leading-tight">
                Se almacena en <code>/public/uploads/</code> o almacenamiento seguro del servidor.
              </span>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" /> Guardando en PostgreSQL...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingEmployee ? 'Actualizar Ficha' : 'Crear Empleado'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

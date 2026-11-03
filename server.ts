import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './src/db/employees.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing with generous limit for high-resolution card photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure upload directory exists
const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve public uploads statically
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.resolve(__dirname, 'public')));

// API Routes
app.get('/api/employees', async (_req: Request, res: Response) => {
  try {
    const list = await getAllEmployees();
    res.json({ success: true, employees: list });
  } catch (error: any) {
    console.error('API Error in GET /api/employees:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch employees' });
  }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error: any) {
    console.error(`API Error in GET /api/employees/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch employee' });
  }
});

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    const { codigo, nombre, puesto, empresa, fotoUrl } = req.body;
    if (!codigo || !nombre || !puesto) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: codigo, nombre, and puesto are mandatory.',
      });
    }

    const newEmp = await createEmployee({
      codigo,
      nombre,
      puesto,
      empresa: empresa || 'Agrofem S,A',
      fotoUrl,
    });
    res.status(201).json({ success: true, employee: newEmp });
  } catch (error: any) {
    console.error('API Error in POST /api/employees:', error);
    const msg = error.message || '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return res.status(409).json({ success: false, error: 'Código de empleado ya existe.' });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create employee' });
  }
});

app.put('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, puesto, empresa, fotoUrl } = req.body;
    const updated = await updateEmployee(id, {
      codigo,
      nombre,
      puesto,
      empresa,
      fotoUrl,
    });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error(`API Error in PUT /api/employees/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteEmployee(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/employees/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete employee' });
  }
});

// Secure image upload handler (saves to /public/uploads/)
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid image data' });
    }

    // Match data URI pattern: data:image/(png|jpeg|webp);base64,...
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image data URL' });
    }

    const ext = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Security check: limit to 10MB raw buffer
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Image exceeds 10MB limit' });
    }

    const safePrefix = (filename || 'badge_photo')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 20);
    const uniqueName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;
    res.json({ success: true, url: publicUrl, filename: uniqueName });
  } catch (error: any) {
    console.error('API Error in POST /api/upload:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save image' });
  }
});

// Configure Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CardStudio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

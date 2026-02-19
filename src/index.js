// app.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import UsurioRoute from './route/UsuarioRoute.js';
import ProductRouter from './route/ProductoRoute.js';
import CategoriaRouter from './route/CategoriaRoute.js';
import LicenciaRouter from './route/LicenciaRoute.js';
import recurrenteRoutes from './route/RecurrenteRoute.js';
import CuponRouter from './route/CuponRoute.js';
import VentaRouter from './route/VentaRoute.js'; // Asegúrate de importar VentaRoute

dotenv.config(); // Cargar variables de entorno

const app = express();

// Crear la carpeta uploads si no existe
const __dirname = path.resolve(); // equivalente a __dirname en ES Modules
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware para habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(uploadsDir));

// Ruta raíz
app.get('/', (req, res) => {
    res.send('¡Backend en JavaScript funcionando!');
});

// Rutas con prefijo "api/"
app.use('/api/categoria', CategoriaRouter);
app.use('/api/usuario', UsurioRoute);
app.use('/api/producto', ProductRouter);
app.use('/api/licencia', LicenciaRouter);
app.use('/api/recurrente', recurrenteRoutes);
app.use('/api/cupones', CuponRouter);
app.use('/api/ventas', VentaRouter); // Asegúrate de importar VentaRoute al inicio del archivo

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
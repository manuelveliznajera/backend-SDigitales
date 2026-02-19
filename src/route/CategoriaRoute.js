// routes/CategoriaRoute.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { CategoriaController } from '../controllers/CategoriaController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads')); // Carpeta uploads
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Ruta para crear una categoría con imagen
router.post('/', auth, upload.single('imagen'), CategoriaController.crearCategoria);

// Ruta para obtener categorías
router.get('/', CategoriaController.obtenerCategorias);

// Ruta para editar una categoría (con o sin imagen)
router.put('/:id', auth, upload.single('imagen'), CategoriaController.editarCategoria);

// Ruta para eliminar una categoría
router.delete('/:id', auth, CategoriaController.eliminarCategoria);

export default router;
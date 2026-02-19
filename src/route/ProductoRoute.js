// routes/ProductoRoute.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { ProductoController } from '../controllers/ProductoController.js';
import auth from '../middleware/authMiddleware.js';

const ProductRouter = express.Router();

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

// Ruta para agregar un producto con imagen
ProductRouter.post('/', auth, upload.single('imagen'), ProductoController.agregarProducto);

// Ruta para obtener todos los productos
ProductRouter.get('/', ProductoController.getProductos);

// Ruta para obtener un producto por ID
ProductRouter.get('/:id', ProductoController.getProductoById);

// Ruta para editar un producto (con o sin imagen)
ProductRouter.put('/:id', auth, upload.single('imagen'), ProductoController.editarProducto);

// Ruta para eliminar un producto
ProductRouter.delete('/:id', auth, ProductoController.eliminarProducto);

export default ProductRouter;
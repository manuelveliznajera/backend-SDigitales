// routes/usuarios.js
import express from 'express';
import { UsuarioController } from '../controllers/UsuarioController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/login', UsuarioController.login);
router.post('/', UsuarioController.agregarUsuario); // opcionalmente, se puede proteger con auth + rol admin

// Rutas protegidas
router.get('/', auth, UsuarioController.obtenerTodosLosUsuarios);
router.get('/:id', auth, UsuarioController.buscarUsuario);
router.put('/:id', auth, UsuarioController.editarUsuario);
router.delete('/:id', auth, UsuarioController.eliminarUsuario);

export default router;
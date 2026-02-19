// controllers/UsuarioController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export class UsuarioController {

  // Agregar un nuevo usuario
  static async agregarUsuario(req, res) {
    try {
      const { correo, password, role } = req.body;

      if (!correo || !password) {
        return res.status(400).json({ error: 'El correo y el password son obligatorios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
      }

      const usuarioExistente = await prisma.usuario.findUnique({ where: { correo } });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const nuevoUsuario = await prisma.usuario.create({
        data: { correo, password: hashedPassword, role },
      });

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar el usuario', detalle: error.message });
    }
  }

  // Login de usuario
  static async login(req, res) {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        return res.status(400).json({ error: 'El correo y el password son obligatorios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
      }

      const usuario = await prisma.usuario.findUnique({ where: { correo } });
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no registrado' });
      }

      const esPasswordValido = await bcrypt.compare(password, usuario.password);
      if (!esPasswordValido) {
        return res.status(401).json({ error: 'Password incorrecto' });
      }

      const token = jwt.sign(
        { id: usuario.id, correo: usuario.correo },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        mensaje: 'Login exitoso',
        token,
        role: usuario.role,
        id: usuario.id,
        correo: usuario.correo
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
    }
  }

  // Buscar un usuario por ID
  static async buscarUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.status(200).json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar el usuario', detalle: error.message });
    }
  }

  // Editar un usuario
  static async editarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { correo, password, role } = req.body;

      let data = { correo, role };
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data
      });

      res.status(200).json(usuarioActualizado);
    } catch (error) {
      res.status(500).json({ error: 'Error al editar el usuario', detalle: error.message });
    }
  }

  // Eliminar un usuario
  static async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;
      await prisma.usuario.delete({ where: { id: parseInt(id) } });
      res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el usuario', detalle: error.message });
    }
  }

  // Obtener todos los usuarios
  static async obtenerTodosLosUsuarios(req, res) {
    try {
      const usuarios = await prisma.usuario.findMany();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los usuarios', detalle: error.message });
    }
  }
}
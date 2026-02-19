// controllers/CategoriaController.js
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class CategoriaController {
  // Crear una nueva categoría
  static async crearCategoria(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      const imagen = req.file ? req.file.filename : null;

      if (!imagen) {
        return res.status(400).json({ error: 'La imagen es obligatoria' });
      }

      const imagenPath = path.join(process.cwd(), 'uploads', imagen);
      if (!fs.existsSync(imagenPath)) {
        return res.status(400).json({ error: 'Error al subir la imagen. El archivo no existe.' });
      }

      const imagenHash = CategoriaController.calcularHash(imagenPath);

      // Validar duplicados por hash
      const archivos = fs.readdirSync(path.join(process.cwd(), 'uploads'));
      for (const archivo of archivos) {
        const archivoPath = path.join(process.cwd(), 'uploads', archivo);
        if (archivoPath === imagenPath) continue;
        const archivoHash = CategoriaController.calcularHash(archivoPath);
        if (imagenHash === archivoHash) {
          fs.unlinkSync(imagenPath);
          return res.status(400).json({ error: 'La imagen ya existe en el servidor' });
        }
      }

      if (!nombre || !descripcion) {
        return res.status(400).json({ error: 'El nombre y la descripción son obligatorios' });
      }

      const categoriaExistente = await prisma.categoria.findUnique({ where: { nombre } });
      if (categoriaExistente) {
        return res.status(400).json({ error: 'El nombre de la categoría ya existe' });
      }

      const nuevaCategoria = await prisma.categoria.create({
        data: { nombre, descripcion, imagen },
      });

      res.status(201).json(nuevaCategoria);
    } catch (error) {
      console.error('Error en crearCategoria:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Calcular hash de archivo
  static calcularHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Obtener todas las categorías
  static async obtenerCategorias(req, res) {
    try {
      const categorias = await prisma.categoria.findMany();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las categorías', detalle: error.message });
    }
  }

  // Editar categoría
  static async editarCategoria(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      let nuevaImagen = req.file ? req.file.filename : null;

      const categoria = await prisma.categoria.findUnique({ where: { id: parseInt(id) } });
      if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

      if (nuevaImagen && categoria.imagen) {
        const imagenAnteriorPath = path.join(process.cwd(), 'uploads', categoria.imagen);
        if (fs.existsSync(imagenAnteriorPath)) fs.unlinkSync(imagenAnteriorPath);
      }

      if (!nuevaImagen) nuevaImagen = categoria.imagen;

      if (nombre && nombre !== categoria.nombre) {
        const categoriaExistente = await prisma.categoria.findUnique({ where: { nombre } });
        if (categoriaExistente) return res.status(400).json({ error: 'El nombre de la categoría ya existe' });
      }

      const categoriaActualizada = await prisma.categoria.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre || categoria.nombre,
          descripcion: descripcion || categoria.descripcion,
          imagen: nuevaImagen,
        },
      });

      res.status(200).json(categoriaActualizada);
    } catch (error) {
      console.error('Error al editar la categoría:', error);
      res.status(500).json({ error: 'Error al editar la categoría', detalle: error.message });
    }
  }

  // Eliminar categoría
  static async eliminarCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await prisma.categoria.findUnique({ where: { id: parseInt(id) } });
      if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

      if (categoria.imagen) {
        const imagenPath = path.join(process.cwd(), 'uploads', categoria.imagen);
        if (fs.existsSync(imagenPath)) fs.unlinkSync(imagenPath);
      }

      await prisma.categoria.delete({ where: { id: parseInt(id) } });
      res.status(200).json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      res.status(500).json({ error: 'Error al eliminar la categoría', detalle: error.message });
    }
  }
}
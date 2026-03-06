// controllers/CategoriaController.js
import { PrismaClient } from '@prisma/client';
import { uploadImage, deleteImage } from '../helpers/uploadImage.js';
import fs from 'fs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class CategoriaController {
  // Crear una nueva categoría
  static async crearCategoria (req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "Nombre requerido" });
    }

    let imagenPublicId = null;

    // Si viene imagen
    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, "categorias");
      imagenPublicId = uploadResult.public_id;
    }

    const categoria = await prisma.categoria.create({
      data: {
        nombre,
        descripcion,
        imagen: imagenPublicId,
      },
    });

    res.json(categoria);
  } catch (error) {
    console.error("Error en crearCategoria:", error);
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

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

      const categoria = await prisma.categoria.findUnique({ where: { id: parseInt(id) } });

      if (
            nombre === categoria.nombre &&
            descripcion === categoria.descripcion &&
            !req.file
          ) {
            return res.json({ mensaje: "No hubo cambios" });
          }

      if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
            
      let nuevaImagen = categoria.imagen;

  if (req.file) {
          const upload = await uploadImage(req.file.path, "categorias");

      if (categoria.imagen) {
              await deleteImage(categoria.imagen);
        }

            nuevaImagen = upload.public_id;
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
        await deleteImage(categoria.imagen);
      }

      await prisma.categoria.delete({ where: { id: parseInt(id) } });
      res.status(200).json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la categoría', detalle: error.message });
    }
  }
}

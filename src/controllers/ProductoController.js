// controllers/ProductoController.js
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ProductoController {
  // Agregar un nuevo producto
  static async agregarProducto(req, res) {
    try {
      let imagen = null;
      if (req.file) {
        imagen = req.file.filename;
        const imagenPath = path.join(process.cwd(), 'uploads', imagen);
        if (!fs.existsSync(imagenPath)) {
          return res.status(400).json({ error: 'Error al subir la imagen. El archivo no existe en uploads.' });
        }
      } else if (req.body.imagen) {
        imagen = req.body.imagen;
      }

      const { nombreProducto, descripcion, stock, precioCosto, precioPublico, categoriaId, favorito } = req.body;

      if (
        !nombreProducto ||
        !descripcion ||
        stock === undefined || stock === null ||
        precioCosto === undefined || precioCosto === null ||
        precioPublico === undefined || precioPublico === null ||
        !categoriaId ||
        !imagen
      ) {
        return res.status(400).json({ error: 'No se permiten campos nulos o vacíos para crear el producto' });
      }

      const nuevoProducto = await prisma.producto.create({
        data: {
          nombreProducto,
          descripcion,
          stock: parseInt(stock),
          precioCosto: parseFloat(precioCosto),
          precioPublico: parseFloat(precioPublico),
          categoriaId: parseInt(categoriaId),
          favorito: favorito === undefined ? false : Boolean(favorito),
          imagen,
        },
      });

      if (!nuevoProducto || !nuevoProducto.id) {
        return res.status(500).json({ error: 'No se pudo guardar el producto en la base de datos' });
      }

      res.status(201).json(nuevoProducto);
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar el producto', detalle: error.message });
    }
  }

  // Calcular hash de un archivo
  static calcularHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los productos
  static async getProductos(req, res) {
    try {
      const productos = await prisma.producto.findMany({
        include: { categoria: true },
      });
      res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los productos', detalle: error.message });
    }
  }

  // Obtener un producto por ID
  static async getProductoById(req, res) {
    const { id } = req.params;
    try {
      const producto = await prisma.producto.findUnique({
        where: { id: Number(id) },
        include: { categoria: true },
      });
      if (!producto) return res.status(404).json({ error: `Producto con id ${id} no encontrado` });
      res.status(200).json(producto);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el producto', detalle: error.message });
    }
  }

  // Editar un producto
  static async editarProducto(req, res) {
    try {
      const { id } = req.params;
      let { nombreProducto, descripcion, stock, precioCosto, precioPublico, categoriaId, favorito, imagen } = req.body;

      const producto = await prisma.producto.findUnique({ where: { id: parseInt(id) } });
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

      if (req.file) {
        const nuevaImagen = req.file.filename;
        if (producto.imagen && producto.imagen !== nuevaImagen) {
          const imagenAnteriorPath = path.join(process.cwd(), 'uploads', producto.imagen);
          if (fs.existsSync(imagenAnteriorPath)) fs.unlinkSync(imagenAnteriorPath);
        }
        imagen = nuevaImagen;
      } else if (imagen && producto.imagen !== imagen) {
        const imagenAnteriorPath = path.join(process.cwd(), 'uploads', producto.imagen);
        if (fs.existsSync(imagenAnteriorPath)) fs.unlinkSync(imagenAnteriorPath);
      } else {
        imagen = producto.imagen;
      }

      if (
        !nombreProducto ||
        !descripcion ||
        stock === undefined || stock === null ||
        precioCosto === undefined || precioCosto === null ||
        precioPublico === undefined || precioPublico === null ||
        !categoriaId
      ) {
        return res.status(400).json({ error: 'No se permiten campos nulos o vacíos para editar el producto' });
      }

      const productoActualizado = await prisma.producto.update({
        where: { id: parseInt(id) },
        data: {
          nombreProducto,
          descripcion,
          stock: parseInt(stock),
          precioCosto: parseFloat(precioCosto),
          precioPublico: parseFloat(precioPublico),
          categoriaId: parseInt(categoriaId),
          favorito: favorito === undefined ? producto.favorito : Boolean(favorito),
          imagen,
        },
      });

      res.status(200).json(productoActualizado);
    } catch (error) {
      res.status(500).json({ error: 'Error al editar el producto', detalle: error.message });
    }
  }

  // Eliminar un producto
  static async eliminarProducto(req, res) {
    try {
      const { id } = req.params;
      await prisma.producto.delete({ where: { id: parseInt(id) } });
      res.status(200).json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el producto', detalle: error.message });
    }
  }
}
// controllers/CuponController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CuponController = {

  // 1️⃣ Listar todos los cupones
  getAll: async (req, res) => {
    try {
      const cupones = await prisma.cupon.findMany();
      res.json(cupones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los cupones' });
    }
  },

  // 2️⃣ Obtener un cupón por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const cupon = await prisma.cupon.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cupon) return res.status(404).json({ error: 'Cupón no encontrado' });

      res.json(cupon);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el cupón' });
    }
  },

  // 3️⃣ Crear un nuevo cupón
  create: async (req, res) => {
    try {
      const { codigo, tipo, valor, maxUsos, fechaExpira } = req.body;

      const nuevoCupon = await prisma.cupon.create({
        data: {
          codigo,
          tipo,
          valor,
          maxUsos: maxUsos || null,
          fechaExpira: fechaExpira ? new Date(fechaExpira) : null,
        },
      });

      res.status(201).json(nuevoCupon);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'El código del cupón ya existe' });
      }
      res.status(500).json({ error: 'Error al crear el cupón' });
    }
  },

  // 4️⃣ Actualizar un cupón existente
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { codigo, tipo, valor, maxUsos, fechaExpira } = req.body;

      console.log(id, codigo, tipo, valor, maxUsos, fechaExpira, "datos para actualizar ");

      const cuponActualizado = await prisma.cupon.update({
        where: { id: parseInt(id) },
        data: {
          codigo,
          tipo,
          valor,
          maxUsos: maxUsos || null,
          fechaExpira: fechaExpira ? new Date(fechaExpira) : null,
        },
      });

      res.json(cuponActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el cupón' });
    }
  },

  // 5️⃣ Eliminar un cupón
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.cupon.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: 'Cupón eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el cupón' });
    }
  },

  // 6️⃣ Validar cupón antes de aplicar
validate: async (req, res) => {
  try {

    const { codigo } = req.body;

    // Buscar cupón por código
    const cupon = await prisma.cupon.findUnique({
      where: { codigo },
    });

    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // Validar fecha de expiración
    const ahora = new Date();
    if (cupon.fechaExpira && cupon.fechaExpira < ahora) {
      return res.status(400).json({ error: 'Cupón expirado' });
    }

    // Validar cantidad de usos
    if (cupon.maxUsos !== null && cupon.usos >= cupon.maxUsos) {
      return res.status(400).json({ error: 'El cupón ya no tiene usos disponibles' });
    }

    // Retornar cupón válido
    res.json({
      id: cupon.id,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el cupón' });
  }
}
};
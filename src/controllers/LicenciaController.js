// controllers/LicenciaController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const LicenciaController = {

  // Crear una licencia
  async create(req, res) {
    try {
      const { productoId, clave, estado } = req.body;

      console.log(productoId,clave,estado)

      if (!productoId || !clave) {
        return res.status(400).json({ error: "productoId y clave son requeridos" });
      }

      const licencia = await prisma.licencia.create({
        data: {
          productoId,
          clave,
          estado: estado || "Disponible",
        },
      });

      res.status(201).json(licencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creando licencia" });
    }
  },

  // Obtener todas las licencias
  async getAll(req, res) {
    try {
      const licencias = await prisma.licencia.findMany({
        orderBy: {
         id: 'desc'
        },
        include: {
        Producto: {
          select: {
            nombreProducto: true
          }
        }
      }
      });
      res.json(licencias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo licencias" });
    }
  },

  // Obtener licencia por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const licencia = await prisma.licencia.findUnique({
        where: { id: parseInt(id) },
        include: { Producto: true },
      });

      if (!licencia) return res.status(404).json({ error: "Licencia no encontrada" });

      res.json(licencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo licencia" });
    }
  },

  // Actualizar licencia
  async update(req, res) {
    try {
      const { id } = req.params;
      const { productoId, clave, estado } = req.body;

      const licenciaExist = await prisma.licencia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!licenciaExist) return res.status(404).json({ error: "Licencia no encontrada" });

      const licencia = await prisma.licencia.update({
        where: { id: parseInt(id) },
        data: {
          productoId: productoId ?? licenciaExist.productoId,
          clave: clave ?? licenciaExist.clave,
          estado: estado ?? licenciaExist.estado,
        },
      });

      res.json(licencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error actualizando licencia" });
    }
  },

  // Eliminar licencia
  async delete(req, res) {
    try {
      const { id } = req.params;

      const licenciaExist = await prisma.licencia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!licenciaExist) return res.status(404).json({ error: "Licencia no encontrada" });

      await prisma.licencia.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Licencia eliminada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error eliminando licencia" });
    }
  },

  // Obtener licencias por producto
  async getByProducto(req, res) {
    try {
      const { productoId } = req.params;

      const licencias = await prisma.licencia.findMany({
        where: { productoId: parseInt(productoId) },
      });

      res.json(licencias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo licencias por producto" });
    }
  },

  async asignarLicencia  (req, res) { 
  const { ventaId, licenciaId } = req.body;

  try {
    // 1️⃣ Verificar que la venta exista
    const venta = await prisma.venta.findUnique({
      where: { id: Number(ventaId) },
    });

    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // 2️⃣ Verificar que la licencia esté disponible
    const licencia = await prisma.licencia.findUnique({
      where: { id: Number(licenciaId) },
    });

    if (!licencia) {
      return res.status(404).json({ message: "Licencia no encontrada" });
    }

    if (licencia.estado !== "Disponible") {
      return res.status(400).json({ message: "La licencia no está disponible" });
    }

    // 3️⃣ Crear un nuevo DetalleVenta sin precio (solo con la licencia)
    const nuevoDetalle = await prisma.detalleVenta.create({
      data: {
        ventaId: Number(ventaId),
        licenciaId: Number(licenciaId),
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0,
      },
    });

    // 4️⃣ Actualizar el estado de la licencia a "Vendido"
    await prisma.licencia.update({
      where: { id: Number(licenciaId) },
      data: { estado: "Vendido" },
    });

    return res.status(200).json({
      message: "Licencia asignada correctamente a la venta",
      detalle: nuevoDetalle,
    });
  } catch (error) {
    console.error("Error al asignar licencia:", error);
    return res.status(500).json({
      message: "Error del servidor al asignar licencia",
      error: error.message,
    });
  }

},

async addDetalleConLicencia  (req, res) {
  console.log("ingreso a adddetalleconlicencia")
    const ventaId = Number(req.params.ventaId);
    console.log(ventaId,"ventaId")
    console.log(req.body)

    const { licenciaId } = req.body 

    if (!Number.isFinite(ventaId)) {
      return res.status(400).json({ error: "ventaId inválido" });
    }
    if (!licenciaId || !Number.isFinite(licenciaId)) {
      return res.status(400).json({ error: "licenciaId es requerido" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1) Validar venta
        const venta = await tx.venta.findUnique({ where: { id: ventaId } });
        if (!venta) throw new Error("VENTA_NO_EXISTE");

        // 2) Validar licencia
        const licencia = await tx.licencia.findUnique({
          where: { id: licenciaId },
          include: { Producto: { select: { id: true, nombreProducto: true } } },
        });
        if (!licencia) throw new Error("LICENCIA_NO_EXISTE");

        // (opcional) Validar estado disponible
         if (licencia.estado !== "Disponible") throw new Error("LICENCIA_NO_DISPONIBLE");

        // 3) Evitar duplicado en la misma venta
        const existeEnVenta = await tx.detalleVenta.findFirst({
          where: { ventaId, licenciaId },
          select: { id: true },
        });
        if (existeEnVenta) throw new Error("LICENCIA_YA_ASIGNADA_EN_ESTA_VENTA");

        // 4) Crear el detalle (solo serial, sin costo)
        const detalle = await tx.detalleVenta.create({
          data: {
            ventaId,
            licenciaId,
            productoId: null,   // o licencia.productoId si quieres ligarlo al producto
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
          },
          include: {
            Licencia: { select: { id: true, clave: true } },
            Producto: { select: { id: true, nombreProducto: true } },
          },
        });

        // 5) (Opcional) Marcar licencia como usada
        await tx.licencia.update({
          where: { id: licenciaId },
          data: { estado: "Vendido" },
        });

        return detalle;
      });

      return res.status(201).json(result);
    } catch (err) {
      console.error(err);
     
      const status = mapStatus[err?.message] ?? 500;
      const msg =
        err?.message && mapStatus[err.message]
          ? err.message
          : "Error al crear el detalle de venta";
      return res.status(status).json({ error: msg });
    }
  }
};

  


export default LicenciaController;
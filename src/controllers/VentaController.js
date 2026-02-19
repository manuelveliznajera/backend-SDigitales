// controllers/ventaController.js
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const prisma = new PrismaClient();

// 🔹 Crear venta con detalles y archivo
export const createVenta = async (req, res) => {
  try {
    console.log(req.body.cupon, "cupon id en req body");
    const {
      usuarioId,
      clienteId,
      nombreCompleto: clienteNombre,
      telefono: clienteTelefono,
      email: clienteCorreo,
      direccion: clienteDireccion,
      total,
      metodoPagoId,
      estado = "En Proceso",
      cupon,
      detalleVenta,
    } = req.body;

    const detalleVentaParsed = JSON.parse(detalleVenta);
    let cuponid = null;

    if (cupon) {
      try {
        cuponid = await prisma.cupon.findUnique({
          where: { codigo: cupon },
        });
        if (cuponid?.id) {
          await prisma.cupon.update({
            where: { id: cuponid.id },
            data: { usos: { increment: 1 } },
          });
        }
      } catch (error) {
        console.error("Error procesando cupón:", error);
      }
    }

    // Comprobante
    let comprobantePath = null;
    if (req.file) {
      comprobantePath = req.file.path;
    }

    const venta = await prisma.venta.create({
      data: {
        usuarioId: parseInt(usuarioId),
        clienteId,
        clienteNombre,
        clienteTelefono,
        clienteCorreo,
        clienteDireccion,
        total: parseFloat(total),
        metodoPagoId: parseInt(metodoPagoId),
        comprobantePago: comprobantePath || null,
        estado,
        cuponId: cuponid ? cuponid.id : null,
        DetalleVenta: {
          create: detalleVentaParsed.map((d) => ({
            productoId: d.productoId ? parseInt(d.productoId) : null,
            licenciaId: d.licenciaId ? parseInt(d.licenciaId) : null,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.subtotal,
          })),
        },
      },
      include: {
        DetalleVenta: { include: { Producto: true, Licencia: true } },
        Cliente: true,
        MetodoPago: true,
        cupon: true,
      },
    });

    res.status(201).json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la venta" });
  }
};

// 🔹 Obtener todas las ventas con detalles
export const getVentas = async (req, res) => {
  try {
    const ventas = await prisma.venta.findMany({
      include: {
        DetalleVenta: { include: { Producto: true, Licencia: true } },
        Cliente: true,
        MetodoPago: true,
        cupon: true,
      },
    });
    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las ventas" });
  }
};

// 🔹 Obtener venta por ID con detalles
export const getVentaById = async (req, res) => {
  const { id } = req.params;
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        DetalleVenta: { include: { Producto: true, Licencia: true } },
        Cliente: true,
        MetodoPago: true,
        cupon: true,
      },
    });
    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
    res.json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la venta" });
  }
};

// 🔹 Actualizar venta, detalles y comprobante
export const updateVenta = async (req, res) => {
  const { id } = req.params;
  const {
    clienteId,
    clienteNombre,
    clienteTelefono,
    clienteCorreo,
    clienteDireccion,
    total,
    metodoPagoId,
    estado,
    cuponId,
    detalleVenta, // string JSON
  } = req.body;

  try {
    const detalleVentaArray = JSON.parse(detalleVenta);

    // Obtener venta existente
    const ventaExistente = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
    });
    if (!ventaExistente)
      return res.status(404).json({ error: "Venta no encontrada" });

    // Reemplazar comprobante si se envía archivo
    let comprobantePath = ventaExistente.comprobantePago;
    if (req.file) {
      // eliminar archivo viejo si existe
      if (
        ventaExistente.comprobantePago &&
        fs.existsSync(ventaExistente.comprobantePago)
      ) {
        fs.unlinkSync(ventaExistente.comprobantePago);
      }
      comprobantePath = req.file.path;
    }

    const ventaActualizada = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: {
        clienteId,
        clienteNombre,
        clienteTelefono,
        clienteCorreo,
        clienteDireccion,
        total: parseFloat(total),
        metodoPagoId: parseInt(metodoPagoId),
        comprobantePago: comprobantePath,
        estado,
        cuponId,
        DetalleVenta: {
          deleteMany: {
            id: { notIn: detalleVentaArray.filter((d) => d.id).map((d) => d.id) },
          },
          upsert: detalleVentaArray.map((d) => ({
            where: { id: d.id || 0 },
            update: {
              productoId: d.productoId ? parseInt(d.productoId) : null,
              licenciaId: d.licenciaId ? parseInt(d.licenciaId) : null,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal,
            },
            create: {
              productoId: d.productoId ? parseInt(d.productoId) : null,
              licenciaId: d.licenciaId ? parseInt(d.licenciaId) : null,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal,
            },
          })),
        },
      },
      include: {
        DetalleVenta: { include: { Producto: true, Licencia: true } },
        Cliente: true,
        MetodoPago: true,
        cupon: true,
      },
    });

    res.json(ventaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la venta" });
  }
};

// 🔹 Eliminar venta y comprobante
export const deleteVenta = async (req, res) => {
  const { id } = req.params;
  try {
    const ventaExistente = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
    });
    if (!ventaExistente)
      return res.status(404).json({ error: "Venta no encontrada" });

    // eliminar comprobante si existe
    if (
      ventaExistente.comprobantePago &&
      fs.existsSync(ventaExistente.comprobantePago)
    ) {
      fs.unlinkSync(ventaExistente.comprobantePago);
    }

    await prisma.venta.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la venta" });
  }
};

export const actualizarEstadoVenta = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Validar que estado sea uno de los permitidos
  const estadosValidos = ["En_Proceso", "Rechazada", "Entregada"];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  try {
    const ventaActualizada = await prisma.venta.update({
      where: { id: Number(id) },
      data: { estado },
    });

    res.json(ventaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando el estado de la venta" });
  }
};

// 🔹 Generar factura PDF (profesional)
export const generarFactura = async (req, res) => {
  const { id } = req.params;

  try {
    const venta = await prisma.venta.findUnique({
      where: { id: Number(id) },
      include: {
        DetalleVenta: { include: { Producto: true, Licencia: true } },
        MetodoPago: true,
        cupon: true,
      },
    });


    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });

    const safeClient =
      (venta.clienteNombre || "cliente").replace(/[^\w\s-]/g, "").trim() ||
      "cliente";
    const fileName = `factura_${venta.id}_${safeClient}.pdf`;
    const filePath = path.join(process.cwd(), `uploads/${fileName}`);

    const doc = new PDFDocument({
      margin: 40,
      size: "LETTER", // Carta (8.5 x 11)
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // === WATERMARK ===
    const logoPath = path.join(process.cwd(), "src/assets/logoBlue.png");
    try {
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.opacity(0.08);
        doc.image(logoPath, 150, 200, { width: 300, align: "center" });
        doc.opacity(1);
        doc.restore();
      }
    } catch (e) {
      console.error("Error adding watermark:", e);
    }

    // === ENCABEZADO ===
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 80 });
    }

    // NUMERO DE FACTURA (Estilo D: caja roja con FAC-id)
    doc.lineWidth(1).strokeColor("#d32f2f").rect(380, 30, 160, 30).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#d32f2f")
      .text(`FAC-${venta.id}`, 380, 38, { width: 160, align: "center" });

    // Fecha impresión
    doc
      .font("Helvetica")
      .fillColor("#333")
      .fontSize(10)
      .text(`Fecha de impresión: ${new Date().toLocaleString()}`, 380, 70, {
        align: "right",
      });

    doc.moveDown(2);

    // === SECCIÓN DATOS DEL CLIENTE (sin fondo) ===
    const clienteBoxTop = doc.y;
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(13).text(
      "Datos del Cliente",
      50,
      clienteBoxTop
    );

    // Separador azul
    doc.moveTo(40, doc.y + 4).lineTo(560, doc.y + 4).stroke("#004aad");

    // Contenido cliente
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333")
      .text(`Nombre: ${venta.clienteNombre}`, 50, doc.y + 10)
      .text(`Teléfono: ${venta.clienteTelefono}`, 50)
      .text(`Correo: ${venta.clienteCorreo}`, 50)
      .text(`Dirección: ${venta.clienteDireccion || "N/A"}`, 50);

    doc.moveDown(2);

    // === INFORMACIÓN DE LA VENTA (sin fondo) ===
    const ventaBoxTop = doc.y;
    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Información de la Venta", 50, ventaBoxTop);

    doc.moveTo(40, doc.y + 4).lineTo(560, doc.y + 4).stroke("#004aad");

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333")
      .text(`ID Venta: ${venta.id}`, 50, doc.y + 10)
      .text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 50)
      .text(`Método de Pago: ${venta.MetodoPago?.nombre || "N/A"}`, 300)
      .text(`Estado: ${venta.estado}`, 300);

    if (venta.cupon) {
      doc.text(`Cupón Aplicado: ${venta.cupon.codigo}`, 50);
    }

    doc.moveDown(2);

    // === TABLA DE PRODUCTOS (con columna Serial, posición B) ===
    const startX = 40;
    const colWidths = [30, 180, 130, 50, 65, 65]; // total = 520 (cabe exacto)
    const headers = ["#", "Producto", "Serial", "Cantidad", "Precio", "Subtotal"];
    const tableTop = doc.y + 10;

    // Encabezado tabla (azul corporativo)
    doc
      .rect(startX, tableTop - 5, colWidths.reduce((a, b) => a + b, 0), 24)
      .fill("#004aad")
      .stroke();
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#fff");
    headers.forEach((h, i) => {
      const x =
        startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      doc.text(h, x, tableTop);
    });

    // Cálculo de filas que caben para 1 página
    const rowHeight = 26;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const reserveBottom = 140; // Totales + QR + Footer
    const availableHeight =
      pageBottom - (tableTop + 24) - reserveBottom;
    const maxRows = Math.max(0, Math.floor(availableHeight / rowHeight));

    // Solo las filas que caben
    const items = venta.DetalleVenta.slice(0, maxRows);

    let y = tableTop + 28;
    doc.font("Helvetica").fontSize(10);
    let serialCounter = 0;

    items.forEach((item, index) => {
      const isEven = index % 2 === 0;

      // Fondo fila
      doc
        .rect(startX, y - 4, colWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill(isEven ? "#f7f7f7" : "#ffffff")
        .stroke("#e0e0e0");

      const productoNombre = item.Producto?.nombreProducto || "Producto";
      const serialText = item.Licencia?.clave
  ? `Licencia #${++serialCounter}: ${item.Licencia.clave}`
  : "—";

      // Col 1: #
      let x = startX + 5;
      doc.fillColor("#000").text(String(index + 1), x, y, {
        width: colWidths[0] - 10,
      });

      // Col 2: Producto
      x = startX + colWidths[0] + 5;
      doc.text(productoNombre, x, y, { width: colWidths[1] - 10 });

      // Col 3: 🔑 Serial (Estilo B)
      x = startX + colWidths[0] + colWidths[1] + 5;
      doc.text(serialText, x, y+ 3, { width: colWidths[2] - 10 });

      // Col 4: Cantidad
      x = startX + colWidths[0] + colWidths[1] + colWidths[2] + 5;
      doc.text(String(item.cantidad), x, y+ 3, { width: colWidths[3] - 10 });

      // Col 5: Precio
      x =
        startX +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        5;
      doc.text(`Q${item.precioUnitario.toFixed(2)}`, x, y, {
        width: colWidths[4] - 10,
      });

      // Col 6: Subtotal
      x =
        startX +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4] +
        5;
      doc.text(`Q${item.subtotal.toFixed(2)}`, x, y, {
        width: colWidths[5] - 10,
      });

      y += rowHeight;
    });

    // Separador antes de totales
    doc.moveTo(startX, y + 3).lineTo(550, y + 3).stroke("#004aad");

    // === TOTAL Y DESCUENTO (compacto, sin empujar a otra página) ===
    let descuento = 0;
    if (venta.cupon) {
      descuento =
        venta.cupon.tipo === "fijo"
          ? venta.cupon.valor
          : (venta.total * venta.cupon.valor) / 100;
    }
    const totalConDescuento = venta.total - descuento;

    const boxHeight = venta.cupon ? 52 : 30;
    const pageBottom2 = doc.page.height - doc.page.margins.bottom;
    const boxTop = Math.min(y + 10, pageBottom2 - (boxHeight + 120)); // deja espacio para QR y footer

    doc.rect(340, boxTop, 210, boxHeight).fill("#ffffff").stroke("#cccccc");

    let textY = boxTop + 12;
    doc.fillColor("#000").font("Helvetica").fontSize(12);
    if (venta.cupon) {
      doc.rect(340, textY - 3, 210, 20).fill("#f2f2f2").stroke("#e0e0e0");
      doc
        .fillColor("#000")
        .text(`Descuento (${venta.cupon.codigo}):`, 350, textY)
        .text(`-Q${descuento.toFixed(2)}`, 460, textY, {
          width: 80,
          align: "right",
        });
      textY += 22;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#000")
      .text("Total:", 350, textY)
      .text(`Q${totalConDescuento.toFixed(2)}`, 460, textY, {
        width: 80,
        align: "right",
      });

    // === QR de WhatsApp Soporte (posición segura) ===
    try {
      const whatsappNumber = "50249998437"; // sin '+'
      const msg = `Hola, consulto sobre la activación de mi licencia MVTech. Mi número de factura es #FAC-${venta.id}. Gracias.`;
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        msg
      )}`;

      const dataUrl = await QRCode.toDataURL(waUrl, { width: 120, margin: 1 });
      const base64 = dataUrl.split(",")[1];
      const qrBuffer = Buffer.from(base64, "base64");

      const qrX = 40;
      const qrY = Math.min(boxTop + boxHeight + 15, pageBottom2 - 120);
      doc.image(qrBuffer, qrX, qrY, { width: 90 });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#333")
        .text("Soporte WhatsApp", qrX, qrY + 95, { width: 120 })
        .fillColor("#004aad")
        .text("Escanea para ayuda", qrX, qrY + 108, { width: 120 });
    } catch (e) {
      console.error("Error generando QR:", e);
    }

    // === FOOTER PROFESIONAL (posición fija) ===
    const footerY = doc.page.height - 75;
    doc
      .moveTo(40, footerY - 5)
      .lineTo(doc.page.width - 40, footerY - 5)
      .stroke("#004aad");

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000")
      .text(`FAC-${venta.id} | MVTech - Soluciones Digitales`, 40, footerY, {
        width: 350,
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333")
      .text(
        "www.mvtechgt.com | ventas@mvtechgt.com | +502 49998437",
        40,
        footerY + 14,
        { width: 350 }
      );

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666")
      .text("Jesús Mi Buen Pastor", 40, footerY + 24, { width: 350 });

    

    // === Cerrar PDF y responder ===
    doc.end();

    stream.on("finish", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=" + fileName
      );
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    });
  } catch (error) {
    console.error("Error generando factura:", error);
    res.status(500).json({ error: "Error generando factura" });
  }
};
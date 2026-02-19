// routes/ventaRoutes.js
import express from "express";
import { createVenta, getVentas, getVentaById, updateVenta, deleteVenta, actualizarEstadoVenta, generarFactura } from "../controllers/VentaController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", upload.single("comprobantePago"), createVenta);
router.get("/", getVentas);
router.get("/:id", getVentaById);
router.put("/:id", upload.single("comprobantePago"), updateVenta);
router.put("/estado/:id", actualizarEstadoVenta);
router.delete("/:id", deleteVenta);
router.get("/:id/factura", generarFactura);

export default router;
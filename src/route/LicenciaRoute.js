import express from "express";
import LicenciaController from "../controllers/LicenciaController.js";
import auth from "../middleware/authMiddleware.js";

const LicenciaRouter = express.Router();



LicenciaRouter.post("/asignar/detalle/:ventaId", auth, LicenciaController.addDetalleConLicencia);
LicenciaRouter.get("/producto/:productoId", auth, LicenciaController.getByProducto);
LicenciaRouter.post("/", auth, LicenciaController.create);
LicenciaRouter.get("/", auth, LicenciaController.getAll);
LicenciaRouter.put("/:id", auth, LicenciaController.update);
LicenciaRouter.delete("/:id", auth, LicenciaController.delete);
LicenciaRouter.get("/:id", auth, LicenciaController.getById);

export default LicenciaRouter;
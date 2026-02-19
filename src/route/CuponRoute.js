import express from 'express';
import auth from '../middleware/authMiddleware.js';

import { CuponController } from '../controllers/CuponController.js';


const router = express.Router();

router.get('/',auth,  CuponController.getAll);
router.get('/:id',auth, CuponController.getById);
router.post('', auth, CuponController.create);
router.put('/:id', auth, CuponController.update);
router.delete('/:id', auth, CuponController.delete);
router.post('/validar', CuponController.validate);

export default router;
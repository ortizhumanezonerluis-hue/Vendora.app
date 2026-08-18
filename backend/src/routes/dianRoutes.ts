import { Router } from 'express';
import { dianController } from '../controllers/dianController';

const router = Router();

// Endpoint para procesar la facturación asíncronamente
router.post('/procesar', dianController.procesarFactura);

export default router;

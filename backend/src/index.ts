import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dianRoutes from './routes/dianRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS y JSON body parser
app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/api/dian', dianRoutes);

// Health check para Render y monitorización
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`Backend de Facturación Electrónica DIAN corriendo en puerto ${port}`);
});

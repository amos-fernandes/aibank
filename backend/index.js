// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import leadsRoutes from './routes/leads.js';
import campaignsRoutes from './routes/campaigns.js';
import agnusRoutes from './routes/agnus.js';
import webhookRoutes from './routes/webhook.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/agnus', agnusRoutes);
app.use('/api/webhook', webhookRoutes);

app.get('/', (req, res) => res.send('Agente VerticalAgent Backend Online'));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

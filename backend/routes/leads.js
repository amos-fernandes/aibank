// backend/routes/leads.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware para extrair o user_id do header Authorization (JWT decodificado)
const getUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.id;
};

// GET: Listar todos os leads do usuário
router.get('/', async (req, res) => {
  const userId = await getUser(req);
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// POST: Criar novo lead
router.post('/', async (req, res) => {
  const userId = await getUser(req);
  const { company_name, contact_name, email, phone, whatsapp, industry } = req.body;

  const { data, error } = await supabase
    .from('leads')
    .insert([{ company_name, contact_name, email, phone, whatsapp, industry, user_id: userId }])
    .select();

  if (error) return res.status(400).json({ error });
  res.status(201).json(data[0]);
});

// PUT: Atualizar lead
router.put('/:id', async (req, res) => {
  const userId = await getUser(req);
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// DELETE: Remover lead
router.delete('/:id', async (req, res) => {
  const userId = await getUser(req);
  const { id } = req.params;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error });
  res.status(204).end();
});

export default router;

// backend/routes/campaigns.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const getUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.id;
};

// GET: Campanhas do usuário
router.get('/', async (req, res) => {
  const userId = await getUser(req);
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// POST: Criar nova campanha
router.post('/', async (req, res) => {
  const userId = await getUser(req);
  const { name, message, target_segment, status } = req.body;

  const { data, error } = await supabase
    .from('campaigns')
    .insert([{ name, message, target_segment, status, user_id: userId }])
    .select();

  if (error) return res.status(400).json({ error });
  res.status(201).json(data[0]);
});

// PUT: Atualizar campanha
router.put('/:id', async (req, res) => {
  const userId = await getUser(req);
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// DELETE: Remover campanha
router.delete('/:id', async (req, res) => {
  const userId = await getUser(req);
  const { id } = req.params;

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error });
  res.status(204).end();
});

export default router;

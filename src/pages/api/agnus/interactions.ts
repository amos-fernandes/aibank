// pages/api/agnus/interactions.ts
import verifyUser from 'backend/middleware/verifyUser';
import { supabase } from '@/lib/supabaseClient';
import { NextApiRequest, NextApiResponse } from 'next';

// Aplica o middleware manualmente (Next.js não tem "router")
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await verifyUser(req, res);
  if (!user) return; // Middleware já tratou a resposta se falhou

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar interações.' });
    }
  }

  else if (req.method === 'POST') {
    const { nome, campanha, mensagem, resposta, intencao } = req.body;
    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert([
          {
            nome,
            campanha,
            mensagem,
            resposta,
            intencao,
            user_id: user.id,
          },
        ])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao salvar interação.' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
};

export default handler;

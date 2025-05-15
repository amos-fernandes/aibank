// pages/api/interactions/index.ts
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, campanha, mensagem, resposta, intencao, user_id } = req.body;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert([{ nome, campanha, mensagem, resposta, intencao, user_id }])
        .select();

      if (error) throw error;

      return res.status(201).json(data[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Erro ao salvar interação' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

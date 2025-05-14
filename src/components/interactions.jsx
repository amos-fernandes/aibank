// src/components/interactions.jsx
import axios from 'axios';

export const fetchInteractions = async () => {
  try {
    const res = await axios.get('/api/interactions'); // ← ajuste o endpoint se necessário
    return res.data;
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    return [];
  }
};

// POST /api/interactions
router.post('/', async (req, res) => {
  const { nome, campanha, mensagem, resposta, intencao, user_id } = req.body;

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
          user_id,
        },
      ])
      .select();

    if (error) {
      console.error('Erro ao inserir interação:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Erro inesperado ao salvar interação:', err);
    res.status(500).json({ error: 'Erro ao salvar interação' });
  }
});


// Componente visual
import React, { useEffect, useState } from 'react';

const Interactions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchInteractions();
      setInteractions(data);
      setLoading(false);
    };
    load();
  }, []);

  // render JSX...
};

export default Interactions;



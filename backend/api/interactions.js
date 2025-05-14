const verifyUser = require('../middleware/verifyUser');
import { useRouter } from 'next/router';

const router = useRouter();

// Protege GET por usuário
router.get('/', verifyUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', req.user.id) // filtro por usuário
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar interações:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado' });
  }
});

// Protege POST também
router.post('/', verifyUser, async (req, res) => {
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
          user_id: req.user.id,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar interação' });
  }
});

// routes/agnus.js
import express from 'express';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HuggingFaceInference } from 'langchain/llms/hf';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// HuggingFace e Langchain config
const hf = new HuggingFaceInference({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: 'facebook/bart-large-mnli' // Para classificação de intenção
});

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7
});

// Função para classificar intenção do lead
async function classificarIntencao(mensagem) {
  const prompt = `Classifique a seguinte mensagem como: interesse, dúvida, ou objeção.\nMensagem: "${mensagem}"`;
  const resposta = await hf.call(prompt);
  return resposta;
}

// Função para gerar resposta com base em campanha ativa
async function gerarRespostaContextual(leadMsg, campanha) {
  const prompt = `
  Um lead enviou a seguinte mensagem: "${leadMsg}"
  Você está atuando como representante do CrediMais.
  A campanha ativa é: "${campanha?.message || 'Campanha padrão de crédito consignado'}".
  Gere uma resposta clara e objetiva para engajar o lead.`;
  
  const resposta = await chat.call([{ role: 'user', content: prompt }]);
  return resposta.text;
}

// Rota principal do Agente Agnus
router.post('/responder', async (req, res) => {
  const { mensagem, lead_id } = req.body;

  try {
    // Classificação da intenção
    const intencao = await classificarIntencao(mensagem);

    // Buscar campanha ativa
    const { data: campanhas } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    const campanha = campanhas?.[0] || null;

    // Gerar resposta
    const resposta = await gerarRespostaContextual(mensagem, campanha);

    // Salvar resposta gerada no Supabase
    await supabase.from('whatsapp_messages').insert({
      origem: 'bot',
      lead_id,
      message: resposta
    });

    res.json({
      intencao,
      resposta,
      campanha: campanha?.name || 'Nenhuma campanha ativa'
    });
  } catch (err) {
    console.error('Erro no Agente VA:', err.message);
    res.status(500).json({ error: 'Erro ao processar a IA.' });
  }
});

// routes/agnus.js
router.get('/interactions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar interações' });
  }
});


export default router;

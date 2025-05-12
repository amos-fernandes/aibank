// backend/routes/webhook.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// POST: Recebe mensagens do WhatsApp via Twilio
router.post('/', async (req, res) => {
  const { Body, From } = req.body;

  console.log(`📩 Mensagem recebida de ${From}: ${Body}`);

  // 💾 Salvar no Supabase
  const { error } = await supabase.from('whatsapp_messages').insert([
    {
      from: From,
      message: Body,
      direction: 'inbound',
      status: 'received',
    },
  ]);

  if (error) {
    console.error('Erro ao salvar no Supabase:', error);
    return res.status(500).end();
  }

  // 🤖 Resposta automática simples
  let reply = 'Obrigado pela sua mensagem! Em breve entraremos em contato.';

  // (Exemplo de resposta IA simples para integração futura com Langchain/Agno)
  if (Body.toLowerCase().includes('oi') || Body.toLowerCase().includes('olá')) {
    reply = 'Olá! Sou o Agente VerticalAgent. Como posso ajudar você hoje?';
  }

  // Enviar resposta via Twilio
  try {
    await twilioClient.messages.create({
      body: reply,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: From,
    });
    console.log('✔️ Resposta enviada:', reply);
  } catch (err) {
    console.error('Erro ao enviar resposta Twilio:', err);
  }

  res.status(200).end();
});

export default router;

const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const NotificationService = require('../services/notifications');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Middleware para validar webhook
const validateWebhook = (secret) => {
  return (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    next();
  };
};

// Webhook para PIX recebido
router.post('/pix/received', validateWebhook(process.env.PIX_WEBHOOK_SECRET), async (req, res) => {
  try {
    const { 
      pix_key, 
      amount, 
      sender_name, 
      sender_document, 
      description,
      transaction_id 
    } = req.body;

    // Encontrar conta pela chave PIX
    const { data: pixKey } = await supabase
      .from('pix_keys')
      .select('account_id')
      .eq('key_value', pix_key)
      .eq('status', 'active')
      .single();

    if (!pixKey) {
      return res.status(404).json({ error: 'Chave PIX não encontrada' });
    }

    // Criar transação de crédito
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        account_id: pixKey.account_id,
        transaction_type: 'pix',
        amount: parseFloat(amount),
        description: description || `PIX recebido de ${sender_name}`,
        status: 'completed',
        reference_id: transaction_id,
        metadata: {
          sender_name,
          sender_document,
          pix_key
        }
      })
      .select()
      .single();

    // Buscar usuário para notificação
    const { data: account } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', pixKey.account_id)
      .single();

    // Enviar notificação
    await NotificationService.createNotification(
      account.user_id,
      'PIX Recebido',
      `Você recebeu R$ ${amount} de ${sender_name}`,
      'transaction'
    );

    res.json({ 
      message: 'PIX processado com sucesso',
      transaction_id: transaction.id 
    });
  } catch (error) {
    console.error('Erro no webhook PIX:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Webhook para confirmação de TED/DOC
router.post('/transfer/confirmed', validateWebhook(process.env.BANK_WEBHOOK_SECRET), async (req, res) => {
  try {
    const { 
      external_id, 
      status, 
      error_message,
      processed_at 
    } = req.body;

    // Atualizar status da transação
    const { data: transaction } = await supabase
      .from('transactions')
      .update({
        status: status === 'confirmed' ? 'completed' : 'failed',
        completed_at: processed_at,
        metadata: { error_message }
      })
      .eq('external_id', external_id)
      .select(`
        *,
        accounts(user_id)
      `)
      .single();

    if (transaction) {
      // Notificar usuário
      const title = status === 'confirmed' ? 'Transferência Confirmada' : 'Transferência Falhou';
      const message = status === 'confirmed' 
        ? `Sua transferência de R$ ${transaction.amount} foi confirmada`
        : `Sua transferência falhou: ${error_message}`;

      await NotificationService.createNotification(
        transaction.accounts.user_id,
        title,
        message,
        status === 'confirmed' ? 'success' : 'error'
      );
    }

    res.json({ message: 'Transferência processada' });
  } catch (error) {
    console.error('Erro no webhook de transferência:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Webhook para atualizações de score de crédito (bureau externo)
router.post('/credit/score-update', validateWebhook(process.env.CREDIT_WEBHOOK_SECRET), async (req, res) => {
  try {
    const { cpf, new_score, previous_score, updated_at } = req.body;

    // Encontrar usuário pelo CPF
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (profile) {
      // Notificar mudança significativa no score
      const scoreDiff = new_score - previous_score;
      if (Math.abs(scoreDiff) >= 50) {
        const title = scoreDiff > 0 ? 'Score de Crédito Aumentou' : 'Score de Crédito Diminuiu';
        const message = `Seu score mudou de ${previous_score} para ${new_score} (${scoreDiff > 0 ? '+' : ''}${scoreDiff} pontos)`;

        await NotificationService.createNotification(
          profile.id,
          title,
          message,
          scoreDiff > 0 ? 'success' : 'warning'
        );
      }
    }

    res.json({ message: 'Score atualizado' });
  } catch (error) {
    console.error('Erro no webhook de score:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Webhook para detecção de fraude
router.post('/fraud/alert', validateWebhook(process.env.FRAUD_WEBHOOK_SECRET), async (req, res) => {
  try {
    const { 
      account_id, 
      transaction_id, 
      fraud_type, 
      risk_score, 
      details 
    } = req.body;

    // Buscar usuário
    const { data: account } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', account_id)
      .single();

    if (account) {
      // Se risco alto, bloquear transações temporariamente
      if (risk_score >= 80) {
        await supabase
          .from('accounts')
          .update({ status: 'frozen' })
          .eq('id', account_id);

        await NotificationService.notifySecurityAlert(
          account.user_id,
          'Conta Bloqueada por Segurança',
          'Atividade suspeita detectada. Entre em contato conosco.'
        );
      } else {
        // Apenas notificar
        await NotificationService.notifySecurityAlert(
          account.user_id,
          'Atividade Suspeita Detectada',
          `${fraud_type}: ${details}. Verifique suas transações recentes.`
        );
      }

      // Registrar no log de auditoria
      await supabase
        .from('audit_log')
        .insert({
          user_id: account.user_id,
          action: 'FRAUD_ALERT',
          table_name: 'transactions',
          record_id: transaction_id,
          new_values: {
            fraud_type,
            risk_score,
            details
          }
        });
    }

    res.json({ message: 'Alerta de fraude processado' });
  } catch (error) {
    console.error('Erro no webhook de fraude:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
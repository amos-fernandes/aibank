const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar transporte de email
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

class NotificationService {
  static async createNotification(userId, title, message, type = 'info', actionUrl = null, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar notificação por email se configurado
      await this.sendEmailNotification(userId, title, message);

      return data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  static async sendEmailNotification(userId, title, message) {
    try {
      // Buscar dados do usuário
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user?.user?.email) return;

      // Buscar configurações de notificação
      const { data: settings } = await supabase
        .from('account_settings')
        .select('notification_preferences')
        .eq('user_id', userId)
        .single();

      if (!settings?.notification_preferences?.email) return;

      // Enviar email
      await emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.user.email,
        subject: `AIBank - ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">${title}</h2>
            <p>${message}</p>
            <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Esta é uma notificação automática do AIBank. 
              Para alterar suas preferências de notificação, acesse o app.
            </p>
          </div>
        `
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  static async notifyTransaction(userId, transaction) {
    const titles = {
      credit: 'Crédito Recebido',
      debit: 'Débito Realizado',
      transfer: 'Transferência Realizada',
      pix: 'PIX Realizado',
      payment: 'Pagamento Efetuado'
    };

    const title = titles[transaction.transaction_type] || 'Nova Transação';
    const message = `${transaction.description} - R$ ${transaction.amount.toFixed(2)}`;

    await this.createNotification(userId, title, message, 'transaction');
  }

  static async notifyLowBalance(userId, balance) {
    await this.createNotification(
      userId,
      'Saldo Baixo',
      `Seu saldo está baixo: R$ ${balance.toFixed(2)}. Considere fazer um depósito.`,
      'warning'
    );
  }

  static async notifyLoanApproval(userId, loan) {
    await this.createNotification(
      userId,
      'Empréstimo Aprovado',
      `Seu empréstimo de R$ ${loan.principal_amount.toFixed(2)} foi aprovado! Parcelas de R$ ${loan.monthly_payment.toFixed(2)} em ${loan.term_months}x.`,
      'success'
    );
  }

  static async notifyPaymentDue(userId, payment) {
    await this.createNotification(
      userId,
      'Pagamento Vencendo',
      `Parcela de R$ ${payment.payment_amount.toFixed(2)} vence em ${payment.due_date}`,
      'warning'
    );
  }

  static async notifySecurityAlert(userId, action, details) {
    await this.createNotification(
      userId,
      'Alerta de Segurança',
      `${action}: ${details}`,
      'security'
    );
  }
}

module.exports = NotificationService;
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const NotificationService = require('../services/notifications');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class JobScheduler {
  static start() {
    console.log('🔄 Iniciando jobs automatizados...');

    // Atualizar rendimentos de investimentos (diário às 6:00)
    cron.schedule('0 6 * * *', this.updateInvestmentReturns);

    // Processar parcelas de empréstimos (diário às 1:00)
    cron.schedule('0 1 * * *', this.processLoanPayments);

    // Alertas de saldo baixo (diário às 9:00)
    cron.schedule('0 9 * * *', this.checkLowBalances);

    // Notificar vencimentos (diário às 8:00)
    cron.schedule('0 8 * * *', this.notifyUpcomingPayments);

    // Calcular e atualizar scores de crédito (semanal, domingo às 2:00)
    cron.schedule('0 2 * * 0', this.updateCreditScores);

    console.log('✅ Jobs automatizados iniciados');
  }

  static async updateInvestmentReturns() {
    try {
      console.log('🔄 Atualizando rendimentos de investimentos...');

      const { data: investments } = await supabase
        .from('investments')
        .select('*')
        .eq('status', 'active');

      for (const investment of investments) {
        // Simular rendimento baseado na taxa
        const dailyYield = (investment.yield_rate || 0.10) / 365; // Taxa anual convertida para diária
        const newValue = investment.current_value * (1 + dailyYield);

        await supabase
          .from('investments')
          .update({ current_value: newValue })
          .eq('id', investment.id);
      }

      console.log(`✅ ${investments.length} investimentos atualizados`);
    } catch (error) {
      console.error('❌ Erro ao atualizar investimentos:', error);
    }
  }

  static async processLoanPayments() {
    try {
      console.log('🔄 Processando parcelas de empréstimos...');

      const today = new Date().toISOString().split('T')[0];

      // Buscar parcelas vencendo hoje
      const { data: duePayments } = await supabase
        .from('loan_payments')
        .select(`
          *,
          loans(
            account_id,
            accounts(user_id, balance)
          )
        `)
        .eq('due_date', today)
        .eq('status', 'pending');

      for (const payment of duePayments) {
        const account = payment.loans.accounts;
        
        if (account.balance >= payment.payment_amount) {
          // Débito automático
          await supabase
            .from('transactions')
            .insert({
              account_id: payment.loans.account_id,
              transaction_type: 'payment',
              amount: payment.payment_amount,
              description: `Pagamento empréstimo - Parcela ${payment.payment_number}`,
              status: 'completed'
            });

          await supabase
            .from('loan_payments')
            .update({
              status: 'paid',
              paid_amount: payment.payment_amount,
              paid_date: today
            })
            .eq('id', payment.id);

          // Notificar pagamento realizado
          await NotificationService.createNotification(
            account.user_id,
            'Parcela Paga',
            `Parcela de R$ ${payment.payment_amount.toFixed(2)} foi debitada automaticamente`,
            'success'
          );
        } else {
          // Marcar como em atraso
          await supabase
            .from('loan_payments')
            .update({ status: 'overdue' })
            .eq('id', payment.id);

          // Notificar atraso
          await NotificationService.createNotification(
            account.user_id,
            'Parcela em Atraso',
            `Parcela de R$ ${payment.payment_amount.toFixed(2)} não foi paga por saldo insuficiente`,
            'error'
          );
        }
      }

      console.log(`✅ ${duePayments.length} parcelas processadas`);
    } catch (error) {
      console.error('❌ Erro ao processar parcelas:', error);
    }
  }

  static async checkLowBalances() {
    try {
      console.log('🔄 Verificando saldos baixos...');

      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, user_id, balance, available_balance')
        .eq('status', 'active')
        .lt('available_balance', 100); // Saldo menor que R$ 100

      for (const account of accounts) {
        // Verificar se já foi notificado nas últimas 24h
        const { data: recentNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', account.user_id)
          .eq('type', 'warning')
          .ilike('title', '%Saldo Baixo%')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!recentNotification.length) {
          await NotificationService.notifyLowBalance(account.user_id, account.available_balance);
        }
      }

      console.log(`✅ ${accounts.length} contas com saldo baixo verificadas`);
    } catch (error) {
      console.error('❌ Erro ao verificar saldos baixos:', error);
    }
  }

  static async notifyUpcomingPayments() {
    try {
      console.log('🔄 Notificando vencimentos próximos...');

      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: upcomingPayments } = await supabase
        .from('loan_payments')
        .select(`
          *,
          loans(
            account_id,
            accounts(user_id)
          )
        `)
        .eq('status', 'pending')
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
        .gt('due_date', new Date().toISOString().split('T')[0]);

      for (const payment of upcomingPayments) {
        // Verificar se já foi notificado
        const { data: recentNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', payment.loans.accounts.user_id)
          .eq('type', 'warning')
          .ilike('message', `%${payment.due_date}%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!recentNotification.length) {
          await NotificationService.notifyPaymentDue(
            payment.loans.accounts.user_id,
            payment
          );
        }
      }

      console.log(`✅ ${upcomingPayments.length} vencimentos próximos notificados`);
    } catch (error) {
      console.error('❌ Erro ao notificar vencimentos:', error);
    }
  }

  static async updateCreditScores() {
    try {
      console.log('🔄 Atualizando scores de crédito...');

      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');

      let updatedCount = 0;

      for (const user of users) {
        try {
          const { data: newScore } = await supabase
            .rpc('calculate_credit_score', { p_user_id: user.id });

          // Aqui você poderia salvar o score em uma tabela específica
          // ou atualizar o perfil do usuário
          console.log(`Score do usuário ${user.id}: ${newScore}`);
          updatedCount++;
        } catch (error) {
          console.error(`Erro ao calcular score do usuário ${user.id}:`, error);
        }
      }

      console.log(`✅ ${updatedCount} scores atualizados`);
    } catch (error) {
      console.error('❌ Erro ao atualizar scores:', error);
    }
  }
}

module.exports = JobScheduler;
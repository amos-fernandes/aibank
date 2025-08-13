
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ReportsService {
  static async generateMonthlyStatement(userId, year, month) {
    try {
      // Buscar contas do usuário
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);

      const accountIds = accounts.map(acc => acc.id);

      // Buscar transações do mês
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .in('account_id', accountIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      // Calcular totais
      const income = transactions
        .filter(t => ['credit', 'deposit'].includes(t.transaction_type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = transactions
        .filter(t => ['debit', 'withdrawal', 'payment', 'transfer', 'pix'].includes(t.transaction_type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Agrupar por categoria
      const byCategory = transactions.reduce((acc, t) => {
        const category = t.category || t.transaction_type;
        if (!acc[category]) acc[category] = { income: 0, expenses: 0, count: 0 };
        
        if (['credit', 'deposit'].includes(t.transaction_type)) {
          acc[category].income += parseFloat(t.amount);
        } else {
          acc[category].expenses += parseFloat(t.amount);
        }
        acc[category].count++;
        
        return acc;
      }, {});

      // Agrupar por dia
      const byDay = transactions.reduce((acc, t) => {
        const day = new Date(t.created_at).getDate();
        if (!acc[day]) acc[day] = { income: 0, expenses: 0, count: 0 };
        
        if (['credit', 'deposit'].includes(t.transaction_type)) {
          acc[day].income += parseFloat(t.amount);
        } else {
          acc[day].expenses += parseFloat(t.amount);
        }
        acc[day].count++;
        
        return acc;
      }, {});

      return {
        period: { year, month },
        summary: {
          totalIncome: income,
          totalExpenses: expenses,
          netResult: income - expenses,
          transactionCount: transactions.length
        },
        accounts: accounts.map(acc => ({
          ...acc,
          balance: parseFloat(acc.balance)
        })),
        byCategory,
        byDay,
        transactions: transactions.slice(0, 100) // Limitar para performance
      };
    } catch (error) {
      console.error('Erro ao gerar extrato mensal:', error);
      throw error;
    }
  }

  static async generateCreditReport(userId) {
    try {
      // Calcular score de crédito
      const { data: creditScore } = await supabase
        .rpc('calculate_credit_score', { p_user_id: userId });

      // Buscar empréstimos
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

      const accountIds = accounts.map(acc => acc.id);

      const { data: loans } = await supabase
        .from('loans')
        .select(`
          *,
          loan_payments(*)
        `)
        .in('account_id', accountIds);

      // Calcular estatísticas de pagamento
      const paymentHistory = loans.reduce((acc, loan) => {
        const payments = loan.loan_payments || [];
        acc.totalPayments += payments.length;
        acc.onTimePayments += payments.filter(p => p.status === 'paid' && p.paid_date <= p.due_date).length;
        acc.latePayments += payments.filter(p => p.status === 'paid' && p.paid_date > p.due_date).length;
        acc.overduePayments += payments.filter(p => p.status === 'overdue').length;
        return acc;
      }, { totalPayments: 0, onTimePayments: 0, latePayments: 0, overduePayments: 0 });

      const paymentScore = paymentHistory.totalPayments > 0 
        ? (paymentHistory.onTimePayments / paymentHistory.totalPayments) * 100 
        : 0;

      // Histórico de saldos (últimos 12 meses)
      const { data: balanceHistory } = await supabase
        .from('transactions')
        .select('created_at, amount, transaction_type')
        .in('account_id', accountIds)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      return {
        creditScore,
        scoreInterpretation: this.interpretCreditScore(creditScore),
        paymentHistory,
        paymentScore: Math.round(paymentScore),
        loans: loans.map(loan => ({
          ...loan,
          principal_amount: parseFloat(loan.principal_amount),
          outstanding_balance: parseFloat(loan.outstanding_balance),
          monthly_payment: parseFloat(loan.monthly_payment)
        })),
        recommendations: this.generateCreditRecommendations(creditScore, paymentScore),
        balanceHistory: this.processBalanceHistory(balanceHistory)
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de crédito:', error);
      throw error;
    }
  }

  static interpretCreditScore(score) {
    if (score >= 800) return { rating: 'Excelente', description: 'Baixíssimo risco de inadimplência' };
    if (score >= 700) return { rating: 'Muito Bom', description: 'Baixo risco de inadimplência' };
    if (score >= 600) return { rating: 'Bom', description: 'Risco moderado de inadimplência' };
    if (score >= 500) return { rating: 'Regular', description: 'Alto risco de inadimplência' };
    return { rating: 'Ruim', description: 'Altíssimo risco de inadimplência' };
  }

  static generateCreditRecommendations(creditScore, paymentScore) {
    const recommendations = [];

    if (creditScore < 600) {
      recommendations.push('Quite dívidas em atraso para melhorar seu score');
      recommendations.push('Mantenha seus dados atualizados nos órgãos de proteção');
    }

    if (paymentScore < 80) {
      recommendations.push('Pague suas contas sempre em dia');
      recommendations.push('Configure lembretes para não esquecer dos vencimentos');
    }

    if (creditScore >= 700) {
      recommendations.push('Você tem um bom perfil de crédito! Negocie melhores condições');
      recommendations.push('Considere investimentos para fazer seu dinheiro crescer');
    }

    return recommendations;
  }

  static processBalanceHistory(transactions) {
    const monthlyData = {};
    let runningBalance = 0;

    transactions.forEach(t => {
      const month = new Date(t.created_at).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, endBalance: 0 };
      }

      if (['credit', 'deposit'].includes(t.transaction_type)) {
        monthlyData[month].income += parseFloat(t.amount);
        runningBalance += parseFloat(t.amount);
      } else {
        monthlyData[month].expenses += parseFloat(t.amount);
        runningBalance -= parseFloat(t.amount);
      }

      monthlyData[month].endBalance = runningBalance;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  static async generateInvestmentReport(userId) {
    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

      const accountIds = accounts.map(acc => acc.id);

      const { data: investments } = await supabase
        .from('investments')
        .select('*')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false });

      // Calcular totais
      const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.invested_amount), 0);
      const currentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value), 0);
      const totalReturn = currentValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

      // Agrupar por tipo
      const byType = investments.reduce((acc, inv) => {
        const type = inv.investment_type;
        if (!acc[type]) {
          acc[type] = { invested: 0, current: 0, count: 0, return: 0 };
        }
        
        acc[type].invested += parseFloat(inv.invested_amount);
        acc[type].current += parseFloat(inv.current_value);
        acc[type].count++;
        acc[type].return = acc[type].current - acc[type].invested;
        
        return acc;
      }, {});

      // Agrupar por risco
      const byRisk = investments.reduce((acc, inv) => {
        const risk = inv.risk_rating || 'não informado';
        if (!acc[risk]) {
          acc[risk] = { invested: 0, current: 0, count: 0 };
        }
        
        acc[risk].invested += parseFloat(inv.invested_amount);
        acc[risk].current += parseFloat(inv.current_value);
        acc[risk].count++;
        
        return acc;
      }, {});

      return {
        summary: {
          totalInvested,
          currentValue,
          totalReturn,
          returnPercentage: parseFloat(returnPercentage.toFixed(2)),
          investmentCount: investments.length
        },
        byType,
        byRisk,
        investments: investments.map(inv => ({
          ...inv,
          invested_amount: parseFloat(inv.invested_amount),
          current_value: parseFloat(inv.current_value),
          return_amount: parseFloat(inv.current_value) - parseFloat(inv.invested_amount),
          return_percentage: parseFloat(inv.invested_amount) > 0 
            ? ((parseFloat(inv.current_value) - parseFloat(inv.invested_amount)) / parseFloat(inv.invested_amount)) * 100 
            : 0
        })),
        recommendations: this.generateInvestmentRecommendations(byRisk, returnPercentage)
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de investimentos:', error);
      throw error;
    }
  }

  static generateInvestmentRecommendations(byRisk, returnPercentage) {
    const recommendations = [];

    // Verificar diversificação de risco
    const riskTypes = Object.keys(byRisk).length;
    if (riskTypes < 2) {
      recommendations.push('Considere diversificar seus investimentos em diferentes níveis de risco');
    }

    // Verificar performance
    if (returnPercentage < 5) {
      recommendations.push('Seus investimentos estão com rentabilidade baixa. Avalie outras opções');
    } else if (returnPercentage > 15) {
      recommendations.push('Excelente performance! Continue diversificando sua carteira');
    }

    // Recomendações gerais
    if (byRisk['baixo'] && byRisk['baixo'].invested > byRisk['medio']?.invested + byRisk['alto']?.invested) {
      recommendations.push('Você tem um perfil conservador. Considere alguns investimentos de médio risco');
    }

    return recommendations;
  }
}

module.exports = ReportsService;
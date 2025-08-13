// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Erro de autenticação' });
  }
};

// Rotas da API

// 1. Autenticação e Perfil
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, cpf, phone } = req.body;

    // Registrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Criar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        cpf,
        phone
      })
      .select()
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // Criar conta padrão
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: authData.user.id,
        account_type: 'checking',
        balance: 0,
        available_balance: 0
      })
      .select()
      .single();

    if (accountError) {
      return res.status(400).json({ error: accountError.message });
    }

    res.json({ user: authData.user, profile, account });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 2. Gestão de Contas
app.get('/api/accounts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/accounts/:id/balance', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('accounts')
      .select('balance, available_balance, currency')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 3. Transações
app.get('/api/accounts/:id/transactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq('transaction_type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/transactions/transfer', authenticate, async (req, res) => {
  try {
    const { from_account_id, to_account_number, amount, description } = req.body;

    // Verificar se a conta de origem pertence ao usuário
    const { data: fromAccount, error: fromError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', from_account_id)
      .eq('user_id', req.user.id)
      .single();

    if (fromError || !fromAccount) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Verificar saldo disponível
    if (fromAccount.available_balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Encontrar conta de destino
    const { data: toAccount, error: toError } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', to_account_number)
      .single();

    if (toError || !toAccount) {
      return res.status(404).json({ error: 'Conta de destino não encontrada' });
    }

    // Criar transação de transferência
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: from_account_id,
        transaction_type: 'transfer',
        amount: parseFloat(amount),
        description: description || 'Transferência entre contas',
        destination_account_id: toAccount.id,
        destination_account_number: to_account_number,
        status: 'completed'
      })
      .select()
      .single();

    if (transactionError) {
      return res.status(400).json({ error: transactionError.message });
    }

    res.json({ transaction, message: 'Transferência realizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/transactions/pix', authenticate, async (req, res) => {
  try {
    const { from_account_id, pix_key, amount, description } = req.body;

    // Verificar se a conta pertence ao usuário
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', from_account_id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Processar PIX usando a função SQL
    const { data, error } = await supabase.rpc('process_pix_transfer', {
      p_from_account_id: from_account_id,
      p_pix_key: pix_key,
      p_amount: parseFloat(amount),
      p_description: description || 'Transferência PIX'
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ transaction_id: data, message: 'PIX realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 4. PIX
app.get('/api/pix/keys', authenticate, async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id);

    const accountIds = accounts.map(acc => acc.id);

    const { data, error } = await supabase
      .from('pix_keys')
      .select('*')
      .in('account_id', accountIds)
      .eq('status', 'active');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/pix/keys', authenticate, async (req, res) => {
  try {
    const { account_id, key_type, key_value } = req.body;

    // Verificar se a conta pertence ao usuário
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Criar chave PIX
    const { data, error } = await supabase
      .from('pix_keys')
      .insert({
        account_id,
        key_type,
        key_value,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 5. Cartões
app.get('/api/cards', authenticate, async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id);

    const accountIds = accounts.map(acc => acc.id);

    const { data, error } = await supabase
      .from('cards')
      .select('id, account_id, card_number_masked, card_type, brand, holder_name, expiry_date, status, daily_limit, is_contactless, is_virtual, created_at')
      .in('account_id', accountIds)
      .neq('status', 'expired');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/cards', authenticate, async (req, res) => {
  try {
    const { account_id, card_type = 'debit', is_virtual = false } = req.body;

    // Verificar se a conta pertence ao usuário
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Gerar número do cartão (simulado)
    const cardNumber = generateCardNumber();
    const cardNumberMasked = `**** **** **** ${cardNumber.slice(-4)}`;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    // Buscar nome do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single();

    const { data, error } = await supabase
      .from('cards')
      .insert({
        account_id,
        card_number_masked: cardNumberMasked,
        card_number_encrypted: await bcrypt.hash(cardNumber, 10),
        card_type,
        brand: 'mastercard',
        holder_name: profile?.full_name || 'NOME DO PORTADOR',
        expiry_date: expiryDate.toISOString().split('T')[0],
        cvv_encrypted: await bcrypt.hash(generateCVV(), 10),
        status: 'active',
        is_virtual
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/cards/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar se o cartão pertence ao usuário
    const { data: card } = await supabase
      .from('cards')
      .select('account_id')
      .eq('id', id)
      .single();

    const { data: account } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', card.account_id)
      .single();

    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const { data, error } = await supabase
      .from('cards')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 6. Empréstimos
app.get('/api/loans', authenticate, async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id);

    const accountIds = accounts.map(acc => acc.id);

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/loans/apply', authenticate, async (req, res) => {
  try {
    const { 
      account_id, 
      loan_type, 
      principal_amount, 
      term_months,
      monthly_income 
    } = req.body;

    // Verificar se a conta pertence ao usuário
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Calcular score de crédito
    const { data: creditScore, error: scoreError } = await supabase
      .rpc('calculate_credit_score', { p_user_id: req.user.id });

    if (scoreError) {
      return res.status(400).json({ error: 'Erro ao calcular score de crédito' });
    }

    // Definir taxa de juros baseada no score e tipo do empréstimo
    let interestRate = 0.15; // Taxa base de 15% ao ano
    
    if (creditScore >= 700) interestRate = 0.08;
    else if (creditScore >= 600) interestRate = 0.12;
    else if (creditScore >= 500) interestRate = 0.18;
    else if (creditScore < 400) interestRate = 0.25;

    // Calcular prestação (fórmula simplificada)
    const monthlyRate = interestRate / 12;
    const monthlyPayment = (principal_amount * monthlyRate * Math.pow(1 + monthlyRate, term_months)) / 
                          (Math.pow(1 + monthlyRate, term_months) - 1);

    // Verificar capacidade de pagamento (prestação não deve ser mais que 30% da renda)
    if (monthlyPayment > monthly_income * 0.3) {
      return res.status(400).json({ 
        error: 'Valor da prestação excede a capacidade de pagamento',
        suggested_amount: Math.floor((monthly_income * 0.3) / monthlyRate * (Math.pow(1 + monthlyRate, term_months) - 1) / Math.pow(1 + monthlyRate, term_months))
      });
    }

    // Criar solicitação de empréstimo
    const { data, error } = await supabase
      .from('loans')
      .insert({
        account_id,
        loan_type,
        principal_amount: parseFloat(principal_amount),
        interest_rate: interestRate,
        term_months: parseInt(term_months),
        monthly_payment: parseFloat(monthlyPayment.toFixed(2)),
        outstanding_balance: parseFloat(principal_amount),
        status: creditScore >= 500 ? 'approved' : 'pending',
        credit_score: creditScore,
        application_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Se aprovado automaticamente, criar parcelas
    if (data.status === 'approved') {
      const payments = [];
      const firstPaymentDate = new Date();
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

      for (let i = 1; i <= term_months; i++) {
        const paymentDate = new Date(firstPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + (i - 1));

        // Cálculo de juros e principal (sistema francês)
        const interestAmount = (principal_amount * interestRate / 12);
        const principalAmount = monthlyPayment - interestAmount;

        payments.push({
          loan_id: data.id,
          payment_number: i,
          due_date: paymentDate.toISOString().split('T')[0],
          payment_amount: monthlyPayment,
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          status: 'pending'
        });
      }

      await supabase.from('loan_payments').insert(payments);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 7. Investimentos
app.get('/api/investments', authenticate, async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id);

    const accountIds = accounts.map(acc => acc.id);

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/investments', authenticate, async (req, res) => {
  try {
    const {
      account_id,
      investment_type,
      product_name,
      invested_amount,
      yield_rate,
      maturity_date,
      risk_rating,
      liquidity
    } = req.body;

    // Verificar se a conta pertence ao usuário
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(403).json({ error: 'Conta não encontrada ou não autorizada' });
    }

    // Verificar saldo disponível
    if (account.available_balance < invested_amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Criar investimento
    const { data, error } = await supabase
      .from('investments')
      .insert({
        account_id,
        investment_type,
        product_name,
        invested_amount: parseFloat(invested_amount),
        current_value: parseFloat(invested_amount),
        yield_rate: parseFloat(yield_rate),
        maturity_date,
        risk_rating,
        liquidity,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Debitar valor da conta
    await supabase
      .from('transactions')
      .insert({
        account_id,
        transaction_type: 'debit',
        amount: parseFloat(invested_amount),
        description: `Investimento: ${product_name}`,
        status: 'completed',
        category: 'investment'
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 8. Notificações
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 9. Relatórios e Analytics
app.get('/api/analytics/summary', authenticate, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

    // Buscar contas do usuário
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, balance, available_balance')
      .eq('user_id', req.user.id);

    const accountIds = accounts.map(acc => acc.id);

    // Resumo de transações
    const { data: transactions } = await supabase
      .from('transactions')
      .select('transaction_type, amount, created_at')
      .in('account_id', accountIds)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    // Calcular estatísticas
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    const totalIncome = transactions
      .filter(t => ['credit', 'deposit'].includes(t.transaction_type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => ['debit', 'withdrawal', 'payment', 'transfer', 'pix'].includes(t.transaction_type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Transações por categoria
    const transactionsByType = transactions.reduce((acc, t) => {
      acc[t.transaction_type] = (acc[t.transaction_type] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    // Investimentos
    const { data: investments } = await supabase
      .from('investments')
      .select('invested_amount, current_value, investment_type')
      .in('account_id', accountIds)
      .eq('status', 'active');

    const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.invested_amount || 0), 0) || 0;
    const totalInvestmentValue = investments?.reduce((sum, inv) => sum + parseFloat(inv.current_value || 0), 0) || 0;

    res.json({
      period,
      summary: {
        totalBalance,
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        totalInvested,
        totalInvestmentValue,
        investmentReturn: totalInvestmentValue - totalInvested
      },
      transactionsByType,
      accounts: accounts.length,
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Funções auxiliares
function generateCardNumber() {
  // Gerar número de cartão Mastercard válido (simulado)
  const prefix = '5555';
  let number = prefix;
  
  for (let i = 0; i < 12; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return number;
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🏦 AIBank API rodando na porta ${port}`);
  console.log(`📊 Supabase conectado: ${process.env.SUPABASE_URL}`);
});

module.exports = app;
const OpenFinanceCaixaService = require('../backend-amobank/services/OpenFinanceCaixaService');
const SecurityService = require('../backend-amobank/services/SecurityService');

/**
 * Controller para operações Open Finance
 */
class OpenFinanceController {
  openFinanceService: any;
  constructor() {
    // Configuração do serviço Open Finance
    this.openFinanceService = new OpenFinanceCaixaService({
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      clientId: process.env.CAIXA_CLIENT_ID,
      clientSecret: process.env.CAIXA_CLIENT_SECRET,
      certPath: process.env.CAIXA_CERT_PATH,
      keyPath: process.env.CAIXA_KEY_PATH,
      privateCertPath: process.env.CAIXA_PRIVATE_CERT_PATH,
      kid: process.env.CAIXA_KID,
      redirectUri: process.env.CAIXA_REDIRECT_URI,
      cnpjInitiator: process.env.CAIXA_CNPJ_INITIATOR
    });
  }

  /**
   * Cria consentimento para acesso a dados da conta
   */
  async createConsent(req, res) {
    try {
      const { permissions, expirationDays = 30 } = req.body;
      const userId = req.user.id;

      // Validar permissões solicitadas
      const allowedPermissions = [
        'ACCOUNTS_READ',
        'ACCOUNTS_BALANCES_READ', 
        'ACCOUNTS_TRANSACTIONS_READ',
        'RESOURCES_READ'
      ];

      const invalidPermissions = permissions.filter(p => !allowedPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          error: 'Permissões inválidas',
          invalidPermissions
        });
      }

      // Data de expiração
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Obter CPF do usuário (assumindo que está no banco)
      const user = await User.findById(userId);
      if (!user || !user.cpf) {
        return res.status(400).json({
          error: 'CPF do usuário não encontrado'
        });
      }

      // Criar consentimento
      const consent = await this.openFinanceService.createConsent(
        permissions,
        expirationDate,
        user.cpf
      );

      // Salvar consentimento no banco de dados
      const consentRecord = await ConsentModel.create({
        userId,
        consentId: consent.consentId,
        permissions,
        status: consent.status,
        expirationDateTime: consent.expirationDateTime,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: {
          consentId: consent.consentId,
          authorizationUrl: consent.authorizationUrl,
          status: consent.status,
          expirationDateTime: consent.expirationDateTime
        }
      });

    } catch (error) {
      console.error('Erro ao criar consentimento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Callback OAuth após autorização do consentimento
   */
  async consentCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({
          error: 'Autorização negada',
          description: error
        });
      }

      // Trocar código por token de acesso
      // (Implementar conforme necessário)

      res.redirect(`${process.env.FRONTEND_URL}/banking/success`);

    } catch (error) {
      console.error('Erro no callback de consentimento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista contas vinculadas do usuário
   */
  async getAccounts(req, res) {
    try {
      const userId = req.user.id;
      
      // Buscar consentimento ativo do usuário
      const consent = await ConsentModel.findOne({
        userId,
        status: 'AUTHORISED',
        expirationDateTime: { $gt: new Date() }
      });

      if (!consent) {
        return res.status(404).json({
          error: 'Consentimento não encontrado ou expirado'
        });
      }

      // Obter token de acesso (implementar cache de token)
      const accessToken = await this.openFinanceService.getAccessToken();

      // Obter informações das contas
      const accounts = await this.openFinanceService.getAccountInfo(
        consent.consentId,
        accessToken
      );

      res.json({
        success: true,
        data: accounts
      });

    } catch (error) {
      console.error('Erro ao obter contas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém saldo de uma conta específica
   */
  async getAccountBalance(req, res) {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // Validar se usuário tem acesso à conta
      const consent = await ConsentModel.findOne({
        userId,
        status: 'AUTHORISED',
        expirationDateTime: { $gt: new Date() },
        permissions: 'ACCOUNTS_BALANCES_READ'
      });

      if (!consent) {
        return res.status(403).json({
          error: 'Permissão insuficiente para acessar saldo'
        });
      }

      const accessToken = await this.openFinanceService.getAccessToken();
      
      const balances = await this.openFinanceService.getAccountBalance(
        accountId,
        consent.consentId,
        accessToken
      );

      res.json({
        success: true,
        data: balances
      });

    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém extrato de uma conta
   */
  async getAccountTransactions(req, res) {
    try {
      const { accountId } = req.params;
      const { 
        fromDate, 
        toDate, 
        page = 1 
      } = req.query;
      const userId = req.user.id;

      // Validar permissão
      const consent = await ConsentModel.findOne({
        userId,
        status: 'AUTHORISED',
        expirationDateTime: { $gt: new Date() },
        permissions: 'ACCOUNTS_TRANSACTIONS_READ'
      });

      if (!consent) {
        return res.status(403).json({
          error: 'Permissão insuficiente para acessar transações'
        });
      }

      const accessToken = await this.openFinanceService.getAccessToken();
      
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const transactions = await this.openFinanceService.getAccountTransactions(
        accountId,
        consent.consentId,
        accessToken,
        from,
        to,
        parseInt(page)
      );

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Erro ao obter transações:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Cria pagamento PIX
   */
  async createPixPayment(req, res) {
    try {
      const {
        pixKey,
        pixKeyType,
        amount,
        description,
        creditorAccount,
        creditorIspb,
        creditorIssuer
      } = req.body;
      const userId = req.user.id;

      // Validar dados obrigatórios
      if (!pixKey || !pixKeyType || !amount) {
        return res.status(400).json({
          error: 'Dados obrigatórios não informados'
        });
      }

      // Validar limites de transação
      const user = await User.findById(userId);
      SecurityService.validateTransactionLimits(user, amount, 'pix');

      // Detectar atividade suspeita
      const recentTransactions = await TransactionModel.find({
        userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const suspiciousActivity = SecurityService.detectSuspiciousActivity(
        recentTransactions,
        { amount, type: 'pix' }
      );

      if (suspiciousActivity.suspicious) {
        return res.status(429).json({
          error: 'Atividade suspeita detectada',
          reason: suspiciousActivity.reason
        });
      }

      // Buscar consentimento para pagamentos
      const consent = await ConsentModel.findOne({
        userId,
        status: 'AUTHORISED',
        expirationDateTime: { $gt: new Date() },
        permissions: 'PAYMENTS_INITIATE'
      });

      if (!consent) {
        return res.status(403).json({
          error: 'Consentimento para pagamentos não encontrado'
        });
      }

      const accessToken = await this.openFinanceService.getAccessToken();

      const paymentData = {
        pixKey,
        pixKeyType,
        amount: amount.toString(),
        description,
        creditorAccount,
        creditorIspb,
        creditorIssuer
      };

      const payment = await this.openFinanceService.createPixPayment(
        consent.consentId,
        accessToken,
        paymentData
      );

      // Salvar transação no banco de dados
      await TransactionModel.create({
        userId,
        type: 'pix_out',
        amount,
        description,
        pixKey,
        paymentId: payment.paymentId,
        status: payment.status,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Consulta status de pagamento PIX
   */
  async getPixPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      // Verificar se o pagamento pertence ao usuário
      const transaction = await TransactionModel.findOne({
        userId,
        paymentId
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Pagamento não encontrado'
        });
      }

      const consent = await ConsentModel.findOne({
        userId,
        status: 'AUTHORISED'
      });

      const accessToken = await this.openFinanceService.getAccessToken();

      const paymentStatus = await this.openFinanceService.getPaymentStatus(
        paymentId,
        consent.consentId,
        accessToken
      );

      // Atualizar status no banco
      transaction.status = paymentStatus.status;
      transaction.statusUpdateDateTime = paymentStatus.statusUpdateDateTime;
      await transaction.save();

      res.json({
        success: true,
        data: paymentStatus
      });

    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Webhook para receber notificações da Caixa
   */
  async webhook(req, res) {
    try {
      const signature = req.headers['x-webhook-signature'];
      const payload = JSON.stringify(req.body);

      // Validar assinatura do webhook
      const isValid = this.openFinanceService.validateWebhook(
        signature,
        payload,
        process.env.CAIXA_WEBHOOK_SECRET
      );

      if (!isValid) {
        return res.status(401).json({
          error: 'Assinatura inválida'
        });
      }

      // Processar webhook
      await this.openFinanceService.processWebhook(req.body);

      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new OpenFinanceController();
const express = require('express');
const router = express.Router();
const openFinanceController = require('../controllers/OpenFinanceController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Middleware de rate limiting específico para Open Finance
const openFinanceRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por IP por janela de tempo
  message: 'Muitas tentativas de acesso ao Open Finance'
});

router.use(openFinanceRateLimit);

/**
 * @route   POST /api/openfinance/consents
 * @desc    Criar consentimento para acesso a dados bancários
 * @access  Private
 */
router.post('/consents', openFinanceController.createConsent);

/**
 * @route   GET /api/openfinance/consents/callback
 * @desc    Callback OAuth após autorização do consentimento
 * @access  Public (mas com validação de state)
 */
router.get('/consents/callback', openFinanceController.consentCallback);

/**
 * @route   GET /api/openfinance/accounts
 * @desc    Listar contas vinculadas do usuário
 * @access  Private
 */
router.get('/accounts', openFinanceController.getAccounts);

/**
 * @route   GET /api/openfinance/accounts/:accountId/balance
 * @desc    Obter saldo de uma conta específica
 * @access  Private
 */
router.get('/accounts/:accountId/balance', openFinanceController.getAccountBalance);

/**
 * @route   GET /api/openfinance/accounts/:accountId/transactions
 * @desc    Obter extrato de uma conta
 * @access  Private
 */
router.get('/accounts/:accountId/transactions', openFinanceController.getAccountTransactions);

/**
 * @route   POST /api/openfinance/pix/payments
 * @desc    Criar pagamento PIX
 * @access  Private
 */
router.post('/pix/payments', openFinanceController.createPixPayment);

/**
 * @route   GET /api/openfinance/pix/payments/:paymentId
 * @desc    Consultar status de pagamento PIX
 * @access  Private
 */
router.get('/pix/payments/:paymentId', openFinanceController.getPixPaymentStatus);

/**
 * @route   POST /api/openfinance/webhook
 * @desc    Webhook para receber notificações da Caixa
 * @access  Public (mas com validação de assinatura)
 */
router.post('/webhook', (req, res, next) => {
  // Remove middleware de autenticação para webhook
  req.skipAuth = true;
  next();
}, openFinanceController.webhook);

module.exports = router;
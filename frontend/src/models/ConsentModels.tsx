const { OpenFinanceAuditModel } = require('../models/OpenFinanceModels');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

/**
 * Middleware de auditoria para operações Open Finance
 */
const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para capturar status
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Determinar status da auditoria
      let auditStatus = 'SUCCESS';
      if (statusCode >= 400 && statusCode < 500) {
        auditStatus = 'WARNING';
      } else if (statusCode >= 500) {
        auditStatus = 'FAILURE';
      }
      
      // Extrair resourceId do request
      let resourceId = req.params.accountId || 
                      req.params.paymentId || 
                      req.params.consentId || 
                      req.body.consentId || 
                      'unknown';
      
      // Criar log de auditoria assíncronamente para não bloquear a resposta
      setImmediate(async () => {
        try {
          await OpenFinanceAuditModel.create({
            userId: req.user?.id,
            action,
            resourceId,
            resourceType,
            details: {
              method: req.method,
              url: req.originalUrl,
              params: req.params,
              query: req.query,
              statusCode,
              responseTime: duration
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            status: auditStatus,
            duration
          });
        } catch (error) {
          console.error('Erro ao criar log de auditoria:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Rate limiting específico para Open Finance
 */
const createOpenFinanceRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos
    max: options.max || 100, // Aumentado para 100, 50 pode ser pouco para APIs
    message: {
      error: 'Limite de requests excedido',
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limit por usuário autenticado, ou por IP para anônimos
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    // Pular rate limit para certos casos
    skip: (req) => {
      // Pular para webhooks (geralmente vêm de IPs confiáveis)
      if (req.path.includes('/webhook')) return true;
      // Pular para health check
      if (req.path.includes('/health')) return true;
      return false;
    }
  });
};

/**
 * Middleware para validar consentimento ativo do usuário
 */
const validateConsentMiddleware = async (req, res, next) => {
  try {
    const { ConsentModel } = require('../models/OpenFinanceModels');
    const userId = req.user.id;
    
    // Buscar consentimento ativo
    const consent = await ConsentModel.findOne({
      userId,
      status: 'AUTHORISED',
      expirationDateTime: { $gt: new Date() }
    });
    
    if (!consent) {
      return res.status(403).json({
        error: 'Consentimento não encontrado ou expirado',
        message: 'É necessário criar e autorizar um consentimento para acessar os dados bancários.',
        code: 'CONSENT_NOT_FOUND_OR_EXPIRED'
      });
    }
    
    // Verificar permissões específicas baseadas na rota
    const requiredPermission = getRequiredPermission(req.path, req.method);
    if (requiredPermission && !consent.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'Permissão insuficiente',
        message: `A permissão necessária (${requiredPermission}) não foi concedida no consentimento ativo.`,
        code: 'INSUFFICIENT_PERMISSION',
        requiredPermission
      });
    }
    
    // Anexar consentimento ao request para uso posterior
    req.consent = consent;
    
    // Atualizar data do último uso de forma assíncrona
    setImmediate(async () => {
      try {
        await ConsentModel.updateOne(
          { _id: consent._id },
          { $set: { lastUsedAt: new Date() } }
        );
      } catch (error) {
        console.error('Erro ao atualizar lastUsedAt do consentimento:', error);
      }
    });
    
    next();
  } catch (error) {
    console.error('Erro no middleware de validação de consentimento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao validar o consentimento do usuário.'
    });
  }
};

/**
 * Determina a permissão necessária baseada na rota e método HTTP
 */
function getRequiredPermission(path, method) {
  if (path.includes('/accounts') && !path.includes('/balance') && !path.includes('/transactions')) {
    return 'ACCOUNTS_READ';
  }
  if (path.includes('/balance')) {
    return 'ACCOUNTS_BALANCES_READ';
  }
  if (path.includes('/transactions')) {
    return 'ACCOUNTS_TRANSACTIONS_READ';
  }
  if (path.includes('/payments') && method === 'POST') {
    return 'PAYMENTS_INITIATE';
  }
  // Adicione outras regras conforme necessário
  return null; // Nenhuma permissão específica necessária
}

/**
 * Middleware para validar assinatura de webhook usando HMAC-SHA256
 */
const validateWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  // O payload precisa ser o body bruto (raw), não o JSON parseado.
  // Muitas vezes, um middleware como o `body-parser` já fez o parse.
  // É crucial usar um middleware que guarde o body bruto antes.
  // Ex: `app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));`
  const payload = req.rawBody || JSON.stringify(req.body); 
  
  if (!signature) {
    return res.status(401).json({
      error: 'Assinatura do webhook não encontrada no cabeçalho x-webhook-signature.'
    });
  }
  
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
      console.error("WEBHOOK_SECRET não está definido nas variáveis de ambiente.");
      return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
    }
  } catch (e) {
      // Captura erros se as assinaturas tiverem tamanhos diferentes, o que timingSafeEqual não suporta.
      return res.status(401).json({ error: 'Formato da assinatura do webhook inválido.' });
  }
  
  next();
};

/**
 * Middleware para logging de requests no console
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] REQ: ${req.method} ${req.originalUrl} - User: ${req.user?.id || 'Anonymous'} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] RES: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Middleware para tratamento de erros centralizado e específico do Open Finance
 */
const errorHandlerMiddleware = (error, req, res, next) => {
  console.error('Erro Capturado:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    response: error.response?.data
  });
  
  // Erros de timeout da requisição ao banco
  if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
    return res.status(504).json({
      error: 'Timeout na comunicação com a instituição financeira',
      message: 'A operação demorou mais que o esperado para ser concluída. Por favor, tente novamente.',
      code: 'GATEWAY_TIMEOUT'
    });
  }
  
  // Erros de certificado SSL/TLS
  if (error.message.includes('certificate') || error.code === 'CERT_UNTRUSTED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return res.status(502).json({
      error: 'Erro de certificado na comunicação segura',
      message: 'Houve um problema de segurança (certificado) na comunicação com a instituição.',
      code: 'CERTIFICATE_ERROR'
    });
  }
  
  // Erros estruturados da API do banco (ex: Caixa, BB)
  if (error.response?.status) {
    const { status, data } = error.response;
    return res.status(status).json({
      error: 'Erro retornado pela API da instituição financeira',
      message: data?.message || data?.error_description || 'Erro não especificado na comunicação com o banco.',
      code: data?.code || data?.error || 'BANK_API_ERROR',
      details: data?.errors || data
    });
  }
  
  // Erro padrão para casos não tratados
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado. Nossa equipe já foi notificada.',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Utilitário para cache de tokens de acesso em memória
 */
class TokenCache {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, token, expiresInSeconds) {
    // Define a expiração com uma margem de segurança (ex: 60 segundos)
    const margin = 60 * 1000;
    const expiresAt = Date.now() + (expiresInSeconds * 1000) - margin;
    this.cache.set(key, { token, expiresAt });
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.token;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

/**
 * Objeto contendo funções para validar dados de entrada (payloads)
 */
const validators = {
  /**
   * Valida os dados para um pagamento PIX.
   * @param {object} data - O corpo da requisição (req.body).
   * @returns {string[]} - Um array de mensagens de erro. Vazio se for válido.
   */
  pixPayment: (data) => {
    const errors = [];
    const validPixKeyTypes = ['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'EVP']; // EVP = Chave Aleatória

    if (!data.pixKey || typeof data.pixKey !== 'string' || data.pixKey.trim() === '') {
      errors.push('O campo "pixKey" (Chave PIX) é obrigatório.');
    }
    
    if (!data.pixKeyType || !validPixKeyTypes.includes(data.pixKeyType)) {
      errors.push(`O campo "pixKeyType" é inválido. Valores aceitos: ${validPixKeyTypes.join(', ')}.`);
    }

    if (data.amount === undefined || data.amount === null) {
        errors.push('O campo "amount" (valor) é obrigatório.');
    } else if (typeof data.amount !== 'number' || data.amount <= 0) {
        errors.push('O campo "amount" (valor) deve ser um número positivo maior que zero.');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
        errors.push('O campo "description" (descrição) é obrigatório.');
    }

    if (!data.consentId || typeof data.consentId !== 'string') {
        errors.push('O campo "consentId" (ID do consentimento de pagamento) é obrigatório.');
    }
    
    return errors;
  },

  /**
   * Valida os dados para a criação de um consentimento.
   * @param {object} data - O corpo da requisição (req.body).
   * @returns {string[]} - Um array de mensagens de erro. Vazio se for válido.
   */
  createConsent: (data) => {
    const errors = [];
    const validPermissions = [
        'ACCOUNTS_READ', 'ACCOUNTS_BALANCES_READ', 'ACCOUNTS_TRANSACTIONS_READ',
        'PAYMENTS_INITIATE', 'RESOURCES_READ'
    ];

    if (!data.permissions || !Array.isArray(data.permissions) || data.permissions.length === 0) {
        errors.push('O campo "permissions" é obrigatório, deve ser um array e não pode estar vazio.');
    } else {
        data.permissions.forEach(p => {
            if (!validPermissions.includes(p)) {
                errors.push(`Permissão inválida encontrada: "${p}".`);
            }
        });
    }

    return errors;
  }
};

// Exporta todos os middlewares e utilitários para serem usados em outros arquivos
module.exports = {
  auditMiddleware,
  createOpenFinanceRateLimit,
  validateConsentMiddleware,
  getRequiredPermission,
  validateWebhookSignature,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  TokenCache,
  validators
};
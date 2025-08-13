const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

/**
 * Serviço de integração com Open Finance da Caixa Econômica Federal
 * Implementa OAuth 2.0 com MTLS e JWT para autenticação segura
 */
class OpenFinanceCaixaService {
  constructor(config) {
    this.config = {
      // URLs da Caixa (Sandbox/Produção)
      baseUrl: config.environment === 'production' 
        ? 'https://openfinance-api.caixa.gov.br' 
        : 'https://openfinance-sandbox.caixa.gov.br',
      
      // Credenciais OAuth2
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      
      // Certificados para mTLS
      certPath: config.certPath,
      keyPath: config.keyPath,
      
      // Configurações JWT
      privateCertPath: config.privateCertPath,
      kid: config.kid, // Key ID do certificado
      
      // Redirect URI para consentimentos
      redirectUri: config.redirectUri,
      
      // Timeout e retry
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Configura cliente HTTP com mTLS
   */
  getHttpClient() {
    const httpsAgent = new (require('https').Agent)({
      cert: fs.readFileSync(this.config.certPath),
      key: fs.readFileSync(this.config.keyPath),
      rejectUnauthorized: true
    });

    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AIBank/1.0'
      }
    });
  }

  /**
   * Gera JWT para autenticação client_credentials
   */
  generateClientAssertionJWT() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.clientId,
      sub: this.config.clientId,
      aud: `${this.config.baseUrl}/oauth2/token`,
      jti: crypto.randomUUID(),
      iat: now,
      exp: now + 300 // 5 minutos
    };

    const privateKey = fs.readFileSync(this.config.privateCertPath);
    
    return jwt.sign(payload, privateKey, {
      algorithm: 'PS256',
      keyid: this.config.kid
    });
  }

  /**
   * Obtém token de acesso usando Client Credentials
   */
  async getAccessToken() {
    // Verifica se token ainda é válido
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const client = this.getHttpClient();
    const clientAssertion = this.generateClientAssertionJWT();

    try {
      const response = await client.post('/oauth2/token', {
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope: 'accounts consents payments'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minuto de margem

      return this.accessToken;
    } catch (error) {
      console.error('Erro ao obter token de acesso:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com Open Finance');
    }
  }

  /**
   * Cria consentimento para acesso a dados da conta
   */
  async createConsent(permissions, expirationDate, customerId) {
    const token = await this.getAccessToken();
    const client = this.getHttpClient();

    const consentData = {
      data: {
        permissions,
        expirationDateTime: expirationDate.toISOString(),
        businessEntity: {
          document: {
            identification: customerId,
            rel: 'CPF'
          }
        }
      }
    };

    try {
      const response = await client.post('/open-banking/consents/v2/consents', 
        consentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-fapi-interaction-id': crypto.randomUUID(),
            'x-fapi-auth-date': new Date().toISOString(),
            'x-fapi-customer-ip-address': '127.0.0.1'
          }
        }
      );

      return {
        consentId: response.data.data.consentId,
        status: response.data.data.status,
        expirationDateTime: response.data.data.expirationDateTime,
        authorizationUrl: `${this.config.baseUrl}/oauth2/authorize?` +
          `response_type=code&client_id=${this.config.clientId}&` +
          `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
          `scope=consents%20accounts&state=${crypto.randomUUID()}&` +
          `request=${response.data.data.consentId}`
      };
    } catch (error) {
      console.error('Erro ao criar consentimento:', error.response?.data || error.message);
      throw new Error('Falha ao criar consentimento');
    }
  }

  /**
   * Obtém informações da conta
   */
  async getAccountInfo(consentId, accessToken) {
    const client = this.getHttpClient();

    try {
      const response = await client.get('/open-banking/accounts/v2/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-fapi-interaction-id': crypto.randomUUID(),
          'x-fapi-auth-date': new Date().toISOString(),
          'x-fapi-customer-ip-address': '127.0.0.1',
          'x-consent-id': consentId
        }
      });

      return response.data.data.map(account => ({
        accountId: account.accountId,
        number: account.number,
        checkDigit: account.checkDigit,
        accountType: account.accountType,
        accountSubType: account.accountSubType,
        currency: account.currency,
        nickname: account.nickname
      }));
    } catch (error) {
      console.error('Erro ao obter informações da conta:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações da conta');
    }
  }

  /**
   * Obtém saldo da conta
   */
  async getAccountBalance(accountId, consentId, accessToken) {
    const client = this.getHttpClient();

    try {
      const response = await client.get(
        `/open-banking/accounts/v2/accounts/${accountId}/balances`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-fapi-interaction-id': crypto.randomUUID(),
            'x-fapi-auth-date': new Date().toISOString(),
            'x-fapi-customer-ip-address': '127.0.0.1',
            'x-consent-id': consentId
          }
        }
      );

      return response.data.data.map(balance => ({
        type: balance.type,
        amount: balance.amount,
        currency: balance.currency,
        dateTime: balance.dateTime
      }));
    } catch (error) {
      console.error('Erro ao obter saldo da conta:', error.response?.data || error.message);
      throw new Error('Falha ao obter saldo da conta');
    }
  }

  /**
   * Obtém extrato da conta
   */
  async getAccountTransactions(accountId, consentId, accessToken, fromDate, toDate, page = 1) {
    const client = this.getHttpClient();

    const params = new URLSearchParams({
      page: page.toString(),
      'page-size': '100'
    });

    if (fromDate) params.append('from-booking-date-time', fromDate.toISOString());
    if (toDate) params.append('to-booking-date-time', toDate.toISOString());

    try {
      const response = await client.get(
        `/open-banking/accounts/v2/accounts/${accountId}/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-fapi-interaction-id': crypto.randomUUID(),
            'x-fapi-auth-date': new Date().toISOString(),
            'x-fapi-customer-ip-address': '127.0.0.1',
            'x-consent-id': consentId
          }
        }
      );

      return {
        transactions: response.data.data.map(transaction => ({
          transactionId: transaction.transactionId,
          completedAuthorisedPaymentType: transaction.completedAuthorisedPaymentType,
          creditDebitType: transaction.creditDebitType,
          transactionName: transaction.transactionName,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          transactionDate: transaction.transactionDate,
          bookingDateTime: transaction.bookingDateTime,
          valueDateTime: transaction.valueDateTime
        })),
        meta: response.data.meta,
        links: response.data.links
      };
    } catch (error) {
      console.error('Erro ao obter transações:', error.response?.data || error.message);
      throw new Error('Falha ao obter transações');
    }
  }

  /**
   * Inicia pagamento PIX
   */
  async createPixPayment(consentId, accessToken, paymentData) {
    const client = this.getHttpClient();

    const paymentRequest = {
      data: {
        payment: {
          type: 'PIX',
          amount: paymentData.amount,
          currency: 'BRL',
          details: {
            proxy: paymentData.pixKey,
            proxyType: paymentData.pixKeyType,
            localInstrument: 'MANU'
          }
        },
        creditorAccount: {
          ispb: paymentData.creditorIspb,
          issuer: paymentData.creditorIssuer,
          number: paymentData.creditorAccount,
          accountType: 'CACC'
        },
        cnpjInitiator: this.config.cnpjInitiator,
        remittanceInformation: paymentData.description || 'Pagamento via Open Finance'
      }
    };

    try {
      const response = await client.post(
        '/open-banking/payments/v2/pix/payments',
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-fapi-interaction-id': crypto.randomUUID(),
            'x-fapi-auth-date': new Date().toISOString(),
            'x-fapi-customer-ip-address': '127.0.0.1',
            'x-consent-id': consentId,
            'x-idempotency-key': crypto.randomUUID()
          }
        }
      );

      return {
        paymentId: response.data.data.paymentId,
        status: response.data.data.status,
        creationDateTime: response.data.data.creationDateTime,
        statusUpdateDateTime: response.data.data.statusUpdateDateTime
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error.response?.data || error.message);
      throw new Error('Falha ao criar pagamento PIX');
    }
  }

  /**
   * Consulta status do pagamento
   */
  async getPaymentStatus(paymentId, consentId, accessToken) {
    const client = this.getHttpClient();

    try {
      const response = await client.get(
        `/open-banking/payments/v2/pix/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-fapi-interaction-id': crypto.randomUUID(),
            'x-fapi-auth-date': new Date().toISOString(),
            'x-fapi-customer-ip-address': '127.0.0.1',
            'x-consent-id': consentId
          }
        }
      );

      return {
        paymentId: response.data.data.paymentId,
        status: response.data.data.status,
        creationDateTime: response.data.data.creationDateTime,
        statusUpdateDateTime: response.data.data.statusUpdateDateTime,
        rejectionReason: response.data.data.rejectionReason
      };
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
      throw new Error('Falha ao consultar pagamento');
    }
  }

  /**
   * Valida webhook de notificação
   */
  validateWebhook(signature, payload, webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Processa webhook de notificação
   */
  async processWebhook(webhookData) {
    try {
      const { eventType, data } = webhookData;

      switch (eventType) {
        case 'CONSENT_AUTHORISED':
          console.log('Consentimento autorizado:', data.consentId);
          break;
        case 'CONSENT_REJECTED':
          console.log('Consentimento rejeitado:', data.consentId);
          break;
        case 'PAYMENT_INITIATION_COMPLETED':
          console.log('Pagamento concluído:', data.paymentId);
          break;
        case 'PAYMENT_INITIATION_FAILED':
          console.log('Pagamento falhou:', data.paymentId, data.error);
          break;
        default:
          console.log('Evento não reconhecido:', eventType);
      }

      return { processed: true };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw new Error('Falha ao processar webhook');
    }
  }
}

module.exports = OpenFinanceCaixaService;
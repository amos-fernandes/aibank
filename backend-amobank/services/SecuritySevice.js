const crypto = require('crypto');
const bcrypt = require('bcrypt');

class SecurityService {
  static encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    // Usar createCipherIV em vez de createCipher (deprecated)
    const cipher = crypto.createCipherIV(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    
    // Usar createDecipherIV em vez de createDecipher (deprecated)
    const decipher = crypto.createDecipherIV(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static validateTransactionLimits(account, amount, transactionType) {
    const limits = {
      daily_limit: account.daily_limit || 5000,
      transfer_limit: 10000,
      pix_limit: 5000
    }; // Faltava fechar o objeto

    if (amount > limits.daily_limit) {
      throw new Error('Valor excede o limite diário');
    }

    if (transactionType === 'transfer' && amount > limits.transfer_limit) {
      throw new Error('Valor excede o limite para transferências');
    }

    if (transactionType === 'pix' && amount > limits.pix_limit) {
      throw new Error('Valor excede o limite para PIX');
    }

    return true;
  }

  static detectSuspiciousActivity(transactions, newTransaction) {
    // Verificar se há transações para evitar divisão por zero
    if (!transactions || transactions.length === 0) {
      return { suspicious: false };
    }

    // Detectar transações consecutivas de alto valor
    const recentHighValue = transactions
      .filter(t =>
        t.created_at > new Date(Date.now() - 60000) && // Último minuto
        t.amount > 1000
      ).length;

    if (recentHighValue >= 3) {
      return { suspicious: true, reason: 'Múltiplas transações de alto valor' };
    }

    // Detectar horários incomuns
    const hour = new Date().getHours();
    if ((hour < 6 || hour > 23) && newTransaction.amount > 500) {
      return { suspicious: true, reason: 'Transação em horário incomum' };
    }

    // Detectar mudança brusca no padrão
    const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    if (newTransaction.amount > avgAmount * 5) {
      return { suspicious: true, reason: 'Valor muito acima do padrão' };
    }

    return { suspicious: false };
  }

  static generateAccountNumber() {
    const bank = '001'; // Código do banco
    const agency = '0001'; // Agência padrão
    const account = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
    const digit = this.calculateAccountDigit(account.toString());

    return `${account}-${digit}`;
  }

  static calculateAccountDigit(accountNumber) {
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;

    for (let i = 0; i < accountNumber.length; i++) {
      sum += parseInt(accountNumber[i]) * weights[i % weights.length];
    }

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}

module.exports = SecurityService;
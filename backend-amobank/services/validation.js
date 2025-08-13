const Joi = require('joi');

class ValidationService {
  static validateCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) {
      return false;
    }
    
    // Validação do dígito verificador
    const digits = cpf.split('').map(el => +el);
    
    for (let j = 0; j < 2; j++) {
      let sum = 0;
      for (let i = 0; i < 9 + j; i++) {
        sum += digits[i] * ((10 + j) - i);
      }
      let checkDigit = 11 - (sum % 11);
      if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
      if (checkDigit !== digits[9 + j]) return false;
    }
    
    return true;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^\+?55\s?\(?[1-9]{2}\)?\s?[9]?[0-9]{4}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  static validatePixKey(keyType, keyValue) {
    switch (keyType) {
      case 'cpf':
        return this.validateCPF(keyValue);
      case 'email':
        return this.validateEmail(keyValue);
      case 'phone':
        return this.validatePhone(keyValue);
      case 'random':
        return keyValue.length === 32 && /^[a-f0-9-]+$/i.test(keyValue);
      default:
        return false;
    }
  }

  // Schemas de validação
  static schemas = {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      full_name: Joi.string().min(2).max(100).required(),
      cpf: Joi.string().length(11).required(),
      phone: Joi.string().max(15).optional(),
      birth_date: Joi.date().max('now').optional()
    }),

    transfer: Joi.object({
      from_account_id: Joi.string().uuid().required(),
      to_account_number: Joi.string().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().max(200).optional()
    }),

    pixTransfer: Joi.object({
      from_account_id: Joi.string().uuid().required(),
      pix_key: Joi.string().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().max(200).optional()
    }),

    loanApplication: Joi.object({
      account_id: Joi.string().uuid().required(),
      loan_type: Joi.string().valid('personal', 'home', 'car', 'education', 'business').required(),
      principal_amount: Joi.number().positive().max(1000000).required(),
      term_months: Joi.number().integer().min(6).max(360).required(),
      monthly_income: Joi.number().positive().required()
    }),

    investment: Joi.object({
      account_id: Joi.string().uuid().required(),
      investment_type: Joi.string().valid('cdb', 'lci', 'lca', 'tesouro_direto', 'fundos', 'acoes', 'fiis').required(),
      product_name: Joi.string().required(),
      invested_amount: Joi.number().positive().required(),
      yield_rate: Joi.number().optional(),
      maturity_date: Joi.date().optional(),
      risk_rating: Joi.string().valid('baixo', 'medio', 'alto').optional(),
      liquidity: Joi.string().valid('daily', 'monthly', 'maturity_only').optional()
    })
  };
}

module.exports = ValidationService;
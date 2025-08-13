const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Log da ação após a resposta
      logAudit(req, res, action, data);
      originalSend.call(this, data);
    };

    next();
  };
};

async function logAudit(req, res, action, responseData) {
  try {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Não fazer log de dados sensíveis
    const sanitizedBody = sanitizeData(req.body);
    const sanitizedResponse = sanitizeData(responseData);

    await supabase
      .from('audit_log')
      .insert({
        user_id: userId,
        action: `${req.method} ${action}`,
        table_name: extractTableName(req.path),
        record_id: extractRecordId(req.params, responseData),
        old_values: req.method === 'PUT' || req.method === 'PATCH' ? sanitizedBody : null,
        new_values: res.statusCode < 400 ? sanitizedResponse : null,
        ip_address: ip,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('Erro no log de auditoria:', error);
  }
}

function sanitizeData(data) {
  if (!data) return null;
  
  const sensitive = ['password', 'cvv', 'card_number', 'token'];
  const sanitized = { ...data };
  
  sensitive.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
}

function extractTableName(path) {
  const pathParts = path.split('/');
  return pathParts[2] || 'unknown'; // /api/accounts -> accounts
}

function extractRecordId(params, responseData) {
  return params.id || responseData?.id || null;
}

module.exports = auditMiddleware;
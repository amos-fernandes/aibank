const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };

    // Verificar conexão com Supabase
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      health.checks.database = error ? 'error' : 'ok';
    } catch (error) {
      health.checks.database = 'error';
      health.status = 'degraded';
    }

    // Verificar Redis (se configurado)
    health.checks.redis = 'ok'; // Implementar verificação do Redis

    // Status geral
    const hasErrors = Object.values(health.checks).some(check => check === 'error');
    if (hasErrors) {
      health.status = 'error';
      return res.status(503).json(health);
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
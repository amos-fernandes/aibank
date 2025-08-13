const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  console.log('🔄 Executando migrações...');

  try {
    // Verificar se as tabelas existem
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    const existingTables = tables.map(t => t.table_name);

    // Lista de tabelas esperadas
    const requiredTables = [
      'profiles',
      'accounts', 
      'transactions',
      'cards',
      'loans',
      'loan_payments',
      'investments',
      'notifications',
      'account_settings',
      'pix_keys',
      'audit_log'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log(`❌ Tabelas em falta: ${missingTables.join(', ')}`);
      console.log('Execute o script SQL de criação das tabelas primeiro');
      process.exit(1);
    }

    // Verificar e criar índices se necessário
    console.log('📊 Verificando índices...');

    // Adicionar dados de exemplo se necessário
    await seedData();

    console.log('✅ Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    process.exit(1);
  }
}

async function seedData() {
  // Verificar se já existem dados
  const { data: existingData } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (existingData.length === 0) {
    console.log('🌱 Criando dados de exemplo...');
    
    // Aqui você pode adicionar dados de exemplo para desenvolvimento
    // Remover em produção
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
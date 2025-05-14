import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AgnusPanel from '../components/AgnusPanel';
import axios from 'axios';
import { fetchInteractions } from 'api/interactions';


const [executing, setExecuting] = useState(false);


const handleExecuteAgent = async () => {
  setExecuting(true);
  try {
    const response = await axios.post('/api/agnus/execute-agent');
    console.log('Agente executado com sucesso:', response.data);
    fetchInteractions();
  } catch (error) {
    console.error('Erro ao executar o agente:', error);
  } finally {
    setExecuting(false);
  }
};



const dashboardData = {
  leads: 3,
  campaigns: 1,
  responseRate: 15.3,
  qualified: 23,
};

const leadsMock = [
  {
    company: 'TechCorp Goiânia',
    contact: 'Ana Silva',
    email: 'ana@techcorp.com.br',
    whatsapp: '5562998765432',
    industry: 'Tecnologia',
    date: '2025-05-10',
  },
  {
    company: 'Indústrias Goiás',
    contact: 'Carlos Mendes',
    email: 'carlos@industriasgoias.com.br',
    whatsapp: '5562987651234',
    industry: 'Manufatura',
    date: '2025-05-11',
  },
  {
    company: 'Construtora Cerrado',
    contact: 'Patricia Alves',
    email: 'patricia@cerrado.com.br',
    whatsapp: '5562991234567',
    industry: 'Construção',
    date: '2025-05-12',
  },
];

export default function DashboardAgenteAgnus() {
  const [tab, setTab] = useState('leads');

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Painel de Controle – Agente VerticalAgent</h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total de Leads</p>
            <h3 className="text-xl font-bold">{dashboardData.leads}</h3>
            <p className="text-xs text-green-500">+2 desde a última semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Campanhas Ativas</p>
            <h3 className="text-xl font-bold">{dashboardData.campaigns}</h3>
            <p className="text-xs text-muted">1 em rascunho</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Taxa de Resposta</p>
            <h3 className="text-xl font-bold">{dashboardData.responseRate}%</h3>
            <p className="text-xs text-green-500">+2.5% desde o último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Contatos Qualificados</p>
            <h3 className="text-xl font-bold">{dashboardData.qualified}</h3>
            <p className="text-xs text-muted">Prontos para próxima etapa</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div>
        <h3 className="text-lg font-medium mb-2">Gerenciamento</h3>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="whatsapp">Integração WhatsApp</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex justify-end mb-2">
          <Button onClick={handleExecuteAgent} disabled={executing}>
                    {executing ? 'Executando...' : 'Executar Agente VerticalAgent'}
          </Button>
        </div>

        {/* Leads Table */}
        {tab === 'leads' && (
          <div className="rounded-xl border shadow-sm p-4">
            <h4 className="text-lg font-semibold mb-2">Lista de Leads</h4>
            <p className="text-sm text-gray-500 mb-4">Empresas de Goiás prospectadas pelo Agente Agnus</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsMock.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.contact}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.whatsapp}</TableCell>
                    <TableCell>{lead.industry}</TableCell>
                    <TableCell>{lead.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <AgnusPanel/>
    </div>
  );
}

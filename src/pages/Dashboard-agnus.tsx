import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AgnusPanel from '../components/AgnusPanel';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// useEffect(() => {
//   const storedTab = localStorage.getItem('agnus-tab');
//   if (storedTab) setTab(storedTab);
// }, []);

// useEffect(() => {
//   localStorage.setItem('agnus-tab', tab);
// }, [tab]);

type LeadType = {
  company: string;
  contact: string;
  email: string;
  whatsapp: string;
  industry: string;
  date: string; // ou Date se já vier convertido
};


export default function DashboardAgenteAgnus() {
  const [executing, setExecuting] = useState(false);
  const [tab, setTab] = useState('leads');
  const [leads, setLeads] = useState<LeadType[]>([]);


  const handleExecuteAgent = async () => {
    setExecuting(true);
    try {
      const response = await axios.post('/api/agnus/execute-agent');
      console.log('Agente executado com sucesso:', response.data);
     
      await fetchLeads();
    } catch (error) {
      console.error('Erro ao executar o agente:', error);
    } finally {
      setExecuting(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/agnus/interactions', {

        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const dashboardData = {
    leads: leads.length,
    campaigns: 1,
    responseRate: 15.3,
    qualified: 23,
  };

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

        <Button onClick={handleExecuteAgent} disabled={executing}>
            {executing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              'Executar Agente VerticalAgent'
            )}
          </Button>

        {/* Leads Table */}
        {leads.length === 0 ? (
              <p className="text-sm text-muted">Nenhum lead encontrado.</p>
            ) : (
              <Table>...</Table>
            )}
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
                {Array.isArray(leads) && leads.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.contact}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.whatsapp}</TableCell>
                    <TableCell>{lead.industry}</TableCell>
                   <TableCell>{format(new Date(lead.date), 'dd/MM/yyyy HH:mm')}</TableCell>
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

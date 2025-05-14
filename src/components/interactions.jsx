import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Interactions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const res = await axios.get('../components/interactions');
        setInteractions(res.data);
      } catch (error) {
        console.error('Erro ao buscar interações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, []);

  if (loading) return <div className="text-center p-4">Carregando interações...</div>;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Interações do Agente Agnus</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="py-2 px-4 border-b">Lead</th>
              <th className="py-2 px-4 border-b">Campanha</th>
              <th className="py-2 px-4 border-b">Mensagem Recebida</th>
              <th className="py-2 px-4 border-b">Resposta Agnus</th>
              <th className="py-2 px-4 border-b">Intenção</th>
              <th className="py-2 px-4 border-b">Data</th>
            </tr>
          </thead>
          <tbody>
            {interactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">Nenhuma interação registrada.</td>
              </tr>
            ) : (
              interactions.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item.nome || item.lead_id}</td>
                  <td className="py-2 px-4 border-b">{item.campanha || item.campaign_id}</td>
                  <td className="py-2 px-4 border-b">{item.mensagem || item.message}</td>
                  <td className="py-2 px-4 border-b">{item.resposta}</td>
                  <td className="py-2 px-4 border-b font-medium text-blue-600">{item.intencao}</td>
                  <td className="py-2 px-4 border-b">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Interactions;

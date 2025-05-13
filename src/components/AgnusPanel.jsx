// frontend/src/components/AgnusPanel.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const AgnusPanel = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/agnus/interactions')

      .then(res => {
          console.log('Interações recebidas:', res.data);
          const data = Array.isArray(res.data) ? res.data : [];
          setInteractions(data);
        })
      .catch(err => console.error('Erro ao buscar interações:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md mt-4">
      <h2 className="text-xl font-bold mb-4">Interações do Agente VerticalAgent</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-2">Lead</th>
              <th className="px-4 py-2">Origem</th>
              <th className="px-4 py-2">Mensagem</th>
              <th className="px-4 py-2">Intenção</th>
              <th className="px-4 py-2">Resposta IA</th>
              <th className="px-4 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((i, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{i.lead_name || i.lead_id}</td>
                <td className="px-4 py-2">{i.origem}</td>
                <td className="px-4 py-2">{i.message}</td>
                <td className="px-4 py-2">{i.intent}</td>
                <td className="px-4 py-2">{i.response}</td>
                <td className="px-4 py-2">{new Date(i.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AgnusPanel;

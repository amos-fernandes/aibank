
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Send, Bot } from 'lucide-react';
import { useCreditCard } from '@/contexts/CreditCardContext';
import { useBank } from '@/contexts/BankContext';

const AIInvestmentBot = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'bot', content: 'Olá! Sou seu assistente de investimentos IA. Como posso ajudar com seus investimentos hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = useBank();
  const { investmentLimit } = useCreditCard();

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    
    // Simulate AI response 
    setTimeout(() => {
      let botResponse = '';
      
      // Simple pattern matching for demo purposes
      if (message.toLowerCase().includes('retorno') || message.toLowerCase().includes('rendimento')) {
        botResponse = `Com base nas análises do nosso algoritmo de rede neural, os investimentos estão projetados para render 6.2% ao mês. Isso significa que seu investimento atual de ${formatCurrency(investmentLimit)} pode se tornar aproximadamente ${formatCurrency(investmentLimit * Math.pow(1.062, 12))} em 12 meses.`;
      } else if (message.toLowerCase().includes('risco')) {
        botResponse = 'Nossa estratégia utiliza um algoritmo de IA que balanceia a carteira para minimizar riscos. Mantemos um perfil moderado focando em ativos diversificados e com proteção contra volatilidade.';
      } else if (message.toLowerCase().includes('aumento') || message.toLowerCase().includes('aumentar')) {
        botResponse = 'Para aumentar seu limite de investimento IA, você precisaria entrar em contato com nossa equipe de atendimento. O algoritmo pode gerenciar valores maiores mantendo o mesmo perfil de retorno.';
      } else {
        botResponse = 'Estou aqui para ajudar com suas estratégias de investimento. Posso responder sobre retornos projetados, estratégias de mercado, ou qualquer dúvida sobre como nosso algoritmo de IA trabalha para maximizar seus ganhos.';
      }
      
      setConversation(prev => [...prev, { role: 'bot', content: botResponse }]);
      setIsLoading(false);
      setMessage('');
    }, 1000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot size={20} className="mr-2 text-bank-purple" />
          Assistente de Investimentos IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <div className="space-y-4">
          {conversation.map((msg, i) => (
            <div 
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-bank-teal text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={sendMessage} className="flex w-full">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua pergunta sobre investimentos..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-bank-teal"
            disabled={isLoading}
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-bank-purple text-white rounded-r-md hover:bg-opacity-90 disabled:opacity-50"
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AIInvestmentBot;

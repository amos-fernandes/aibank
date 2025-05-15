
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300">
              <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-8 h-8" />
            </div>
            
              <h1 className="ml-3 text-xl font-bold">AIBANK</h1>
            
           
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-bank-teal transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-bank-teal transition-colors">
              Como funciona
            </a>
            <Link to="/login" className="text-bank-purple font-medium hover:underline">
              Entrar
            </Link>
          </div>
          <div className="md:hidden">
            <Link to="/login" className="text-bank-purple font-medium hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-bank-teal to-bank-purple">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-white animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Seu banco digital com o poder do OpenFinance
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Integre suas contas e tenha uma visão completa das suas finanças. Envie, receba e invista com um só aplicativo.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/register">
                  <Button className="bg-white text-bank-teal hover:bg-opacity-90 text-lg px-8 py-3 rounded-lg">
                    Criar conta grátis
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:bg-opacity-10 text-lg px-8 py-3 rounded-lg">
                    Como funciona
                  </Button>
                </a>
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
              <div className="w-[280px] h-[580px] bg-white rounded-[40px] p-4 shadow-2xl animate-fade-in">
                <div className="w-full h-full rounded-[32px] bg-slate-50 overflow-hidden relative">
                  <div className="bg-gradient-to-br from-bank-teal to-bank-purple p-5 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm opacity-70">Saldo disponível</p>
                        <h3 className="text-xl font-bold">R$ 10.000,00</h3>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300">
                          <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-8 h-8" />
                        </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-500 text-sm mb-4">Transações recentes</p>
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-800">Transação #{item}</p>
                            <p className="text-xs text-gray-500">Hoje</p>
                          </div>
                        </div>
                        <p className={`font-medium ${item % 2 === 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item % 2 === 0 ? '+' : '-'}R$ {(Math.random() * 500).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a AIBANK?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nossa plataforma integra o poder do OpenFinance com a simplicidade de uma experiência bancária moderna
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-bank-teal bg-opacity-10 rounded-lg flex items-center justify-center mb-5">
                <ShieldCheck className="text-bank-teal" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Segurança avançada</h3>
              <p className="text-gray-600">
                Protegemos seus dados financeiros com criptografia de última geração e autenticação em duas etapas.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-bank-purple bg-opacity-10 rounded-lg flex items-center justify-center mb-5">
                <CreditCard className="text-bank-purple" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">OpenFinance integrado</h3>
              <p className="text-gray-600">
                Conecte suas contas de outros bancos e tenha uma visão completa das suas finanças em um só lugar.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-bank-neon-green bg-opacity-10 rounded-lg flex items-center justify-center mb-5">
                <Smartphone className="text-bank-neon-green" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">100% digital</h3>
              <p className="text-gray-600">
                Faça tudo pelo aplicativo: transfira dinheiro, pague contas, invista em criptomoedas e muito mais.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comece a usar o AIBANK em apenas 3 passos simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-bank-teal text-white flex items-center justify-center text-xl font-bold mb-5">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Crie sua conta</h3>
                <p className="text-gray-600">
                  Cadastre-se em minutos com seus dados pessoais básicos.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-12 h-2 bg-gray-200 -translate-y-1/2 -ml-6">
                <ChevronRight className="text-gray-400 absolute top-1/2 -right-4 -translate-y-1/2" />
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-bank-purple text-white flex items-center justify-center text-xl font-bold mb-5">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Conecte seus bancos</h3>
                <p className="text-gray-600">
                  Integre suas contas através do OpenFinance para visualizar tudo em um só lugar.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-12 h-2 bg-gray-200 -translate-y-1/2 -ml-6">
                <ChevronRight className="text-gray-400 absolute top-1/2 -right-4 -translate-y-1/2" />
              </div>
            </div>
            
            {/* Step 3 */}
            <div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-bank-neon-green text-white flex items-center justify-center text-xl font-bold mb-5">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Comece a usar</h3>
                <p className="text-gray-600">
                  Aproveite todos os recursos: envie dinheiro, pague contas e invista com facilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-bank-teal to-bank-purple text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para revolucionar suas finanças?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Junte-se a milhares de brasileiros que já estão transformando sua relação com dinheiro através do OpenFinance.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-bank-teal hover:bg-opacity-90 text-lg px-8 py-3 rounded-lg">
              Comece agora
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-8 h-8" />
            </div>
           <h1 className="ml-3 text-xl font-bold">AIBANK</h1>
          </div>
          
          <div className="text-center text-gray-400 text-sm">
            <p>© 2023 AIBANK. Todos os direitos reservados.</p>
            <p className="mt-2">
              Este é um projeto incubado pela UFG com apoio do CEI UFG, HUB Goiás, SEBRAE-GO. proboro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;


import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditCard } from '@/contexts/CreditCardContext';

const CreditCardDisplay = () => {
  const { user } = useAuth();
  const { creditCardInfo, showCardDetails, toggleCardDetails } = useCreditCard();
  
  return (
    <motion.div 
      className="bank-card relative overflow-hidden h-56 w-full max-w-md mx-auto"
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={toggleCardDetails}
          className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
        >
          {showCardDetails ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium">Finverse</div>
            <div className="flex space-x-2 items-center">
              <div className="font-bold uppercase">Black</div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <circle cx="7" cy="12" r="4" fill="#EB001B" />
                    <circle cx="17" cy="12" r="4" fill="#F79E1B" />
                    <path d="M12 8.4c1.3 1.6 2 3.6 2 5.6 0 2-0.7 4-2 5.6-1.3-1.6-2-3.6-2-5.6 0-2 0.7-4 2-5.6z" fill="#FF5F00" />
                  </svg>
                </div>
                <div className="text-[8px] uppercase">Mastercard</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-xs text-white/70 mb-1">Número do cartão</div>
            <div className="flex space-x-3 font-mono">
              {showCardDetails ? (
                <>
                  <span>{creditCardInfo.cardNumber.slice(0, 4)}</span>
                  <span>{creditCardInfo.cardNumber.slice(4, 8)}</span>
                  <span>{creditCardInfo.cardNumber.slice(8, 12)}</span>
                  <span>{creditCardInfo.cardNumber.slice(12, 16)}</span>
                </>
              ) : (
                <>
                  <span>****</span>
                  <span>****</span>
                  <span>****</span>
                  <span>{creditCardInfo.cardNumber.slice(12, 16)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/70 mb-1">Nome</div>
              <div className="font-medium uppercase">{user?.name}</div>
            </div>
            <div>
              <div className="text-xs text-white/70 mb-1">Validade</div>
              <div className="font-medium">
                {showCardDetails ? creditCardInfo.expiryDate : '**/**'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditCardDisplay;

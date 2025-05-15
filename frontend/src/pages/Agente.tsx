// src/pages/Agente.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AgnusPanel from "../components/AgnusPanel";

export default function Agente() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Painel do Agente</h1>
      <AgnusPanel />
    </div>
  );
}

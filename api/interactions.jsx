// src/components/interactions.jsx
import axios from 'axios';

export const fetchInteractions = async () => {
  try {
    const res = await axios.get('/api/interactions'); // ← ajuste o endpoint se necessário
    return res.data;
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    return [];
  }
};

// Componente visual
import React, { useEffect, useState } from 'react';

const Interactions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchInteractions();
      setInteractions(data);
      setLoading(false);
    };
    load();
  }, []);

  // render JSX...
};

export default Interactions;



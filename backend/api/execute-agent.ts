// pages/api/agnus/execute-agent.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const backendUrl = process.env.BACKEND_AGENT_URL || 'http://localhost:3001/api/execute-agent'
    
    const response = await axios.post(backendUrl)

    return res.status(200).json({ success: true, data: response.data })
  } catch (error: any) {
    console.error('Erro ao acionar o agente Agnus:', error.message)
    return res.status(500).json({ success: false, message: 'Erro ao acionar o backend' })
  }
}



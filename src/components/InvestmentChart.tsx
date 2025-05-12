
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useBank } from '@/contexts/BankContext';

interface InvestmentReturn {
  month: string;
  value: number;
  expectedReturn: number;
}

interface InvestmentChartProps {
  data: InvestmentReturn[];
}

const InvestmentChart = ({ data }: InvestmentChartProps) => {
  const { formatCurrency } = useBank();
  
  const chartConfig = {
    value: {
      color: "#2A9D8F",
    },
    expectedReturn: {
      color: "#6E59A5",
    },
  };

  return (
    <ChartContainer className="w-full h-full" config={chartConfig}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }} 
        />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value).split(' ')[1]}
          width={80}
        />
        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="Valor real"
          stroke="#2A9D8F"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="expectedReturn"
          name="Projeção IA"
          stroke="#6E59A5"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ChartContainer>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatCurrency: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label, formatCurrency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-bank-teal">
          Valor: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-bank-purple">
          Projeção: {formatCurrency(payload[1].value)}
        </p>
      </div>
    );
  }

  return null;
};

export default InvestmentChart;

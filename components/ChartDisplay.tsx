import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from 'recharts';
import { CategoryBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';

interface ChartDisplayProps {
  data: CategoryBreakdown[];
  type: 'pie' | 'bar';
  title: string;
  selectedCurrency: string;
}

const COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#0ea5e9', '#6d28d9', '#db2777', '#facc15',
  '#14b8a6', '#84cc16', '#ef4444', '#f472b6', '#3b82f6',
];

const ChartDisplay: React.FC<ChartDisplayProps> = ({ data, type, title, selectedCurrency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No data available to display {title}.
      </div>
    );
  }

  const chartData = data.map(item => ({ name: item.category, value: item.amount }));

  const currencyFormatter = (value: number) => formatCurrency(value, selectedCurrency);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-72 w-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={currencyFormatter} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ right: 0, top: '50%', transform: 'translateY(-50%)' }}
            />
          </PieChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis formatter={(value: number) => formatCurrency(value, selectedCurrency)} />
            <Tooltip formatter={currencyFormatter} />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" name="Amount" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartDisplay;
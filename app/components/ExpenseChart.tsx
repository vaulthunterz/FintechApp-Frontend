import React from 'react';
import GiftedExpenseChart from './charts/GiftedExpenseChart';

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, title, type, period }) => {

  return (
    <GiftedExpenseChart
      data={data}
      title={title}
      type={type}
      period={period}
    />
  );
};



export default ExpenseChart;

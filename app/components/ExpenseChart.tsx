import React from 'react';
import { ExpenseChart as PlatformExpenseChart, ExpenseData } from './charts';

interface ExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, title, type, period }) => {
  return (
    <PlatformExpenseChart
      data={data}
      title={title}
      type={type}
      period={period}
    />
  );
};

export default ExpenseChart;

/**
 * Utility functions for chart formatting
 */

export const formatCurrency = (value: number): string => {
  return `KES ${value.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatTooltipValue = (value: number, total?: number): string => {
  let tooltip = formatCurrency(value);
  if (total && total > 0) {
    const percentage = (value / total) * 100;
    tooltip += ` (${percentage.toFixed(1)}%)`;
  }
  return tooltip;
};

export const getAbbreviatedLabel = (label: string, maxLength: number = 12): string => {
  if (label.length <= maxLength) return label;
  return `${label.substring(0, maxLength - 3)}...`;
};

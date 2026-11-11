# Demo

This example shows how to create an accessible chart configuration for a line chart and then use the generated description and data table.

```javascript
import { buildChartConfig, describeChart, toDataTable } from '@trysac/accessible-chart-config';

const config = buildChartConfig({
  type: 'line',
  title: 'Revenue',
  xLabel: 'month',
  unit: 'USD',
  x: ['Jan', 'Feb', 'Mar'],
  series: [
    { name: 'North', values: [100, 120, 90] },
    { name: 'South', values: [80, 85, 95] },
  ],
});

console.log(config.ariaLabel);
console.log(describeChart(config));
console.log(toDataTable(config));
```

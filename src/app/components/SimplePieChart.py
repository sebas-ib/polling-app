
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const SimplePieChart = ({ labels, dataPoints }) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: '# of Votes',
        data: dataPoints,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',   // Red
          'rgba(255, 206, 86, 0.7)',   // Yellow
          'rgba(54, 162, 235, 0.7)',   // Blue
          'rgba(75, 192, 192, 0.7)',   // Green
          'rgba(153, 102, 255, 0.7)',  // Purple
          'rgba(255, 180, 100, 0.7)',  // Orange
        ],
        borderWidth: 1,
      },
    ],
  };

  return <Pie data={data} />;
};

export default SimplePieChart;

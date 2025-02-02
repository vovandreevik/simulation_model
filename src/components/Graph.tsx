import React from "react";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  CategoryScale,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Регистрация необходимых компонентов Chart.js
ChartJS.register(
  Tooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  CategoryScale
);

interface GraphProps {
  labels: string[];
  data: number[];
  title: string;
}

const Graph: React.FC<GraphProps> = ({ labels, data, title }) => {
  const lineData = {
    labels, // Метки по оси X
    datasets: [
      {
        label: title,
        data, // Данные (значения Y)
        borderColor: "rgba(75, 192, 192, 1)", // Цвет линии
        backgroundColor: "rgba(75, 192, 192, 0.2)", // Цвет точек
        fill: false, // Оставляем только линии без заливки
        tension: 0.2, // Кривизна линии (0 — жёсткие линии, >0 — сглаживание)
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Позиция",
        },
      },
      y: {
        title: {
          display: true,
          text: "Значение",
        },
      },
    },
  };

  return <Line data={lineData} options={options} />;
};

export default Graph;

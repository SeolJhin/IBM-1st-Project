import React from "react"
import { PolarArea } from "react-chartjs-2"
import getChartColorsArray from "../../../components/Common/ChartsDynamicColor";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const PolarChart = ({ dataColors }) => {
  var polarAreaChartColors = getChartColorsArray(dataColors);
  const data = {
    datasets: [
      {
        data: [11, 16, 7, 18],
        backgroundColor: polarAreaChartColors,
        label: "My dataset", // for legend
        hoverBorderColor: "#fff",
      },
    ],
    labels: ["Series 1", "Series 2", "Series 3", "Series 4"],
  }

  return <PolarArea width={715} height={300} data={data} className="mx-auto chartjs-render-monitor" />
}

export default PolarChart;
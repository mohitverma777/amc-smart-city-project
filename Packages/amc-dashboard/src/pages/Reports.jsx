import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  const [department, setDepartment] = useState("All");
  const [chartData, setChartData] = useState({});
  const reportRef = useRef();

  // Fetch simulated data
  useEffect(() => {
    const fetchData = () => {
      const allDepartments = [
        "Waste Management",
        "Traffic",
        "Utilities",
        "Complaints",
      ];

      const dates =
        dateRange === "7d"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : dateRange === "30d"
          ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

      const randomData = () =>
        dates.map(() => Math.floor(Math.random() * 100) + 20);

      let filteredDepartments =
        department === "All" ? allDepartments : [department];

      setChartData({
        dates,
        departmentBreakdown: filteredDepartments.map((dep) => ({
          name: dep,
          data: randomData(),
        })),
        categoryCounts: allDepartments.map((dep) => ({
          label: dep,
          count: Math.floor(Math.random() * 500) + 100,
        })),
      });
    };

    fetchData();
  }, [dateRange, department]);

  // Download PDF
  const downloadPDF = async () => {
    const input = reportRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`AMC_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!chartData.dates) return null;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="6m">Last 6 Months</option>
        </select>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="All">All Departments</option>
          <option value="Waste Management">Waste Management</option>
          <option value="Traffic">Traffic</option>
          <option value="Utilities">Utilities</option>
          <option value="Complaints">Complaints</option>
        </select>

        <button
          onClick={downloadPDF}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Download Report
        </button>
      </div>

      {/* Report Content */}
      <div ref={reportRef}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-[#1f1f23] p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Department Trends</h2>
            <Bar
              data={{
                labels: chartData.dates,
                datasets: chartData.departmentBreakdown.map((dep, idx) => ({
                  label: dep.name,
                  data: dep.data,
                  backgroundColor: `hsl(${idx * 90}, 70%, 50%)`,
                })),
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          {/* Line Chart */}
          <div className="bg-[#1f1f23] p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Overall Trends</h2>
            <Line
              data={{
                labels: chartData.dates,
                datasets: [
                  {
                    label: "Total Cases",
                    data: chartData.dates.map((_, i) =>
                      chartData.departmentBreakdown.reduce(
                        (sum, dep) => sum + dep.data[i],
                        0
                      )
                    ),
                    borderColor: "rgba(75,192,192,1)",
                    backgroundColor: "rgba(75,192,192,0.2)",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          {/* Doughnut Chart */}
          <div className="bg-[#1f1f23] p-4 rounded-lg shadow-lg col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Category Breakdown</h2>
            <Doughnut
              data={{
                labels: chartData.categoryCounts.map((c) => c.label),
                datasets: [
                  {
                    label: "Cases",
                    data: chartData.categoryCounts.map((c) => c.count),
                    backgroundColor: [
                      "#4cafef",
                      "#ff9800",
                      "#8bc34a",
                      "#f44336",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

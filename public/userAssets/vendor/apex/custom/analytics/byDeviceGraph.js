var options = {
  chart: {
    height: 310,
    type: 'donut',
  },
  labels: ['Desktop', 'Tablet', 'Mobile'],
  series: [60000, 45000, 15000],
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 8,
    colors: ['#ffffff'],
  },
  colors: ['#e02539', '#3c3c3c', '#585858', '#a2a2a2', '#dcdcdc'],
  tooltip: {
    y: {
      formatter: function(val) {
        return  "$" + val
      }
    }
  },
}
var chart = new ApexCharts(
  document.querySelector("#byDevice"),
  options
);
chart.render();
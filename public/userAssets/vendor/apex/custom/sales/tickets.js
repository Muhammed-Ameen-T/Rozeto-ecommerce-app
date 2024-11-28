var options = {
  chart: {
    height: 232,
    type: 'donut',
  },
  labels: ['New', 'Resolved', 'Pending'],
  series: [60000, 45000, 15000],
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 2,
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
  document.querySelector("#tickets"),
  options
);
chart.render();
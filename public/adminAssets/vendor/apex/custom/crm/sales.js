var options = {
  chart: {
    height: 228,
    type: 'bar',
    stacked: true,
    toolbar: {
      show: false
    },
    zoom: {
      enabled: true
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
    },
  },
  dataLabels: {
    enabled: true
  },
  series: [{
    name: 'Orders',
    data: [10, 15, 25, 35, 45, 55, 65]
  },{
    name: 'Revenue',
    data: [15, 20, 30, 40, 50, 60, 70]
  }],
  xaxis: {
    categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  legend: {
    position: 'bottom',
    offsetY: 0,
  },
  grid: {
    borderColor: '#e0e6ed',
    strokeDashArray: 5,
    xaxis: {
      lines: {
        show: true
      }
    },   
    yaxis: {
      lines: {
        show: false,
      } 
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 10,
      left: 10
    }, 
  },
  yaxis: {
    show: false,
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return "$" + val + " thousands"
      }
    }
  },
  colors: ['#e02539', '#3c3c3c'],
}
var chart = new ApexCharts(
  document.querySelector("#sales"),
  options
);
chart.render();



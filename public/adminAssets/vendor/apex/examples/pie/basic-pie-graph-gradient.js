var options = {
	chart: {
		width: 400,
		type: 'pie',
	},
	labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
	series: [20, 20, 20, 20, 20],
	responsive: [{
		breakpoint: 480,
		options: {
			chart: {
				width: 200
			},
			legend: {
				position: 'bottom'
			}
		}
	}],
	stroke: {
		width: 0,
	},
	fill: {
		type: 'gradient',
	},
	colors: ['#e02539', '#3c3c3c', '#585858', '#a2a2a2', '#dcdcdc'],
}
var chart = new ApexCharts(
	document.querySelector("#basic-pie-graph-gradient"),
	options
);
chart.render();
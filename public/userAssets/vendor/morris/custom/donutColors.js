// Morris Donut
Morris.Donut({
	element: 'donutColors',
	data: [
		{value: 30, label: 'foo'},
		{value: 15, label: 'bar'},
		{value: 10, label: 'baz'},
		{value: 5, label: 'A really really long label'}
	],
	backgroundColor: '#ffffff',
	labelColor: '#13202b',
	colors:['#e02539', '#3c3c3c', '#585858', '#a2a2a2', '#dcdcdc'],
	resize: true,
	hideHover: "auto",
	gridLineColor: "#e4e6f2",
	formatter: function (x) { return x + "%"}
});
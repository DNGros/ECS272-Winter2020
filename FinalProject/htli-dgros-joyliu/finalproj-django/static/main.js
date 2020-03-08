(function () {
    jQuery.ajax({
        method: "GET",
        url: "get_scatter_points/",
        success: function (data) {
            console.log(data);
            drawClusters(data);
        }
    })
})()

//dimensions for scatter plot

var width = 500;
var height = 500;
var margin = { left: 60, right: 60, top: 30, bottom: 60 }

var svg1 = d3.select('#scatter')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

console.log(svg1);
function drawClusters(data) {
    var lineg = svg1.append('g')
        .attr("transform", "translate(" + "0,0 " + ")");
    var dotg = svg1.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    var centerg = svg1.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    //get data

    dots = [];

    for (i = 0; i < data.x.length; i++) {
        var dot = {
            x: data.x[i],
            y: data.y[i],
            c: data.c[i],
            lvl: data.lvl[i]
        };
        dots.push(dot);
    }
    console.log(dots);
    //draw 
    var x = d3.scaleLinear()
        .domain([d3.min(dots, d => d.x), d3.max(dots, d => d.x)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(dots, d => d.y), d3.max(dots, d => d.y)])
        .range([height, 0]);
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>x:</strong> <span style='color:red'>" + d.x + "</span><br><strong>y:</strong> <span style='color:red'>" + d.y + "</span>";
        })
    svg1.append("g")
        .attr("transform", "translate(60," + (height + 50) + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr('y', -10)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("x");

    svg1.append("g")
        .attr("transform", "translate(10" + ",40)")
        .call(d3.axisRight(y))
        .append("text")
        .attr("fill", "#000")
        .attr("x", 0)
        .attr("y", -5)
        .text("y")
        .attr("text-anchor", "start");

    var colors = d3.scaleLinear()
        .domain([0, d3.max(data.c)])
        .range(d3.schemeCategory10);

    var scatterPlot = dotg.selectAll('circle')
        .data(dots)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr("r", 5)
        .attr('opacity', 0.5)
        .attr("fill", "orange")
        .on("mouseover", tip.show)
        .on("mouseleave", tip.hide);
    dotg.call(tip);

    console.log(scatterPlot);

    

    // dotg.call(tip);
}

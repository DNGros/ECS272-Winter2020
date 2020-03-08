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
    var xAxis = d3.axisBottom(x);

    var gX = svg1.append("g")
        .attr("transform", "translate(60," + (height + 50) + ")")
        .call(xAxis)
        .append("text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr('y', -10)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("x");

    var yAxis = d3.axisRight(y);

    var gY = svg1.append("g")
        .attr("transform", "translate(10" + ",40)")
        .call(yAxis)
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
        .filter(function (d) { return d.lvl == 1 })
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

    //zooming

    var zoom = d3.zoom()
        .scaleExtent([1, 3])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg1.call(zoom);

    function zoomed() {
        var level = d3.event.transform.k;
        newdata = dots.filter(function (e) {
            return e.lvl <= level;
        })
        console.log(level);
        console.log(newdata);
        scatterPlot =
            dotg
                .selectAll("circle")
                .data(newdata)
                .enter()
                .append('circle')
                .attr("cx", d => x(d.x))
                .attr("cy", d => y(d.y))
                .attr("fill", "blue")
                .attr("r", 5)
                .attr('opacity', 0.5)
                .on("mouseover", tip.show)
                .on("mouseleave", tip.hide);

        d3.selectAll('circle')
            .data(newdata)
            .exit().remove();

        s = d3.selectAll("circle");
        console.log(s);

        dotg.attr("transform", d3.event.transform);
        //console.log(d3.event.transform);
        //TODO: rescaling axes
        gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
    }

    //zooming ends
    // dotg.call(tip);
}

//update scatter plot on zoom
function updateHist(level) {
    var width = 500;
    var height = 500;
    var margin = { left: 60, right: 60, top: 30, bottom: 60 }

    var svg = d3.select("#scatter svg");
    var x = d3.scaleLinear()
        .domain([d3.min(newdata), d3.max(newdata)])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);

    // set the parameters for the histogram
    var histogram = d3.histogram()
        //.value(data.x)   // I need to give the vector of value
        .domain(hx.domain())  // then the domain of the graphic
        .thresholds(hx.ticks(40)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(newdata);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0]);
    y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    var colors = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) { return d.length; })])
        .range([d3.rgb("steelblue").brighter(), d3.rgb("steelblue").darker()]);

    // append the bar rectangles to the svg element
    svg
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .transition()
        .duration(750)
        .attr("x", d => hx(d.x0) + 1)
        .attr("width", d => Math.max(0, hx(d.x1) - hx(d.x0) - 1))
        .attr("y", d => hy(d.length))
        .attr("fill", d => colors(d.length))
        .attr("height", d => hy(0) - hy(d.length));
}

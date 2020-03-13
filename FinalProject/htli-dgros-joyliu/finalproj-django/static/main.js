(function () {
    jQuery.ajax({
        method: "GET",
        url: "get_scatter_points/",
        success: function (data) {
            console.log(data);
            mainScatter(data);
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
function mainScatter(data) {
    var dotg = svg1.append('g')
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
    //console.log(dots);
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

    //console.log(scatterPlot);

    //views for different classes
    var c = Array.from(new Set(data.c));
    for (i = 0; i < c.length; i++) {
        var data = dots.filter(function (el) {
            return el.c == c[i];
        });
        drawScatter(data);
    }
    //zooming

    var zoom = d3.zoom()
        .scaleExtent([1, 3])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    //svg1.call(zoom);
    $("#zoom").on('click', function () {
        svg1.call(zoom);
    })
    function zoomed() {
        var level = d3.event.transform.k;
        newdata = dots.filter(function (e) {
            return e.lvl <= level;
        })
        //console.log(level);
        //console.log(newdata);
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
        //console.log(s);

        dotg.attr("transform", d3.event.transform);
        //console.log(d3.event.transform);
        //TODO: rescaling axes
        gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
    }

    //zooming ends
    // dotg.call(tip);

    //lasso selection

    var lasso_start = function () {
        console.log('start')
        lasso.items()
            .attr("r", 5)
            .classed("not_possible", true)
            .classed("selected", false);
    };

    var lasso_draw = function () {
        console.log('draw')
        lasso.possibleItems()
            .classed("not_possible", false)
            .classed("possible", true);
        lasso.notPossibleItems()
            .classed("not_possible", true)
            .classed("possible", false);
    };

    var lasso_end = function () {
        console.log('end')
        lasso.items()
            .classed("not_possible", false)
            .classed("possible", false);
        lasso.selectedItems()
            .classed("selected", true)
            //.attr('fill', 'orange')
            .attr("r", 8);
        s = lasso.selectedItems();
        console.log(s._groups[0].length);
        if (s._groups[0].length == 0) {
            lasso.items()
                .attr('fill', 'orange');
        } else {
            lasso.notSelectedItems()
                .attr('fill', 'white')
                .attr("r", 5);
        }
    };
    //console.log(circles[0]);
    var s = dotg.selectAll('circle');
    const lasso = d3.lasso()
        .closePathDistance(305)
        .closePathSelect(true)
        .targetArea(svg1)
        .items(s)
        .on("start", lasso_start)
        .on("draw", lasso_draw)
        .on("end", lasso_end);
    console.log(lasso);
    $("#lasso").on('click', function () {
        svg1.call(lasso);
    })
}

function drawScatter(dots) {
    var width = 200;
var height = 200;
var margin = { left: 60, right: 60, top: 30, bottom: 60 }

    var svg2 = d3.select('#classes')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

    var dotg = svg2.append('g')
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([d3.min(dots, d => d.x), d3.max(dots, d => d.x)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(dots, d => d.y), d3.max(dots, d => d.y)])
        .range([height, 0]);
    
    var xAxis = d3.axisBottom(x);

    var gX = svg2.append("g")
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

    var gY = svg2.append("g")
        .attr("transform", "translate(10" + ",40)")
        .call(yAxis)
        .append("text")
        .attr("fill", "#000")
        .attr("x", 0)
        .attr("y", -5)
        .text("y")
        .attr("text-anchor", "start");

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
        .attr("fill", "orange");

        dotg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .attr('fill', 'black')
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Class " + dots[0].c);
}


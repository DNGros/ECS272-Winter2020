
(function () {
    jQuery.ajax({
        method: "GET",
        url: "get_scatter_points/",
        success: function (d) {
            console.log(d);
            mainScatter(d);
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
            clr: data.clr[i],
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
        .attr("fill", d => d.clr)
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

        dotg.selectAll('circle')
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
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("class", "scatter");

    var x = d3.scaleLinear()
        .domain([d3.min(dots, d => d.x), d3.max(dots, d => d.x)])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([d3.min(dots, d => d.y), d3.max(dots, d => d.y)])
        .range([height, 0]);

    console.log(x.domain()[0] + " " + x.domain()[1]);
    var scatterPlot = dotg.selectAll('circle')
        .data(dots)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr("data-clr", d => d.clr)
        .attr("r", 5)
        .attr('opacity', 0.5)
        .classed("x_selected", true)
        .classed("y_selected", true)
        .attr("fill", d => d.clr)


    dotg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .attr('fill', 'black')
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Class " + dots[0].c);

    //histogram



    drawHist(dots, svg2, "x");
    drawHist(dots, svg2, "y");
}


function updateScatter(dots, data, svg) {
    var width = 200;
    var height = 200;
    var margin = { left: 60, right: 60, top: 30, bottom: 60 }

    console.log(data);
    var dotg = svg.select("g.scatter");
    var x = d3.scaleLinear()
        .domain([d3.min(dots, d => d.x), d3.max(dots, d => d.x)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(dots, d => d.y), d3.max(dots, d => d.y)])
        .range([height, 0]);
    //console.log(dotg.selectAll("circle"));

    var circles = dotg.selectAll("circle").data(data);
    console.log(x.domain()[0] + " " + x.domain()[1]);
    circles
        .enter()
        .append('circle')
        .attr("cx", function (d) { console.log(x(d.x)); return x(d.x); })
        .attr("cy", d => y(d.y))
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr("fill", d => d.clr)
        .attr("r", 5)
        .attr('opacity', 0.5);
    // console.log(dotg.selectAll("circle"));

    circles
        .exit().remove();
    console.log(dotg.selectAll("circle"));
}

function drawHist(dots, svg, or) {
    var width = 200;
    var height = 50;
    var margin = { left: 60, right: 60, top: 30, bottom: 60 }

    var totalHeight = 250 + margin.top;
    var data = [];
    if (or == "x") {
        dots.forEach(e => data.push(e.x));
    } else {
        dots.forEach(e => data.push(e.y));
        //data = data.reverse();
    }

    var x = d3.scaleLinear()
    // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
       if(or == "x") { 
        x.domain([d3.min(data), d3.max(data)])
        .range([0, width]);
       } else {
           x        
           .domain([d3.min(data), d3.max(data)]) 
           .range([0,width]);
       }



    // set the parameters for the histogram
    var histogram = d3.histogram()
        //.value(data.x)   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(40)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(data);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

    var colors = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) { return d.length; })])
        .range([d3.rgb("steelblue").brighter(), d3.rgb("steelblue").darker()]);

    // append the bar rectangles to the svg element
    var bar = svg.append("g");
    if (or == "x") {
        bar.attr("transform", "translate(50,240)");
    } else {
        bar
            .attr("transform", "translate(0,240) rotate(-90) ");
    }

    bar.selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("class", "rect")
        .attr("fill", d => colors(d.length))
        .attr("x", d => x(d.x0) + 1)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("y", d => y(d.length))
        .attr("height", d => y(0) - y(d.length))

    const brush = d3.brushX()
        .extent([[0, 0], [width, 50]])
        .on("brush", brushed)
        .on("end", brushended);

    const defaultSelection = [x.range()[0], x.range()[1]];

    const gb = bar
        .call(brush)
        .call(brush.move, defaultSelection);

    function brushed() {
        if (d3.event.selection) {
            svg.property("value", d3.event.selection.map(x.invert, x));
            svg.dispatch("input");

            const [x0, x1] = d3.event.selection;
            console.log(svg.select("g.scatter").selectAll("circle"));
            var notselected;
            if (or == "x") {
                var selected = svg.select("g.scatter").selectAll("circle.y_selected");
                //var notselected = svg.select("g.scatter").selectAll("circle.not_selected");
                selected.each(function (d, i) {
                    //console.log(d.className.baseVal);
                    if (d.x >= x.invert(x0) && d.x <= x.invert(x1)) {
                        d3.select(this)
                            //.classed("selected", true)
                            .classed("x_selected", true)
                            .attr("fill", d.clr);
                    } else {
                        d3.select(this)
                          .classed("x_selected", false)
                          .attr("fill", "grey");
                    }
                });



            } else {
                var color;
                var selected = svg.select("g.scatter").selectAll("circle.x_selected");
                //var notselected = svg.select("g.scatter").selectAll("circle.not_selected");
                selected.each(function (d, i) {
                    color = d.clr;
                    //console.log(d.className.baseVal);
                    if (d.y >= x.invert(x0) && d.y <= x.invert(x1)) {
                        d3.select(this)
                            //.classed("selected", true)
                            .classed("y_selected", true)
                            .attr("fill", d.clr);
                    } else {
                        d3.select(this)
                          .classed("y_selected", false)
                          .attr("fill", 'grey');
                    }
                });
            }
            console.log(x.invert(x0) + " " + x.invert(x1));
            console.log(notselected);
            console.log(dots);
            //updateScatter(dots, newdata, svg);
            //notselected.attr("fill", "grey");
        }
    }

    function brushended() {
        if (!d3.event.selection) {
            gb.call(brush.move, defaultSelection);
            //updateScatter(dots, dots, svg);
            //svg.selectAll("circle")
                //.classed("selected", true);

        }
    }
}
/**    const brush = d3.brushX()
        .extent([[margin.left, 0.5], [width - margin.right, 50 - margin.bottom + 0.5]])
        .on("brush", brushed)
        .on("end", brushended);

    const defaultSelection = [x(d3.utcYear.offset(x.domain()[1], -1)), x.range()[1]];

    svg2.append("g")
        .call(xAxis, x, focusHeight);

    svg.append("path")
        .datum(data)
        .attr("fill", "steelblue")
        .attr("d", area(x, y.copy().range([focusHeight - margin.bottom, 4])));

    const gb = svg.append("g")
        .call(brush)
        .call(brush.move, defaultSelection);

    function brushed() {
        if (d3.event.selection) {
            svg.property("value", d3.event.selection.map(x.invert, x).map(d3.utcDay.round));
            svg.dispatch("input");
        }
    }

    function brushended() {
        if (!d3.event.selection) {
            gb.call(brush.move, defaultSelection);
        }
    } */
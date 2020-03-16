
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
var margin = { left: 60, right: 20, top: 20, bottom: 60 };
var defaultRadius = 0.05;
var mainOpacity = 1;
//var radiusStepdown = defaultRadius / (0.1 / 2);

var svg1 = d3.select('#scatter')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    ;

var dotg = svg1.append("g")
    .attr("class", "dots");
    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

console.log(svg1);
var mx;
var my;
dots = [];
origDots = [];

function scaleRadius(r) {
    let axisDif = mx(1) - mx(0);
    console.log("SCALE RADIUS " + axisDif + " " + r);
    return r * axisDif;
}

function mainScatter(data) {

    //get data


    for (i = 0; i < data.x.length; i++) {
        var dot = {
            x: data.x[i],
            y: data.y[i],
            c: data.c[i],
            c_name: data.c_name[i],
            clr: data.clr[i],
            lvl: data.lvl[i]
        };
        dots.push(dot);
    }

    for (i = 0; i < data.orig_x.length; i++) {
        var dot = {

            x: data.orig_x[i],
            y: data.orig_y[i],
            c: data.orig_c[i],
            c_name: data.orig_c_name[i],
            clr: data.orig_clr[i]
        };
        origDots.push(dot);
    }
    console.log(origDots);
    //draw
    // The domain should be shared so that way radius is meaningful in both dims
    shared_domain = [d3.min(dots, d => Math.min(d.x, d.y)), d3.max(dots, d => Math.max(d.x, d.y))];
    mx = d3.scaleLinear()
        .domain(shared_domain)
        .range([0, width+margin.left+margin.right]);
    my = d3.scaleLinear()
        .domain(shared_domain)
        .range([height+margin.top+margin.bottom, 0]);
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>x:</strong> <span style='color:red'>" + d.x + "</span><br><strong>y:</strong> <span style='color:red'>" + d.y + "</span>";
        })
    var xAxis = d3.axisBottom(mx);
    var yAxis = d3.axisRight(my);

    var colors = d3.scaleLinear()
        .domain([0, d3.max(data.c)])
        .range(d3.schemeCategory10);

    var scatterPlot = dotg.selectAll('circle')
        .data(dots)
        .enter()
        .append('circle')
        .filter(function (d) { return d.lvl == 1 })
        .attr('cx', d => mx(d.x))
        .attr('cy', d => my(d.y))
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr("class", "show")
        .attr("id", d => d.c)
        .attr("r", scaleRadius(defaultRadius))
        .attr('opacity', mainOpacity)
        .attr("fill", d => d.clr);
    //dotg.call(tip);

    console.log(scatterPlot);
    // x axis
    var gX = svg1.append("g")
        .attr("transform", "translate(0," + (height+margin.bottom) + ")")
        .call(xAxis)
        .attr("class", "xAxis")
        .append("text")
        .attr("fill", "#000")
        .attr("x", width / 2)
        .attr('y', margin.bottom / 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("x");

    // y axis
    var gY = svg1.append("g")
        .call(yAxis)
        .attr("class", "yAxis")
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("x", - height / 2)
        .attr("y", - margin.left)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("y");

    //small views for different classes
    var c = Array.from(new Set(data.orig_c));
    for (i = 0; i < c.length; i++) {
        var data = origDots.filter(function (el) {
            return el.c == c[i];
        });
        drawScatter(data);
    }

    //point size slider

    d3.select("input[type=range]#pointsize").on("input", function () {
        var size = this.value;
        d3.select("output#pointsize").text(size);
        dotg.selectAll("circle.show").attr("r", scaleRadius(size));
        console.log(dotg.selectAll("circle"));
    });

    //zooming

    var zoom = d3.zoom()
        .scaleExtent([1, 4])
        //.translateExtent([[0,0], [width-margin.left, height-margin.top]])
        .on("zoom", zoomed);

    //svg1.call(zoom);
    $("#zoom").on('click', function () {
        svg1.on(".dragstart", null);
        svg1.on(".drag", null);
        svg1.on(".dragend", null);
        svg1.call(zoom);
        var transform = d3.zoomIdentity
            .translate(margin.left, margin.top)
            .scale(1);
        //dotg.call(zoom.transform, transform);
    })
    function zoomed() {
        var level = d3.event.transform.k;
        newdata = dots.filter(function (e) {
            return e.lvl <= level;
        })
        //console.log(level);
        //console.log(newdata);
        /* scatterPlot =
             svg1.select(".dots").selectAll("circle")
                 .data(newdata);
                 scatterPlot
                 .join('circle')
                 .attr("cx", d => mx(d.x))
                 .attr("cy", d => my(d.y))
                 .attr("fill", d => d.clr)
                 .attr("class", "show")
                 .attr("id", d => d.c)
                 .attr("r", parseInt(document.getElementsByTagName("output")[0].value))
                 .attr('opacity', 0.5);
 
                 svg1.select(".dots").selectAll("circle")
             .data(newdata)
             .exit().remove();
 */

        for (i = 0; i < c.length; i++) {
            updateScatter(svg1.select(".dots").selectAll("circle[id='" + c + "']"), c);
        }
        
        console.log(svg1.select(".dots").selectAll("circle"));
        svg1.select(".dots").selectAll("circle")
        .attr("r", 5/level);
        //console.log(s);

        svg1.select(".dots").attr("transform", d3.event.transform);
        //console.log(d3.event.transform);
        //TODO: rescaling axes
        svg1.select(".xAxis").call(xAxis.scale(d3.event.transform.rescaleX(mx)));
        //.attr("transform", "translate(60," + (height + 50) + ")");
        svg1.select(".yAxis").call(yAxis.scale(d3.event.transform.rescaleY(my)));
        //.attr("transform", "translate(10" + ",40)");
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
            .attr('fill', d => d.clr)
            .attr("r", 8);
        s = lasso.selectedItems();
        console.log(s._groups[0].length);
        if (s._groups[0].length == 0) {
            lasso.items()
                .attr('fill', d => d.clr);
        } else {
            lasso.notSelectedItems()
                .attr('fill', 'white')
                .attr("r", 5);
        }
    };
    //console.log(circles[0]);
    var s = svg1.selectAll('circle');
    const lasso = d3.lasso()
        .closePathDistance(305)
        .closePathSelect(true)
        .targetArea(svg1)
        .items(s)
        .on("start", lasso_start)
        .on("draw", lasso_draw)
        .on("end", lasso_end);

    $("#lasso").on('click', function () {
        svg1.on(".zoom", null);
        svg1.call(lasso);
    })

}


function updateScatter(selection, c) {

    console.log(selection);
    xs = [];
    selection.each(d => xs.push(d.x));

    ys = [];
    selection.each(d => ys.push(d.y));

    x0 = d3.min(xs);
    x1 = d3.max(xs);
    y0 = d3.min(ys);
    y1 = d3.max(ys);

    var newdata = [];
    var level;
    if (d3.event.transform) {
        level = d3.event.transform.k;
    } else {
        level = 1;
    }

    newdata = dots.filter(e => e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1 && e.lvl <= level && e.c == c);


    var update = svg1.select(".dots").selectAll("circle[id='" + c + "']")
        .data(newdata);

    update
        .join('circle')
        .attr("class", "show")
        .attr("cx", d => mx(d.x))
        .attr("cy", d => my(d.y))
        .attr("fill", d => d.clr)
        .attr("id", d => d.c)
        .attr("r", 5 / level)
        .attr('opacity', mainOpacity);

        //update.exit().remove();
    console.log(newdata);
}


function drawScatter(origDots) {
    var width = 200;
    var height = 200;
    var margin = { left: 60, right: 60, top: 30, bottom: 60 }

    var svg2 = d3.select('#classes')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class", origDots[0].c);

    var dotg = svg2.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("class", "scatter");

    var x = d3.scaleLinear()
        .domain([d3.min(origDots, d => d.x), d3.max(origDots, d => d.x)])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([d3.min(origDots, d => d.y), d3.max(origDots, d => d.y)])
        .range([height, 0]);

    console.log(x.domain()[0] + " " + x.domain()[1]);
    var scatterPlot = dotg.selectAll('circle')
        .data(origDots)
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
        .text(origDots[0].c_name);

    //histogram



    drawHist(origDots, svg2, "x");
    drawHist(origDots, svg2, "y");
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
    if (or == "x") {
        x.domain([d3.min(data), d3.max(data)])
            .range([0, width]);
    } else {
        x
            .domain([d3.min(data), d3.max(data)])
            .range([0, width]);
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

    const defaultSelection = [50, 150];

    const gb = bar
        .call(brush)
        .call(brush.move, defaultSelection);

    function brushed() {
        if (d3.event.selection) {
            svg.property("value", d3.event.selection.map(x.invert, x));
            svg.dispatch("input");

            const [x0, x1] = d3.event.selection;
            console.log(svg.select("g.scatter").selectAll("circle"));

            if (or == "x") {
                var selected = svg.select("g.scatter").selectAll("circle.y_selected");
                //var notselected = svg.select("g.scatter").selectAll("circle.not_selected");
                selected.each(function (d, i) {
                    c = d.c;
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

                updateScatter(svg.select("g.scatter").selectAll("circle.x_selected.y_selected"), svg.attr("class"));

            } else {
                var selected = svg.select("g.scatter").selectAll("circle.x_selected");
                //var notselected = svg.select("g.scatter").selectAll("circle.not_selected");
                selected.each(function (d, i) {
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

                updateScatter(svg.select("g.scatter").selectAll("circle.x_selected.y_selected"), svg.attr("class"));
            }
            console.log(x.invert(x0) + " " + x.invert(x1));
            //console.log(notselected);
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
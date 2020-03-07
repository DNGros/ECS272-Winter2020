(function () {
    jQuery.ajax({
        method: "GET",
        url: "get_scatter_points/",
        success: function (data) {
            console.log("got data");
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

function drawClusters(data) {
    var lineg = svg1.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    var dotg = svg1.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    var centerg = svg1.append('g')
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    //get data

    console.log(data);

    K = data.K;
    groups = [];
    for (var i = 0; i < K; i++) {
        var attack = [], defense = [];
        for (j = 0; j < data.Attack.length; j++) {
            if (data.Cluster[j] === i) {
                attack.push(data.Attack[j]);
                defense.push(data.Defense[j]);
            }
        }
        //console.log(a);
        attack.sort((a, b) => a - b);
        defense.sort((a, b) => a - b);

        var g = {
            dots: [],
            color: 'hsl(' + (i * 360 / K) + ',100%,50%)',
            center: {
                x: attack[Math.floor(attack.length / 2)],
                y: defense[Math.floor(defense.length / 2)]
            },
            init: {
                center: {}
            }
        };
        g.init.center = {
            x: g.center.x,
            y: g.center.y
        };
        groups.push(g);

    }

    dots = [];
    flag = false;
    for (i = 0; i < data.Attack.length; i++) {
        var dot = {
            x: data.Attack[i],
            y: data.Defense[i],
            name: data.Name[i],
            speed: data.Speed[i],
            group: groups[data.Cluster[i]]
        };
        dots.push(dot);
    }
    console.log(dots);

    //draw 
    var x = d3.scaleLinear()
        .domain([0, d3.max(data.Attack)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([0, d3.max(data.Defense)])
        .range([height, 0]);
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>Name:</strong> <span style='color:red'>" + d.name + "</span><br><strong>Attack:</strong> <span style='color:red'>" + d.x + "</span><br><strong>Defense:</strong> <span style='color:red'>" + d.y + "</span><br><strong>Speed:</strong> <span style='color:red'>" + d.speed + "</span>";
        })
        svg1.append("g")
        .attr("transform", "translate(60," + (height+50)  + ")")
        .call(d3.axisBottom(x))                
        .append("text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr('y', -10)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Attack");

        svg1.append("g")
        .attr("transform", "translate(10"  + ",40)")
        .call(d3.axisRight(y))
        .append("text")
        .attr("fill", "#000")
        .attr("x", 0)
        .attr("y", -5)
        .text("Defense")
        .attr("text-anchor", "start");

    var circles = dotg.selectAll('circle')
        .data(dots)
        .enter()
        .append('circle')
        .attr('cx', function (d) { return x(d.x); })
        .attr('cy', function (d) { return y(d.y); })
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr('data-speed', d => d.speed)
        .attr('class', 'circle')
        .attr('fill', function (d) { return d.group.color; })
        .attr('opacity', 0.5)
        .attr('r', 5)
        .on("mouseover", tip.show)
        .on("mouseleave", tip.hide);
    dotg.call(tip);

    var c = centerg.selectAll('path')
        .data(groups);
    var updateCenters = function (centers) {
        centers
            .attr('transform', function (d) { return "translate(" + x(d.center.x) + "," + y(d.center.y) + ") rotate(45)"; })
            .attr('fill', function (d, i) { return d.color; })
            .attr('stroke', '#aabbcc');
    };
    c.exit().remove();
    updateCenters(c.enter()
        .append('path')
        .attr('d', d3.symbol().type(d3.symbolCross))
        .attr('stroke', '#aabbcc'));
    updateCenters(c
        .transition()
        .duration(500));

}

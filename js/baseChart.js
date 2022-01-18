class BaseChart {
    constructor(parentElementID) {
        this.parentElementID = parentElementID;
    }

    initVis (){
        let vis = this;
        vis.margin = {top: 100, right: 40, bottom: 40, left: 40};

        vis.width = $('#' + vis.parentElementID).width() - vis.margin.left - vis.margin.right;
        vis.height = $('#' + vis.parentElementID).height() - vis.margin.top - vis.margin.bottom;
        vis.tickValues = [5,10,50,100,500,1000];

        vis.svg = d3.select("#" + vis.parentElementID).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right + 40)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .style("border", "black solid 0px")
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append('defs')
            .append('marker')
            .attr('id', 'arrowhead-right')
            .attr('refX', 5)
            .attr('refY', 5)
            .attr('markerWidth', 16)
            .attr('markerHeight', 13)
            .append('path')
            .attr('d', 'M 0 0 L 5 5 L 0 10')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('fill', 'none');


        vis.tooltip = d3.select("#" + vis.parentElementID)
            .append("div")
            .attr("class", "tooltip tooltip-style");

        // set up mouse events
        vis.mouseover = function(event, d) {
            vis.tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        vis.mousemove = function(event, d) {
            vis.tooltip
                .html(d.reference)
                .style("left", (event.x + 10) + "px")
                .style("top", (event.y) + "px")
        }
        vis.mouseleave = function(event, d) {
            vis.tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

        vis.yScale = d3.scaleBand()
            .range([vis.height, 0])
            .paddingInner(0.1);

        vis.xScale = d3.scaleLog()
            .range([0, vis.width*0.98])
            .domain([vis.tickValues[0], vis.tickValues[vis.tickValues.length-1]]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale).tickFormat("");
        
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)
            .tickValues(vis.tickValues)
            .tickFormat(d3.format("d"));

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis");

        //vis.yAxisGroup = vis.svg.append("g")
        //    .attr("class", "y-axis axis");

        vis.shapeSizeCof = 0.4;
        vis.shapeMarginCof = 0.2;
        vis.shapes = [
            d3.symbol().type(d3.symbolSquare),
            d3.symbol().type(d3.symbolCircle),
            d3.symbol().type(d3.symbolCross)
        ]
        vis.shapesAreaNormFunCof = [
            1, 1, 5.0 / 9.0
        ]
        vis.legendMaginCof = 8;
        vis.legendYOffsetCof = 1.5;
    }

    updateVis(chartData) {
        let vis = this;
        let data = chartData;
        vis.chartData = chartData;

        // draw x and y axis
        vis.yScale.domain(data.map( d => d.neuron));
        //vis.xScale.domain([0, d3.max(data, d => d.size)]).nice();

        vis.svg.select(".x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis);

        vis.svg.select(".y-axis")
            .call(vis.yAxis);

        // fine tune axis, adding arrow head to the end, and add a text label to indicate axis
        let xAxisSvg = vis.svg.select('.x-axis path.domain')
            .attr('marker-end', 'url(#arrowhead-right)');
        let tmpD = xAxisSvg.attr("d");
        xAxisSvg.attr("d", tmpD.substring(0, tmpD.length - 2));

        vis.svg.select(".x-label").remove();
        vis.svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "end")
            .attr("x", vis.width)
            .attr("y", vis.height - 6)
            .text("Side length (um)");


        // add text to the correct positions of the chart
        let neurons = vis.svg.selectAll(".neuron")
            .data(data);

        let neuronGroups = neurons.enter()
            .append("g")
            .merge(neurons)
            .attr("class", d => "neuron g-" + d.neuron);

        neurons.exit().remove();

        neuronGroups.select(".neuron-text").remove();
        neuronGroups.append("text")
            .attr("class", "neuron-text")
            .attr("text-anchor", "middle")
            .attr("x", d => vis.xScale(d.size))
            .attr("y", d => vis.yScale(d.neuron))
            .text(d => d.neuron)
            .on("mouseover", vis.mouseover)
            .on("mousemove", vis.mousemove)
            .on("mouseleave", vis.mouseleave)
            .on("click", (event, d) => {
                window.open(d.link, '_blank').focus();
            });


        // draw shapes under the texts
        let shapeSize = vis.yScale.bandwidth() * vis.shapeSizeCof;
        vis.shapes.forEach((e, i) => {
           e.size(shapeSize * shapeSize * vis.shapesAreaNormFunCof[i])
        });

        neuronGroups.selectAll(".neuron-types").remove();
        neuronGroups.append("g")
            .attr("class", "neuron-types")
            .selectAll(".neuron-shapes")
            .append("g")
            .data(d => d.types)
            .enter().append("path")
            .attr("d", (d, i) => {
                return vis.shapes[i]();
            })
            .attr("class", d => {return d})
            .attr("transform", (d, i) => {
                return "translate(" + shapeSize * (1 + vis.shapeMarginCof) * i + "," + 0 + ")";
            });

        neuronGroups.selectAll(".neuron-types")
            .attr("transform", (d, i, n) => {
               return "translate(" + (vis.xScale(d.size) - n[i].getBBox().width/2 + shapeSize / 2) + "," + (vis.yScale(d.neuron) + vis.yScale.bandwidth() * 0.3) + ")";
            });

        // add legend for shapes
        let uniqueTypes = new Set();
        chartData.forEach(e => {
            e.types.forEach(t => {
                uniqueTypes.add(t);
            });
        });
        let allTypes = [];
        for (let e of uniqueTypes){
            allTypes.push(e);
        }
        allTypes.sort((a, b) => {return a[0] - b[0]});

        vis.svg.selectAll(".legend").remove();
        let legendG = vis.svg.append("g")
            .attr("class", "legend")
            .selectAll(".legend-elements")
            .data(allTypes);

        // add legend labels
        legendG.enter().append("text")
            .text(d => d)
            .attr("class", d => d)
            .attr("text-anchor", "middle")
            .attr("transform", (d, i) => {
                return "translate(" + i * (shapeSize * vis.legendMaginCof) + "," + (shapeSize * vis.legendYOffsetCof) + ")";
            });

        // add legend shapes
        legendG.enter().append("path")
            .attr("d", (d, i) => {
                return vis.shapes[i]();
            })
            .attr("class", d => {return d})
            .attr("transform", (d, i) => {
                return "translate(" + i * (shapeSize * vis.legendMaginCof) + "," + 0 + ")";
            });

        // add legend underline
        legendG.enter().append("line")
            .style("stroke", "black")
            .attr("x1", -shapeSize*5)
            .attr("y1", shapeSize*2)
            .attr("x2", (allTypes.length-1) * (shapeSize * vis.legendMaginCof)+shapeSize*5)
            .attr("y2", shapeSize*2);

        // move legend to the center
        d3.select(".legend")
            .attr("transform", (d, i, n) => {
                return "translate(" + ((vis.width + vis.margin.left + vis.margin.right + 40)/2 - n[i].getBBox().width/2) + "," + (-n[i].getBBox().height - 10) + ")";
            });
    }
}

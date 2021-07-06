
window.onload = async function (){
    const chartData = await d3.csv("../data/benchmark.csv", (d) => {
        let types = d.type.split(";");
        types.sort((a, b) => {return a[0] - b[0]});

        return {
            neuron: d.neuron,
            types: types,
            height: parseInt(d.height),
            graph: parseInt(d.graph),
            size: parseFloat(d.size),
            reference: d.reference,
            link: d.link
        }
    });
    chartData.sort((a, b) => {return a.size - b.size});


    let chart = new BaseChart("vis");
    chart.initVis();

    d3.selectAll(".bt-text")
        .on("click", (e) => {
            d3.selectAll(".bt-text")
                .classed('clicked', false);
            let thisBt = d3.select("#" + e.currentTarget.id);
            thisBt.classed('clicked', true);

            let graphID = parseInt(e.currentTarget.id.slice(1, e.currentTarget.id.length));

            let graphData = chartData.filter(d => d.graph === graphID);
            chart.updateVis(graphData);

        });

    document.getElementById("b0").click();
}


data = fetch('../data/Adult_COVID_agg.json').then(response => response.json()).then(data => {
    console.log(data);
    return data;
});
// Map

const svg = d3.select("#map-container")
    .append("svg")
    .style("width", "100%")
    .style("height", "100%");

const color = d3.scaleLinear()
    .domain([40, 80])
    .range(["rgb(255, 255, 255)", "rgb(255, 0, 0)"])
    .clamp(true);

const proj = d3.geoAlbersUsa()
    .translate([450, 300])
    .scale(1000);

const path = d3.geoPath().projection(proj);

function createMap(us) {
    // Draw the states
    // state_estimates = data
    //     .filter(d => d['Geography'] === 'State')
    //     .map(d => [d['State'], d['Estimate']]);
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", d => color(data[d.properties.name] || 0))
        .style("opacity", 0.7);

    // Add state borders
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("d", path);
}


async function init() {
    const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
    createMap(us);
}


init(); 
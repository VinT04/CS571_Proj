import { showStateName } from './stateView.js';

const data = {
    'Alabama': 45, 'Alaska': 52, 'Arizona': 55, 'Arkansas': 48, 'California': 72,
    'Colorado': 65, 'Connecticut': 75, 'Delaware': 68, 'Florida': 60, 'Georgia': 50,
    'Hawaii': 78, 'Idaho': 45, 'Illinois': 65, 'Indiana': 52, 'Iowa': 58,
    'Kansas': 54, 'Kentucky': 52, 'Louisiana': 48, 'Maine': 70, 'Maryland': 72,
    'Massachusetts': 78, 'Michigan': 60, 'Minnesota': 68, 'Mississippi': 45, 'Missouri': 52,
    'Montana': 54, 'Nebraska': 58, 'Nevada': 58, 'New Hampshire': 72, 'New Jersey': 72,
    'New Mexico': 65, 'New York': 72, 'North Carolina': 58, 'North Dakota': 52, 'Ohio': 55,
    'Oklahoma': 48, 'Oregon': 68, 'Pennsylvania': 65, 'Rhode Island': 75, 'South Carolina': 52,
    'South Dakota': 52, 'Tennessee': 50, 'Texas': 55, 'Utah': 58, 'Vermont': 78,
    'Virginia': 68, 'Washington': 70, 'West Virginia': 48, 'Wisconsin': 62, 'Wyoming': 45
};

const container = d3.select("#map-container");

const color = d3.scaleLinear()
    .domain([40, 80])
    .range(["rgb(255, 255, 255)", "rgb(255, 0, 0)"])
    .clamp(true);

const proj = d3.geoAlbersUsa()
    .translate([450, 300])
    .scale(1000);

const path = d3.geoPath().projection(proj);

function createMap(us) {
    // Clear any existing content
    container.selectAll("*").remove();

    // Create new SVG
    const svg = container
        .append("svg")
        .attr("viewBox", "0 0 900 600")
        .style("width", "100%")
        .style("height", "100%");

    // Draw the states
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", d => color(data[d.properties.name] || 0))
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            showStateName(d.properties.name, container, () => {
                container.selectAll("*").remove();
                init();
            });
        });

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
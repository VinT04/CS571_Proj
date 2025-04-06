import { showStateName } from './stateView.js';
import { showStateGraph } from './stategraph.js';

const data = await fetch('../data/Adult_COVID.json').then(response => response.json());

const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
const container = d3.select("#map-container");

const color = d3.scaleLinear()
    .domain([60, 84, 100])
    .range(["rgb(255, 255, 255)", "rgb(0, 151, 118)"])
    .clamp(true);

const proj = d3.geoAlbersUsa()
    .translate([450, 300])
    .scale(1000);

const path = d3.geoPath().projection(proj);
const slider_to_date = new Map([
    [0, "September 1 - September 28"],
    [1, "September 29 - October 26"],
    [2, "October 27 - November 30"],
    [3, "December 1 - December 28"],
    [4, "December 29 - January 25"]
]);
const slider = document.getElementById('mySlider');

let default_time = slider_to_date.get(0);
slider.addEventListener("input", () => {
    default_time = slider_to_date.get(parseInt(slider.value));
    console.log(default_time);
    updateMap();
});

function getData() {
    return data
        .filter(d =>
            d['Group Category'] === 'All adults 18+ years' &&
            d['Time Period'] === default_time)
        .reduce((acc, curr) => {
            acc[curr.Geography] = curr['Estimate (%)'];
            return acc;
        }, {});
}


function createMap(us) {
    // Draw the states
    let state_estimates = getData();
    // console.log(state_estimates);

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
        .style("fill", d => color(state_estimates[d.properties.name] || 0))
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            showStateName(d.properties.name, container, () => {
                container.selectAll("*").remove();
                init();
            });
        })
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 4)
                .attr('size', 10);
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        });

    // Add state borders
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("d", path);
}

function updateMap() {
    let state_estimates = getData();
    console.log(state_estimates);
    svg.selectAll(".state")
        .style("fill", d => color(state_estimates[d.properties.name] || 0))
        .style("opacity", 0.7);
}

function init() {
    createMap(us);
}

init();
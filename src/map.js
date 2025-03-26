import { showStateName } from './stateView.js';
import './DetailView.js';

// Data for COVID and flu respectively
const data_covid = await fetch('../data/covid_data/Adult_COVID.json').then(response => response.json());
const data_flu = await fetch('../data/flu_data/Adult_Flu.json').then(response => response.json());


// Getting topology data for the svg, and getting the element where we will put the svg
const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
const container = d3.select("#map-container");

// Estblishing color scaling
let color = d3.scaleLinear()
    .domain([60, 84, 100])
    .range(["rgb(255, 255, 255)", "rgb(0, 151, 118)"])
    .clamp(true);

const proj = d3.geoAlbersUsa()
    .translate([450, 300])
    .scale(1000);

const path = d3.geoPath().projection(proj);

// Mapping slider values to time periods in the dataset
const slider_to_date = new Map([
    [0, "September 1 - September 28"],
    [1, "September 29 - October 26"],
    [2, "October 27 - November 30"],
    [3, "December 1 - December 28"],
    [4, "December 29 - January 25"]
]);

// Elements that will react to user input, and assign event listeners
const option_container = document.getElementById('option-container');
const slider = document.getElementById('mySlider');
const checkbox = document.getElementById('rsv-check');
const header = document.getElementById('header');
const button = document.getElementById('detail-button');

let default_time = slider_to_date.get(0);
let rsv = false;
slider.addEventListener("input", () => {
    default_time = slider_to_date.get(parseInt(slider.value));
    if (rsv)
        updateMap(data_flu);
    else
        updateMap(data_covid);
});

checkbox.addEventListener('change', () => {
    rsv = checkbox.checked;
    if (rsv) {
        option_container.classList.add('active');
        header.classList.add('active');
        button.classList.add('active');
        color = d3.scaleLinear()
            .domain([0, 40, 55])
            .range(["rgb(255, 255, 255)", "rgb(106, 0, 138)"])
            .clamp(true);
        createMap(us, data_flu);
    } else {
        option_container.classList.remove('active');
        header.classList.remove('active');
        button.classList.remove('active');
        color = d3.scaleLinear()
            .domain([60, 84, 100])
            .range(["rgb(255, 255, 255)", "rgb(0, 151, 118)"])
            .clamp(true);
        createMap(us, data_covid);
    }
});

button.addEventListener("click", () => {
    document.getElementById("myNav").style.width = "100%";
    // Start working on detail stats with DetailView.js here <<- ->>
});

/**
 * 
 * @param {*} data JSON object correpsonding to the data
 * @returns Map corresponding to states and their estimates
 */
function filter_statewide(data) {
    // console.log(data);
    return data
        .filter(d =>
            d['Geography Type'] === 'State' &
            d['Group Category'] === 'All adults 18+ years' &&
            d['Time Period'] === default_time)
        .reduce((acc, curr) => {
            acc[curr.Geography] = curr['Estimate (%)'];
            return acc;
        }, {});
}

/**
 * 
 * @param {*} us us topology/svg data
 * @param {*} data Map for state and estimates
 */
function createMap(us, data) {
    // Draw the states
    container.selectAll("*").remove();
    let new_data = filter_statewide(data);

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
        .style("fill", d => color(new_data[d.properties.name] || 0))
        .style("opacity", 0)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            const stateColor = color(state_estimates[d.properties.name] || 0);
            showStateName(d.properties.name, container, () => {
                container.selectAll("*").remove();
                init();
            }, stateColor);
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
        })
        .transition() // Add a transition
        .duration(1000) // Duration of the transition
        .style("opacity", 0.7) // Final opacity
        .ease(d3.easeCubicInOut); // Optional easing function

    // Add state borders
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("d", path)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 0.7)
        .ease(d3.easeCubicInOut);
}

/**
 * 
 * @param {*} data Map for state and estimates
 */
function updateMap(data) {
    let new_data = filter_statewide(data);
    console.log(new_data);
    container.selectAll(".state")
        .style("fill", d => color(new_data[d.properties.name] || 0))
        .style("opacity", 0.7);
}

// setting up
function init() {
    createMap(us, data_covid);
}

init();
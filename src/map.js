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
    .domain([0, 20, 50])
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

// Application state
const appState = {
    default_time: slider_to_date.get(0),
    rsv: false,
    current_data: data_covid,
    state_data: null,
    is_transitioning: false
};

// Update state data based on current settings
function updateStateData() {
    appState.state_data = filter_statewide(appState.current_data);
}

// Event listeners
slider.addEventListener("input", () => {
    appState.default_time = slider_to_date.get(parseInt(slider.value));
    updateStateData();
    updateMap();
});

checkbox.addEventListener('change', () => {
    appState.rsv = checkbox.checked;
    if (appState.rsv) {
        option_container.classList.add('active');
        header.classList.add('active');
        button.classList.add('active');
        color = d3.scaleLinear()
            .domain([0, 40, 55])
            .range(["rgb(255, 255, 255)", "rgb(106, 0, 138)"])
            .clamp(true);
        appState.current_data = data_flu;
    } else {
        option_container.classList.remove('active');
        header.classList.remove('active');
        button.classList.remove('active');
        color = d3.scaleLinear()
            .domain([0, 20, 50])
            .range(["rgb(255, 255, 255)", "rgb(0, 151, 118)"])
            .clamp(true);
        appState.current_data = data_covid;
    }
    updateStateData();
    createMap();
});

button.addEventListener("click", () => {
    document.getElementById("myNav").style.width = "100%";
    // Start working on detail stats with DetailView.js here <<- ->>
});

/**
 * Filter data to get statewide estimates for the current time period
 * @param {*} data JSON object corresponding to the data
 * @returns Map corresponding to states and their estimates
 */
function filter_statewide(data) {
    return data
        .filter(d =>
            d['Geography Type'] === 'State' &&
            d['Group Category'] === 'All adults 18+ years' &&
            d['Time Period'] === appState.default_time)
        .reduce((acc, curr) => {
            acc[curr.Geography] = curr['Estimate (%)'];
            return acc;
        }, {});
}

/**
 * Create the map visualization
 */
function createMap() {
    // Prevent multiple transitions
    if (appState.is_transitioning) return;
    appState.is_transitioning = true;
    
    // Draw the states
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
        .style("fill", d => {
            const value = appState.state_data[d.properties.name] || 0;
            return color(value);
        })
        .style("opacity", 0)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            if (appState.is_transitioning) return;
            
            const stateName = d.properties.name;
            const stateValue = appState.state_data[stateName] || 0;
            const stateColor = color(stateValue);
            
            showStateName(stateName, container, () => {
                container.selectAll("*").remove();
                appState.is_transitioning = false;
                // Show the option container when returning to national view
                option_container.style.display = 'flex';
                createMap();
            }, stateColor);
            
            // Hide the option container when entering state view
            option_container.style.display = 'none';
        })
        .on("mouseover", function (event, d) {
            if (appState.is_transitioning) return;
            
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 4)
                .attr('size', 10);
        })
        .on("mouseout", function (event, d) {
            if (appState.is_transitioning) return;
            
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        })
        .transition()
        .duration(1000)
        .style("opacity", 0.7)
        .ease(d3.easeCubicInOut)
        .on("end", () => {
            appState.is_transitioning = false;
        });

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
 * Update the map with new data
 */
function updateMap() {
    if (appState.is_transitioning) return;
    
    container.selectAll(".state")
        .style("fill", d => {
            const value = appState.state_data[d.properties.name] || 0;
            return color(value);
        })
        .style("opacity", 0.7);
}

// Initialize the application
function init() {
    updateStateData();
    createMap();
}

init();
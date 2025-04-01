import './DetailView.js';

// Get COVID data and US topology
const data_covid = await fetch('../data/covid_data/Adult_COVID.json').then(response => response.json());
const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
const container = d3.select("#map-container");

// Color scale setup
const color = d3.scaleLinear()
    .domain([60, 84, 100])
    .range(["rgb(255, 255, 255)", "rgb(0, 151, 118)"])
    .clamp(true);

// Map projection setup
const proj = d3.geoAlbersUsa()
    .translate([450, 300])
    .scale(1000);

const path = d3.geoPath().projection(proj);

// UI elements
const button = document.getElementById('detail-button');
button.addEventListener("click", () => {
    document.getElementById("myNav").style.width = "100%";
});

// Filter data to get state-wide estimates
function filter_statewide(data) {
    return data
        .filter(d =>
            d['Geography Type'] === 'State' &&
            d['Group Category'] === 'All adults 18+ years')
        .reduce((acc, curr) => {
            acc[curr.Geography] = curr['Estimate (%)'];
            return acc;
        }, {});
}

// Create the map visualization
function createMap(us, data) {
    container.selectAll("*").remove();
    let new_data = filter_statewide(data);

    const svg = container
        .append("svg")
        .attr("viewBox", "0 0 900 600")
        .style("width", "100%")
        .style("height", "100%");

    // Draw states
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
            const stateColor = color(new_data[d.properties.name] || 0);
            showStateView(d.properties.name, stateColor);
        })
        .on("mouseover", function() {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 4);
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        })
        .transition()
        .duration(1000)
        .style("opacity", 0.7)
        .ease(d3.easeCubicInOut);

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

// Show individual state view
function showStateView(stateName, stateColor) {
    // Hide UI elements
    button.style.display = 'none';
    document.getElementById('option-container').style.display = 'none';
    
    // Clear and setup container
    container.selectAll("*").remove();
    const wrapper = container
        .append("div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("gap", "20px")
        .style("padding", "20px");

    // Add state name
    wrapper
        .append("div")
        .style("font-size", "48px")
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "20px")
        .text(stateName);

    // Add visualization container
    const vizContainer = wrapper
        .append("div")
        .style("width", "80%")
        .style("max-width", "800px")
        .style("height", "600px")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center");

    // Add back button
    wrapper
        .append("button")
        .style("padding", "10px 20px")
        .style("font-size", "18px")
        .style("cursor", "pointer")
        .style("background-color", "rgb(55, 137, 224)")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
        .style("margin-top", "20px")
        .text("Back to Map")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("click", () => {
            button.style.display = '';
            document.getElementById('option-container').style.display = '';
            container.selectAll("*").remove();
            init();
        });

    // Load and display state shape
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        .then(response => response.json())
        .then(us => {
            const stateFeature = topojson.feature(us, us.objects.states)
                .features.find(d => d.properties.name === stateName);

            if (stateFeature) {
                const svg = vizContainer
                    .append("svg")
                    .style("width", "100%")
                    .style("height", "100%");

                const projection = d3.geoMercator()
                    .fitSize([vizContainer.node().getBoundingClientRect().width * 0.9, 
                             vizContainer.node().getBoundingClientRect().height * 0.9], 
                            stateFeature);

                const path = d3.geoPath().projection(projection);

                svg.append("path")
                    .datum(stateFeature)
                    .attr("d", path)
                    .attr("fill", stateColor)
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .style("opacity", 0.7);
            }
        })
        .catch(error => {
            console.error("Error loading TopoJSON data:", error);
            vizContainer
                .append("div")
                .style("color", "red")
                .style("text-align", "center")
                .style("padding", "20px")
                .text("Error loading state data. Please try again.");
        });
}

// Initialize the visualization
function init() {
    createMap(us, data_covid);
}

init();
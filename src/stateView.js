// Function to show state view
import { drawVaccinationSpots } from './vaccinationSpots.js';

export function showStateName(stateName, container, onBackClick, stateColor) {
    // Clear the container
    container.selectAll("*").remove();
    
    // Create a wrapper div for flex layout
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

    // Add state name as header
    wrapper
        .append("div")
        .style("font-size", "48px")
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "20px")
        .text(stateName);

    // Create a container for the visualization
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
        .text("Back to Main Map")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("click", onBackClick);

    // Fetch both state and county TopoJSON data
    Promise.all([
        fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
        fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([stateData, countyData]) => {
        // Find the state feature
        const stateFeature = topojson.feature(stateData, stateData.objects.states)
            .features.find(d => d.properties.name === stateName);

        if (stateFeature) {
            // Create SVG for the state visualization
            const svg = vizContainer
                .append("svg")
                .style("width", "100%")
                .style("height", "100%");

            // Create a projection that will fit the state
            const projection = d3.geoMercator()
                .fitSize([vizContainer.node().getBoundingClientRect().width * 0.9, 
                         vizContainer.node().getBoundingClientRect().height * 0.9], 
                        stateFeature);

            // Create a path generator
            const path = d3.geoPath().projection(projection);

            // Draw the state
            svg.append("path")
                .datum(stateFeature)
                .attr("d", path)
                .attr("fill", stateColor)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("opacity", 0.7);

            // Get all counties for this state
            const counties = topojson.feature(countyData, countyData.objects.counties).features;
            const stateId = stateFeature.id;
            const stateCounties = counties.filter(county => 
                county.id.toString().substring(0, 2) === stateId.toString());

            // Draw county boundaries
            svg.append("path")
                .datum(topojson.mesh(countyData, countyData.objects.counties, (a, b) => {
                    return a.id.toString().substring(0, 2) === stateId.toString() && 
                           b.id.toString().substring(0, 2) === stateId.toString();
                }))
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-width", 0.5)
                .attr("stroke-opacity", 0.5)
                .attr("d", path);
                
            // Add vaccination spots visualization
            drawVaccinationSpots(stateName, svg, projection);
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
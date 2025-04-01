// Function to show state view
export function showStateName(stateName, container, onBackClick, stateColor) {
    
    const overlay = d3.select("body")
        .append("div")
        .style("position", "fixed")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("background-color", "rgba(0, 0, 0, 0.5)")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("z-index", "1000");


    const wrapper = overlay
        .append("div")
        .style("width", "90%")
        .style("max-width", "1000px")
        .style("height", "90vh")
        .style("background-color", "white")
        .style("border-radius", "10px")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("gap", "20px")
        .style("padding", "20px")
        .style("position", "relative");

    // Add state name as header
    wrapper
        .append("div")
        .style("font-size", "48px")
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "20px")
        .text(stateName);


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
        .text("Close")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("click", () => {
            overlay.remove();
            onBackClick();
        });

    // Add click handler to close on overlay click
    overlay.on("click", function(event) {
        if (event.target === this) {
            overlay.remove();
            onBackClick();
        }
    });

    // Fetch and display the TopoJSON data
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        .then(response => response.json())
        .then(us => {
            // Find the state feature
            const stateFeature = topojson.feature(us, us.objects.states)
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
// Function to show state view
export function showStateName(stateName, container, onBackClick) {
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
        .style("gap", "20px");

    // Add state name
    wrapper
        .append("div")
        .style("font-size", "48px")
        .style("font-family", "Arial, sans-serif")
        .text(stateName);

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
        .text("Back to Main Map")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "rgb(88, 156, 171)")
        })
        .on("click", onBackClick);
} 
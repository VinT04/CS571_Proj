// Make sure to include D3.js in your HTML file, e.g. via:
// <script src="https://d3js.org/d3.v7.min.js"></script>

export function createStateGraphs(wrapper, stateName) {
    // Load the dataset JSON file
    let container;
    if (wrapper && typeof wrapper.node === "function") {
    // wrapper is already a D3 selection.
    container = wrapper;
    } else 
    {
    container = d3.select(wrapper);
    }
    d3.json(`../data/covid_data/${stateName}COVID_dataset.json`).then(data => {
      // Filter the records:
      //  - Only records from the requested state.
      //  - Only records whose Indicator Name includes the vaccination measure.
      //  - For an overall time-series we use the "All adults 18+ years" group.
      const filteredData = data.filter(d =>
        d.Geography === stateName &&
        d["Indicator Name"].includes("Received at least one dose") &&
        d["Group Name"] === "All adults 18+ years"
      );
      
      // If there are no records, log a warning.
      if (!filteredData.length) {
        console.warn("No matching records found for state:", stateName);
        return;
      }
  
      // Create a time parser.
      // Our dataset's "Time Period" is in the format "Month Day - Month Day".
      // We take the start date and combine it with the Year field.
      const parseDate = d3.timeParse("%B %d %Y");
  
      // Process each record: parse the date and convert the estimate to a number.
      filteredData.forEach(d => {
        // Use the first part of the Time Period (before the " - ") as the starting date.
        const startDateStr = d["Time Period"].split(" - ")[0];
        d.date = parseDate(`${startDateStr} ${d.Year}`);
        d.estimate = +d["Estimate (%)"];
      });
  
      // Sort the data by date.
      filteredData.sort((a, b) => a.date - b.date);
  
      // Set up the SVG dimensions and margins.
      const margin = { top: 20, right: 20, bottom: 40, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      // Append an SVG element to the provided wrapper element.
      const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Define the scales for x (time) and y (percentage)
      const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.date))
        .range([0, width]);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.estimate) * 1.1])
        .range([height, 0]);
  
      // Define the line generator.
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.estimate))
        .curve(d3.curveMonotoneX); // smooth curve
  
      // Add the x-axis.
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d")))
        .append("text")
        .attr("fill", "#000")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .text("Date");
  
      // Add the y-axis.
      svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height/2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Percentage Vaccinated");
  
      // Draw the line representing the time-series.
      svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
  
      // Create a tooltip div that is initially hidden.
      const tooltip = d3.select(wrapper)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("pointer-events", "none");
  
      // Add circles at each data point and attach mouse events for interactivity.
      svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.estimate))
        .attr("r", 4)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`Date: ${d.date.toLocaleDateString()}<br/>Vaccinated: ${d.estimate}%`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    }).catch(error => {
      console.error("Error loading or processing data:", error);
    });
  }
  
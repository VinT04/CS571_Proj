export function showStateGraph(stateName, container) {
    // Clear the container
    container.innerHTML = "";
  
    let file_str = "/data/".concat(stateName).concat("_dataset.json");
    let stateData = [];
  
    fetch(file_str)
      .then(response => response.json())
      .then(data => {
        // Access and use the data here
        stateData = data;
  
        // Filter for the "Concern about getting COVID-19 disease" topic
        // and select the two key risk perception categories.
        const riskData = stateData.filter(d =>
          d["Group Name"] === "Concern about getting COVID-19 disease" &&
          (d["Group Category"] === "Very or moderately concerned" ||
           d["Group Category"] === "A little or not at all concerned") &&
          d["Estimate (%)"] !== undefined
        );
  
        // Convert the "Estimate (%)" field to a number.
        riskData.forEach(d => {
          d.estimate = +d["Estimate (%)"];
        });
  
        // Set dimensions and margins for the SVG container.
        const svgWidth = 500, svgHeight = 300;
        const margin = { top: 40, right: 20, bottom: 40, left: 60 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
  
        // Append the SVG element to the container.
        const svg = d3.select(container)
          .append("svg")
          .attr("width", svgWidth)
          .attr("height", svgHeight)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
        // Create the x-scale using a band scale.
        const x = d3.scaleBand()
          .domain(riskData.map(d => d["Group Category"]))
          .range([0, width])
          .padding(0.4);
  
        // Add the x-axis.
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
  
        // Create the y-scale using a linear scale.
        const y = d3.scaleLinear()
          .domain([0, d3.max(riskData, d => d.estimate)])
          .nice()
          .range([height, 0]);
  
        // Add the y-axis.
        svg.append("g")
          .call(d3.axisLeft(y));
  
        // Add the bars.
        svg.selectAll(".bar")
          .data(riskData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d["Group Category"]))
          .attr("y", d => y(d.estimate))
          .attr("width", x.bandwidth())
          .attr("height", d => height - y(d.estimate))
          .attr("fill", "steelblue");
  
        // Add a chart title.
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", -margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Risk Perception vs Vaccination Uptake");
  
        // Optional: Add a y-axis label.
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -margin.left + 15)
          .attr("x", -height / 2)
          .attr("dy", "-1em")
          .attr("text-anchor", "middle")
          .text("Vaccination Rate (%)");
      });
  }
  
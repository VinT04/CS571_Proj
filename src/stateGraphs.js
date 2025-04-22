
export function createStateGraphs(wrapper, stateName) {
  // Normalize wrapper to a D3 selection
  let container;
  if (wrapper && typeof wrapper.node === "function") {
    container = wrapper;
  } else {
    container = d3.select(wrapper);
  }

  // Load the JSON data for the state
  d3.json(`../data/covid_data/${stateName}COVID_dataset.json`)
    .then(data => {
      // 1) Filter to only “received at least one dose” for all adults 18+ (but update for more cases)
      const filteredData = data.filter(d =>
        d.Geography === stateName &&
        d["Indicator Name"].includes("Received at least one dose") &&
        d["Group Name"] === "All adults 18+ years"
      );

      if (!filteredData.length) {
        console.warn("No matching records found for state:", stateName);
        return;
      }

      // 2) Parse dates 
      const parseDate = d3.timeParse("%B %d %Y");
      filteredData.forEach(d => {
        const startDateStr = d["Time Period"].split(" - ")[0];
        d.date = parseDate(`${startDateStr} ${d.Year}`);
        d.estimate = +d["Estimate (%)"];
      });
      filteredData.sort((a, b) => a.date - b.date);

      // 3) Set up SVG dims
      const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width  = 800 - margin.left - margin.right;
    const height = 400 - margin.top  - margin.bottom;


      // 4) Append the SVG a single <g> 
      const svg = container.append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // 5) Draw a  background rect 
      svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width",  width)
        .attr("height", height)
        .attr("fill",   "rgba(43,43,58,0.3)")
        .lower();

      // 6) Define scales and line
      const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.date))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.estimate) * 1.1])
        .range([height, 0]);

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.estimate))
        .curve(d3.curveMonotoneX);

      // 7) Add grid‑lines
      svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
        )
        .call(g => g.selectAll("line")
                    .attr("stroke", "rgba(255,255,255,0.1)"))
        .call(g => g.selectAll("path")
                    .attr("stroke", "none"));

      // 8) X‑axis (light ticks + labels)
      const xAxisG = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d")));

      xAxisG.selectAll("path, line")
        .attr("stroke", "#888");
      xAxisG.selectAll("text")
        .attr("fill", "#eee")
        .attr("font-size", "14px");
      xAxisG.append("text")
        .attr("fill", "#eee")
        .attr("font-size", "16px")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .text("Date");

      // 9) Y‑axis (light ticks + labels)
      const yAxisG = svg.append("g")
        .call(d3.axisLeft(y));

      yAxisG.selectAll("path, line")
        .attr("stroke", "#888");
      yAxisG.selectAll("text")
        .attr("fill", "#eee")
        .attr("font-size", "16px");
      yAxisG.append("text")
        .attr("fill", "#eee")
        .attr("font-size", "16px")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Percentage Vaccinated");

      // 10) Draw the time‑series line in a bright, contrasting cyan
      svg.append("path")
        .datum(filteredData)
        .attr("fill",        "none")
        .attr("stroke",      "rgb(0, 151, 118)")
        .attr("stroke-width","3")
        .attr("d",           line);

      // 11) Create an inverted (dark) tooltip
      const tooltip = d3.select(wrapper)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity",         0)
        .style("position",        "absolute")
        .style("background",      "rgba(0,0,0,0.8)")
        .style("color",           "#fff")
        .style("padding",         "5px")
        .style("border",          "none")
        .style("border-radius",   "4px")
        .style("pointer-events",  "none");

      // 12) Add circles and interactivity
      svg.selectAll("circle")
        .data(filteredData)
        .enter().append("circle")
          .attr("cx",    d => x(d.date))
          .attr("cy",    d => y(d.estimate))
          .attr("r",     5)
          .attr("fill",  "rgb(0, 151, 118)")
          .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Date: ${d.date.toLocaleDateString()}<br/>Vaccinated: ${d.estimate}%`)
              .style("left", (event.pageX + 10) + "px")
              .style("top",  (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
          });

    })
    .catch(error => {
      console.error("Error loading or processing data:", error);
    });
}

const graphs = [];
let mostRecentState = "National";

export function recallGraphs() {
  createStateGraphs(mostRecentState);
}

export function destroyOnBackButton() {
  const vizRoot = d3.select('#myNav');
  vizRoot.selectAll('.demo-viz').remove();
  mostRecentState = "National";
  recallGraphs();
}

document.getElementById('Dem-option').addEventListener('change', recallGraphs)
document.getElementById('rsv-check').addEventListener('change', recallGraphs);
document.getElementById('detail-button').addEventListener('click', createStateGraphs(mostRecentState))
export function createStateGraphs(stateName) {
  mostRecentState = stateName;


  function renderCharts(data, stateName, vaccineTag = 'COVID‑19') {
    const CHART_W = 760;
    const CHART_H = 480;

    const cScheme = d3.scaleOrdinal(d3.schemeTableau10);
    const vizRoot = d3.select('#myNav');
    vizRoot.selectAll('.demo-viz').remove();
    const wrapper = vizRoot.append('div')
      .attr('class', 'demo-viz')
      .style('display', 'flex')
      .style('gap', '2rem')
      .style('justify-content', 'center')
      .style('flex-wrap', 'wrap')
      .style('padding', '1rem');

    const tooltip = d3.select('body').selectAll('div.tooltip').data([null]).join('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(255,255,255,0.95)')
      .style('border', '1px solid #999')
      .style('border-radius', '4px')
      .style('padding', '6px 8px')
      .style('font-size', '0.8rem')
      .style('opacity', 0);

    function showTip(html, event) {
      tooltip.html(html)
        .style('opacity', 1)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY + 12) + 'px');
    }
    function moveTip(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY + 12) + 'px');
    }
    function hideTip() { tooltip.style('opacity', 0); }
    const monthNames = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    function parsePeriod(period) {
      // Typical strings: "September 6‑18 2024", "Dec 1‑14 2024"
      const monthMatch = period.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/);
      if (!monthMatch) return new Date(2024, 0, 1);
      const month = monthNames[monthMatch[1]];
      const yearMatch = period.match(/(\d{4})$/);
      const year = yearMatch ? +yearMatch[1] : 2024;
      return new Date(year, month - 1, 1);
    }

    /**
     * Simple horizontal bar‑chart with tooltips
     */
    function drawBar({ dataset, title, holder }) {
      const maxLabelLen = d3.max(dataset, d => d.key.length);
      const margin = { top: 50, right: 40, bottom: 60, left: Math.max(250, maxLabelLen * 7) };
      const innerW = CHART_W - margin.left - margin.right;
      const innerH = CHART_H - margin.top - margin.bottom;

      const svg = holder.append('svg')
        .attr('width', CHART_W)
        .attr('height', CHART_H)
        .attr('class', 'covid-chart');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.value)]).nice()
        .range([0, innerW]);

      const y = d3.scaleBand()
        .domain(dataset.map(d => d.key))
        .range([0, innerH])
        .padding(0.25);

      const yAxis = d3.axisLeft(y);
      g.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('font-size', '0.9rem')
        .attr('fill', 'white');

      const xAxis = d3.axisBottom(x)
        .tickFormat(d => d + '%');
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis)
        .selectAll('text')
        .attr('font-size', '0.9rem')
        .attr('fill', 'white');

      g.selectAll('rect')
        .data(dataset)
        .join('rect')
        .attr('x', 0)
        .attr('y', d => y(d.key))
        .attr('width', d => x(d.value))
        .attr('height', y.bandwidth())
        .attr('fill', '#3182bd')
        .on('mouseenter', (event, d) => {
          tooltip
            .html(`<strong>${d.key}</strong>: ${d.value}%`)
            .style('opacity', 1)
            .style('left', (event.pageX + 12) + 'px')
            .style('top', (event.pageY + 12) + 'px')
            .style('z-index', 1000);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', (event.pageX + 12) + 'px')
            .style('top', (event.pageY + 12) + 'px');
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', 0);
        });


      // title 
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', margin.top - 20)
        .attr('font-size', '1.25rem')
        .attr('font-weight', 700)
        .attr('fill', 'white')
        .text(title);
    }

    function drawLine({ multiSeries, title, holder }) {
      const margin = { top: 50, right: 200, bottom: 60, left: 60 };
      const innerW = CHART_W - margin.left - margin.right;
      const innerH = CHART_H - margin.top - margin.bottom;

      const allDates = Array.from(
        d3.union(...multiSeries.map(s => s.values.map(v => v.date)))
      ).sort(d3.ascending);

      const x = d3.scalePoint().domain(allDates).range([0, innerW]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(multiSeries, s => d3.max(s.values, v => v.value))]).nice()
        .range([innerH, 0]);

      multiSeries.forEach(s => {
        const dateMap = new Map(s.values.map(v => [+v.date, v.value]));
        s.values = allDates.map(d => ({ date: d, value: dateMap.get(+d) ?? null }));
      });

      const svg = holder.append('svg')
        .attr('width', CHART_W)
        .attr('height', CHART_H)
        .attr('class', 'covid-chart');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat('%b %Y'));
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis)
        .selectAll('text')
        .attr('font-size', '0.9rem')
        .attr('fill', 'white');

      const yAxis = d3.axisLeft(y)
        .tickFormat(d => d + '%');
      g.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('font-size', '0.9rem')
        .attr('fill', 'white');
      const line = d3.line()
        .defined(d => d.value !== null)
        .x(d => x(d.date))
        .y(d => y(d.value));

      g.selectAll('path.series')
        .data(multiSeries)
        .join('path')
        .attr('class', 'series')
        .attr('fill', 'none')
        .attr('stroke', (d, i) => cScheme(i))
        .attr('stroke-width', 2)
        .attr('d', d => line(d.values));

      multiSeries.forEach((s, i) => {
        g.selectAll(`circle.series-${i}`)
          .data(s.values.filter(v => v.value !== null))
          .join('circle')
          .attr('class', `series-${i}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.value))
          .attr('r', 4)
          .attr('fill', cScheme(i))
          .attr('stroke', '#fff')
          .on('mouseover', (event, d) => {
            const dateStr = d3.timeFormat('%b %Y')(d.date);
            showTip(`<strong>${s.name}</strong><br>${dateStr}: ${d.value}%`, event);
          })
          .on('mousemove', event => moveTip(event))
          .on('mouseout', hideTip);

      });

      /* title */
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', margin.top - 20)
        .attr('font-size', '1.25rem')
        .attr('font-weight', 700)
        .attr('fill', 'white')
        .text(title);

      // legend 
      const legendX = margin.left + innerW + 10;
      const legendY = margin.top;

      const legend = svg.append('g')
        .attr('transform', `translate(${legendX},${legendY})`);

      const legendEntry = legend.selectAll('g')
        .data(multiSeries)
        .join('g')
        .attr('transform', (d, i) => `translate(0,${i * 22})`)
        .style('cursor', 'pointer')
        .on('click', function (event, d) {
          const path = g.selectAll('path.series').filter(p => p === d);
          const on = path.style('display') !== 'none';
          path.style('display', on ? 'none' : null);
          g.selectAll(`circle.series-${multiSeries.indexOf(d)}`).style('display', on ? 'none' : null);
          d3.select(this).select('text').style('opacity', on ? 0.4 : 1);
        });

      legendEntry.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', (d, i) => cScheme(i));

      legendEntry.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('font-size', '0.85rem')
        .attr('fill', 'white')
        .text(d => d.name);
    }
    const selectedDemographic = document.getElementById('Dem-option');
    function buildCharts(groupFilter, barTitle, lineTitle, barSort = (a, b) => d3.ascending(a.key, b.key)) {
      if (vaccineTag === 'Flu') {
        barTitle = barTitle
          .replace('with ≥1 dose', 'vaccinated')
          .replace('COVID‑19', 'Flu');
        lineTitle = lineTitle.replace('COVID‑19', 'Flu');
      }
      const subset = data.filter(groupFilter);
      const latest = d3.max(subset, d => parsePeriod(d['Time Period']));
      const barData = d3.groups(subset, d => d['Group Category'])
        .map(([key, rows]) => {
          const latestRow = rows.reduce((a, b) =>
            // compare their dates
            parsePeriod(a['Time Period']) > parsePeriod(b['Time Period']) ? a : b
          );
          return { key, value: +latestRow['Estimate (%)'] };
        })
        .sort(barSort);

      drawBar({ dataset: barData, title: `${stateName} – ${barTitle}`, holder: wrapper });
      const series = d3.groups(subset, d => d['Group Category'])
        .map(([cat, rows]) => ({
          name: cat,
          values: rows.map(r => ({ date: parsePeriod(r['Time Period']), value: +r['Estimate (%)'] }))
        }));
      drawLine({ multiSeries: series, title: lineTitle, holder: wrapper });
    }

    switch (+selectedDemographic.value) {
      case 0:
        buildCharts(d => d['Group Name'] === 'Age', '% adults with ≥1 dose by Age (latest)', 'Trends – Age');
        break;
      case 1:
        buildCharts(d => d['Group Name'] === 'Sex', '% adults by Gender (latest)', 'Trends – Gender');
        break;
      case 2:
        buildCharts(d => d['Group Name'].startsWith('Race/Ethnicity (7'), '% adults by Race/Ethnicity (latest)', 'Trends – Race/Ethnicity', (a, b) => d3.descending(a.value, b.value));
        break;
      case 3:
        buildCharts(d => d['Group Name'] === 'Sexual orientation', '% adults by Sexual Orientation (latest)', 'Trends – Sexual Orientation');
        break;
      case 4:
        buildCharts(d => d['Group Name'] === 'Metropolitan statistical area', '% adults by Metropolitan Status (latest)', 'Trends – Metropolitan Status');
        break;
      case 5:
        buildCharts(d => d['Group Name'] === 'Poverty status', '% adults by Poverty Status (latest)', 'Trends – Poverty Status');
        break;
      default:
        console.warn('ERROR');
    }
  }

  const checkbox = document.getElementById('rsv-check');
  if (checkbox.checked) {
    if (mostRecentState != "National") {
      d3.json(`./flu_data/${stateName}_dataset_flu.json`)
        .then(data => renderCharts(data, stateName, 'Flu'));
      return;
    }
    else {
      d3.json(`./flu_data/Adult_Flu_national.json`)
        .then(data => renderCharts(data, `National`, 'Flu'));
      return;
    }
  }
  if (mostRecentState != "National") {
    d3.json(`./covid_data/${stateName}COVID_dataset.json`)
      .then(data => renderCharts(data, stateName, 'COVID‑19'));
  }
  else {
    d3.json(`./covid_data/Adult_COVID_national.json`)
      .then(data => renderCharts(data, `National`, 'COVID‑19'));
  }

}


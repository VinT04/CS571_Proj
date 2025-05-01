const graphs = [];
let mostRecentState = null;

/* =============================================================
   0.  Public entry‑points
   ============================================================= */
export function recallGraphs () {
  createStateGraphs(mostRecentState);
}

document.getElementById('Dem-option').addEventListener('change', recallGraphs);

/* =============================================================
   1.  Master builder
   ============================================================= */
export function createStateGraphs (stateName) {
  mostRecentState = stateName;

  /* -----------------------------------------------------------
     Early exit if user requests RSV instead of COVID
     ----------------------------------------------------------- */
  const checkbox = document.getElementById('rsv-check');
  if (checkbox.checked) {
    d3.json(`../data/flu_data/${stateName}_dataset_flu.json`).then(_ => {/* todo */});
    return;
  }

  /* -----------------------------------------------------------
     Otherwise: load COVID‑19 data for this state
     ----------------------------------------------------------- */
  d3.json(`../data/covid_data/${stateName}COVID_dataset.json`).then(data => {

    /* ---------------------------------------------------------
       Shared constants
       --------------------------------------------------------- */
    const CHART_W  = 760;   // identical footprint for bar & line (slightly bigger)
    const CHART_H  = 480;

    const colour = d3.scaleOrdinal(d3.schemeTableau10);

    /* ---------------------------------------------------------
       Tidy up the stage before drawing new charts
       --------------------------------------------------------- */
    const vizRoot = d3.select('#myNav');
    vizRoot.selectAll('.demo-viz').remove();
    const wrapper = vizRoot.append('div')
      .attr('class', 'demo-viz')
      .style('display', 'flex')
      .style('gap', '2rem')
      .style('justify-content', 'center')
      .style('flex-wrap', 'wrap')
      .style('padding', '1rem');

    /* ---------------------------------------------------------
       Global tooltip (shared by all charts)
       --------------------------------------------------------- */
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

    function showTip (html, event) {
      tooltip.html(html)
        .style('opacity', 1)
        .style('left', (event.pageX + 12) + 'px')
        .style('top',  (event.pageY + 12) + 'px');
    }
    function moveTip (event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
             .style('top',  (event.pageY + 12) + 'px');
    }
    function hideTip () { tooltip.style('opacity', 0); }

    /* ---------------------------------------------------------
       Convenience – parse the survey period as first‑of‑month
       (FIX: collapse multiple rounds in a month into one date
             to avoid duplicate x‑axis labels)
       --------------------------------------------------------- */
    const monthNames = {
      January:1, February:2, March:3, April:4, May:5, June:6,
      July:7, August:8, September:9, October:10, November:11, December:12
    };
    function parsePeriod (period) {
      // Typical strings: "September 6‑18 2024", "Dec 1‑14 2024"
      const monthMatch = period.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/);
      if (!monthMatch) return new Date(2024, 0, 1);
      const month = monthNames[monthMatch[1]];
      const yearMatch = period.match(/(\d{4})$/);
      const year = yearMatch ? +yearMatch[1] : 2024;
      // ALWAYS return the first day of the month so every survey
      // round within that month shares a common x‑axis position.
      return new Date(year, month - 1, 1);
    }

    /* ---------------------------------------------------------
       Generic drawing helpers
       --------------------------------------------------------- */

    /**
     * Simple horizontal bar‑chart with tooltips
     */
    function drawBar ({ dataset, title, holder }) {
      // widen left margin dynamically based on label length
      const maxLabelLen = d3.max(dataset, d => d.key.length);
      const margin = { top: 50, right: 40, bottom: 60, left: Math.max(180, maxLabelLen * 7) };
      const innerW = CHART_W - margin.left - margin.right;
      const innerH = CHART_H - margin.top - margin.bottom;

      const svg = holder.append('svg')
        .attr('width',  CHART_W)
        .attr('height', CHART_H)
        .attr('class',  'covid-chart');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.value)]).nice()
        .range([0, innerW]);

      const y = d3.scaleBand()
        .domain(dataset.map(d => d.key))
        .range([0, innerH])
        .padding(0.25);

      /* axes */
      g.append('g').call(d3.axisLeft(y));
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => d + '%'));

      /* bars */
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
            .style('left',  (event.pageX + 12) + 'px')
            .style('top',   (event.pageY + 12) + 'px')
            .style('z-index', 1000);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', (event.pageX + 12) + 'px')
            .style('top',  (event.pageY + 12) + 'px');
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', 0);
        });
    

      /* title */
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', margin.top - 20)
        .attr('font-size', '1.25rem')
        .attr('font-weight', 700)
        .text(title);
    }

    /**
     * Multi‑series line‑chart with a tidy vertical legend and tooltip interactivity
     */
    function drawLine ({ multiSeries, title, holder }) {
      const margin = { top: 50, right: 200, bottom: 60, left: 60 }; // extra right‑hand padding for legend
      const innerW = CHART_W - margin.left - margin.right;
      const innerH = CHART_H - margin.top - margin.bottom;

      /* union of all survey rounds (as Date objects) */
      const allDates = Array.from(
        d3.union(...multiSeries.map(s => s.values.map(v => v.date)))
      ).sort(d3.ascending);

      const x = d3.scalePoint().domain(allDates).range([0, innerW]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(multiSeries, s => d3.max(s.values, v => v.value))]).nice()
        .range([innerH, 0]);

      /* ensure every series has an entry for each survey round (null if missing) */
      multiSeries.forEach(s => {
        const dateMap = new Map(s.values.map(v => [+v.date, v.value]));
        s.values = allDates.map(d => ({ date: d, value: dateMap.get(+d) ?? null }));
      });

      const svg = holder.append('svg')
        .attr('width',  CHART_W)
        .attr('height', CHART_H)
        .attr('class', 'covid-chart');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      /* axes */
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %Y')));
      g.append('g')
        .call(d3.axisLeft(y).tickFormat(d => d + '%'));

      /* lines */
      const line = d3.line()
        .defined(d => d.value !== null)
        .x(d => x(d.date))
        .y(d => y(d.value));

      g.selectAll('path.series')
        .data(multiSeries)
        .join('path')
          .attr('class', 'series')
          .attr('fill', 'none')
          .attr('stroke', (d,i) => colour(i))
          .attr('stroke-width', 2)
          .attr('d', d => line(d.values));

      /* circles for tooltip */
      multiSeries.forEach((s, i) => {
        g.selectAll(`circle.series-${i}`)
          .data(s.values.filter(v => v.value !== null))
          .join('circle')
            .attr('class', `series-${i}`)
            .attr('cx', d => x(d.date))
            .attr('cy', d => y(d.value))
            .attr('r', 4)
            .attr('fill', colour(i))
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
        .text(title);

      /* legend – tidy vertical stack on the right */
      const legendX = margin.left + innerW + 10;
      const legendY = margin.top;

      const legend = svg.append('g')
        .attr('transform', `translate(${legendX},${legendY})`);

      const legendEntry = legend.selectAll('g')
        .data(multiSeries)
        .join('g')
          .attr('transform', (d,i) => `translate(0,${i * 22})`)
          .style('cursor', 'pointer')
          .on('click', function (event, d) {
            // simple interactivity – click legend to toggle series visibility
            const path = g.selectAll('path.series').filter(p => p === d);
            const on   = path.style('display') !== 'none';
            path.style('display', on ? 'none' : null);
            g.selectAll(`circle.series-${multiSeries.indexOf(d)}`).style('display', on ? 'none' : null);
            d3.select(this).select('text').style('opacity', on ? 0.4 : 1);
          });

      legendEntry.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', (d,i) => colour(i));

      legendEntry.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('font-size', '0.85rem')
        .text(d => d.name);
    }

    /* =========================================================
       2.  Demographic switcher – ONLY 1 bar + 1 line per case
       ========================================================= */
    const selectedDemographic = document.getElementById('Dem-option');

    /* helper to build bar & line for a given group‑name */
    function buildCharts (groupFilter, barTitle, lineTitle, barSort = (a,b) => d3.ascending(a.key,b.key)) {
      const subset = data.filter(groupFilter);
      const latest = d3.max(subset, d => parsePeriod(d['Time Period']));

      const barData = subset
        .filter(d => +parsePeriod(d['Time Period']) === +latest)
        .map(d => ({ key: d['Group Category'], value: +d['Estimate (%)'] }))
        .sort(barSort);

      drawBar({ dataset: barData, title: `${stateName} – ${barTitle}`, holder: wrapper });

      const series = d3.groups(subset, d => d['Group Category'])
        .map(([cat, rows]) => ({
          name  : cat,
          values: rows.map(r => ({ date: parsePeriod(r['Time Period']), value: +r['Estimate (%)'] }))
        }));

      drawLine({ multiSeries: series, title: lineTitle, holder: wrapper });
    }

    switch (+selectedDemographic.value) {
      case 0: // AGE
        buildCharts(
          d => d['Group Name'] === 'Age',
          '% adults with ≥1 dose by AGE (latest)',
          'Trend – AGE'
        );
        break;
      case 1: // SEX
        buildCharts(
          d => d['Group Name'] === 'Sex',
          '% adults by SEX (latest)',
          'Trend – SEX'
        );
        break;
      case 2: // RACE / ETHNICITY (7‑level)
        buildCharts(
          d => d['Group Name'].startsWith('Race/Ethnicity (7'),
          '% adults by RACE / ETHNICITY (latest)',
          'Trend – RACE / ETHNICITY',
          (a,b) => d3.descending(a.value, b.value) // sort bar by size
        );
        break;
      case 3: // SEXUAL ORIENTATION
        buildCharts(
          d => d['Group Name'] === 'Sexual orientation',
          '% adults by SEXUAL ORIENTATION (latest)',
          'Trend – SEXUAL ORIENTATION'
        );
        break;
      case 4: // METRO vs RURAL
        buildCharts(
          d => d['Group Name'] === 'Metropolitan statistical area',
          '% adults by METRO / SUBURBAN / RURAL (latest)',
          'Trend – METROPOLITAN STATUS'
        );
        break;
      case 5: // POVERTY STATUS
        buildCharts(
          d => d['Group Name'] === 'Poverty status',
          '% adults by POVERTY STATUS (latest)',
          'Trend – POVERTY STATUS'
        );
        break;
      default:
        console.warn('Unknown demographic option');
    }
  });
}

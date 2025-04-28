/**
 * Vaccination Spots Visualization
 * This module generates diamonds on the state view representing vaccination spots,
 * with the size of each diamond corresponding to the number of vaccination locations in that city.
 */

// Cache for city coordinates
let cityCoordinates = null;

// Function to load city coordinates data
async function loadCityCoordinates() {
    if (cityCoordinates === null) {
        try {
            const response = await fetch('/src/us_cities.json');
            cityCoordinates = await response.json();
        } catch (error) {
            cityCoordinates = {};
        }
    }
    return cityCoordinates;
}

// Function to get coordinates from local data
async function getLocalCoordinates(city, state) {
    const coords = await loadCityCoordinates();
    if (coords[state] && coords[state][city.toLowerCase()]) {
        return coords[state][city.toLowerCase()];
    }
    return null;
}

// Function to get vaccination locations data
async function getVaccinationLocations(stateName, isFlu = false) {
    try {
        const dataPath = isFlu ? '/data/summary_flu_prov.json' : '/data/summary_covid_prov.json';
        console.log('Loading data from:', dataPath);
        const response = await fetch(dataPath);
        const data = await response.json();
        
        const stateCodeMap = {
            'Alabama': 'AL',
            'Alaska': 'AK',
            'Arizona': 'AZ',
            'Arkansas': 'AR',
            'California': 'CA',
            'Colorado': 'CO',
            'Connecticut': 'CT',
            'Delaware': 'DE',
            'Florida': 'FL',
            'Georgia': 'GA',
            'Hawaii': 'HI',
            'Idaho': 'ID',
            'Illinois': 'IL',
            'Indiana': 'IN',
            'Iowa': 'IA',
            'Kansas': 'KS',
            'Kentucky': 'KY',
            'Louisiana': 'LA',
            'Maine': 'ME',
            'Maryland': 'MD',
            'Massachusetts': 'MA',
            'Michigan': 'MI',
            'Minnesota': 'MN',
            'Mississippi': 'MS',
            'Missouri': 'MO',
            'Montana': 'MT',
            'Nebraska': 'NE',
            'Nevada': 'NV',
            'New Hampshire': 'NH',
            'New Jersey': 'NJ',
            'New Mexico': 'NM',
            'New York': 'NY',
            'North Carolina': 'NC',
            'North Dakota': 'ND',
            'Ohio': 'OH',
            'Oklahoma': 'OK',
            'Oregon': 'OR',
            'Pennsylvania': 'PA',
            'Rhode Island': 'RI',
            'South Carolina': 'SC',
            'South Dakota': 'SD',
            'Tennessee': 'TN',
            'Texas': 'TX',
            'Utah': 'UT',
            'Vermont': 'VT',
            'Virginia': 'VA',
            'Washington': 'WA',
            'West Virginia': 'WV',
            'Wisconsin': 'WI',
            'Wyoming': 'WY',
            'District of Columbia': 'DC'
        };
        
        const stateCode = stateCodeMap[stateName];
        if (!stateCode) {
            return [];
        }
        
        // Filter and group data by city
        const filteredData = data.filter(entry => entry.loc_admin_state === stateCode);
        console.log(`Raw filtered entries for ${stateCode}:`, filteredData.length);
        
        const cityData = filteredData.reduce((acc, entry) => {
            const city = entry.loc_admin_city.toLowerCase();
            if (!acc[city]) {
                acc[city] = {
                    city: city,
                    locations: entry.entry_count
                };
            } else {
                acc[city].locations += entry.entry_count;
            }
            return acc;
        }, {});
        
        const cities = Object.values(cityData);
        console.log(`Cities with location counts for ${stateCode}:`, 
            cities.map(c => `${c.city}: ${c.locations}`).slice(0, 5));
        
        // Get coordinates for each city
        const citiesWithCoords = await Promise.all(
            cities.map(async (cityInfo) => {
                const coords = await getLocalCoordinates(cityInfo.city, stateCode);
                if (coords) {
                    return {
                        ...cityInfo,
                        lat: coords.lat,
                        lon: coords.lon
                    };
                }
                return null;
            })
        );
        
        const validCities = citiesWithCoords.filter(city => city !== null);
        console.log(`Cities with valid coordinates:`, 
            validCities.map(c => `${c.city}: ${c.locations}`).slice(0, 5));
            
        return validCities;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Function to draw diamonds on the state view
export async function drawVaccinationSpots(stateName, container, projection) {
    // Get the current toggle state from the checkbox
    const isFlu = document.getElementById('rsv-check').checked;
    
    // Clear any existing spots
    container.selectAll(".vaccination-spot").remove();
    
    // Get vaccination locations data based on current toggle state
    const vaccinationData = await getVaccinationLocations(stateName, isFlu);
    
    if (vaccinationData.length === 0) {
        return;
    }
    
    // Create SVG group for spots
    const spotsGroup = container.append("g")
        .attr("class", "vaccination-spots");
    
    // Use a fixed maximum scale for both datasets to show absolute differences
    const FIXED_MAX_LOCATIONS = 2500;
    
    // Create a scale for diamond sizes - adjusted for the state view scale
    const sizeScale = d3.scaleLinear()
        .domain([1, FIXED_MAX_LOCATIONS])
        .range([5, 15])
        .clamp(true); // Clamp values to prevent extremely large diamonds
    
    // Create tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

   
    // Draw diamonds for each city
    const diamonds = spotsGroup.selectAll("path")
        .data(vaccinationData.sort((a, b) => b.locations - a.locations))
        .enter()
        .append("path")
        .attr("class", "vaccination-spot")
        .attr("d", d => {
            const coords = projection([d.lon, d.lat]);
            if (!coords) return "";
            const [x, y] = coords;
            const size = sizeScale(d.locations);
            return `M ${x} ${y-size} L ${x+size} ${y} L ${x} ${y+size} L ${x-size} ${y} Z`;
        })
        .style("fill", "#ff4444")
        .style("opacity", isFlu ? 0.6 : 0.8)
        .style("stroke", "none")
        .style("stroke-width", 0)
        .style("cursor", "pointer")
        // Add hover effects
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", "#ff6666")
                .style("opacity", 1);
                
            tooltip.html(`
                <strong>${d.city.toUpperCase()}</strong><br/>
                ${d.locations} vaccination site${d.locations > 1 ? 's' : ''}<br/>
                ${isFlu ? '(Flu Vaccines)' : '(COVID-19 Vaccines)'}
            `)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", "#ff4444")
                .style("opacity", isFlu ? 0.6 : 0.8);
                
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        });
    
    // Add a small text label showing the type and scale
    container.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .style("font-size", "12px")
        .style("fill", "#666")
        .text(`# of available ${isFlu ? 'flu' : 'COVID'} vaccination sites`);
        
    // Comment out zoom instructions
    /*
    // Add zoom instructions
    container.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Use mouse wheel to zoom in/out");
    */
}

// Function to update spots when the state view changes
export function updateVaccinationSpots(stateName, container, projection) {
    drawVaccinationSpots(stateName, container, projection);
} 
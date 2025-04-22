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
            console.log('Loaded city coordinates data');
        } catch (error) {
            console.error('Error loading city coordinates:', error);
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
    console.warn(`No coordinates found for ${city}, ${state}`);
    return null;
}

// Function to get vaccination locations data
async function getVaccinationLocations(stateName) {
    try {
        console.log('Loading data for state:', stateName);
        const response = await fetch('/data/summary_covid_prov.json');
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
            console.warn(`No state code mapping for ${stateName}`);
            return [];
        }
        
        // Filter and group data by city
        const cityData = data
            .filter(entry => entry.loc_admin_state === stateCode)
            .reduce((acc, entry) => {
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
        console.log(`Processing ${cities.length} cities for ${stateCode}`);
        
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
        
        return citiesWithCoords.filter(city => city !== null);
    } catch (error) {
        console.error('Error loading vaccination location data:', error);
        return [];
    }
}

// Function to draw diamonds on the state view
export async function drawVaccinationSpots(stateName, container, projection) {
    console.log('Drawing spots for:', stateName);
    // Clear any existing spots
    container.selectAll(".vaccination-spot").remove();
    
    // Get vaccination locations data
    const vaccinationData = await getVaccinationLocations(stateName);
    console.log('Got vaccination data:', vaccinationData.length, 'cities');
    
    if (vaccinationData.length === 0) {
        console.warn(`No vaccination data found for ${stateName}`);
        return;
    }
    
    // Create SVG group for spots
    const spotsGroup = container.append("g")
        .attr("class", "vaccination-spots");
    
    // Find the maximum number of locations for scaling
    const maxLocations = d3.max(vaccinationData, d => d.locations);
    console.log('Max locations:', maxLocations);
    
    // Create a scale for diamond sizes - adjusted for the state view scale
    const sizeScale = d3.scaleLinear()
        .domain([1, maxLocations])
        .range([5, 15]); // Smaller diamonds to fit the state view better
    
    // Draw diamonds for each city - draw larger ones first so they appear in back
    spotsGroup.selectAll("path")
        .data(vaccinationData.sort((a, b) => b.locations - a.locations)) // Sort by size descending
        .enter()
        .append("path")
        .attr("class", "vaccination-spot")
        .attr("d", d => {
            const coords = projection([d.lon, d.lat]);
            console.log('Projecting:', d.city, [d.lon, d.lat], 'to:', coords);
            if (!coords) return "";
            const [x, y] = coords;
            const size = sizeScale(d.locations);
            
            // Create a diamond shape (rotated square)
            return `M ${x} ${y-size} L ${x+size} ${y} L ${x} ${y+size} L ${x-size} ${y} Z`;
        })
        .style("fill", "#ff4444") // Red color as shown in the example
        .style("opacity", 0.8)
        .style("stroke", "white")
        .style("stroke-width", 0.5)
        .append("title")
        .text(d => `${d.city}: ${d.locations} vaccination locations`);
    
    // Add a small text label for "# of available vaccination sites"
    container.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("# of available vaccination sites");
}

// Function to update spots when the state view changes
export function updateVaccinationSpots(stateName, container, projection) {
    drawVaccinationSpots(stateName, container, projection);
} 
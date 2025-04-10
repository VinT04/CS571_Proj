/**
 * Vaccination Spots Visualization
 * This module generates diamonds on the state view representing vaccination spots,
 * with the size of each diamond corresponding to the number of vaccination locations in that city.
 */

// Hardcoded fake data for cities by state
const FAKE_CITY_DATA = {
    "colorado": [
        { city: "Denver", lat: 39.7392, lon: -104.9903, locations: 15 },
        { city: "Colorado Springs", lat: 38.8339, lon: -104.8214, locations: 12 },
        { city: "Aurora", lat: 39.7294, lon: -104.8319, locations: 10 },
        { city: "Fort Collins", lat: 40.5853, lon: -105.0844, locations: 8 },
        { city: "Boulder", lat: 40.0150, lon: -105.2705, locations: 7 },
        { city: "Lakewood", lat: 39.7047, lon: -105.0814, locations: 6 },
        { city: "Pueblo", lat: 38.2544, lon: -104.6091, locations: 5 },
        { city: "Grand Junction", lat: 39.0639, lon: -108.5506, locations: 4 },
        { city: "Greeley", lat: 40.4233, lon: -104.7091, locations: 4 },
        { city: "Longmont", lat: 40.1672, lon: -105.1019, locations: 3 },
        { city: "Loveland", lat: 40.3977, lon: -105.0749, locations: 3 },
        { city: "Broomfield", lat: 39.9205, lon: -105.0867, locations: 3 },
        { city: "Castle Rock", lat: 39.3722, lon: -104.8561, locations: 2 },
        { city: "Parker", lat: 39.5186, lon: -104.7613, locations: 2 },
        { city: "Commerce City", lat: 39.8083, lon: -104.9339, locations: 2 }
    ],
    "texas": [
        { city: "Houston", lat: 29.7604, lon: -95.3698, locations: 25 },
        { city: "San Antonio", lat: 29.4241, lon: -98.4936, locations: 20 },
        { city: "Dallas", lat: 32.7767, lon: -96.7970, locations: 18 },
        { city: "Austin", lat: 30.2672, lon: -97.7431, locations: 15 },
        { city: "Fort Worth", lat: 32.7555, lon: -97.3308, locations: 12 },
        { city: "El Paso", lat: 31.7619, lon: -106.4850, locations: 10 },
        { city: "Arlington", lat: 32.7357, lon: -97.1081, locations: 8 },
        { city: "Corpus Christi", lat: 27.8006, lon: -97.3964, locations: 7 },
        { city: "Plano", lat: 33.0198, lon: -96.6989, locations: 6 },
        { city: "Lubbock", lat: 33.5779, lon: -101.8552, locations: 5 },
        { city: "Irving", lat: 32.8140, lon: -96.9489, locations: 4 },
        { city: "Amarillo", lat: 35.2220, lon: -101.8313, locations: 4 },
        { city: "Waco", lat: 31.5493, lon: -97.1467, locations: 3 },
        { city: "Tyler", lat: 32.3513, lon: -95.3011, locations: 3 },
        { city: "College Station", lat: 30.6280, lon: -96.3344, locations: 3 }
    ],
    "florida": [
        { city: "Jacksonville", lat: 30.3322, lon: -81.6557, locations: 20 },
        { city: "Miami", lat: 25.7617, lon: -80.1918, locations: 18 },
        { city: "Tampa", lat: 27.9506, lon: -82.4572, locations: 15 },
        { city: "Orlando", lat: 28.5383, lon: -81.3792, locations: 12 },
        { city: "St. Petersburg", lat: 27.7676, lon: -82.6403, locations: 10 },
        { city: "Hialeah", lat: 25.8576, lon: -80.2781, locations: 8 },
        { city: "Tallahassee", lat: 30.4383, lon: -84.2807, locations: 7 },
        { city: "Fort Lauderdale", lat: 26.1224, lon: -80.1373, locations: 6 },
        { city: "Port St. Lucie", lat: 27.2731, lon: -80.3534, locations: 5 },
        { city: "Cape Coral", lat: 26.5629, lon: -81.9495, locations: 4 },
        { city: "Gainesville", lat: 29.6516, lon: -82.3248, locations: 4 },
        { city: "Clearwater", lat: 27.9659, lon: -82.8001, locations: 3 },
        { city: "Palm Bay", lat: 28.0345, lon: -80.5887, locations: 3 },
        { city: "Lakeland", lat: 28.0395, lon: -81.9498, locations: 3 },
        { city: "Daytona Beach", lat: 29.2108, lon: -81.0228, locations: 2 }
    ],
    "california": [
        { city: "Los Angeles", lat: 34.0522, lon: -118.2437, locations: 30 },
        { city: "San Diego", lat: 32.7157, lon: -117.1611, locations: 25 },
        { city: "San Jose", lat: 37.3382, lon: -121.8863, locations: 20 },
        { city: "San Francisco", lat: 37.7749, lon: -122.4194, locations: 18 },
        { city: "Fresno", lat: 36.7378, lon: -119.7871, locations: 15 },
        { city: "Sacramento", lat: 38.5816, lon: -121.4944, locations: 12 },
        { city: "Long Beach", lat: 33.7701, lon: -118.1937, locations: 10 },
        { city: "Oakland", lat: 37.8044, lon: -122.2711, locations: 8 },
        { city: "Bakersfield", lat: 35.3733, lon: -119.0187, locations: 7 },
        { city: "Anaheim", lat: 33.8366, lon: -117.9143, locations: 6 },
        { city: "Santa Ana", lat: 33.7455, lon: -117.8677, locations: 5 },
        { city: "Riverside", lat: 33.9534, lon: -117.3962, locations: 4 },
        { city: "Stockton", lat: 37.9577, lon: -121.2908, locations: 4 },
        { city: "Irvine", lat: 33.6846, lon: -117.8265, locations: 3 },
        { city: "Chula Vista", lat: 32.6401, lon: -117.0842, locations: 3 }
    ]
};

// Function to get vaccination locations data
async function getVaccinationLocations(stateName) {
    // Convert state name to lowercase for comparison
    const stateKey = stateName.toLowerCase();
    
    // Return hardcoded data for the state, or empty array if not found
    return FAKE_CITY_DATA[stateKey] || [];
}

// Function to draw diamonds on the state view
export async function drawVaccinationSpots(stateName, container, projection) {
    // Clear any existing spots
    container.selectAll(".vaccination-spot").remove();
    
    // Get vaccination locations data
    const vaccinationData = await getVaccinationLocations(stateName);
    
    if (vaccinationData.length === 0) {
        console.warn(`No vaccination data found for ${stateName}`);
        return;
    }
    
    // Create SVG group for spots
    const spotsGroup = container.append("g")
        .attr("class", "vaccination-spots");
    
    // Find the maximum number of locations for scaling
    const maxLocations = d3.max(vaccinationData, d => d.locations);
    
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
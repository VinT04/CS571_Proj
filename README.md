# VaxInfo
This repo is dedicated to the construction of a visualization program that works on vaccination data

For project notes, make sure to run the file on Chrome, as we are experiencing porting issues on other browsers.

## Introduction
VaxInfo is an all encompassing tool that lets users visualize survey trends regarding COVID vaccinations.
It allows users to view vaccination metrics of COVID and the flu for comparison, and allows users to make relationships
regarding the data.

## Code Overview
The project is organized into two main directories:
1. `src/`: Contains our visualization code
   - `map.js`: Main visualization logic for the national map
   - `stateGraphs.js`: Generates state-level demographic charts
   - `vaccinationSpots.js`: Handles vaccination site visualization
   - `stateView.js`: Manages state-level view transitions
   - `index.html`: Main entry point and UI structure

2. `data/`: Contains the vaccination data files
   - `covid_data/`: State-specific COVID-19 vaccination datasets (e.g., `ArkansasCOVID_dataset.json`)
   - `flu_data/`: State-specific flu vaccination datasets (e.g., `Connecticut_dataset_flu.json`)


## Data Sources
Our vaccination data has been source from the National Immunization Survey, as well as Census data. Our goal was to find 
accurate survey data that would provide vaccination information through different demographics. Additionally, we wanted 
support that information with additional context of how many major vaccination sites exist in a state, as well as where 
they are located.
![img_4.png](img_4.png)
## Structure/Setup of Website
### Homepage
VaxInfo's homepage provides users with a national view, with viewers being able to hover over states observe their statewide
vaccination percentage for the given time periods. Time periods can be alternate through a slider, and the users can switch 
between COVID and flu data at the click of a switch next to the slider.
![img.png](img.png)
### State
When hovering over states, viewers can see vaccination data for the specified time period, but if users wish to see detailed
statistics about the state or view vaccination sites around the state, then can click on the state in order to look at locations 
of vaccination sites around the state. Hovering over site indicators shows the amount of sites in the specified county, adding 
another layer of detail to the visualization.
![img_1.png](img_1.png)
### Detailed
The "Detail Statistics" button, present in both national and state views, allows the user to view metrics for the specified
area through lenses of demographics that the visualization offers. Some of the demographics the visualization offers are:
* Age
* Sex
* Sexual Orientation
* Metropolitan Area
* Race/Ethnicity
* Poverty Status
![img_2.png](img_2.png)
![img_3.png](img_3.png)
All of these can be altered, meaning that users can see any combination of the values for each of these demographics, 
allowing for further customization.

## Link to Presentation/Screencast

https://youtu.be/fhgTP65VJ-4


## Link to Web Application
[![Launch App](https://img.shields.io/badge/Launch-App-red)](https://vint04.github.io/CS571_Proj/)
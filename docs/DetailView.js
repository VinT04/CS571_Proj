const dems_detail = new Map([
    ['Age', ['18-49 years',
        '50-64 years',
        '65+ years']],
    ['Race/Ethnicity (7 level)', ['Asian, non-Hispanic',
        'Black, non-Hispanic',
        'American Indian/Alaska Native, non-Hispanic',
        'White, non-Hispanic',
        'Other or multiple races, non-Hispanic',
        'Hispanic',
        'Native Hawaiian/Pacific Islander, non-Hispanic']],
    ['Sex', ['Female',
        'Male']],
    ['Sexual orientation', ['Don\'t know / refused',
        'Gay/Lesbian/Bisexual/Other',
        'Heterosexual/Straight']],
    ['Poverty status', ['Above poverty, income <$75k',
        'Below poverty',
        'Unknown income',
        'Above poverty, income >=$75k']],
    ['Metropolitan statistical area', ['Urban',
        'Suburban',
        'Rural']]
]);

const options = document.getElementById('Dem-option');

/**
 * Sets up the detailed overview for the states adn /or national statistics
 * @param {*} geo Must be a state name or just the string 'national'
 * @param {*} rsv Msut be a boolean corresponding over whether to use rsv data or not
 */
export function setUpDetail(geo, rsv) {
    switch (geo) {
        case value:

            break;

        default:
            break;
    }
}
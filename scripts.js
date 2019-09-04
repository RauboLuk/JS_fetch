const form = document.querySelector('.select-country');
const input = form.querySelector('#country');
const submit = form.querySelector('#test');
const citiesList = document.querySelector('#cities');

const countries = [
    'PL',
    'DE',
    'ES',
    'FR'
];

// input.addEventListener("keyup", handleInput);
submit.addEventListener('click', handleInput);


function handleInput(e) {
    e.preventDefault();
    console.log(e.keyCode);
    // Get input value
    const country = input.value;
    // Don't fetch if country isnt on the list
    // TODO reduce queries
    const citiesPollution = [];
    if( !countries.includes(country) || e.keyCode === 16) return;
    else {
        getCities(country)
        .then(cities => {
            cities.map(element => CityAvg(element.city, country, citiesPollution));
        })
            
            // cities.map(element => {
            // CityAvg(element.city, country, citiesPollution)
            // .then(cityAvg => citiesPollution.push({ ...cityAvg}));
            // }));
    }
    setTimeout(() => {
        console.log(citiesPollution.sort((a, b) => b.pm10 - a.pm10));
        citiesPollution.innerHTML = '';
        for(let i = 0; i < 10; i++){
            citiesList.innerHTML += `
            <li>City: ${citiesPollution[i].city}, PM10: ${citiesPollution[i].pm10}, PM2.5: ${citiesPollution[i].pm25}</li>
            `;
        }
    }, 5000);
}

function getCities(country) {
    return new Promise((resolve, rejesct) => resolve(fetch(`https://api.openaq.org/v1/cities?country=${country}&limit=10000`)
    .then(response => response.json())
    .then(json => json.results)));
    // TODO catch ? reject
}

function CityAvg(city, country, citiesPollution) {
    fetch(`https://api.openaq.org/v1/measurements?country=${country}&city=${city}&parameter[]=pm10&parameter[]=pm25&date_from[]=2019-08-04&limit=10000`)
    .then(response => response.json())
    .then(json => {
        if(json.meta.found === 0) return;
        let pm10 = 0;
        let pm10c = 0
        let pm25 = 0;
        let pm25c = 0;
        json.results.map(ele => {
            if( ele.parameter === "pm10" ){
                pm10 += ele.value;
                pm10c++
            }
            else if ( ele.parameter === "pm25" ){
                pm25 += ele.value;
                pm25c++;
            }
        })
        citiesPollution.push({
            city,
            pm10: Math.round(pm10/pm10c),
            pm25: Math.round(pm25/pm25c)
        })
        // console.log(`City ${city}, pm10: ${Math.round(pm10/pm10c)}, pm25: ${Math.round(pm25/pm25c)}`);
    })
}


// 'Poland',
// 'Germany',
// 'Spain',
// 'France'
// https://api.openaq.org/v1/measurements?country=PL&city=Pozna%C5%84&parameter[]=10&parameter[]=pm25
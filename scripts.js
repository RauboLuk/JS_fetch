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
    // Get input value
    // TODO change to event.value?
    const country = input.value;
    let citiesPollution = [];
    citiesPollution.splice(0, citiesPollution.length - 1);
    // Don't fetch if country isnt on the list
    if( !countries.includes(country) || e.keyCode === 16) return;
    else {
        // TODO remove consolelogs
        // CityAvg('Poznań', 'PL', citiesPollution).then(te => console.log(te));
        // getCities('PL').then(data => console.log(data));
        getCities(country).then(cit => {
            Promise.all(cit.map(obj =>
                CityAvg(obj.city, country, citiesPollution)))
                .then(data => {
                    citiesPollution = [...data];
                    displayCities(citiesPollution);
                })
            })
        }
}

function getCities(country) {
    return new Promise((resolve, reject) => resolve(fetch(`https://api.openaq.org/v1/cities?country=${country}&limit=10000`)
    .then(response => response.json())
    .then(json => json.results)));
    // TODO catch ? reject
}

function CityAvg(city, country, citiesPollution, dateFrom) {
    if(!dateFrom) {
        const today = new Date();
        // TODO change variable name
        today.setMonth(today.getMonth() - 1);
        dateFrom = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
    }
    return new Promise ((resolve, reject) => resolve(fetch(`https://api.openaq.org/v1/measurements?country=${country}&city=${city}&parameter[]=pm10&parameter[]=pm25&date_from[]=${dateFrom}&limit=10000`)
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
        //TODO handle no data pm10 || pm25
        return({
            city,
            pm10: Math.round(pm10/pm10c),
            pm25: Math.round(pm25/pm25c),
        })
    })))
}

//TODO add sorting by pm25 or pm10
function displayCities(cities) {
    cities.sort((a, b) => b.pm10 - a.pm10);
    cities.splice(10);
    getCityDesc(cities)
        .then(descriptions => {
            citiesList.innerHTML = '';
            for(let i = 0; i < 10; i++){
                citiesList.innerHTML += `
                <li>
                    City: ${cities[i].city}, PM10: ${cities[i].pm10}, PM2.5: ${cities[i].pm25}</br>
                    Description: ${descriptions[i]}
                    </li>
                    `;
            }
        });
}

function getCityDesc(cities) {
    const titles = cities.map(cit => cit.city).join('|');
    return new Promise ((resolve, reject) => resolve(fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=description&titles=${titles}&redirects=1`)
        .then(response => response.json())
        .then(json => {
            const pages = json.query.pages;
            const citiesDescription = []
            // What if pages.lenght > 1?
            for(let p in pages){
                citiesDescription.push(pages[p].description);
            }
            return citiesDescription;
    })))
}

// 'Poland',
// 'Germany',
// 'Spain',
// 'France'
// /w/api.php?action=query&format=json&prop=description&titles=Warszawa&redirects=1

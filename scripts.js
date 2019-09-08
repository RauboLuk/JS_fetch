const form = document.querySelector('#select-country');
const input = form.querySelector('#country');
const submit = form.querySelector('#Button');
const citiesList = document.querySelector('#cities');
const alert = document.querySelector('.alert');
const spinner = document.querySelector('.spinner-border');

const countries = {
    'Poland': 'PL',
    'Germany': 'DE',
    'Spain': 'ES',
    'France': 'FR'
};

input.value = JSON.parse(sessionStorage.getItem('value')) || '';

// input.addEventListener("keyup", handleInput);
submit.addEventListener('click', handleInput);
submit.countries = countries;


function handleInput(e) {
    e.preventDefault();
    sessionStorage.setItem('value', JSON.stringify(input.value));
    // Get input value
    // TODO change to event.value?
    const country = countries[input.value];
    let citiesPollution = [];
    // Don't fetch if country isnt on the list
    if( !Object.values(countries).includes(country) || e.keyCode === 16) {
        alert.hidden ? alert.hidden = false : null;
        return;
    }
    else {
        alert.hidden = true;
        spinner.hidden = false;
        // TODO remove consolelogs
        // CityAvg('Poznań', 'PL', citiesPollution).then(te => console.log(te));
        // getCities('PL').then(data => console.log(data));
        getCities(country).then(cit => {
            Promise.all(cit.map(obj =>
                CityAvg(obj.city, country, citiesPollution)))
                .then(data => {
                    citiesPollution = [...data];
                    displayCities(citiesPollution);
                    spinner.hidden = true
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
    citiesList.innerHTML = '';
    const test = [];
    Promise.all(cities.map((city, i) => {
        getCityDesc(city.city).then(description => {
            return {
                nr: i ,
                html: 
            `
            <tr data-toggle="collapse" data-target="#accordion${i}" class="clickable">
                <th scope="row">${i+1}</th>
                <td>${city.city}</td>
                <td>${city.pm10 || 'No data'}</td>
                <td>${city.pm25 || 'No data'}</td>
                <td>Show description</td>
            </tr>
            <tr>
                <td colspan="3">
                    <div id="accordion${i}" class="collapse">${description[0]}</div>
                </td>
            </tr>
            `};
        }).then(x => {
            citiesList.innerHTML = '';
            test.push(x);
            test.sort((a, b) => a['nr'] - b['nr'])
            test.map(z => citiesList.innerHTML += z.html);
        });
    }));
}

function getCityDesc(citiyName) {
    return new Promise ((resolve, reject) => resolve(fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=description&titles=${citiyName}&redirects=1`)
        .then(response => response.json())
        .then(json => {
            const pages = json.query.pages;
            const citiesDescription = []
            for(let p in pages){
                citiesDescription.push(pages[p].description);
            }
            return citiesDescription;
    })))
}
const displayValueOnEl = (select, value) => {
    const el = document.querySelector(select);
    if (el) {
        el.textContent = value;
    }
}


const form = document.querySelector('#cityForm');
const cityInput = document.querySelector('#cityInput');

const handleSearch = async (event) => {
    if (event) {
        event.preventDefault();
    }

    const city = cityInput.value.trim();
    if (!city) {
        cityInput.focus();
        return;
    }

    const [lat, lon] = await getLatLngByCityName(city);
    if (lat && lon) {
        const weatherData = await getWeatherData(lat, lon);
        const { current_weather: { temperature } } = weatherData;

        const hourlyTemps = fetchTodaysTimesWithTemp(weatherData.hourly);
        console.log('weatherData', weatherData, hourlyTemps);

        displayValueOnEl('#cityName', toCapitalize(city));
        displayValueOnEl('#currentDate', new Date().toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric', hour12: true }));
        displayValueOnEl('#temp', temperature.toFixed(0));

        renderHourlyTemps(hourlyTemps);
    }
};

form.addEventListener('submit', handleSearch);
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSearch(event);
    }
});

const toCapitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const fetchTodaysTimesWithTemp = (hourly) => {
    const today = new Date(Date.now() + 5 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    if (hourly && hourly.time) {
        const todayTimes = hourly.time
            .filter((time) => time.startsWith(today));
        return todayTimes.map(time => ({ time: time.split('T')[1], temp: hourly.temperature_2m[hourly.time.indexOf(time)] }));
    }
}

const renderHourlyTemps = (temps) => {
    const hourlyRootContainer = document.querySelector('#hourlyRootContainer');
    hourlyRootContainer.classList.remove('hidden');

    temps.map(({ time, temp }) => {
        const [hours, minutes] = time.split(':');
        const ampm = hours >= 12 ? 'pm' : 'am';
        const formattedHours = hours % 12 || 12;
        time = `${formattedHours}:${minutes} ${ampm}`;

        const el = document.createElement('div');
        el.className = 'flex-1 text-white text-center mr-2';

        el.innerHTML = `<div class="text-xs">${time}</div>
            <div><i class="bi bi-cloud-fill"></i></div>
            <div class="text-xs">${temp}°</div>`;

        document.querySelector('#hourlyTempsContainer').appendChild(el);
    });

}

const getLatLngByCityName = async (city) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
    const data = await res.json();
    if (data.length > 0) {
        const { lat, lon } = data[0];
        return [lat, lon];
    } else {
        console.error("City not found");
        return [null, null];
    }
}

const getWeatherData = async (lat, lon) => {
    const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature`);
    const data = await req.json();
    return data;
}

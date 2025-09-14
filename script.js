const apiKey = "61b8e1f67cbfde1df582a0056125723d"; // 🔑 Replace with your OpenWeather key
let units = localStorage.getItem("units") || "metric";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const unitSelect = document.getElementById("unitSelect");
const themeBtn = document.getElementById("themeBtn");
const weatherResult = document.getElementById("weatherResult");
const forecastDiv = document.getElementById("forecast");
const message = document.getElementById("message");
const favList = document.getElementById("favList");

unitSelect.value = units;

// Event listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

unitSelect.addEventListener("change", () => {
  units = unitSelect.value;
  localStorage.setItem("units", units);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => showMessage("Location access denied.")
    );
  } else {
    showMessage("Geolocation not supported.");
  }
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("dark");
}

// Fetch weather by city
async function getWeather(city) {
  try {
    message.textContent = "Loading...";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`
    );
    const data = await res.json();
    if (res.ok) {
      renderCurrentWeather(data);
      getForecast(data.coord.lat, data.coord.lon);
    } else {
      showMessage(data.message);
    }
  } catch {
    showMessage("Error fetching data.");
  }
}

// Fetch weather by coordinates
async function getWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
    );
    const data = await res.json();
    if (res.ok) {
      renderCurrentWeather(data);
      getForecast(lat, lon);
    } else {
      showMessage(data.message);
    }
  } catch {
    showMessage("Error fetching location data.");
  }
}

// Render current weather + favorites button
function renderCurrentWeather(data) {
  message.textContent = "";

  // Detect condition for animation class
  let condition = data.weather[0].main.toLowerCase();
  let iconClass = "weather-icon";

  if (condition.includes("sun") || condition.includes("clear")) {
    iconClass += " sunny";
  } else if (condition.includes("rain")) {
    iconClass += " rainy";
  } else if (condition.includes("cloud")) {
    iconClass += " cloudy";
  } else if (condition.includes("snow")) {
    iconClass += " snowy";
  }

  // 🌤 Background change according to weather
  document.body.classList.remove("bg-sunny", "bg-rainy", "bg-cloudy", "bg-snowy");
  if (condition.includes("sun") || condition.includes("clear")) {
    document.body.classList.add("bg-sunny");
  } else if (condition.includes("rain")) {
    document.body.classList.add("bg-rainy");
  } else if (condition.includes("cloud")) {
    document.body.classList.add("bg-cloudy");
  } else if (condition.includes("snow")) {
    document.body.classList.add("bg-snowy");
  }

  weatherResult.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
           class="${iconClass}" 
           onclick="toggleAnimate(this)">
      ${data.weather[0].description}
    </p>
    <p>🌡 Temp: ${Math.round(data.main.temp)} ${units === "metric" ? "°C" : "°F"}</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌬 Wind: ${data.wind.speed} ${units === "metric" ? "m/s" : "mph"}</p>
    <button onclick="addFavorite('${data.name}')">⭐ Add to Favorites</button>
  `;
}

// Fetch 5-day forecast
async function getForecast(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
    );
    const data = await res.json();
    if (res.ok) {
      renderForecast(data.list);
    } else {
      showMessage(data.message);
    }
  } catch {
    showMessage("Error fetching forecast.");
  }
}

// Render forecast
function renderForecast(list) {
  forecastDiv.innerHTML = "";
  const daily = {};

  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toDateString();

    // Only save the first forecast for each day
    if (!daily[day]) {
      daily[day] = item;
    }
  });

  // Show next 5 days
  Object.values(daily).slice(0, 5).forEach(day => {
    const date = new Date(day.dt * 1000);

    // Weather condition for icon class
    let condition = day.weather[0].main.toLowerCase();
    let iconClass = "weather-icon";

    if (condition.includes("sun") || condition.includes("clear")) {
      iconClass += " sunny";
    } else if (condition.includes("rain")) {
      iconClass += " rainy";
    } else if (condition.includes("cloud")) {
      iconClass += " cloudy";
    } else if (condition.includes("snow")) {
      iconClass += " snowy";
    }

    forecastDiv.innerHTML += `
      <div class="forecast-day">
        <h4>${date.toDateString().slice(0, 10)}</h4>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
             class="${iconClass}" 
             onclick="toggleAnimate(this)">
        <p>${Math.round(day.main.temp)} ${units === "metric" ? "°C" : "°F"}</p>
        <p>${day.weather[0].description}</p>
      </div>
    `;
  });
}

// Toggle animation (for mobile tap)
function toggleAnimate(el) {
  el.classList.toggle("active");
}

// Favorites
function addFavorite(city) {
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
  }
}

function removeFavorite(city) {
  favorites = favorites.filter(c => c !== city);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  favList.innerHTML = "";
  favorites.forEach(city => {
    const div = document.createElement("div");
    div.className = "fav-item";
    div.innerHTML = `
      ${city}
      <button onclick="removeFavorite('${city}')">x</button>
    `;
    div.addEventListener("click", () => getWeather(city));
    favList.appendChild(div);
  });
}

// Show messages
function showMessage(msg) {
  message.textContent = msg;
}

// Initialize on page load
initTheme();
renderFavorites();

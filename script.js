const apiKey = "61b8e1f67cbfde1df582a0056125723d"; 
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
searchBtn.addEventListener("click", () => { const city = cityInput.value.trim(); if(city) getWeather(city); });
unitSelect.addEventListener("change", () => { units = unitSelect.value; localStorage.setItem("units", units); });
locationBtn.addEventListener("click", () => {
  if(navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude), () => showMessage("Location access denied."));
  else showMessage("Geolocation not supported.");
});
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
function initTheme() { const saved = localStorage.getItem("theme"); if(saved==="dark") document.body.classList.add("dark"); }

// Fetch weather by city
async function getWeather(city){
  try {
    message.textContent="Loading...";
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
    const data = await res.json();
    if(res.ok){ renderCurrentWeather(data); getForecast(data.coord.lat, data.coord.lon);}
    else showMessage(data.message);
  } catch { showMessage("Error fetching data."); }
}

// Fetch weather by coords
async function getWeatherByCoords(lat, lon){
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    const data = await res.json();
    if(res.ok){ renderCurrentWeather(data); getForecast(lat, lon);}
    else showMessage(data.message);
  } catch { showMessage("Error fetching location data."); }
}

// Render current weather
function renderCurrentWeather(data){
  message.textContent="";
  let condition = data.weather[0].main.toLowerCase();
  let wrapperClass="weather-icon-wrapper";
  if(condition.includes("sun")||condition.includes("clear")) wrapperClass+=" sunny";
  else if(condition.includes("rain")) wrapperClass+=" rainy active";
  else if(condition.includes("cloud")) wrapperClass+=" cloudy";
  else if(condition.includes("snow")) wrapperClass+=" snowy active";
  else if(condition.includes("haze")||condition.includes("fog")||condition.includes("mist")||condition.includes("smoke")) wrapperClass+=" haze";

  // Dynamic background
  document.body.classList.remove("bg-sunny","bg-rainy","bg-cloudy","bg-snowy");
  if(condition.includes("sun")||condition.includes("clear")) document.body.classList.add("bg-sunny");
  else if(condition.includes("rain")) document.body.classList.add("bg-rainy");
  else if(condition.includes("cloud")) document.body.classList.add("bg-cloudy");
  else if(condition.includes("snow")) document.body.classList.add("bg-snowy");

  weatherResult.innerHTML=`
    <h2>${data.name}, ${data.sys.country}</h2>
    <div class="${wrapperClass}">
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" class="weather-icon">
    </div>
    <p>${data.weather[0].description}</p>
    <p>🌡 Temp: ${Math.round(data.main.temp)} ${units==="metric"?"°C":"°F"}</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌬 Wind: ${data.wind.speed} ${units==="metric"?"m/s":"mph"}</p>
    <button onclick="addFavorite('${data.name}')">⭐ Add to Favorites</button>
  `;
  enableMobileAnimations();
}

// Fetch forecast
async function getForecast(lat, lon){
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    const data = await res.json();
    if(res.ok) renderForecast(data.list);
    else showMessage(data.message);
  } catch { showMessage("Error fetching forecast."); }
}

// Render forecast
function renderForecast(list){
  forecastDiv.innerHTML="";
  const daily={};
  list.forEach(item=>{ const date=new Date(item.dt*1000); const day=date.toDateString(); if(!daily[day]) daily[day]=item; });
  Object.values(daily).slice(0,5).forEach(day=>{
    const date=new Date(day.dt*1000);
    let condition=day.weather[0].main.toLowerCase();
    let wrapperClass="weather-icon-wrapper";
    if(condition.includes("sun")||condition.includes("clear")) wrapperClass+=" sunny";
    else if(condition.includes("rain")) wrapperClass+=" rainy active";
    else if(condition.includes("cloud")) wrapperClass+=" cloudy";
    else if(condition.includes("snow")) wrapperClass+=" snowy active";
    else if(condition.includes("haze")||condition.includes("fog")||condition.includes("mist")||condition.includes("smoke")) wrapperClass+=" haze";

    forecastDiv.innerHTML+=`
      <div class="forecast-day">
        <h4>${date.toDateString().slice(0,10)}</h4>
        <div class="${wrapperClass}">
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" class="weather-icon">
        </div>
        <p>${Math.round(day.main.temp)} ${units==="metric"?"°C":"°F"}</p>
        <p>${day.weather[0].description}</p>
      </div>
    `;
  });
  enableMobileAnimations();
}

// Mobile tap animation
function enableMobileAnimations(){
  if(/Mobi|Android/i.test(navigator.userAgent)){
    document.querySelectorAll('.weather-icon-wrapper').forEach(wrapper=>{
      wrapper.addEventListener('touchstart',()=>wrapper.classList.toggle('active'));
    });
  }
}

// Favorites
function addFavorite(city){ if(!favorites.includes(city)){ favorites.push(city); localStorage.setItem("favorites",JSON.stringify(favorites)); renderFavorites(); } }
function removeFavorite(city){ favorites=favorites.filter(c=>c!==city); localStorage.setItem("favorites",JSON.stringify(favorites)); renderFavorites(); }
function renderFavorites(){ favList.innerHTML=""; favorites.forEach(city=>{ const div=document.createElement("div"); div.className="fav-item"; div.innerHTML=`${city} <button onclick="removeFavorite('${city}')">x</button>`; div.addEventListener("click",()=>getWeather(city)); favList.appendChild(div); }); }

// Message
function showMessage(msg){ message.textContent=msg; }

// Init
initTheme(); renderFavorites();

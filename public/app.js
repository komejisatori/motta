const generateButton = document.getElementById("generateButton");
const providerBadge = document.getElementById("providerBadge");
const scheduleList = document.getElementById("scheduleList");
const weatherCard = document.getElementById("weatherCard");
const itemList = document.getElementById("itemList");
const summaryText = document.getElementById("summaryText");
const tipsList = document.getElementById("tipsList");

const DEFAULT_MOCK_SCHEDULE = [
  { time: "09:00", title: "Team sync meeting", location: "Office" },
  { time: "12:30", title: "Client lunch", location: "Shibuya" },
  { time: "18:30", title: "Gym session", location: "Fitness club" },
];

const DEFAULT_MOCK_WEATHER = {
  weather: "Light rain",
  temperature: "17C",
  humidity: "76%",
  uv_index: 4,
  highC: 20,
  lowC: 14,
  windKph: 20,
  precipitationChance: 78,
};

function renderSchedule(schedule) {
  scheduleList.innerHTML = schedule
    .map(
      (event) => `
        <li>
          <span class="list-title">${event.time} · ${event.title}</span>
          <span class="list-meta">${event.location}</span>
          ${event.notes ? `<span class="list-meta">${event.notes}</span>` : ""}
        </li>
      `,
    )
    .join("");
}

function renderWeather(weather) {
  const weatherLabel = weather.weather || weather.condition || "Unknown";
  const temperatureLabel =
    weather.temperature !== undefined && weather.temperature !== null
      ? `${weather.temperature}C`
      : weather.temperatureC !== undefined
        ? `${weather.temperatureC}C`
        : "Unknown";
  const humidityLabel =
    weather.humidity !== undefined && weather.humidity !== null ? `${weather.humidity}%` : "Unknown";
  const uvIndexLabel = weather.uv_index ?? "Unknown";
  const highLow =
    weather.highC !== undefined && weather.lowC !== undefined
      ? `High: ${weather.highC}C, Low: ${weather.lowC}C`
      : "";
  const wind = weather.windKph !== undefined ? `Wind: ${weather.windKph} kph` : "";
  const rain =
    weather.precipitationChance !== undefined
      ? `Rain chance: ${weather.precipitationChance}%`
      : "";

  weatherCard.innerHTML = `
    <div><strong>${weatherLabel}</strong></div>
    <div>Temperature: ${temperatureLabel}</div>
    <div>Humidity: ${humidityLabel}</div>
    <div>UV index: ${uvIndexLabel}</div>
    ${highLow ? `<div>${highLow}</div>` : ""}
    ${wind ? `<div>${wind}</div>` : ""}
    ${rain ? `<div>${rain}</div>` : ""}
  `;
}

function renderItems(items) {
  itemList.innerHTML = items
    .map(
      (item) => `
        <li>
          <span class="list-title">${item.name}</span>
          <span class="list-meta">${item.reason}</span>
        </li>
      `,
    )
    .join("");
}

function renderTips(tips) {
  tipsList.innerHTML = tips
    .map(
      (tip) => `
        <li>
          <span class="list-meta">${tip}</span>
        </li>
      `,
    )
    .join("");
}

async function generateRecommendation() {
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  try {
    const response = await fetch("/api/generate_daily_carry_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.detail || "Failed to load recommendation data.");
    }

    providerBadge.textContent = data.provider;
    renderSchedule(data.context.schedule || []);
    renderWeather(data.context.weather || {});
    renderItems(data.recommendation.items || []);
    renderTips(data.recommendation.tips || []);
    summaryText.textContent = data.recommendation.summary || "No summary returned.";
  } catch (error) {
    providerBadge.textContent = "error";
    summaryText.textContent = error.message;
    itemList.innerHTML = "";
    tipsList.innerHTML = "";
    renderSchedule(DEFAULT_MOCK_SCHEDULE);
    renderWeather(DEFAULT_MOCK_WEATHER);
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate Recommendation";
  }
}

generateButton.addEventListener("click", generateRecommendation);
renderSchedule(DEFAULT_MOCK_SCHEDULE);
renderWeather(DEFAULT_MOCK_WEATHER);

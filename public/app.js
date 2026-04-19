const generateButton = document.getElementById("generateButton");
const providerBadge = document.getElementById("providerBadge");
const scheduleList = document.getElementById("scheduleList");
const weatherCard = document.getElementById("weatherCard");
const itemList = document.getElementById("itemList");
const summaryText = document.getElementById("summaryText");
const tipsList = document.getElementById("tipsList");

const STATIC_MOCK_CONTEXT = {
  schedule: [
    {
      time: "09:00",
      title: "Team sync meeting",
      location: "Office",
      notes: "Bring your laptop and prepare project updates.",
    },
    {
      time: "12:30",
      title: "Client lunch",
      location: "Shibuya",
      notes: "Business casual outfit is recommended.",
    },
    {
      time: "18:30",
      title: "Gym session",
      location: "Fitness club",
      notes: "Indoor training after work.",
    },
  ],
  weather: {
    weather: "Light rain",
    temperature: "17C",
    humidity: "76%",
    uv_index: 4,
    highC: 20,
    lowC: 14,
    windKph: 20,
    precipitationChance: 78,
  },
};

function renderSchedule(schedule) {
  scheduleList.innerHTML = schedule
    .map(
      (event) => `
        <li>
          <span class="list-title">${event.time} · ${event.title}</span>
          <span class="list-meta">${event.location}</span>
          <span class="list-meta">${event.notes}</span>
        </li>
      `,
    )
    .join("");
}

function renderWeather(weather) {
  const weatherLabel = weather.weather || weather.condition || "Unknown";
  const temperatureLabel =
    weather.temperature ||
    `${weather.temperatureC}°C now, high ${weather.highC}°C, low ${weather.lowC}°C`;
  const humidityLabel = weather.humidity ?? "Unknown";
  const uvIndexLabel = weather.uv_index ?? "Unknown";
  const extraDetails = [];

  if (weather.highC !== undefined && weather.lowC !== undefined && !weather.temperature) {
    extraDetails.push(`${weather.temperatureC}°C now, high ${weather.highC}°C, low ${weather.lowC}°C`);
  }

  if (weather.windKph !== undefined) {
    extraDetails.push(`Wind: ${weather.windKph} kph`);
  }

  if (weather.precipitationChance !== undefined) {
    extraDetails.push(`Rain chance: ${weather.precipitationChance}%`);
  }

  weatherCard.innerHTML = `
    <div><strong>${weatherLabel}</strong></div>
    <div>Temperature: ${temperatureLabel}</div>
    <div>Humidity: ${humidityLabel}</div>
    <div>UV index: ${uvIndexLabel}</div>
    ${extraDetails.map((detail) => `<div>${detail}</div>`).join("")}
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

    if (!response.ok) {
      throw new Error("Failed to load recommendation data.");
    }

    const data = await response.json();

    providerBadge.textContent = data.provider;
    renderSchedule(STATIC_MOCK_CONTEXT.schedule);
    renderWeather(STATIC_MOCK_CONTEXT.weather);
    renderItems(data.recommendation.items);
    renderTips(data.recommendation.tips);
    summaryText.textContent = data.recommendation.summary;
  } catch (error) {
    providerBadge.textContent = "error";
    summaryText.textContent = error.message;
    itemList.innerHTML = "";
    tipsList.innerHTML = "";
    renderSchedule(STATIC_MOCK_CONTEXT.schedule);
    renderWeather(STATIC_MOCK_CONTEXT.weather);
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate Recommendation";
  }
}

renderSchedule(STATIC_MOCK_CONTEXT.schedule);
renderWeather(STATIC_MOCK_CONTEXT.weather);
generateButton.addEventListener("click", generateRecommendation);

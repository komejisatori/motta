const generateButton = document.getElementById("generateButton");
const providerBadge = document.getElementById("providerBadge");
const scheduleList = document.getElementById("scheduleList");
const weatherCard = document.getElementById("weatherCard");
const itemList = document.getElementById("itemList");
const summaryText = document.getElementById("summaryText");
const tipsList = document.getElementById("tipsList");
const kimiApiKeyInput = document.getElementById("kimiApiKeyInput");
const systemPromptInput = document.getElementById("systemPromptInput");
const event1Time = document.getElementById("event1Time");
const event1Title = document.getElementById("event1Title");
const event1Location = document.getElementById("event1Location");
const event1Notes = document.getElementById("event1Notes");
const event2Time = document.getElementById("event2Time");
const event2Title = document.getElementById("event2Title");
const event2Location = document.getElementById("event2Location");
const event2Notes = document.getElementById("event2Notes");
const event3Time = document.getElementById("event3Time");
const event3Title = document.getElementById("event3Title");
const event3Location = document.getElementById("event3Location");
const event3Notes = document.getElementById("event3Notes");
const weatherConditionInput = document.getElementById("weatherConditionInput");
const weatherTemperatureInput = document.getElementById("weatherTemperatureInput");
const weatherHumidityInput = document.getElementById("weatherHumidityInput");
const weatherUvInput = document.getElementById("weatherUvInput");
const weatherHighInput = document.getElementById("weatherHighInput");
const weatherLowInput = document.getElementById("weatherLowInput");
const weatherWindInput = document.getElementById("weatherWindInput");
const weatherRainInput = document.getElementById("weatherRainInput");

const DEFAULT_SYSTEM_PROMPT =
  "You are a daily carry recommendation agent. You must use tools to collect the calendar and weather for the requested day, then call push_todolist with a JSON recommendation. Keep the output practical and concise.";

const DEFAULT_MOCK_CALENDAR = [
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
];

const DEFAULT_MOCK_WEATHER = {
  weather: "Light rain",
  temperature: 17,
  humidity: 76,
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
          <span class="list-meta">${event.notes}</span>
        </li>
      `,
    )
    .join("");
}

function renderWeather(weather) {
  const weatherLabel = weather.weather || weather.condition || "Unknown";
  const temperatureLabel =
    weather.temperature !== undefined
      ? `${weather.temperature}C`
      : weather.temperature ||
    `${weather.temperatureC}°C now, high ${weather.highC}°C, low ${weather.lowC}°C`;
  const humidityLabel =
    weather.humidity !== undefined && weather.humidity !== null
      ? `${weather.humidity}%`
      : "Unknown";
  const uvIndexLabel = weather.uv_index ?? "Unknown";
  const extraDetails = [];

  if (weather.highC !== undefined && weather.lowC !== undefined) {
    extraDetails.push(`High: ${weather.highC}C, Low: ${weather.lowC}C`);
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

function buildEditablePayload() {
  const calendar = [
    {
      time: event1Time.value.trim(),
      title: event1Title.value.trim(),
      location: event1Location.value.trim(),
      notes: event1Notes.value.trim(),
    },
    {
      time: event2Time.value.trim(),
      title: event2Title.value.trim(),
      location: event2Location.value.trim(),
      notes: event2Notes.value.trim(),
    },
    {
      time: event3Time.value.trim(),
      title: event3Title.value.trim(),
      location: event3Location.value.trim(),
      notes: event3Notes.value.trim(),
    },
  ];

  for (let index = 0; index < calendar.length; index += 1) {
    const event = calendar[index];
    if (!event.time || !event.title || !event.location || !event.notes) {
      throw new Error(`Event ${index + 1} needs time, title, location, and notes.`);
    }
  }

  const numericFields = [
    { label: "temperature", value: weatherTemperatureInput.value },
    { label: "humidity", value: weatherHumidityInput.value },
    { label: "uv_index", value: weatherUvInput.value },
    { label: "highC", value: weatherHighInput.value },
    { label: "lowC", value: weatherLowInput.value },
    { label: "windKph", value: weatherWindInput.value },
    { label: "precipitationChance", value: weatherRainInput.value },
  ];

  const parsedNumbers = {};
  for (const field of numericFields) {
    const numberValue = Number(field.value);
    if (Number.isNaN(numberValue)) {
      throw new Error(`${field.label} must be a number.`);
    }
    parsedNumbers[field.label] = numberValue;
  }

  if (!weatherConditionInput.value.trim()) {
    throw new Error("weather must not be empty.");
  }

  return {
    kimi_api_key: kimiApiKeyInput.value.trim(),
    system_prompt: systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT,
    mock_calendar: calendar,
    mock_weather: {
      weather: weatherConditionInput.value.trim(),
      temperature: parsedNumbers.temperature,
      humidity: parsedNumbers.humidity,
      uv_index: parsedNumbers.uv_index,
      highC: parsedNumbers.highC,
      lowC: parsedNumbers.lowC,
      windKph: parsedNumbers.windKph,
      precipitationChance: parsedNumbers.precipitationChance,
    },
  };
}

async function generateRecommendation() {
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  try {
    const payload = buildEditablePayload();
    const response = await fetch("/api/generate_daily_carry_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || "Failed to load recommendation data.");
    }

    const data = await response.json();

    providerBadge.textContent = data.provider;
    renderSchedule(payload.mock_calendar);
    renderWeather(payload.mock_weather);
    renderItems(data.recommendation.items);
    renderTips(data.recommendation.tips);
    summaryText.textContent = data.recommendation.summary;
  } catch (error) {
    providerBadge.textContent = "error";
    summaryText.textContent = error.message;
    itemList.innerHTML = "";
    tipsList.innerHTML = "";
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate Recommendation";
  }
}

kimiApiKeyInput.value = "";
systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
event1Time.value = DEFAULT_MOCK_CALENDAR[0].time;
event1Title.value = DEFAULT_MOCK_CALENDAR[0].title;
event1Location.value = DEFAULT_MOCK_CALENDAR[0].location;
event1Notes.value = DEFAULT_MOCK_CALENDAR[0].notes;
event2Time.value = DEFAULT_MOCK_CALENDAR[1].time;
event2Title.value = DEFAULT_MOCK_CALENDAR[1].title;
event2Location.value = DEFAULT_MOCK_CALENDAR[1].location;
event2Notes.value = DEFAULT_MOCK_CALENDAR[1].notes;
event3Time.value = DEFAULT_MOCK_CALENDAR[2].time;
event3Title.value = DEFAULT_MOCK_CALENDAR[2].title;
event3Location.value = DEFAULT_MOCK_CALENDAR[2].location;
event3Notes.value = DEFAULT_MOCK_CALENDAR[2].notes;
weatherConditionInput.value = DEFAULT_MOCK_WEATHER.weather;
weatherTemperatureInput.value = String(DEFAULT_MOCK_WEATHER.temperature);
weatherHumidityInput.value = String(DEFAULT_MOCK_WEATHER.humidity);
weatherUvInput.value = String(DEFAULT_MOCK_WEATHER.uv_index);
weatherHighInput.value = String(DEFAULT_MOCK_WEATHER.highC);
weatherLowInput.value = String(DEFAULT_MOCK_WEATHER.lowC);
weatherWindInput.value = String(DEFAULT_MOCK_WEATHER.windKph);
weatherRainInput.value = String(DEFAULT_MOCK_WEATHER.precipitationChance);
renderSchedule(DEFAULT_MOCK_CALENDAR);
renderWeather(DEFAULT_MOCK_WEATHER);
generateButton.addEventListener("click", generateRecommendation);

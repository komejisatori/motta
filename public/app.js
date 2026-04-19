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
const event2Time = document.getElementById("event2Time");
const event2Title = document.getElementById("event2Title");
const event2Location = document.getElementById("event2Location");
const event3Time = document.getElementById("event3Time");
const event3Title = document.getElementById("event3Title");
const event3Location = document.getElementById("event3Location");
const weatherConditionInput = document.getElementById("weatherConditionInput");
const weatherTemperatureInput = document.getElementById("weatherTemperatureInput");
const weatherHumidityInput = document.getElementById("weatherHumidityInput");
const weatherUvInput = document.getElementById("weatherUvInput");
const weatherHighInput = document.getElementById("weatherHighInput");
const weatherLowInput = document.getElementById("weatherLowInput");
const weatherWindInput = document.getElementById("weatherWindInput");
const weatherRainInput = document.getElementById("weatherRainInput");

const KIMI_BASE_URL = "https://api.moonshot.cn/v1";
const KIMI_MODEL = "moonshot-v1-8k";

const DEFAULT_SYSTEM_PROMPT =
  "You are a daily carry recommendation agent. You must use tools to collect the calendar and weather for the requested day, then call push_todolist with a JSON recommendation. Keep the output practical and concise.";

const DEFAULT_MOCK_CALENDAR = [
  {
    time: "09:00",
    title: "Team sync meeting",
    location: "Office",
  },
  {
    time: "12:30",
    title: "Client lunch",
    location: "Shibuya",
  },
  {
    time: "18:30",
    title: "Gym session",
    location: "Fitness club",
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
    },
    {
      time: event2Time.value.trim(),
      title: event2Title.value.trim(),
      location: event2Location.value.trim(),
    },
    {
      time: event3Time.value.trim(),
      title: event3Title.value.trim(),
      location: event3Location.value.trim(),
    },
  ];

  for (let index = 0; index < calendar.length; index += 1) {
    const event = calendar[index];
    if (!event.time || !event.title || !event.location) {
      throw new Error(`Event ${index + 1} needs time, title, and location.`);
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

function getToolSchemas() {
  return [
    {
      type: "function",
      function: {
        name: "read_weather",
        description:
          "Get the weather of a specific day. The returned weather includes weather, temperature, humidity, and UV index.",
        parameters: {
          type: "object",
          properties: {
            day: { type: "string", description: "Target day in YYYY-MM-DD format." },
          },
          required: ["day"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_calendar",
        description: "Get the calendar events of a specific day.",
        parameters: {
          type: "object",
          properties: {
            day: { type: "string", description: "Target day in YYYY-MM-DD format." },
          },
          required: ["day"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "push_todolist",
        description:
          "Generate and return the recommendation items of a specific day. The returned items must be included in JSON format.",
        parameters: {
          type: "object",
          properties: {
            day: { type: "string" },
            summary: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["name", "reason"],
              },
            },
            tips: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["day", "summary", "items", "tips"],
        },
      },
    },
  ];
}

function callTool(name, args, context) {
  if (name === "read_weather") {
    return { ...context.mock_weather, date: args.day };
  }
  if (name === "read_calendar") {
    return { date: args.day, events: context.mock_calendar };
  }
  if (name === "push_todolist") {
    return {
      date: args.day,
      summary: args.summary,
      items: args.items,
      tips: args.tips,
    };
  }
  throw new Error(`Unsupported tool call: ${name}`);
}

async function requestKimiCompletion(messages, tools, apiKey) {
  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      temperature: 0.2,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.detail || `Kimi API failed (${response.status}).`);
  }
  return data;
}

async function runKimiAgent(context) {
  const apiKey = context.kimi_api_key;
  if (!apiKey) {
    throw new Error("Please enter Kimi API Key.");
  }

  const day = new Date().toISOString().slice(0, 10);
  const tools = getToolSchemas();
  const messages = [
    { role: "system", content: context.system_prompt },
    {
      role: "user",
      content: `Create a daily carry recommendation for ${day}. Use read_weather, read_calendar, and then push_todolist.`,
    },
  ];

  let finalTodo = null;

  for (let i = 0; i < 6; i += 1) {
    const completion = await requestKimiCompletion(messages, tools, apiKey);
    const message = completion?.choices?.[0]?.message || {};
    const toolCalls = message.tool_calls || [];

    const assistantMessage = { role: "assistant" };
    if (message.content !== undefined && message.content !== null) {
      assistantMessage.content = message.content;
    }
    if (toolCalls.length > 0) {
      assistantMessage.tool_calls = toolCalls;
    }
    messages.push(assistantMessage);

    if (toolCalls.length === 0) {
      break;
    }

    for (const toolCall of toolCalls) {
      const fn = toolCall.function || {};
      const toolName = fn.name;
      const args = JSON.parse(fn.arguments || "{}");
      const result = callTool(toolName, args, context);

      if (toolName === "push_todolist") {
        finalTodo = result;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(result),
      });
    }

    if (finalTodo) {
      break;
    }
  }

  if (!finalTodo) {
    throw new Error("Kimi did not return push_todolist.");
  }

  return finalTodo;
}

async function generateRecommendation() {
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  try {
    const inputContext = buildEditablePayload();
    const recommendation = await runKimiAgent(inputContext);

    providerBadge.textContent = "kimi-direct";
    renderSchedule(inputContext.mock_calendar);
    renderWeather(inputContext.mock_weather);
    renderItems(recommendation.items || []);
    renderTips(recommendation.tips || []);
    summaryText.textContent = recommendation.summary || "No summary returned.";
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
event2Time.value = DEFAULT_MOCK_CALENDAR[1].time;
event2Title.value = DEFAULT_MOCK_CALENDAR[1].title;
event2Location.value = DEFAULT_MOCK_CALENDAR[1].location;
event3Time.value = DEFAULT_MOCK_CALENDAR[2].time;
event3Title.value = DEFAULT_MOCK_CALENDAR[2].title;
event3Location.value = DEFAULT_MOCK_CALENDAR[2].location;
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

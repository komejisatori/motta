import json
from datetime import date, datetime, timezone
from urllib import error, request

KIMI_API_KEY = ""
KIMI_BASE_URL = "https://api.moonshot.cn/v1"
KIMI_MODEL = "moonshot-v1-8k"

SYSTEM_PROMPTS = (
    "You are a daily carry recommendation agent. You must use tools to "
    "collect the calendar and weather for the requested day, then call "
    "push_todolist with a JSON recommendation. Keep the output practical "
    "and concise."
)


def get_mock_calendar(day):
    return [
        {
            "time": "09:00",
            "title": "Team sync meeting",
            "location": "Office",
            "notes": "Bring your laptop and prepare project updates.",
        },
        {
            "time": "12:30",
            "title": "Client lunch",
            "location": "Shibuya",
            "notes": "Business casual outfit is recommended.",
        },
        {
            "time": "18:30",
            "title": "Gym session",
            "location": "Fitness club",
            "notes": "Indoor training after work.",
        },
    ]


def get_mock_weather(day):
    return {
        "date": day,
        "weather": "Light rain",
        "temperature": "17C",
        "humidity": "76%",
        "uv_index": 4,
        "highC": 20,
        "lowC": 14,
        "windKph": 20,
        "precipitationChance": 78,
    }


def read_weather(day):
    return get_mock_weather(day)


def read_calendar(day):
    return {
        "date": day,
        "events": get_mock_calendar(day),
    }


def push_todolist(day, items, summary, tips):
    return {
        "date": day,
        "summary": summary,
        "items": items,
        "tips": tips,
    }


def get_tool_schemas():
    return [
        {
            "type": "function",
            "function": {
                "name": "read_weather",
                "description": (
                    "Get the weather of a specific day. The returned weather includes "
                    "weather, temperature, humidity, and UV index."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "day": {
                            "type": "string",
                            "description": "Target day in YYYY-MM-DD format.",
                        }
                    },
                    "required": ["day"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "read_calendar",
                "description": "Get the calendar events of a specific day.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "day": {
                            "type": "string",
                            "description": "Target day in YYYY-MM-DD format.",
                        }
                    },
                    "required": ["day"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "push_todolist",
                "description": (
                    "Generate and return the recommendation items of a specific day. "
                    "The returned items must be included in JSON format."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "day": {
                            "type": "string",
                            "description": "Target day in YYYY-MM-DD format.",
                        },
                        "summary": {
                            "type": "string",
                            "description": "Short explanation of the recommendation.",
                        },
                        "items": {
                            "type": "array",
                            "description": "Recommended carry items in JSON format.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "reason": {"type": "string"},
                                },
                                "required": ["name", "reason"],
                            },
                        },
                        "tips": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Extra travel or packing suggestions.",
                        },
                    },
                    "required": ["day", "summary", "items", "tips"],
                },
            },
        },
    ]


def call_tool(name, arguments):
    if name == "read_weather":
        return read_weather(arguments["day"])
    if name == "read_calendar":
        return read_calendar(arguments["day"])
    if name == "push_todolist":
        return push_todolist(
            day=arguments["day"],
            items=arguments["items"],
            summary=arguments["summary"],
            tips=arguments["tips"],
        )
    raise RuntimeError(f"Unsupported tool call: {name}")


def request_kimi_completion(*, messages, tools):
    if not KIMI_API_KEY:
        raise RuntimeError("KIMI_API_KEY is missing in src/agent.py.")

    payload = json.dumps(
        {
            "model": KIMI_MODEL,
            "temperature": 0.2,
            "messages": messages,
            "tools": tools,
            "tool_choice": "auto",
        }
    ).encode("utf-8")

    http_request = request.Request(
        f"{KIMI_BASE_URL}/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {KIMI_API_KEY}",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        raise RuntimeError(f"Kimi API request failed with status {exc.code}.") from exc
    except error.URLError as exc:
        raise RuntimeError("Kimi API request could not reach the server.") from exc


def run_kimi_agent(day):
    tools = get_tool_schemas()
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPTS,
        },
        {
            "role": "user",
            "content": (
                f"Create a daily carry recommendation for {day}. "
                "Use read_weather, read_calendar, and then push_todolist."
            ),
        },
    ]
    final_todolist = None

    for _ in range(6):
        response_data = request_kimi_completion(messages=messages, tools=tools)

        message = ((response_data.get("choices") or [{}])[0]).get("message") or {}
        tool_calls = message.get("tool_calls") or []
        assistant_message = {"role": "assistant"}

        if message.get("content") is not None:
            assistant_message["content"] = message.get("content")

        if tool_calls:
            assistant_message["tool_calls"] = tool_calls

        messages.append(assistant_message)

        if not tool_calls:
            break

        for tool_call in tool_calls:
            function_data = tool_call.get("function") or {}
            tool_name = function_data.get("name")
            arguments = json.loads(function_data.get("arguments") or "{}")
            tool_result = call_tool(tool_name, arguments)

            if tool_name == "push_todolist":
                final_todolist = tool_result

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.get("id"),
                    "name": tool_name,
                    "content": json.dumps(tool_result),
                }
            )

        if final_todolist:
            break

    if not final_todolist:
        raise RuntimeError("Kimi did not produce a push_todolist result.")

    return final_todolist, messages


def generate_daily_carry_plan(overrides=None):
    requested_day = ((overrides or {}).get("date")) or date.today().isoformat()
    weather = read_weather(requested_day)
    calendar_data = read_calendar(requested_day)
    recommendation, prompt_preview = run_kimi_agent(requested_day)

    return {
        "provider": "kimi",
        "context": {
            "date": requested_day,
            "city": "Tokyo",
            "schedule": calendar_data["events"],
            "weather": weather,
        },
        "promptPreview": prompt_preview,
        "recommendation": recommendation,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

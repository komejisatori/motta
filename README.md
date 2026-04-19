# Motter Agent

This project is a minimal Python framework for a daily carry recommendation agent.
It uses mock calendar and weather data for now, and it is structured so we can replace the mock reasoning with the Kimi API later.

## Run

```bash
pip install -r requirements.txt
python3 app.py
```

Then open `http://127.0.0.1:3000`.

## Environment

Copy `.env.example` to `.env` when you are ready to connect the Kimi API.

## Current Behavior

- Uses mock schedule data for today's events
- Uses mock weather data for today's forecast
- Uses Kimi tool calling to generate `push_todolist` results
- Serves the demo page and API with FastAPI

import uvicorn

from src.server import HOST, PORT, app

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)

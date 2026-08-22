from fastapi import FastAPI

app = FastAPI(title="MediNexus AI")

@app.get("/")
async def root():
    return {"status": "Infrastructure Online. Waiting for AI Core Integration."}
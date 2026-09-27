from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os

from laya import Router

app = FastAPI()

# Optionally preload models based on environment variables or just default Router
preload = os.environ.get("LAYA_PRELOAD", "false").lower() == "true"
router = Router(preload=preload)

class PredictRequest(BaseModel):
    state: str
    questions: Dict[str, Any]
    model: Optional[str] = None
    max_len: Optional[int] = None

@app.post("/predict")
def predict(req: PredictRequest):
    kwargs = {}
    if req.model is not None:
        kwargs["model"] = req.model
        
    max_len = req.max_len if req.max_len is not None else int(os.getenv("MAX_LEN", 8192))
    
    # Manually route to support max_len since Router.predict doesn't accept it
    decision = router.route(req.state, req.questions, **kwargs)
    agent = router.load(decision["model"])
    
    original_max_len = agent.cfg.get("max_len")
    agent.cfg["max_len"] = max_len
    
    try:
        result = agent.system_one(req.state, req.questions)
        result["routing"] = dict(decision)
    finally:
        if original_max_len is not None:
            agent.cfg["max_len"] = original_max_len
        elif "max_len" in agent.cfg:
            del agent.cfg["max_len"]
            
    return result

@app.get("/health")
def health():
    return {"status": "ok"}

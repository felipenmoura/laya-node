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
    kwargs["max_len"] = max_len
        
    result = router.predict(req.state, req.questions, **kwargs)
    return result

@app.get("/health")
def health():
    return {"status": "ok"}

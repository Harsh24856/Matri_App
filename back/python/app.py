"""
app.py - simple FastAPI wrapper for predict_from_json

Routes:
- POST /predict  -> accepts {"data": {...} or [...], "include_id": true/false}
- GET  /health   -> returns model load status
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Union, Optional

from model import predict_from_json, get_models, model_load_error

app = FastAPI(title="RiskPredictorAPI")

origins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.222.177:5173",
  "http://172.31.73.125:5173"
];
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    data: Union[Dict[str, Any], List[Dict[str, Any]]]
    include_id: Optional[bool] = True


@app.post("/predict")
async def predict(req: PredictRequest):
    # Try to ensure models are loaded
    try:
        clf, reg = get_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model load error: {e}")

    try:
        result = predict_from_json(req.data, clf_pipeline=clf, reg=reg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    # attach input ids if include_id requested
    if req.include_id:
        inputs = req.data if isinstance(req.data, list) else [req.data]
        ids = []
        for r in inputs:
            if isinstance(r, dict) and 'id' in r:
                ids.append(r.get('id'))
            elif isinstance(r, dict) and 'external_id' in r:
                ids.append(r.get('external_id'))
            else:
                ids.append(None)
        for i, rec in enumerate(result.get("predictions", [])):
            rec["_input_id"] = ids[i]
        for i, rec in enumerate(result.get("probabilities", [])):
            rec["_input_id"] = ids[i]
        result["input_ids"] = ids

    return result


@app.get("/health")
async def health():
    return {"status": "ok", "model_load_error": model_load_error}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
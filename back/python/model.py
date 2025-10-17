"""
model.py

Load joblib models (once) and expose predict_from_json(json_obj).
If models fail to load at import time, model_load_error contains the message.
"""

from __future__ import annotations
import json
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

from preprocess import preprocess_records

CLASSIFIER_PATH = "multioutput_classifier_rf.joblib"
REGRESSOR_PATH = "risk_regressor_rf.joblib"


def _load_models(classifier_path: str = CLASSIFIER_PATH, reg_path: str = REGRESSOR_PATH):
    """Load and return (clf_pipeline, reg)."""
    try:
        clf = joblib.load(classifier_path)
    except Exception as e:
        raise RuntimeError(f"Failed loading classifier from {classifier_path}: {e}")
    try:
        reg = joblib.load(reg_path)
    except Exception as e:
        raise RuntimeError(f"Failed loading regressor from {reg_path}: {e}")
    return clf, reg


# Try to load models at import time (so server can surface load errors early)
try:
    _GLOBAL_CLF, _GLOBAL_REG = _load_models()
    model_load_error: Optional[str] = None
except Exception as e:
    _GLOBAL_CLF, _GLOBAL_REG = None, None
    model_load_error = str(e)


def get_models():
    """Return (clf_pipeline, reg). Retry loading if not loaded at import."""
    global _GLOBAL_CLF, _GLOBAL_REG, model_load_error
    if _GLOBAL_CLF is not None and _GLOBAL_REG is not None:
        return _GLOBAL_CLF, _GLOBAL_REG
    # attempt to load
    _GLOBAL_CLF, _GLOBAL_REG = _load_models()
    model_load_error = None
    return _GLOBAL_CLF, _GLOBAL_REG


def _infer_target_names_from_pipeline(clf_pipeline) -> List[str]:
    try:
        ests = clf_pipeline.named_steps['clf'].estimators_
        n = len(ests)
        return [f"flag_{i}" for i in range(n)]
    except Exception:
        return ["flag_0"]


def _build_proba_array(clf_pipeline, sample_df: pd.DataFrame) -> pd.DataFrame:
    """Handle both list-of-arrays and single 2D array outputs from predict_proba."""
    proba = clf_pipeline.predict_proba(sample_df)

    # Case A: list of arrays, one per label
    if isinstance(proba, list):
        prob_cols = []
        for i, p in enumerate(proba):
            if p.ndim == 2 and p.shape[1] == 2:
                prob_1 = p[:, 1]
            else:
                prob_1 = np.zeros(p.shape[0])
            prob_cols.append(prob_1)
        prob_array = np.column_stack(prob_cols)

    # Case B: single 2D array (n_samples, n_labels)
    elif isinstance(proba, np.ndarray):
        if proba.ndim == 2:
            prob_array = proba
        else:  # rare edge case, reshape
            prob_array = proba.reshape(-1, 1)
    else:
        raise RuntimeError(f"Unexpected predict_proba output type: {type(proba)}")

    # column names
    try:
        names = _infer_target_names_from_pipeline(clf_pipeline)
        if len(names) != prob_array.shape[1]:
            names = [f"flag_{i}" for i in range(prob_array.shape[1])]
    except Exception:
        names = [f"flag_{i}" for i in range(prob_array.shape[1])]

    proba_df = pd.DataFrame(prob_array, columns=names, index=sample_df.index)
    return proba_df


def _build_flags_df(clf_pipeline, sample_df: pd.DataFrame, proba_df: pd.DataFrame) -> pd.DataFrame:
    flags = clf_pipeline.predict(sample_df)
    flags = np.atleast_2d(flags)
    cols = proba_df.columns.tolist()
    if flags.shape[1] != len(cols):
        if flags.shape[1] > len(cols):
            flags = flags[:, : len(cols)]
        else:
            pad = np.zeros((flags.shape[0], len(cols) - flags.shape[1]))
            flags = np.hstack([flags, pad])
    flags_df = pd.DataFrame(flags, columns=cols, index=sample_df.index).astype(int)
    return flags_df


def _predict_risk(clf_pipeline, reg, sample_df: pd.DataFrame) -> pd.Series:
    if 'preprocessor' in getattr(clf_pipeline, "named_steps", {}):
        pre = clf_pipeline.named_steps['preprocessor']
        X_for_reg = pre.transform(sample_df)
    else:
        X_for_reg = sample_df.values
    risk = reg.predict(X_for_reg)
    return pd.Series(risk, index=sample_df.index, name="risk_score")


def predict_from_json(json_obj: Any, clf_pipeline=None, reg=None) -> Dict[str, Any]:
    """
    Accepts single dict or list-of-dicts (or JSON string). Returns dict:
      { predictions: [...], probabilities: [...], risk: [...], columns: {...} }
    """
    if isinstance(json_obj, str):
        parsed = json.loads(json_obj)
    else:
        parsed = json_obj

    df = preprocess_records(parsed)

    if clf_pipeline is None or reg is None:
        clf_pipeline, reg = get_models()

    proba_df = _build_proba_array(clf_pipeline, df)
    flags_df = _build_flags_df(clf_pipeline, df, proba_df)
    risk_ser = _predict_risk(clf_pipeline, reg, df)

    out = {
        "predictions": flags_df.astype(int).to_dict(orient="records"),
        "probabilities": proba_df.round(6).to_dict(orient="records"),
        "risk": [float(x) for x in risk_ser.tolist()],
        "columns": {
            "flags": list(flags_df.columns),
            "probabilities": list(proba_df.columns)
        }
    }
    return out


# CLI for quick tests
if __name__ == "__main__":
    import sys
    try:
        clf, reg = get_models()
    except Exception as e:
        print("Model load failed:", e)
        sys.exit(2)

    if len(sys.argv) == 1 or sys.argv[1].lower() == "sample":
        sample = {
            "id": 1,
            "name": "Alice",
            "age": 28,
            "past_pregnancy_count": 1,
            "blood_group_mother": "A+",
            "blood_group_father": "O+",
            "medical_bg_mother": "diabetes, hypertension",
            "medical_bg_father": "thalassemia",
            "years_since_last_pregnancy": 2,
            "delivery_type": "Normal",
            "haemoglobin": 10.5,
            "external_id": "ext-123",
        }
        res = predict_from_json(sample, clf_pipeline=clf, reg=reg)
        print(json.dumps(res, indent=2))
    elif sys.argv[1].lower() == "file" and len(sys.argv) >= 3:
        path = sys.argv[2]
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        res = predict_from_json(data, clf_pipeline=clf, reg=reg)
        print(json.dumps(res, indent=2))
    else:
        print("Usage: python model.py [sample|file path.json]")
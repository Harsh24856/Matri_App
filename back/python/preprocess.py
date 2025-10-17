"""
preprocess.py

Convert JSON records (matching your DB schema) into a pandas DataFrame
that matches the input format expected by your ML pipeline.

Features:
- Accepts snake_case and common camelCase keys (e.g., yearsSinceLastPregnancy).
- Infers boolean flags from comma-separated medical background text.
- Returns a DataFrame with columns ordered for the model.
"""

from __future__ import annotations
import re
from typing import List, Dict, Any, Iterable
import pandas as pd
import numpy as np

OUTPUT_COLUMNS = [
    'age',
    'past_pregnancy_count',
    'blood_group_mother',
    'blood_group_father',
    'time_since_last_pregnancy_years',
    'delivery_type',
    'haemoglobin',
    'mother_diabetes',
    'mother_hypertension',
    'mother_anaemia_dx',
    'mother_thyroid',
    'mother_heart_disease',
    'mother_prev_csection',
    'father_diabetes',
    'father_hypertension',
    'father_heart_disease',
    'father_thalassemia_trait'
]

_KEYWORD_MAP = {
    'diabetes': ['diabetes', r'\bdm\b'],
    'hypertension': ['hypertension', r'\bhtn\b', 'high blood pressure'],
    'anaemia': ['anaemia', 'anemia'],
    'thyroid': ['thyroid'],
    'heart': ['heart', 'cardiac', 'cardiomyopathy', 'ischemia', 'ihd'],
    'thalassemia': ['thalassemia', 'thalassaemia'],
    'csection': ['c-section', 'c section', 'csection', 'cesarean', 'caesarean']
}
_COMPILED_KEYWORDS = {k: re.compile('|'.join(re.escape(x) if not x.startswith('\\b') else x for x in vals), flags=re.I)
                      for k, vals in _KEYWORD_MAP.items()}

# common camelCase -> snake_case aliases
_KEY_ALIASES = {
    'pastPregnancyCount': 'past_pregnancy_count',
    'bloodGroupMother': 'blood_group_mother',
    'bloodGroupFather': 'blood_group_father',
    'medicalBgMother': 'medical_bg_mother',
    'medicalBgFather': 'medical_bg_father',
    'yearsSinceLastPregnancy': 'years_since_last_pregnancy',
    'deliveryType': 'delivery_type',
    'externalId': 'external_id',
    # keep name, id, age etc as-is
}


def _normalize_record_keys(rec: dict) -> dict:
    """Return a shallow copy where known camelCase keys are also present as snake_case."""
    if not isinstance(rec, dict):
        return rec
    out = dict(rec)
    for k, v in list(rec.items()):
        if k in _KEY_ALIASES:
            out[_KEY_ALIASES[k]] = out.get(k, v)
    return out


def _extract_text(text: Any) -> str:
    if text is None:
        return ""
    return str(text).strip()


def _infer_flags_from_medical_text(text: str) -> Dict[str, int]:
    normalized = _extract_text(text)
    flags = {
        'diabetes': 0,
        'hypertension': 0,
        'anaemia': 0,
        'thyroid': 0,
        'heart': 0,
        'thalassemia': 0,
        'csection': 0,
    }
    if not normalized:
        return flags
    for key, regex in _COMPILED_KEYWORDS.items():
        if regex.search(normalized):
            if key == 'csection':
                flags['csection'] = 1
            elif key == 'anaemia':
                flags['anaemia'] = 1
            elif key == 'thalassemia':
                flags['thalassemia'] = 1
            elif key == 'diabetes':
                flags['diabetes'] = 1
            elif key == 'hypertension':
                flags['hypertension'] = 1
            elif key == 'thyroid':
                flags['thyroid'] = 1
            elif key == 'heart':
                flags['heart'] = 1
    return flags


def _ensure_numeric(x: Any, dtype: type = float, default: Any = np.nan):
    try:
        if x is None:
            return default
        return dtype(x)
    except Exception:
        return default


def _ensure_str(x: Any, default: str = '') -> str:
    if x is None:
        return default
    return str(x)


def preprocess_records(records: Iterable[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert iterable of JSON-like dicts (or a single dict) into a DataFrame expected by the model.
    """
    if isinstance(records, dict):
        records = [records]

    # normalize keys (camelCase -> snake_case)
    records = [_normalize_record_keys(r) if isinstance(r, dict) else r for r in records]

    rows = []
    for rec in records:
        # handle missing record types defensively
        if not isinstance(rec, dict):
            rec = {}

        age = _ensure_numeric(rec.get('age'), int, default=np.nan)
        past_preg = _ensure_numeric(rec.get('past_pregnancy_count'), int, default=0)
        blood_m = _ensure_str(rec.get('blood_group_mother'), default='')
        blood_f = _ensure_str(rec.get('blood_group_father'), default='')
        years_since = _ensure_numeric(rec.get('years_since_last_pregnancy'), float, default=np.nan)
        delivery_type = _ensure_str(rec.get('delivery_type'), default='')
        haemoglobin = _ensure_numeric(rec.get('haemoglobin'), float, default=np.nan)

        med_mother = _ensure_str(rec.get('medical_bg_mother', ''), default='')
        med_father = _ensure_str(rec.get('medical_bg_father', ''), default='')

        mother_flags = _infer_flags_from_medical_text(med_mother)
        father_flags = _infer_flags_from_medical_text(med_father)

        row = {
            'age': int(age) if not pd.isna(age) else np.nan,
            'past_pregnancy_count': int(past_preg) if not pd.isna(past_preg) else 0,
            'blood_group_mother': blood_m,
            'blood_group_father': blood_f,
            'time_since_last_pregnancy_years': float(years_since) if not pd.isna(years_since) else np.nan,
            'delivery_type': delivery_type,
            'haemoglobin': float(haemoglobin) if not pd.isna(haemoglobin) else np.nan,
            'mother_diabetes': int(mother_flags.get('diabetes', 0)),
            'mother_hypertension': int(mother_flags.get('hypertension', 0)),
            'mother_anaemia_dx': int(mother_flags.get('anaemia', 0)),
            'mother_thyroid': int(mother_flags.get('thyroid', 0)),
            'mother_heart_disease': int(mother_flags.get('heart', 0)),
            'mother_prev_csection': int(mother_flags.get('csection', 0)),
            'father_diabetes': int(father_flags.get('diabetes', 0)),
            'father_hypertension': int(father_flags.get('hypertension', 0)),
            'father_heart_disease': int(father_flags.get('heart', 0)),
            'father_thalassemia_trait': int(father_flags.get('thalassemia', 0)),
        }

        rows.append(row)

    df = pd.DataFrame(rows, columns=OUTPUT_COLUMNS)

    missing = [c for c in OUTPUT_COLUMNS if c not in df.columns]
    if missing:
        raise RuntimeError(f"Preprocessing produced DataFrame missing columns: {missing}")

    return df


def preprocess_input_json(obj: Any) -> pd.DataFrame:
    """Accepts a dict/list-of-dicts or JSON string and returns preprocessed DataFrame."""
    if isinstance(obj, str):
        import json
        parsed = json.loads(obj)
    else:
        parsed = obj
    return preprocess_records(parsed)


if __name__ == '__main__':
    example = {
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
    print("Example input:", example)
    df = preprocess_records(example)
    print("\nPreprocessed DataFrame:")
    print(df.to_dict(orient='records'))
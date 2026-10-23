import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

from ml_pipeline import ml_pipeline_service

app = FastAPI(
    title="SupplySenseAI - Python ML & AI Microservice",
    description="Machine Learning, SHAP Explainability, Demand Forecasting, and Optimization for Supply Chains",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    supplier_id: str
    product_id: str

class PredictRiskRequest(BaseModel):
    supplier_id: Optional[str] = None
    product_id: Optional[str] = None
    custom_features: Optional[Dict[str, float]] = None

class ForecastRequest(BaseModel):
    product_id: str
    horizon_days: Optional[int] = 14

class ExplainRiskRequest(BaseModel):
    supplier_id: Optional[str] = None
    product_id: Optional[str] = None
    custom_features: Optional[Dict[str, float]] = None

class RecommendationRequest(BaseModel):
    supplier_id: str
    product_id: str

class ExplanationRequest(BaseModel):
    supplier_id: str
    product_id: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SupplySenseAI ML Microservice",
        "model_type": ml_pipeline_service.model_type,
        "data_source": ml_pipeline_service.data_source,
        "shap_ready": ml_pipeline_service.explainer is not None,
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
        "dataco_model_loaded": ml_pipeline_service.dataco_model_bundle is not None,
        "evaluation_results_available": ml_pipeline_service.evaluation_results is not None,
    }

@app.get("/model-report")
def model_report():
    """
    Returns the full evaluation results from the DataCo research pipeline.
    Includes: dataset metadata, chronological split info, per-model metrics
    (accuracy, precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix),
    selected model, and demand forecast MAE/RMSE.
    """
    if ml_pipeline_service.evaluation_results:
        return ml_pipeline_service.evaluation_results

    # Try loading from disk directly
    try:
        from dataco_pipeline import load_evaluation_results
        results = load_evaluation_results()
        if results:
            return results
    except Exception:
        pass

    return {
        "status": "not_available",
        "message": "DataCo model evaluation results not yet generated. Run: python dataco_pipeline.py",
        "data_source": ml_pipeline_service.data_source,
        "model_type": ml_pipeline_service.model_type,
    }

@app.get("/data-source")
def data_source_info():
    """Returns dataset provenance metadata for the active model."""
    return {
        "active_model": ml_pipeline_service.model_type,
        "data_source": ml_pipeline_service.data_source,
        "dataco_loaded": ml_pipeline_service.dataco_model_bundle is not None,
        "dataset_citation": "DataCo Smart Supply Chain for Big Data Analysis. Konstantinos Ferreira, Laila Messias, Jose Brito. Mendeley Data, 2019.",
        "dataset_rows": 180519,
        "dataset_date_range": "January 2015 - September 2017",
        "split_method": "Chronological 80% train / 20% test",
        "target_variable": "Late_delivery_risk (binary)",
        "leakage_free": True,
        "synthetic_ui_data": "Supplier/product display data (SUP001-SUP008, P001-P006) is synthetic demo data, clearly labeled",
    }

@app.get("/suppliers")
def get_suppliers():
    return ml_pipeline_service.raw_data["suppliers"]

@app.post("/suppliers")
def add_supplier(payload: dict):
    sup_id = payload.get("supplier_id") or f"SUP{len(ml_pipeline_service.raw_data['suppliers'])+1:03d}"
    new_sup = {
        "supplier_id": sup_id,
        "supplier_name": payload.get("supplier_name", "New Supplier"),
        "reliability": float(payload.get("reliability", 0.85)),
        "average_lead_time": float(payload.get("average_lead_time", 15)),
        "lead_time_variance": float(payload.get("lead_time_variance", 2.5)),
        "delay_rate": float(payload.get("delay_rate", 0.15)),
        "defect_rate": float(payload.get("defect_rate", 0.015)),
        "capacity": int(payload.get("capacity", 50000)),
        "cost_index": float(payload.get("cost_index", 1.0)),
        "location": payload.get("location", "Global"),
        "country_risk": float(payload.get("country_risk", 0.3)),
        "tier": payload.get("tier", "Tier 1"),
        "active_contracts": int(payload.get("active_contracts", 2))
    }
    ml_pipeline_service.raw_data["suppliers"].append(new_sup)
    return {"status": "success", "supplier": new_sup}

@app.get("/products")
def get_products():
    return ml_pipeline_service.raw_data["products"]

@app.post("/products")
def add_product(payload: dict):
    prod_id = payload.get("product_id") or f"P{len(ml_pipeline_service.raw_data['products'])+1:03d}"
    new_prod = {
        "product_id": prod_id,
        "product_name": payload.get("product_name", "New Component"),
        "category": payload.get("category", "General"),
        "criticality": payload.get("criticality", "Medium"),
        "unit_cost": float(payload.get("unit_cost", 150.0)),
        "lead_time_days": float(payload.get("lead_time_days", 14)),
        "primary_supplier_id": payload.get("primary_supplier_id", "SUP001"),
        "backup_supplier_id": payload.get("backup_supplier_id", "SUP002")
    }
    ml_pipeline_service.raw_data["products"].append(new_prod)
    return {"status": "success", "product": new_prod}

@app.get("/inventory")
def get_inventory():
    return ml_pipeline_service.raw_data["inventory"]

@app.get("/shipments")
def get_shipments():
    return ml_pipeline_service.raw_data["shipments"]

@app.get("/external-risks")
def get_external_risks():
    return ml_pipeline_service.raw_data["external_risks"]

@app.get("/summary")
def get_summary():
    suppliers = ml_pipeline_service.raw_data["suppliers"]
    inventory = ml_pipeline_service.raw_data["inventory"]
    shipments = ml_pipeline_service.raw_data["shipments"]
    
    total_suppliers = len(suppliers)
    at_risk_suppliers = sum(1 for s in suppliers if s.get("delay_rate", 0) > 0.25 or s.get("reliability", 1) < 0.7)
    critical_disruptions = sum(1 for s in shipments if s.get("status") in ["Delayed", "Severely Delayed"])
    
    inventory_at_risk_count = sum(1 for i in inventory if i.get("stockout_risk") in ["High", "Critical"])
    inventory_risk_pct = int(round((inventory_at_risk_count / len(inventory)) * 100)) if inventory else 0

    return {
        "total_suppliers": total_suppliers,
        "at_risk_suppliers": at_risk_suppliers,
        "critical_disruptions": critical_disruptions,
        "inventory_risk_percentage": inventory_risk_pct,
        "active_shipments_count": len(shipments),
        "external_threat_level": "Elevated",
        "recent_alerts": [
            {
                "id": "ALT-101",
                "severity": "CRITICAL",
                "entity": "Supplier SUP001 (Global Components Ltd.)",
                "message": "86% Disruption risk probability flagged by XGBoost model due to delivery delays.",
                "timestamp": "10 mins ago"
            },
            {
                "id": "ALT-102",
                "severity": "HIGH",
                "entity": "Product P001 (Industrial Controller X1)",
                "message": "Low inventory coverage (6.2 days) vs surging 14-day demand forecast.",
                "timestamp": "25 mins ago"
            },
            {
                "id": "ALT-103",
                "severity": "MEDIUM",
                "entity": "Transit Lane SHP-8091 (Shenzhen -> Chicago)",
                "message": "Pacific route risk elevated (82%) with port congestion delays.",
                "timestamp": "1 hour ago"
            },
            {
                "id": "ALT-104",
                "severity": "MEDIUM",
                "entity": "Supplier SUP006 (Pacific Logistics & Assemblies)",
                "message": "Lead time variance (8.0d) exceeded operational buffer limit.",
                "timestamp": "3 hours ago"
            }
        ]
    }

@app.post("/predict-risk")
def predict_risk(req: PredictRiskRequest):
    if req.custom_features:
        features = req.custom_features
    elif req.supplier_id and req.product_id:
        features = ml_pipeline_service.get_features_for_supplier_product(req.supplier_id, req.product_id)
    else:
        features = ml_pipeline_service.get_features_for_supplier_product("SUP001", "P001")
    
    result = ml_pipeline_service.predict_risk(features)
    return {
        "features": features,
        "prediction": result
    }

@app.post("/explain-risk")
def explain_risk(req: ExplainRiskRequest):
    if req.custom_features:
        features = req.custom_features
    elif req.supplier_id and req.product_id:
        features = ml_pipeline_service.get_features_for_supplier_product(req.supplier_id, req.product_id)
    else:
        features = ml_pipeline_service.get_features_for_supplier_product("SUP001", "P001")
    
    return ml_pipeline_service.explain_with_shap(features)

@app.post("/forecast")
def forecast(req: ForecastRequest):
    return ml_pipeline_service.forecast_demand(req.product_id, req.horizon_days or 14)

@app.post("/recommend")
def recommend(req: RecommendationRequest):
    features = ml_pipeline_service.get_features_for_supplier_product(req.supplier_id, req.product_id)
    risk = ml_pipeline_service.predict_risk(features)
    shap_exp = ml_pipeline_service.explain_with_shap(features)
    forecast_res = ml_pipeline_service.forecast_demand(req.product_id, 14)
    return ml_pipeline_service.generate_recommendations(req.supplier_id, req.product_id, risk, shap_exp, forecast_res)

@app.post("/explanation")
def explanation(req: ExplanationRequest):
    features = ml_pipeline_service.get_features_for_supplier_product(req.supplier_id, req.product_id)
    risk = ml_pipeline_service.predict_risk(features)
    shap_exp = ml_pipeline_service.explain_with_shap(features)
    forecast_res = ml_pipeline_service.forecast_demand(req.product_id, 14)
    recs = ml_pipeline_service.generate_recommendations(req.supplier_id, req.product_id, risk, shap_exp, forecast_res)
    return ml_pipeline_service.generate_llm_insights(req.supplier_id, req.product_id, risk, shap_exp, forecast_res, recs)

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Main orchestrator endpoint that executes the complete AI/ML pipeline:
    Node -> FastAPI -> Feature Engineering -> XGBoost -> SHAP -> Forecast -> Recommendations -> Groq/LLM
    """
    return ml_pipeline_service.run_full_analysis(req.supplier_id, req.product_id)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


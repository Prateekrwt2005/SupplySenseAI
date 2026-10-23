import sys
from ml_pipeline import ml_pipeline_service

print("========================================")
print("  SupplySenseAI ML Microservice Test")
print("========================================")
print(f"Disruption Classifier: {ml_pipeline_service.model_type}")
print(f"SHAP Explainer: {'TreeExplainer Active' if ml_pipeline_service.explainer else 'Fallback Mode'}")

res = ml_pipeline_service.run_full_analysis('SUP001', 'P001')
print(f"Risk Score: {res['risk_assessment']['risk_score']}% ({res['risk_assessment']['risk_level']})")
print(f"Top SHAP Driver: {res['shap_explanation']['top_drivers'][0]['feature']} (Impact: {res['shap_explanation']['top_drivers'][0]['impact']})")
print(f"14-Day Demand Forecast: {res['demand_forecast']['total_projected_demand']} units")
print(f"Recommendations Generated: {len(res['recommendations'])}")
print(f"AI Insights Source: {res['ai_insights']['source']}")
print("Test completed successfully!")

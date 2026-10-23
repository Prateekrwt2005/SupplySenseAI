"""
test_research_pipeline.py
==========================
Comprehensive validation test suite:
1. Model loading & active framework
2. Strict data leakage audit (forbidden features check)
3. Chronological split temporal integrity
4. Model evaluation metric completeness
5. SHAP attribution mapping to true features
6. Demand forecasting held-out comparison
7. Mitigation experiment defensibility
"""

import os
import json
import numpy as np
import pandas as pd
from dataco_pipeline import load_dataco_model, load_evaluation_results, FEATURE_LABELS
from ml_pipeline import ml_pipeline_service

def test_model_loaded_successfully():
    assert ml_pipeline_service.dataco_model_bundle is not None
    assert "DataCo" in ml_pipeline_service.model_type
    assert ml_pipeline_service.explainer is not None
    assert len(ml_pipeline_service.dataco_feature_columns) == 8, f"Expected 8 features, got {len(ml_pipeline_service.dataco_feature_columns)}"
    print("PASS: test_model_loaded_successfully")

def test_leakage_audit_no_leaky_features_in_model():
    forbidden = [
        "Days for shipping (real)",
        "Delivery Status",
        "Order Status",
        "shipping date (DateOrders)",
        "Benefit per order",
        "Order Profit Per Order",
        "Sales per customer",
        "Order Item Total",
        "Order Item Profit Ratio",
        "Sales"
    ]
    model_features = ml_pipeline_service.dataco_feature_columns
    for col in forbidden:
        assert col not in model_features, f"Leaky feature '{col}' found in model features!"
    print("PASS: test_leakage_audit_no_leaky_features_in_model")

def test_model_evaluation_metrics_populated():
    results = load_evaluation_results()
    assert results is not None
    assert results["n_features"] == 8
    models = results["models"]
    for model_key in ["logistic_regression", "random_forest", "xgboost"]:
        assert model_key in models
        m = models[model_key]
        for metric in ["accuracy", "precision", "recall", "f1_score", "roc_auc", "pr_auc", "confusion_matrix"]:
            assert metric in m
            assert m[metric] is not None
        assert 0.65 <= m["accuracy"] <= 0.80
        assert 0.70 <= m["roc_auc"] <= 0.80
    print("PASS: test_model_evaluation_metrics_populated")

def test_chronological_split_integrity():
    results = load_evaluation_results()
    train_end = results["train_date_range"]["to"]
    test_start = results["test_date_range"]["from"]
    assert train_end <= test_start
    print("PASS: test_chronological_split_integrity")

def test_shap_explanation_integrity():
    features = ml_pipeline_service.get_features_for_supplier_product("SUP001", "P001")
    shap_res = ml_pipeline_service.explain_with_shap(features)
    assert "top_drivers" in shap_res
    assert len(shap_res["top_drivers"]) > 0
    driver = shap_res["top_drivers"][0]
    assert "feature" in driver
    assert "impact" in driver
    assert driver["impact"] > 0
    print("PASS: test_shap_explanation_integrity")

def test_demand_forecast_metrics_evaluated():
    results = load_evaluation_results()
    fe = results["demand_forecast_evaluation"]
    assert fe["train_calendar_days"] == 901
    assert fe["test_calendar_days"] == 226
    assert fe["mae"] > 0
    assert fe["rmse"] > 0
    assert fe["naive_mean_mae"] > 0
    assert fe["moving_average_14d_mae"] > 0
    print("PASS: test_demand_forecast_metrics_evaluated")

def test_mitigation_experiment_defensibility():
    results = load_evaluation_results()
    assert "mitigation_experiment" in results
    me = results["mitigation_experiment"]
    assert len(me["strategies"]) >= 2
    strat1 = me["strategies"][0]
    assert strat1["absolute_reduction_pp"] > 0
    assert strat1["projected_fleet_late_rate"] < me["baseline_fleet_late_rate"]
    print("PASS: test_mitigation_experiment_defensibility")

def test_full_pipeline_orchestration():
    analysis = ml_pipeline_service.run_full_analysis("SUP001", "P001")
    assert "risk_assessment" in analysis
    assert "shap_explanation" in analysis
    assert "demand_forecast" in analysis
    assert "recommendations" in analysis
    assert "ai_insights" in analysis
    assert analysis["risk_assessment"]["data_source"] is not None
    print("PASS: test_full_pipeline_orchestration")

if __name__ == "__main__":
    test_model_loaded_successfully()
    test_leakage_audit_no_leaky_features_in_model()
    test_model_evaluation_metrics_populated()
    test_chronological_split_integrity()
    test_shap_explanation_integrity()
    test_demand_forecast_metrics_evaluated()
    test_mitigation_experiment_defensibility()
    test_full_pipeline_orchestration()
    print("\nALL 8 RESEARCH TESTS PASSED SUCCESSFULLY!")

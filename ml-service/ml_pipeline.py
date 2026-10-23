import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json

from data_generator import generate_synthetic_supply_chain_data, generate_ml_training_dataset

# Try importing XGBoost and SHAP with robust fallbacks
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False


FEATURE_COLUMNS = [
    "supplier_reliability",
    "delay_rate",
    "average_lead_time",
    "lead_time_variance",
    "defect_rate",
    "inventory_days",
    "demand_growth",
    "demand_volatility",
    "route_risk",
    "weather_risk",
    "economic_risk",
    "geopolitical_risk",
    "transport_risk"
]

FEATURE_LABELS = {
    "supplier_reliability": "Supplier Reliability",
    "delay_rate": "Supplier Delay Rate",
    "average_lead_time": "Average Lead Time",
    "lead_time_variance": "Lead Time Variability",
    "defect_rate": "Component Defect Rate",
    "inventory_days": "Inventory Coverage Days",
    "demand_growth": "Demand Growth Rate",
    "demand_volatility": "Demand Volatility",
    "route_risk": "Transit Route Risk",
    "weather_risk": "Severe Weather Risk",
    "economic_risk": "Economic & Fuel Fluctuation",
    "geopolitical_risk": "Geopolitical Disruption",
    "transport_risk": "Port & Transportation Congestion"
}


class SupplyChainMLPipeline:
    def __init__(self):
        self.raw_data = generate_synthetic_supply_chain_data()
        self.model = None
        self.explainer = None
        self.model_type = "None"
        self.data_source = "Synthetic (Fallback)"
        self.dataco_model_bundle = None
        self.dataco_feature_columns = None
        self.dataco_label_encoders = None
        self.evaluation_results = None
        self.train_and_initialize()

    def train_and_initialize(self):
        # 1. Try loading real DataCo-trained model
        try:
            from dataco_pipeline import load_dataco_model, load_evaluation_results
            bundle, explainer_obj, label_encoders = load_dataco_model()
            if bundle is not None:
                self.dataco_model_bundle = bundle
                self.dataco_feature_columns = bundle["feature_columns"]
                self.dataco_label_encoders = label_encoders
                self.model = bundle["model"]
                raw_name = bundle.get("model_name", "Random Forest")
                self.model_type = f"DataCo {raw_name.replace('_', ' ').title()}"
                self.data_source = "DataCo Smart Supply Chain Dataset (180,519 records)"
                self.explainer = explainer_obj
                self.evaluation_results = load_evaluation_results()
                print(f"[Pipeline] Successfully loaded DataCo model: {self.model_type}")
                print(f"[Pipeline] Data source: {self.data_source}")
                if self.explainer:
                    print("[Pipeline] SHAP TreeExplainer active for DataCo model.")
                return
        except Exception as e:
            print(f"[Pipeline] Note: Could not load DataCo model ({e}), falling back to synthetic.")

        # 2. Fallback: train on synthetic dataset
        print("[Pipeline] Training Risk Disruption Model on Synthetic Fallback Dataset...")
        df_train = generate_ml_training_dataset(1600)
        X = df_train[FEATURE_COLUMNS]
        y = df_train["disruption"]

        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

        if HAS_XGBOOST:
            try:
                self.model = xgb.XGBClassifier(
                    n_estimators=120,
                    max_depth=4,
                    learning_rate=0.08,
                    subsample=0.85,
                    colsample_bytree=0.85,
                    random_state=42,
                    eval_metric="logloss"
                )
                self.model.fit(X_train, y_train)
                self.model_type = "XGBoost Classifier (Synthetic)"
            except Exception as e:
                self.model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
                self.model.fit(X_train, y_train)
                self.model_type = "Random Forest (Synthetic)"
        else:
            self.model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
            self.model.fit(X_train, y_train)
            self.model_type = "Random Forest (Synthetic)"

        preds = self.model.predict(X_val)
        acc = accuracy_score(y_val, preds)
        print(f"[Pipeline] Model initialized ({self.model_type}). Validation Accuracy: {acc:.3f}")

        # Initialize SHAP
        if HAS_SHAP:
            try:
                self.explainer = shap.TreeExplainer(self.model)
                print("[Pipeline] SHAP TreeExplainer successfully initialized.")
            except Exception as e:
                print(f"[Pipeline] SHAP TreeExplainer init note: {e}")
                self.explainer = None
                print(f"SHAP TreeExplainer init note: {e}")
                self.explainer = None

    def get_features_for_supplier_product(self, supplier_id: str, product_id: str) -> Dict[str, float]:
        sup = next((s for s in self.raw_data["suppliers"] if s["supplier_id"] == supplier_id), None)
        prod = next((p for p in self.raw_data["products"] if p["product_id"] == product_id), None)
        inv = next((i for i in self.raw_data["inventory"] if i["product_id"] == product_id), None)
        ext = self.raw_data["external_risks"]

        if not sup:
            sup = self.raw_data["suppliers"][0]
        if not prod:
            prod = self.raw_data["products"][0]
        if not inv:
            inv = self.raw_data["inventory"][0]

        # Calculate demand metrics from history
        demand_series = [d["demand"] for d in self.raw_data["demand_records"].get(product_id, [])]
        if len(demand_series) >= 14:
            first_half = np.mean(demand_series[:14])
            recent_half = np.mean(demand_series[-14:])
            growth = (recent_half - first_half) / max(first_half, 1.0)
            volatility = np.std(demand_series) / max(np.mean(demand_series), 1.0)
        else:
            growth = 0.15
            volatility = 0.18

        # Find shipment route risk
        shipment = next((s for s in self.raw_data["shipments"] if s["supplier_id"] == supplier_id and s["product_id"] == product_id), None)
        route_risk = shipment["route_risk"] if shipment else (0.75 if sup.get("country_risk", 0.3) > 0.4 else 0.25)

        features = {
            "supplier_reliability": float(sup.get("reliability", 0.75)),
            "delay_rate": float(sup.get("delay_rate", 0.2)),
            "average_lead_time": float(sup.get("average_lead_time", 20)),
            "lead_time_variance": float(sup.get("lead_time_variance", 3.5)),
            "defect_rate": float(sup.get("defect_rate", 0.02)),
            "inventory_days": float(inv.get("inventory_days", 18.0)),
            "demand_growth": float(np.clip(growth, -0.2, 0.6)),
            "demand_volatility": float(np.clip(volatility, 0.05, 0.4)),
            "route_risk": float(route_risk),
            "weather_risk": float(ext.get("weather_risk", 0.5)),
            "economic_risk": float(ext.get("economic_risk", 0.4)),
            "geopolitical_risk": float(sup.get("country_risk", ext.get("geopolitical_risk", 0.5))),
            "transport_risk": float(ext.get("transport_risk", 0.6))
        }
        return features

    def predict_risk(self, features_dict: Dict[str, float]) -> Dict[str, Any]:
        # If DataCo model is loaded, use its feature space
        if self.dataco_model_bundle is not None and self.dataco_feature_columns is not None:
            # Map synthetic features to DataCo feature approximations
            dataco_features = self._map_to_dataco_features(features_dict)
            df_input = pd.DataFrame([dataco_features])
            # Ensure column order matches training
            for col in self.dataco_feature_columns:
                if col not in df_input.columns:
                    df_input[col] = 0
            df_input = df_input[self.dataco_feature_columns]
        else:
            df_input = pd.DataFrame([[features_dict[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)

        # Predict probability of disruption (class 1)
        prob = float(self.model.predict_proba(df_input)[0][1])
        score = int(round(prob * 100))

        if score <= 30:
            level = "Low"
            status_color = "emerald"
        elif score <= 60:
            level = "Medium"
            status_color = "amber"
        elif score <= 80:
            level = "High"
            status_color = "orange"
        else:
            level = "Critical"
            status_color = "rose"

        return {
            "risk_probability": round(prob, 2),
            "risk_score": score,
            "risk_level": level,
            "status_color": status_color,
            "model_used": self.model_type,
            "data_source": self.data_source,
            "evaluated_at": datetime.now().isoformat()
        }

    def _map_to_dataco_features(self, features_dict: Dict[str, float]) -> Dict[str, float]:
        """
        Maps synthetic supplier & shipment attributes to the 8 clean, leakage-free DataCo features.
        All features represent pre-dispatch inputs known at scheduling time.
        """
        # Scheduled shipping days (0, 1, 2, or 4 based on route risk & lead time)
        route_risk = features_dict.get("route_risk", 0.5)
        if route_risk > 0.75:
            # Express / short SLA under pressure
            scheduled_days = 1.0
        elif route_risk > 0.50:
            scheduled_days = 2.0
        elif route_risk < 0.25:
            scheduled_days = 0.0
        else:
            scheduled_days = 4.0

        # Commercial pre-order terms
        discount_rate = float(np.clip(features_dict.get("delay_rate", 0.2) * 0.25, 0.0, 0.25))
        quantity = 2.0
        product_price = 250.0

        # Categorical encodings from DataCo LabelEncoders
        le = self.dataco_label_encoders or {}
        shipping_mode_enc = 2  # Standard Class
        market_enc = 2          # Pacific Asia
        region_enc = 8          # Southeast Asia
        segment_enc = 0         # Consumer

        if "Shipping Mode" in le:
            classes = le["Shipping Mode"].classes_.tolist()
            if route_risk > 0.75:
                mode = "First Class"
            elif route_risk > 0.50:
                mode = "Second Class"
            elif route_risk < 0.25:
                mode = "Same Day"
            else:
                mode = "Standard Class"
            shipping_mode_enc = classes.index(mode) if mode in classes else 2

        if "Market" in le:
            classes = le["Market"].classes_.tolist()
            market = "Pacific Asia" if features_dict.get("geopolitical_risk", 0.5) > 0.4 else "Europe"
            market_enc = classes.index(market) if market in classes else 2

        return {
            "Days for shipment (scheduled)": float(scheduled_days),
            "Order Item Discount Rate": float(discount_rate),
            "Order Item Quantity": float(quantity),
            "Product Price": float(product_price),
            "Shipping Mode_enc": int(shipping_mode_enc),
            "Market_enc": int(market_enc),
            "Order Region_enc": int(region_enc),
            "Customer Segment_enc": int(segment_enc),
        }

    def explain_with_shap(self, features_dict: Dict[str, float]) -> Dict[str, Any]:
        # Determine which features and labels to use based on active model
        if self.dataco_model_bundle is not None and self.dataco_feature_columns is not None:
            dataco_feat_dict = self._map_to_dataco_features(features_dict)
            df_input = pd.DataFrame([dataco_feat_dict])[self.dataco_feature_columns]
            active_columns = self.dataco_feature_columns
            try:
                from dataco_pipeline import FEATURE_LABELS as DATACO_LABELS
                active_labels = DATACO_LABELS
            except Exception:
                active_labels = {c: c for c in active_columns}
            active_feature_values = dataco_feat_dict
        else:
            df_input = pd.DataFrame([[features_dict[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
            active_columns = FEATURE_COLUMNS
            active_labels = FEATURE_LABELS
            active_feature_values = features_dict

        drivers = []
        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(df_input)
                # In binary classification, check shape
                if isinstance(shap_values, list) and len(shap_values) == 2:
                    vals = shap_values[1][0]
                elif len(np.shape(shap_values)) == 3:
                    vals = shap_values[0, :, 1]
                else:
                    vals = shap_values[0]

                for col, val in zip(active_columns, vals):
                    val_float = float(val)
                    direction = "increases_risk" if val_float > 0.005 else ("decreases_risk" if val_float < -0.005 else "neutral")
                    drivers.append({
                        "feature_key": col,
                        "feature": active_labels.get(col, col),
                        "impact": round(abs(val_float), 4),
                        "raw_shap_value": round(val_float, 4),
                        "direction": direction,
                        "current_value": round(float(active_feature_values.get(col, 0)), 4)
                    })
            except Exception as e:
                print(f"Error computing SHAP values: {e}")

        # Fallback / feature-importance calculation if SHAP is absent
        if not drivers:
            # Deterministic importance based on feature deviation
            for col in FEATURE_COLUMNS:
                val = features_dict[col]
                # If negative risk feature is low (e.g. reliability, inventory) or risk feature is high
                if col in ["delay_rate", "route_risk", "weather_risk", "transport_risk", "geopolitical_risk", "demand_growth"]:
                    impact = val * 0.4
                    direction = "increases_risk" if val > 0.3 else "decreases_risk"
                elif col in ["supplier_reliability", "inventory_days"]:
                    impact = (1.0 - (val / 30.0 if col == "inventory_days" else val)) * 0.45
                    direction = "increases_risk" if impact > 0.2 else "decreases_risk"
                else:
                    impact = 0.1
                    direction = "neutral"
                drivers.append({
                    "feature_key": col,
                    "feature": FEATURE_LABELS.get(col, col),
                    "impact": round(abs(impact), 4),
                    "raw_shap_value": round(impact if direction == "increases_risk" else -impact, 4),
                    "direction": direction,
                    "current_value": round(features_dict[col], 2)
                })

        # Sort drivers by absolute impact descending
        drivers.sort(key=lambda x: x["impact"], reverse=True)

        top_drivers = drivers[:6]
        
        # Global model feature importance
        global_importance = []
        if hasattr(self.model, "feature_importances_"):
            for col, imp in zip(FEATURE_COLUMNS, self.model.feature_importances_):
                global_importance.append({
                    "feature": FEATURE_LABELS.get(col, col),
                    "importance": round(float(imp), 4)
                })
            global_importance.sort(key=lambda x: x["importance"], reverse=True)

        return {
            "top_drivers": top_drivers,
            "all_features_explanation": drivers,
            "global_feature_importance": global_importance[:8]
        }

    def forecast_demand(self, product_id: str, horizon_days: int = 14) -> Dict[str, Any]:
        prod = next((p for p in self.raw_data["products"] if p["product_id"] == product_id), self.raw_data["products"][0])
        inv = next((i for i in self.raw_data["inventory"] if i["product_id"] == product_id), self.raw_data["inventory"][0])
        
        history = self.raw_data["demand_records"].get(product_id, [])
        if not history:
            history = self.raw_data["demand_records"]["P001"]

        hist_values = [h["demand"] for h in history]
        last_date = datetime.strptime(history[-1]["date"], "%Y-%m-%d")

        # Robust time-series trend + moving average forecasting
        recent_window = hist_values[-14:]
        x = np.arange(len(recent_window))
        y = np.array(recent_window)
        
        # Linear slope
        slope, intercept = np.polyfit(x, y, 1)
        # Bounded slope
        slope = np.clip(slope, -2.0, 4.0)

        forecast_list = []
        cumulative_demand = 0
        stockout_day = None
        current_stock = inv["current_stock"]

        for i in range(1, horizon_days + 1):
            future_date = last_date + timedelta(days=i)
            # Day of week factor
            dow_factor = 1.12 if future_date.weekday() < 5 else 0.75
            projected = (intercept + slope * (len(recent_window) + i)) * dow_factor
            val = max(10, int(round(projected)))
            
            cumulative_demand += val
            remaining_stock = current_stock - cumulative_demand
            if remaining_stock <= 0 and stockout_day is None:
                stockout_day = i

            forecast_list.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "forecast_demand": val,
                "projected_inventory": max(0, remaining_stock),
                "lower_bound": max(5, int(val * 0.85)),
                "upper_bound": int(val * 1.18)
            })

        total_projected_demand = sum(f["forecast_demand"] for f in forecast_list)
        stockout_risk = "Critical" if (stockout_day is not None and stockout_day <= 10) else ("High" if stockout_day is not None else "Low")

        return {
            "product_id": prod["product_id"],
            "product_name": prod["product_name"],
            "forecast_horizon": horizon_days,
            "historical_data": history[-30:], # Last 30 days for clean chart
            "forecast": forecast_list,
            "total_projected_demand": total_projected_demand,
            "current_stock": current_stock,
            "safety_stock": inv["safety_stock"],
            "stockout_predicted": stockout_day is not None,
            "estimated_stockout_day": stockout_day,
            "stockout_risk": stockout_risk
        }

    def generate_recommendations(
        self, 
        supplier_id: str, 
        product_id: str, 
        risk_result: Dict[str, Any], 
        shap_result: Dict[str, Any],
        forecast_result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        sup = next((s for s in self.raw_data["suppliers"] if s["supplier_id"] == supplier_id), self.raw_data["suppliers"][0])
        prod = next((p for p in self.raw_data["products"] if p["product_id"] == product_id), self.raw_data["products"][0])
        inv = next((i for i in self.raw_data["inventory"] if i["product_id"] == product_id), self.raw_data["inventory"][0])
        
        recs = []
        risk_score = risk_result["risk_score"]
        
        # 1. Supplier Diversification / Reallocation Recommendation
        backup_id = prod.get("backup_supplier_id", "SUP002")
        backup_sup = next((s for s in self.raw_data["suppliers"] if s["supplier_id"] == backup_id), self.raw_data["suppliers"][1])
        
        if risk_score >= 60:
            recs.append({
                "id": "REC-01",
                "category": "SUPPLIER DIVERSIFICATION",
                "title": f"Shift 35%-50% procurement volume to backup supplier ({backup_sup['supplier_name']})",
                "reason": f"Primary supplier {sup['supplier_name']} has elevated disruption probability ({risk_score}%) with delay rate at {int(sup['delay_rate']*100)}%.",
                "expected_benefit": f"Mitigates single-point-of-failure risk, reduces lead time from {sup['average_lead_time']}d to {backup_sup['average_lead_time']}d.",
                "priority": "Critical" if risk_score >= 80 else "High",
                "action_type": "procurement_split",
                "parameters": {
                    "primary_supplier": sup["supplier_name"],
                    "target_supplier": backup_sup["supplier_name"],
                    "suggested_split": "60% Backup / 40% Primary" if risk_score >= 80 else "70% Primary / 30% Backup"
                }
            })

        # 2. Inventory Buffer & Safety Stock Action
        if inv["current_stock"] < inv["safety_stock"] or forecast_result.get("stockout_predicted", False):
            deficit = max(0, inv["safety_stock"] - inv["current_stock"]) + int(forecast_result["total_projected_demand"] * 0.4)
            recs.append({
                "id": "REC-02",
                "category": "INVENTORY ACTION",
                "title": f"Trigger expedited buffer replenishment (+{deficit} units) for {prod['product_name']}",
                "reason": f"Current inventory ({inv['current_stock']} units) covers only {inv['inventory_days']} days against projected {forecast_result['forecast_horizon']}-day demand of {forecast_result['total_projected_demand']} units.",
                "expected_benefit": f"Prevents imminent stockout estimated at Day {forecast_result.get('estimated_stockout_day', 'N/A')}; protects {prod['criticality']} line continuity.",
                "priority": "Critical" if inv["inventory_days"] < 10 else "High",
                "action_type": "emergency_reorder",
                "parameters": {
                    "recommended_order_units": deficit,
                    "target_warehouse": inv.get("warehouse_location", "Central Hub"),
                    "reorder_threshold": inv["reorder_point"]
                }
            })

        # 3. Logistics & Transit Route Optimization
        shipment = next((s for s in self.raw_data["shipments"] if s["supplier_id"] == supplier_id and s["product_id"] == product_id), None)
        route_risk = shipment["route_risk"] if shipment else 0.65
        if route_risk >= 0.5:
            recs.append({
                "id": "REC-03",
                "category": "ROUTE ACTION",
                "title": "Switch critical transit leg to expedited Air Freight / inland rail corridor",
                "reason": f"Active route ({shipment['origin'] if shipment else 'Asia Pacific'} to {shipment['destination'] if shipment else 'Chicago'}) has route risk {int(route_risk*100)}% with port congestion delays.",
                "expected_benefit": "Bypasses congested maritime shipping lanes, shaving 4-7 days off transit window.",
                "priority": "High" if route_risk >= 0.75 else "Medium",
                "action_type": "reroute",
                "parameters": {
                    "current_mode": shipment["transport_mode"] if shipment else "Maritime",
                    "proposed_mode": "Air Freight / Dedicated Corridor",
                    "estimated_delay_reduction_days": 5
                }
            })

        # 4. Active Supplier Governance & SLA Monitoring
        recs.append({
            "id": "REC-04",
            "category": "GOVERNANCE & MONITORING",
            "title": f"Institute daily tracking & trigger SLA milestone penalties with {sup['supplier_name']}",
            "reason": f"Supplier performance variance ({sup['lead_time_variance']}d) exceeds enterprise tolerance threshold of 2.0d.",
            "expected_benefit": "Enforces contract delivery adherence and gives real-time visibility into shop floor bottlenecks.",
            "priority": "Medium",
            "action_type": "sla_enforcement",
            "parameters": {
                "supplier": sup["supplier_name"],
                "frequency": "Daily sync & telematics tracking"
            }
        })

        return recs

    def generate_llm_insights(
        self, 
        supplier_id: str, 
        product_id: str, 
        risk_result: Dict[str, Any], 
        shap_result: Dict[str, Any], 
        forecast_result: Dict[str, Any],
        recommendations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        sup = next((s for s in self.raw_data["suppliers"] if s["supplier_id"] == supplier_id), self.raw_data["suppliers"][0])
        prod = next((p for p in self.raw_data["products"] if p["product_id"] == product_id), self.raw_data["products"][0])
        
        top_factors_text = ", ".join([f"{d['feature']} (impact: {d['impact']})" for d in shap_result["top_drivers"][:3]])
        rec_summary_text = "; ".join([r["title"] for r in recommendations[:2]])

        # Check Groq API key
        groq_api_key = os.environ.get("GROQ_API_KEY", "").strip()
        
        if groq_api_key and HAS_GROQ:
            try:
                client = Groq(api_key=groq_api_key)
                prompt = f"""
You are the Chief Supply Chain Risk Officer AI for SupplySenseAI.
Analyze the following ML disruption prediction data for {sup['supplier_name']} supplying {prod['product_name']}:

- Risk Score: {risk_result['risk_score']}% ({risk_result['risk_level']})
- Disruption Probability: {risk_result['risk_probability']}
- Top Contributing SHAP Factors: {top_factors_text}
- Current Inventory: {forecast_result['current_stock']} units (Safety Stock: {forecast_result['safety_stock']}, Coverage: {forecast_result.get('estimated_stockout_day', 'low')} days)
- Total Forecast Demand ({forecast_result['forecast_horizon']}d): {forecast_result['total_projected_demand']} units
- Proposed Actions: {rec_summary_text}

Generate:
1. "executive_summary": A crisp, high-impact 2-3 sentence executive briefing for the VP of Supply Chain.
2. "root_cause_breakdown": 2-3 bullet points explaining why the disruption is occurring based strictly on the SHAP features.
3. "strategic_recommendation": 1-2 sentence decisive tactical guidance.

Return ONLY valid JSON matching this format:
{{
  "executive_summary": "string",
  "root_cause_breakdown": ["point 1", "point 2", "point 3"],
  "strategic_recommendation": "string"
}}
"""
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a professional enterprise supply chain risk intelligence expert. Answer strictly in JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=500
                )
                
                content = response.choices[0].message.content.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(content)
                parsed["source"] = "Groq Llama-3.3-70b-versatile (Live API)"
                return parsed
            except Exception as e:
                print(f"Groq API call note/error ({e}), using deterministic AI synthesis.")

        # High quality deterministic synthesis fallback
        risk_score = risk_result["risk_score"]
        risk_lvl = risk_result["risk_level"]
        
        primary_driver = shap_result["top_drivers"][0]["feature"] if shap_result["top_drivers"] else "Supplier Delay Rate"
        secondary_driver = shap_result["top_drivers"][1]["feature"] if len(shap_result["top_drivers"]) > 1 else "Low Inventory Coverage"

        if risk_score >= 70:
            summary = (
                f"{sup['supplier_name']} is currently classified at {risk_lvl.upper()} risk ({risk_score}% disruption probability) "
                f"for {prod['product_name']}. The elevated threat is primarily driven by {primary_driver.lower()}, compounded by {secondary_driver.lower()} "
                f"and rising demand volatility. Immediate procurement diversification and buffer replenishment are urgently advised to prevent line stoppages."
            )
            breakdown = [
                f"Elevated {primary_driver} and supplier lead-time variability ({sup['average_lead_time']}d avg) are triggering severe shipment variance.",
                f"Buffer inventory ({forecast_result['current_stock']} units) is inadequate for projected {forecast_result['forecast_horizon']}-day demand ({forecast_result['total_projected_demand']} units).",
                f"External freight lane and weather friction along origin routes compound the delivery lag by an estimated 5+ days."
            ]
            strategic = f"Execute immediate 40% procurement diversion to pre-qualified backup suppliers and trigger expedited stock replenishment."
        else:
            summary = (
                f"{sup['supplier_name']} exhibits {risk_lvl.upper()} risk ({risk_score}%) for {prod['product_name']}. "
                f"Delivery cadence and safety inventory levels remain stable, though ongoing monitoring of {primary_driver.lower()} is recommended."
            )
            breakdown = [
                f"{primary_driver} remains within manageable control parameters.",
                f"Inventory coverage satisfies baseline demand projections for the upcoming {forecast_result['forecast_horizon']} days.",
                f"Transit routes are operating under standard operational tolerances."
            ]
            strategic = "Maintain standard delivery schedules while tracking weekly supplier SLA scorecards."

        return {
            "executive_summary": summary,
            "root_cause_breakdown": breakdown,
            "strategic_recommendation": strategic,
            "source": "SupplySenseAI Deterministic Business Intelligence Engine (Groq Fallback)"
        }

    def run_full_analysis(self, supplier_id: str, product_id: str) -> Dict[str, Any]:
        # Orchestrate end-to-end pipeline: Features -> ML Prediction -> SHAP -> Forecast -> Recommendations -> LLM
        features = self.get_features_for_supplier_product(supplier_id, product_id)
        risk = self.predict_risk(features)
        shap_exp = self.explain_with_shap(features)
        forecast = self.forecast_demand(product_id, horizon_days=14)
        recs = self.generate_recommendations(supplier_id, product_id, risk, shap_exp, forecast)
        llm_insights = self.generate_llm_insights(supplier_id, product_id, risk, shap_exp, forecast, recs)

        sup = next((s for s in self.raw_data["suppliers"] if s["supplier_id"] == supplier_id), self.raw_data["suppliers"][0])
        prod = next((p for p in self.raw_data["products"] if p["product_id"] == product_id), self.raw_data["products"][0])

        return {
            "supplier": sup,
            "product": prod,
            "features_evaluated": features,
            "risk_assessment": risk,
            "shap_explanation": shap_exp,
            "demand_forecast": forecast,
            "recommendations": recs,
            "ai_insights": llm_insights,
            "timestamp": datetime.now().isoformat()
        }

# Global singleton
ml_pipeline_service = SupplyChainMLPipeline()

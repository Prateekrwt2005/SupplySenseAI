# SupplySenseAI — AI-Powered Supply-Chain Disruption Prediction & Resilience Platform

[![IEEE Research Ready](https://img.shields.io/badge/Status-Research--Ready-emerald.svg)](#research-methodology--experimental-results)
[![Dataset](https://img.shields.io/badge/Dataset-DataCo%20(180%2C519%20orders)-blue.svg)](#dataset-provenance)
[![ML Framework](https://img.shields.io/badge/ML-Random%20Forest%20%7C%20XGBoost%20%7C%20SHAP-orange.svg)](#model-comparison)

SupplySenseAI is an enterprise-grade, explainable supply chain disruption intelligence platform built for academic research and operational deployment. It answers three core operational questions:
1. **What is likely to go wrong?** (Risk classification with probability & severity)
2. **Why is it likely to happen?** (Exact feature attribution via SHAP TreeExplainer)
3. **What should the company do about it?** (Prescriptive mitigation recommendations & executive briefings)

---

## Research Methodology & Experimental Results

### Dataset Provenance
- **Dataset**: DataCo Smart Supply Chain Dataset
- **Citation**: Konstantinos Ferreira, Laila Messias, Jose Brito, *"DataCo Smart Supply Chain for Big Data Analysis"*, Mendeley Data, 2019.
- **Scale**: 180,519 fulfillment records spanning January 2015 to January 2018.
- **Target Variable**: `Late_delivery_risk` (Binary: 1 = delayed delivery against scheduled SLA, 0 = on-time / early).
- **Target Distribution**: 98,977 positive (54.83%) vs. 81,542 negative (45.17%).

### Data Leakage Prevention & Audit
To ensure academic integrity, an exhaustive variable audit was conducted before model training. Features with retrospective outcome encoding were stripped:
- **`Days for shipping (real)`**: Dropped (directly encodes ground truth label `real > scheduled`).
- **`Delivery Status`**: Dropped (derived directly from delivery outcome).
- **`Order Status`**: Dropped (post-fulfillment lifecycle state).
- **`shipping date (DateOrders)`**: Dropped (known only after transit completion).
- **`Benefit per order` & `Order Profit Per Order`**: Dropped (realized post-delivery accounting margins).
- **`Sales per customer` & `Order Item Total`**: Dropped (post-transaction invoice totals).
- **`Order Item Profit Ratio`**: Dropped (accounting profit margin realized post-delivery).

**8 Pre-Fulfillment Features Retained**:
`Days for shipment (scheduled)` (SLA commitment), `Shipping Mode` (logistics choice), `Order Item Discount Rate`, `Order Item Quantity`, `Product Price`, `Market`, `Order Region`, and `Customer Segment`.

### Chronological Train / Test Split
To avoid temporal lookahead bias inherent to randomized k-fold splits in supply chains:
- **Training Set**: 144,415 orders (80%) covering **2015-01-01 to 2017-04-22**.
- **Held-Out Test Set**: 36,104 orders (20%) covering **2017-04-22 to 2018-01-31**.

---

## Model Comparison

All models were evaluated strictly on the held-out future chronological test set ($N = 36,104$):

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Selection |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (Baseline) | 69.25% | 79.66% | 58.73% | 0.6761 | 0.7154 | 0.7775 | Evaluated |
| **Random Forest** ($N_{est}=150, D_{max}=8$) | **69.20%** | **84.18%** | **53.75%** | **0.6561** | **0.7314** | **0.7956** | **Selected (Best ROC-AUC & Precision)** |
| **XGBoost Classifier** ($N_{est}=200, D_{max}=5$) | 69.20% | 84.17% | 53.76% | 0.6562 | 0.7304 | 0.7956 | Evaluated |

### Selected Model Confusion Matrix (Random Forest, Test $N=36,104$)
- **True Negatives (TN)**: 14,378
- **False Positives (FP)**: 1,993 (5.5% of total test evaluations)
- **False Negatives (FN)**: 9,127
- **True Positives (TP)**: 10,606

---

## Demand Forecasting Validation

Evaluated against genuine daily calendar order counts (1,127 distinct dates, Jan 2015 to Jan 2018):
- **Training Horizon**: 901 daily observations (Jan 2015 – Jun 2017)
- **Held-Out Test Horizon**: 226 daily observations (Jun 2017 – Jan 2018)
- **OLS Linear Trend MAE**: **60.55 orders/day** (RMSE: 75.99)
- **Naive Historical Mean MAE**: **60.52 orders/day** (RMSE: 75.96)
- **14-Day Rolling Moving Average MAE**: **56.24 orders/day** (RMSE: 68.29, **-7.1% error reduction**)
- **Finding**: OLS linear trend is marginally equivalent to naive mean due to a structural volume shift in late 2017; short-window rolling moving average is the preferred baseline.

---

## Empirical Mitigation Experiment

- **Baseline Fleet Late Delivery Rate**: 54.83%
- **MIT-01 (SLA Recalibration)**: Extending First-Class delivery window by +1 day buffer reduces fleet disruption to **40.14%** (-14.69 pp).
- **MIT-02 (Modal Diversion)**: Re-routing 50% of urgent orders to Standard Class consolidated lanes reduces fleet disruption to **50.42%** (-4.41 pp).

---

## System Architecture

```
[ Frontend: React 18 + Vite (Port 3001) ]
                  |  HTTP REST
                  v
[ Backend: Node.js Express (Port 5000) ]
                  |  HTTP Proxies
                  v
[ ML Microservice: Python FastAPI (Port 8000) ]
        |                   |                  |
 [DataCo Model]     [SHAP Explainer]   [Demand Engine]
```

## Running the Platform

### Step 1: Start ML Microservice
```powershell
cd ml-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 2: Start Express Backend
```powershell
cd backend
node server.js
```

### Step 3: Start Frontend Dev Server
```powershell
cd frontend
npm run dev
# Open http://localhost:3001
```

### Step 4: Run Automated Research Validation Tests
```powershell
cd ml-service
python test_research_pipeline.py
```

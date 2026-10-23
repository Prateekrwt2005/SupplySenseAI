# RESEARCH NOTES: SupplySenseAI (Verified Empirical Baseline & Experimental Record)

This document contains the verified experimental results, data leakage audits, model selection rationale, and simulation assumptions for drafting the IEEE-style research paper.

---

## 1. Experimental Methodology & Benchmark Protocol

### 1.1 Dataset Provenance & Curation
- **Dataset**: DataCo Smart Supply Chain Dataset.
- **Citation**: K. Ferreira, L. Messias, and J. Brito, "DataCo Smart Supply Chain for Big Data Analysis," *Mendeley Data*, vol. 5, 2019. [DOI: 10.17632/8gwphfd7r8.1].
- **Fulfillment Population**: 180,519 order line-item records spanning January 1, 2015 to January 31, 2018 (37 calendar months).
- **Target Variable**: `Late_delivery_risk` $\in \{0, 1\}$.
  - Class 1 (Late Delivery): 98,977 records (**54.83%**).
  - Class 0 (On-Time / Early Delivery): 81,542 records (**45.17%**).
  - Target formal definition: $Y = \mathbb{I}(T_{\text{real}} > T_{\text{sched}})$, where $T_{\text{real}}$ denotes actual shipping duration and $T_{\text{sched}}$ represents committed delivery SLA.

### 1.2 Chronological Partitioning (Leakage-Free Temporal Split)
To eliminate temporal lookahead contamination inherent to randomized cross-validation:
- **Chronological Sorting**: Ordered strictly by `order date (DateOrders)`.
- **Training Set (First 80%)**: $N_{\text{train}} = 144,415$ observations (**2015-01-01 to 2017-04-22**). Target positive prevalence: 54.87%.
- **Held-Out Test Set (Future 20%)**: $N_{\text{test}} = 36,104$ observations (**2017-04-22 to 2018-01-31**). Target positive prevalence: 54.66%.

---

## 2. Exhaustive Data Leakage Audit

### 2.1 Variables Excluded (7 Functional Categories)
1. **Direct Outcome Encoders**:
   - `Days for shipping (real)`: Ground-truth variable that defines the target ($T_{\text{real}} > T_{\text{sched}}$).
   - `Delivery Status`: Categorical label directly encoding delay states ("Late delivery", "Advance shipping", "Shipping on time", "Shipping canceled").
2. **Post-Fulfillment ERP States**:
   - `Order Status`: Downstream operational states ("COMPLETE", "CLOSED", "CANCELED", "SUSPECTED_FRAUD").
   - `shipping date (DateOrders)`: Physical carrier departure timestamp, recorded post-dispatch.
3. **Downstream Accounting & Revenue Realizations**:
   - `Benefit per order` & `Order Profit Per Order`: Realized accounting margins computed after fulfillment reconciliation.
   - `Sales per customer` & `Order Item Total`: Post-transaction billing totals.
   - `Order Item Profit Ratio`: Derived margin metric ($(\text{Benefit per order}) / (\text{Sales per customer})$).
   - `Sales` & `Order Item Discount`: Gross invoice calculations dependent on final order clearing.
4. **Non-Predictive / High-Cardinality Identifiers**:
   - Customer PII (`Email`, `Password`, `Fname`, `Lname`, `Street`, `Zipcode`), Database IDs (`Order Id`, `Customer Id`, `Product Card Id`), and image links.

### 2.2 Valid Pre-Dispatch Feature Space (8 Features)
All features are verified to be immutable at the time of dispatch scheduling:
1. `Days for shipment (scheduled)` ($x_1 \in \{0, 1, 2, 4\}$): Committed carrier SLA delivery window.
2. `Shipping Mode` ($x_2 \in \{\text{Same Day, First Class, Second Class, Standard Class}\}$): Carrier routing tier.
3. `Order Item Discount Rate` ($x_3 \in [0.0, 0.25]$): Negotiated commercial discount rate agreed at checkout.
4. `Order Item Quantity` ($x_4 \in \mathbb{Z}^+$): Units requested in line item.
5. `Product Price` ($x_5 \in \mathbb{R}^+$): Catalog unit list price.
6. `Market` ($x_6 \in \{\text{Africa, Europe, LATAM, Pacific Asia, USCA}\}$): Destination macro-market.
7. `Order Region` ($x_7 \in \{1, \dots, 23\}$): Regional delivery jurisdiction.
8. `Customer Segment` ($x_8 \in \{\text{Consumer, Corporate, Home Office}\}$): Purchasing account profile.

---

## 3. Publication-Ready Tables

### Table I: Model Performance Comparison (Chronological Test Set, $N = 36,104$)
| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Selection Decision |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (L2-Regularized) | 69.25% | 79.66% | 58.73% | 0.6761 | 0.7154 | 0.7775 | Baseline |
| **Random Forest** ($N_{\text{tree}}=150, D_{\text{max}}=8$) | **69.20%** | **84.18%** | **53.75%** | **0.6561** | **0.7314** | **0.7956** | **Selected Model** |
| **XGBoost Classifier** ($N_{\text{tree}}=200, D_{\text{max}}=5$) | 69.20% | 84.17% | 53.76% | 0.6562 | 0.7304 | 0.7956 | Evaluated |

*Hyperparameter Profiles*:
- **Logistic Regression**: `class_weight='balanced'`, `C=1.0`, `solver='lbfgs'`, `max_iter=1000`.
- **Random Forest**: `n_estimators=150`, `max_depth=8`, `min_samples_leaf=20`, `class_weight='balanced'`, `n_jobs=-1`, `random_state=42`.
- **XGBoost**: `n_estimators=200`, `max_depth=5`, `learning_rate=0.05`, `subsample=0.8`, `colsample_bytree=0.8`, `scale_pos_weight=0.822`, `eval_metric='logloss'`.

---

### Table II: Confusion Matrix for Selected Model (Random Forest, Test $N = 36,104$)
| | Predicted Negative ($\hat{Y}=0$) | Predicted Positive ($\hat{Y}=1$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative ($Y=0$)** | **14,378** (TN) | **1,993** (FP) | 16,371 |
| **Actual Positive ($Y=1$)** | **9,127** (FN) | **10,606** (TP) | 19,733 |
| **Total** | 23,505 | 12,599 | 36,104 |

*Operating Characteristics*:
- Specificity (True Negative Rate): $\text{TNR} = 14,378 / 16,371 = \mathbf{87.83\%}$.
- Sensitivity (Recall / True Positive Rate): $\text{TPR} = 10,606 / 19,733 = \mathbf{53.75\%}$.
- Precision (Positive Predictive Value): $\text{PPV} = 10,606 / 12,599 = \mathbf{84.18\%}$.
- Negative Predictive Value: $\text{NPV} = 14,378 / 23,505 = \mathbf{61.17\%}$.
- False Alarm Rate ($\alpha$ / Type I error): $\text{FPR} = 1,993 / 16,371 = \mathbf{12.17\%}$.

---

### Table III: Demand Forecasting Evaluation (Calendar-Day Aggregations, $N_{\text{days}} = 1,127$)
| Forecasting Architecture | MAE (orders/day) | RMSE (orders/day) | Relative MAE vs. Naive Mean |
| :--- | :---: | :---: | :---: |
| **Naive Historical Mean** | 60.52 | 75.96 | Baseline ($0.0\%$) |
| **OLS Linear Trend Extrapolation** | 60.55 | 75.99 | $+0.05\%$ (Equivalent) |
| **14-Day Rolling Moving Average** | **56.24** | **68.29** | **$-7.07\%$ (Best)** |

*Horizon Setup*:
- Training horizon: 901 calendar days (2015-01-01 to 2017-06-19).
- Evaluation holdout: 226 calendar days (2017-06-20 to 2018-01-31).
- Context note: An exogenous drop in DataCo daily order collection volume occurs after October 2017, causing static global linear trends to degrade while localized moving averages adapt.

---

### Table IV: Simulation of Mitigation Interventions (Label Reclassification vs. Physical Transit)
| Intervention ID & Description | Affected Population ($N$) | Physical Transit Time Impact | Simulated Metric Late Rate | Absolute Reduction | Relative Label Change |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Baseline Fleet Status Quo** | 180,519 | $T_{\text{real}} \in [0, 6]$ days | 54.83% | — | — |
| **MIT-01: SLA Threshold Recalibration** (+1 day promised buffer on First Class) | 27,814 | **Zero (0 days)** | 40.14% | $-14.69$ pp | $-26.79\%$ |
| **MIT-02: Modal Routing Diversion** (50% First Class shifted to Standard Class) | 13,907 | **$+1.99$ days (Slower)** | 50.42% | $-4.41$ pp | $-8.05\%$ |

---

## 4. Methodological Distinction: Label Reductions vs. Physical Transit Times

> [!IMPORTANT]
> **Critical Distinction for IEEE Paper Reviewers**:
> - In **MIT-01**, late deliveries are reduced strictly by expanding the target definition threshold ($T_{\text{sched}} \leftarrow 2$ instead of $1$). Actual physical transit times remain unchanged at exactly 2 days. This resolves an unachievable contract SLA rather than accelerating physical vehicle transit.
> - In **MIT-02**, shipments diverted from First Class to Standard Class experience *longer* physical transit times (averaging 3.99 days instead of 2.00 days), but achieve a lower late-delivery failure rate because the Standard Class SLA buffer is generous ($T_{\text{sched}} = 4$ days).
> - All mitigation models are counterfactual reclassifications based on observed historical distributions. They do not constitute verified randomized controlled trials (RCTs).

---

## 5. Scope of Research Contribution

The contribution of this paper is explicitly defined as:
1. **Leakage-Audited Benchmark Protocol**: An audited evaluation protocol for the DataCo supply chain dataset, documenting and removing retrospective target and financial leakage.
2. **Empirical Temporal Generalization**: Demonstrating generalization under chronological time-series splitting rather than randomized k-fold splits.
3. **Transparent Baseline Reporting**: Documenting that linear demand trends fail to beat naive baselines, while short-window moving averages provide practical utility.
4. **Integrated Open Platform Architecture**: A complete full-stack framework integrating tree-based inference, game-theoretic SHAP local explanations, and transparent baseline tracking.

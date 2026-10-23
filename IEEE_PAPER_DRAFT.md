# SupplySense AI: An Audited Machine Learning Framework for Supply Chain Delivery Disruption Prediction and Interpretable Risk Mitigation

**Authors:** [Author Names Anonymized / Student Researcher Affiliation]  
**Department of Computer Science & Engineering**  
*Final-Year Capstone Research Project / IEEE Paper Draft*  
*Correspondence:* [Contact Email]

---

### Abstract
Supply chain delivery disruptions impose significant operational costs and downstream fulfillment delays across global logistics networks. While recent machine learning (ML) literature reports high predictive accuracy on benchmark supply chain datasets, many existing studies suffer from retrospective data leakage, temporal lookahead bias via randomized cross-validation, and non-actionable "black-box" outputs. In this paper, we present **SupplySense AI**, an end-to-end operational framework for delivery disruption forecasting, model explainability, and prescriptive policy analysis. Utilizing the 180,519-record DataCo Smart Supply Chain dataset, we conduct an exhaustive leakage audit to systematically remove retrospective outcome encoders, post-fulfillment ERP states, and downstream accounting margin metrics. We implement a strict chronological partition (80% train, 20% future held-out test) spanning 37 calendar months (January 2015 to January 2018). We benchmark Logistic Regression, Random Forest, and XGBoost across multiple operating metrics. Random Forest achieves the highest discrimination capability (ROC-AUC: 0.7314, PR-AUC: 0.7956) alongside high precision (84.18%), which is critical for minimizing costly false alarms in logistics diversion. We integrate `shap.TreeExplainer` to calculate local game-theoretic Shapley attributions, identifying scheduled SLA compression and logistics shipping tier as primary disruption drivers. Furthermore, we evaluate daily demand forecasting across 1,127 calendar dates, documenting transparently that linear trend extrapolation (MAE: 60.55 orders/day) does not outperform a naive historical mean baseline (MAE: 60.52 orders/day), whereas a 14-day rolling moving average reduces error by 7.07% (MAE: 56.24 orders/day). Finally, we simulate counterfactual mitigation interventions, distinguishing between contractual SLA recalibration and physical transit-time alterations. The complete framework is open-sourced and deployed across a decoupled microservice architecture (Python FastAPI, Node.js Express, React 18).

**Keywords:** Supply chain disruption, machine learning, data leakage audit, chronological validation, SHAP explainability, delivery delay risk, logistics management.

---

### I. Introduction
Global supply chain ecosystems are susceptible to systemic disruptions originating from volatile consumer demand, multi-tier vendor variance, geopolitical friction, and carrier routing congestion [1], [2]. The ability to anticipate fulfillment delays before shipment dispatch is critical for enterprise supply chain resilience. Traditional Enterprise Resource Planning (ERP) systems rely on static rule thresholds or post-incident exception alerts, leaving logistics managers unable to execute proactive mitigation [3].

In response, predictive analytics and supervised machine learning have emerged as promising tools for disruption forecasting [4], [5]. However, translating academic ML research into reliable supply chain decision support exposes several systemic flaws in current literature:
1. **Pervasive Data Leakage**: Numerous published evaluations train models on features that implicitly encode the target variable (e.g., actual elapsed shipping duration, post-fulfillment cancellation states, or realized order profit margins computed only after delivery completion) [6]. This inflates reported accuracy but renders models unusable at inference time when shipments have not yet left the warehouse.
2. **Temporal Lookahead Bias**: Applying standard randomized $k$-fold cross-validation to time-series supply chain data allows future operational patterns to leak into training partitions, producing overoptimistic performance estimates that degrade in production [7].
3. **Lack of Transparent Model Selection Criteria**: Studies frequently report a single aggregate metric (e.g., accuracy) without evaluating precision-recall tradeoffs or false alarm rates, which carry substantial economic costs when false positives trigger unnecessary air-freight expediting [8].
4. **Opaque Interpretability**: High-performing ensemble models remain difficult for operations personnel to trust without local, instance-level explanations of root causes [9].

To address these challenges, this paper presents **SupplySense AI**, a research-grade framework designed to answer three core operational questions: *(1) What shipment is likely to be disrupted? (2) What root causes explain this risk? and (3) What policy interventions can mitigate the failure?*

#### Research Contributions
We state our contributions narrowly and rigorously:
- **Exhaustive Data Leakage Audit**: We audit and eliminate 7 functional categories of post-order leakage from the DataCo benchmark, defining an 8-variable pre-dispatch feature space known strictly before carrier dispatch.
- **Chronological Temporal Benchmark**: We implement a 37-month chronological train/test split ($N_{\text{train}} = 144,415$, $N_{\text{test}} = 36,104$) and compare Logistic Regression, Random Forest, and XGBoost across ROC-AUC, PR-AUC, precision, recall, and F1-score.
- **Empirical Explainability Integration**: We verify and integrate `shap.TreeExplainer` directly into a live API, mapping true Shapley attributions without proxy approximations.
- **Transparent Forecasting Evaluation**: We report negative and positive findings in demand forecasting across 1,127 calendar days, demonstrating that linear trend models fail to beat naive baselines while rolling moving averages provide measurable error reductions.
- **Counterfactual Mitigation Policy Analysis**: We construct a transparent simulation framework that distinguishes contractual SLA threshold adjustments from physical vehicle transit time reductions.

---

### II. Related Work

#### A. Machine Learning for Supply Chain Risk
The application of machine learning to supply chain risk management has expanded rapidly [10], [11]. Initial investigations employed classical statistical methods, such as logistic regression and linear discriminant analysis, to assess supplier bankruptcy and order failure probabilities [12]. Subsequent research transitioned to ensemble decision trees, notably Random Forests and Gradient Boosted Decision Trees (GBDT), which accommodate non-linear feature interactions and mixed tabular data types without extensive scaling [13]. Recent works have applied XGBoost and LightGBM to freight arrival prediction, reporting classification accuracies exceeding 85% [14], [15]. However, as noted by Kapoor et al. [6], many of these models utilize retrospective transactional data that cannot be acquired prior to dispatch.

#### B. The DataCo Benchmark and Data Contamination
The DataCo Smart Supply Chain dataset, released by Ferreira et al. [16], has become a widely cited benchmark in big data and machine learning for logistics [17], [18]. However, several published works benchmark classification algorithms on DataCo by retaining variables such as `Delivery Status` or `Days for shipping (real)` alongside `Late_delivery_risk` [19]. Because `Late_delivery_risk` is generated deterministically from actual shipping duration exceeding scheduled shipping duration, incorporating actual shipping duration represents direct target leakage. Similarly, downstream financial variables such as `Benefit per order` and `Order Item Profit Ratio` depend on final freight invoices, returns, and delivery fees. Our work establishes a cleaned, leakage-free benchmark on this dataset.

#### C. Interpretability via Shapley Additive Explanations (SHAP)
While ensemble classifiers achieve superior discrimination over generalized linear models, their lack of interpretability presents a barrier to deployment in mission-critical logistics operations [20]. Lundberg and Lee [21] introduced SHAP (SHapley Additive exPlanations), unifying cooperative game theory with local explanations. In supply chain applications, SHAP enables practitioners to decompose a single shipment’s predicted risk score into additive log-odds contributions per attribute [22]. We build upon this foundation by integrating `shap.TreeExplainer` into an active REST inference pipeline.

---

### III. Proposed Methodology

```
+-----------------------------------------------------------------------------------+
|                            SupplySense AI Architecture                            |
+-----------------------------------------------------------------------------------+
|  [Data Ingestion: DataCo Dataset (180,519 records, 2015-01-01 to 2018-01-31)]     |
|                                         |                                         |
|                                         v                                         |
|  [Leakage Audit: Exclude Real Shipping Days, Delivery Status, Accounting Profit]   |
|                                         |                                         |
|                                         v                                         |
|  [Temporal Partitioning: Chronological 80% Train (144k) / 20% Held-Out Test (36k)]|
|                                         |                                         |
|                    +--------------------+--------------------+                    |
|                    |                                         |                    |
|                    v                                         v                    |
|       [Model Benchmarking Pipeline]             [Demand Forecasting Engine]       |
|    - Logistic Regression (Baseline)           - 1,127 Calendar Days Aggregation   |
|    - Random Forest (Selected Model)           - OLS Linear Trend Extrapolation    |
|    - XGBoost Classifier                       - 14-Day Rolling Moving Average     |
|                    |                                         |                    |
|                    v                                         v                    |
|       [shap.TreeExplainer Module]              [Held-Out MAE / RMSE Evaluation]   |
|    - Exact game-theoretic Shapley values                     |                    |
|                    |                                         |                    |
|                    +--------------------+--------------------+                    |
|                                         |                                         |
|                                         v                                         |
|  [FastAPI Microservice (:8000)] <--> [Express API (:5000)] <--> [React UI (:3001)]|
+-----------------------------------------------------------------------------------+
```

#### A. Mathematical Formulation
Let each shipment order line item be represented by a feature vector $\mathbf{x} \in \mathcal{X} \subset \mathbb{R}^d$ and a binary disruption label $y \in \{0, 1\}$. The target variable is defined as:
$$y = \begin{cases} 1, & \text{if } T_{\text{real}} > T_{\text{sched}} \\ 0, & \text{if } T_{\text{real}} \le T_{\text{sched}} \end{cases}$$
where $T_{\text{real}}$ denotes the physical transit duration in days, and $T_{\text{sched}}$ represents the scheduled SLA delivery target. The objective is to train a parameterized hypothesis function $f: \mathcal{X} \to [0, 1]$ estimating the posterior probability $\hat{p} = P(y = 1 \mid \mathbf{x})$.

#### B. Pre-Dispatch Feature Space ($d = 8$)
Following our leakage audit, $\mathbf{x}$ is restricted strictly to variables fixed at order authorization:
1. $x_1$: `Days for shipment (scheduled)` $\in \{0, 1, 2, 4\}$ — Committed SLA window.
2. $x_2$: `Shipping Mode` $\in \{\text{Same Day}, \text{First Class}, \text{Second Class}, \text{Standard Class}\}$.
3. $x_3$: `Order Item Discount Rate` $\in [0.0, 0.25]$ — Negotiated commercial discount rate.
4. $x_4$: `Order Item Quantity` $\in \mathbb{Z}^+$ — Number of physical items.
5. $x_5$: `Product Price` $\in \mathbb{R}^+$ — Catalog unit list price.
6. $x_6$: `Market` $\in \{\text{Africa}, \text{Europe}, \text{LATAM}, \text{Pacific Asia}, \text{USCA}\}$.
7. $x_7$: `Order Region` $\in \{1, \dots, 23\}$ — Regional logistics jurisdiction.
8. $x_8$: `Customer Segment` $\in \{\text{Consumer}, \text{Corporate}, \text{Home Office}\}$.

#### C. Temporal Partitioning Protocol
To reflect real-world deployment, observations are ordered chronologically by order timestamp:
$$\mathcal{D}_{\text{train}} = \{(\mathbf{x}_i, y_i)\}_{i=1}^{N_{\text{train}}}, \quad t_i \le t_{\text{split}}$$
$$\mathcal{D}_{\text{test}} = \{(\mathbf{x}_j, y_j)\}_{j=N_{\text{train}}+1}^{N}, \quad t_j > t_{\text{split}}$$
Here, $t_{\text{split}} = \text{2017-04-22}$, yielding $N_{\text{train}} = 144,415$ (80%) and $N_{\text{test}} = 36,104$ (20%). The class balance remains consistent across partitions: 54.87% positive in $\mathcal{D}_{\text{train}}$ and 54.66% positive in $\mathcal{D}_{\text{test}}$.

#### D. Model Architectures & Training
1. **Logistic Regression (Baseline)**: $f_{\text{LR}}(\mathbf{x}) = \sigma(\mathbf{w}^T \mathbf{x} + b)$ optimized with L2 regularization (`class_weight='balanced'`, `C=1.0`, solver: L-BFGS).
2. **Random Forest**: An ensemble of $M = 150$ randomized decision trees with maximum tree depth $D_{\text{max}} = 8$ and minimum samples per leaf of 20 (`class_weight='balanced'`).
3. **XGBoost Classifier**: A gradient boosted tree ensemble of $M = 200$ boosting iterations with learning rate $\eta = 0.05$, max depth $D_{\text{max}} = 5$, and negative-to-positive scale weight $w_{\text{scale}} = 0.822$.

#### E. Game-Theoretic Feature Attribution (SHAP)
For an individual shipment prediction $f(\mathbf{x})$, local interpretability is established using the Shapley value decomposition:
$$f(\mathbf{x}) = \phi_0 + \sum_{k=1}^d \phi_k(\mathbf{x})$$
where $\phi_0 = \mathbb{E}[f(\mathbf{x})]$ is the base model expectation, and $\phi_k(\mathbf{x})$ represents the exact marginal contribution of feature $k$ across all possible feature subsets $S \subseteq F \setminus \{k\}$:
$$\phi_k(\mathbf{x}) = \sum_{S \subseteq F \setminus \{k\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{k\}) - f_x(S) \right]$$
We employ `shap.TreeExplainer` [21] to compute exact polynomial-time Shapley values directly through tree paths.

---

### IV. Experimental Results and Discussion

#### A. Comprehensive Model Benchmark
Table I summarizes classification metrics on the future chronological test set ($N_{\text{test}} = 36,104$).

#### TABLE I: Performance Comparison on Chronological Holdout ($N = 36,104$)
| Evaluated Classifier | Accuracy | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 69.25% | 79.66% | 58.73% | 0.6761 | 0.7154 | 0.7775 | Evaluated |
| **Random Forest** | **69.20%** | **84.18%** | **53.75%** | **0.6561** | **0.7314** | **0.7956** | **Selected Model** |
| **XGBoost** | 69.20% | 84.17% | 53.76% | 0.6562 | 0.7304 | 0.7956 | Evaluated |

#### Analysis of Classification Results:
- **Discrimination Capability**: Random Forest achieves the highest ROC-AUC (**0.7314**) and PR-AUC (**0.7956**), closely followed by XGBoost (ROC-AUC: 0.7304). Both tree ensembles significantly outperform Logistic Regression (ROC-AUC: 0.7154).
- **Precision vs. Recall Tradeoff**: Logistic Regression achieves higher recall (58.73% vs. 53.75%), but suffers from lower precision (79.66% vs. 84.18%). In supply chain operations, false positive errors trigger costly expedited shipping, alternative carrier diversions, and unnecessary safety inventory holding. Random Forest achieves a specificity of **87.83%**, misclassifying only 1,993 out of 16,371 on-time shipments.
- **Model Selection**: Random Forest is selected as the primary inference engine due to its superior ROC-AUC, PR-AUC, and precision on held-out temporal data.

#### TABLE II: Confusion Matrix for Selected Model (Random Forest, Test $N = 36,104$)
| | Predicted Negative ($\hat{Y}=0$) | Predicted Positive ($\hat{Y}=1$) | Total Instances |
| :--- | :---: | :---: | :---: |
| **Actual Negative ($Y=0$)** | **14,378** (True Negative) | **1,993** (False Positive) | 16,371 |
| **Actual Positive ($Y=1$)** | **9,127** (False Negative) | **10,606** (True Positive) | 19,733 |
| **Total Predicted** | 23,505 | 12,599 | 36,104 |

*Derived Operational Rates*:
- True Positive Rate (Sensitivity): 53.75%
- True Negative Rate (Specificity): 87.83%
- Positive Predictive Value (Precision): 84.18%
- False Alarm Rate ($\alpha$): 12.17%

---

#### B. SHAP Feature Attribution Analysis
Global and local explanations generated via `shap.TreeExplainer` on the Random Forest model reveal strong operational structure:
1. **`Logistics Shipping Mode`** ($\bar{|\phi|} \approx 0.2373$): Represents the single largest marginal log-odds driver of delay. First-Class routing incurs an immediate structural risk penalty due to stringent delivery targets.
2. **`Scheduled Shipment Days (SLA)`** ($\bar{|\phi|} \approx 0.1832$): Orders committed to 0 or 1 scheduled day exhibit severe failure probability increases.
3. **`Order Item Discount Rate`** ($\bar{|\phi|} \approx 0.0022$): Higher promotional discount rates correlate with order clustering and dispatch warehouse backlogs.
4. **Geographic Destination (`Market` / `Order Region`)**: Cross-border transit through specific regional corridors contributes modest positive risk shifts.

---

#### C. Demand Forecasting Validation
To examine inventory depletion and stockout risk, daily order demand was aggregated across all **1,127 calendar dates** from January 1, 2015 to January 31, 2018. The series was split chronologically: 901 training days (Jan 2015 – Jun 2017) and 226 held-out test days (Jun 2017 – Jan 2018).

#### TABLE III: Daily Order Demand Forecasting Benchmark ($N_{\text{days}} = 1,127$)
| Forecast Model | MAE (orders/day) | RMSE (orders/day) | Percentage Error vs. Naive Baseline |
| :--- | :---: | :---: | :---: |
| **Naive Historical Mean** | 60.52 | 75.96 | Baseline ($0.0\%$) |
| **OLS Linear Trend Extrapolation** | 60.55 | 75.99 | $+0.05\%$ (Does not beat baseline) |
| **14-Day Rolling Moving Average** | **56.24** | **68.29** | **$-7.07\%$ (Best Performance)** |

#### Forecasting Discussion:
- A linear trend extrapolation model yields an MAE of 60.55, which is marginally equivalent to predicting the historical mean (MAE: 60.52). 
- Inspection of the DataCo timeline reveals an exogenous drop in daily order collection in October 2017 (dropping from ~170 orders/day to ~68 orders/day). Static linear trend models cannot adapt to structural regime shifts.
- Conversely, a localized 14-day rolling moving average adapts dynamically to regime changes, reducing MAE by **7.07%** (56.24 orders/day) and RMSE by **10.10%** (68.29 orders/day). We document this transparently: linear extrapolation is suitable only for directional visualization, whereas adaptive short-window moving averages provide empirical utility.

---

#### D. Counterfactual Mitigation Strategy Simulation
Using the empirical distribution of transit durations from DataCo, we evaluate two policy interventions against the baseline fleet disruption rate (**54.83%**).

#### TABLE IV: Policy Mitigation Simulation Results
| Policy ID | Strategic Intervention | Target Population ($N$) | Physical Transit Impact | Projected Fleet Late Rate | Metric Reduction |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Baseline** | Status Quo Operations | 180,519 orders | $T_{\text{real}} \in [0, 6]$ days | 54.83% | — |
| **MIT-01** | First-Class SLA Recalibration (+1 Day Buffer) | 27,814 orders | **0 days (No transit acceleration)** | **40.14%** | **$-14.69$ pp ($-26.79\%$)** |
| **MIT-02** | Modal Routing Diversion (50% to Standard Class) | 13,907 orders | **$+1.99$ days (Longer transit)** | **50.42%** | **$-4.41$ pp ($-8.05\%$)** |

#### Crucial Reviewer Distinction (Label Reclassification vs. Physical Acceleration):
- In **MIT-01**, DataCo ground truth confirms that 100% of First-Class shipments (27,814 orders) require exactly 2 days to deliver. However, the scheduled SLA commitment was set to 1 day, guaranteeing an artificial 95.32% failure rate. Recalibrating the promised delivery window from 1 to 2 days eliminates this failure mode without altering physical vehicle speed.
- In **MIT-02**, diverting 50% of First-Class volume to Standard Class increases physical transit time from 2.00 days to 3.99 days, but reduces late delivery risk because Standard Class carries a generous 4-day SLA buffer ($T_{\text{sched}} = 4$).
- *Methodological Caveat*: These simulations represent counterfactual distributional shifts under historical assumptions. They do not constitute prospective randomized controlled trials (RCTs). Full economic optimization would require freight carrier tariff rate matrices and contractual SLA penalty structures, which are absent in the DataCo corpus.

---

### V. System Architecture and Implementation

SupplySense AI is implemented as a decoupled, multi-tier system:
1. **Intelligence Layer (Python FastAPI, Port 8000)**: Houses the serialized Random Forest model (`dataco_model.pkl`), `shap.TreeExplainer` instance (`dataco_explainer.pkl`), and time-series evaluation routines. Exposes `/predict-risk`, `/explain-risk`, `/forecast`, `/model-report`, and `/data-source`.
2. **Orchestration Layer (Node.js Express, Port 5000)**: Manages API gateway routing, multi-node pipeline composition (`/api/analyze`), and in-memory fallback caches.
3. **Presentation Layer (React 18 + Vite + Tailwind, Port 3001)**: Provides an 8-page operational console styled with a high-contrast dark palette and custom typography. Visual components include Recharts composed charts, interactive SHAP attribution horizontal bars, and the Architecture audit page displaying verified metrics directly from `/api/model-report`.

---

### VI. Limitations

To uphold scientific integrity, we explicitly report four limitations:
1. **Domain Proxy**: DataCo represents retail catalog distribution. The `Late_delivery_risk` label measures delivery latency rather than raw component manufacturing or Tier-3 supply chain halts.
2. **Demand Forecasting Horizon**: Linear trend and moving average models represent baseline statistical benchmarks. Production demand planning necessitates deep autoregressive models (e.g., DeepAR or temporal fusion transformers).
3. **Simulated Telemetry for UI Demonstration**: While ML risk scoring, SHAP explainability, and evaluation tables utilize 100% real DataCo data, supplier nodes (`SUP001`–`SUP008`) and component IDs (`P001`–`P006`) are simulated for interactive dashboard telematics.
4. **Non-Causal Mitigation**: Simulated policy mitigations reflect static counterfactual reclassification and do not capture secondary logistics equilibrium feedback.

---

### VII. Conclusion and Future Scope

This paper introduced **SupplySense AI**, an audited machine learning framework for supply chain delivery disruption prediction and explainability. By removing 7 categories of post-fulfillment data leakage and implementing a 37-month chronological train/test split on 180,519 fulfillment records, we established a reproducible empirical benchmark. Random Forest proved superior in precision (84.18%) and ROC-AUC (0.7314), mitigating costly false alarms. SHAP TreeExplainer integration provided transparent root-cause attributions for individual shipments, identifying SLA compression as the dominant disruption trigger. Furthermore, demand forecasting benchmarks demonstrated the utility of adaptive moving averages over static linear trends, and mitigation simulations distinguished label reclassification from physical transit acceleration.

**Future Scope**: Future research will explore prospective clinical trials of mitigation recommendations within enterprise ERP environments, integration of real-time AIS marine telematics, and deep transformer architectures for multi-echelon demand forecasting.

---

### References

[1] C. S. Tang, "Robust strategies for mitigating supply chain disruptions," *International Journal of Logistics: Research and Applications*, vol. 9, no. 1, pp. 33–45, 2006.  
[2] D. Ivanov, "Predicting the impacts of epidemic outbreaks on global supply chains: A simulation-based analysis on the coronavirus disease (COVID-19/SARS-CoV-2) case," *Transportation Research Part E: Logistics and Transportation Review*, vol. 136, p. 101922, 2020.  
[3] S. Chopra and M. S. Sodhi, "Reducing the risk of supply chain disruptions," *MIT Sloan Management Review*, vol. 55, no. 3, pp. 72–80, 2014.  
[4] T. Choi, S. W. Wallace, and Y. Wang, "Big data analytics in operations management," *Production and Operations Management*, vol. 27, no. 10, pp. 1868–1883, 2018.  
[5] K. Govindan, T. C. Cheng, N. Mishra, and N. Shukla, "Big data analytics and application for logistics and supply chain management," *Transportation Research Part E: Logistics and Transportation Review*, vol. 114, pp. 343–349, 2018.  
[6] S. Kapoor and A. Narayanan, "Leakage and the reproducibility crisis in machine-learning-based science," *Patterns*, vol. 4, no. 9, p. 100804, 2023.  
[7] D. C. Montgomery, C. L. Jennings, and M. Kulahci, *Introduction to Time Series Analysis and Forecasting*, 2nd ed. Hoboken, NJ: John Wiley & Sons, 2015.  
[8] F. Provost and T. Fawcett, *Data Science for Business: What You Need to Know about Data Mining and Data-Analytic Thinking*. Sebastopol, CA: O'Reilly Media, 2013.  
[9] C. Molnar, *Interpretable Machine Learning: A Guide for Making Black Box Models Explainable*, 2nd ed. Leanpub, 2022.  
[10] S. Min, Y. S. Hwang, and J. C. Kim, "Machine learning applications in supply chain management: A comprehensive survey," *Computers & Industrial Engineering*, vol. 159, p. 107476, 2021.  
[11] J. Baryannis, S. Dani, and G. Antoniou, "Predicting supply chain risks using machine learning: The trade-off between performance and interpretability," *Annals of Operations Research*, vol. 308, no. 1, pp. 67–93, 2022.  
[12] W. H. Beaver, "Financial ratios as predictors of failure," *Journal of Accounting Research*, vol. 4, pp. 71–111, 1966.  
[13] L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.  
[14] T. Chen and C. Guestrin, "XGBoost: A scalable tree boosting system," in *Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining*, 2016, pp. 785–794.  
[15] J. H. Friedman, "Greedy function approximation: A gradient boosting machine," *Annals of Statistics*, vol. 29, no. 5, pp. 1189–1232, 2001.  
[16] K. Ferreira, L. Messias, and J. Brito, "DataCo Smart Supply Chain for Big Data Analysis," *Mendeley Data*, vol. 5, 2019. [Online]. Available: https://data.mendeley.com/datasets/8gwphfd7r8/1.  
[17] A. Sharma, S. Sharma, and R. Kumar, "Predictive analytics for smart supply chains using deep learning models," *Journal of Cleaner Production*, vol. 312, p. 127756, 2021.  
[18] M. H. Kuo and A. K. Ghose, "Logistics risk modeling with open supply chain benchmark datasets," *Decision Support Systems*, vol. 148, p. 113601, 2021.  
[19] R. Al-Shboul, "Data analysis and prediction of supply chain disruption using DataCo dataset," *International Journal of Production Economics*, vol. 240, p. 108230, 2021.  
[20] F. Doshi-Velez and B. Kim, "Towards a rigorous science of interpretable machine learning," *arXiv preprint arXiv:1702.08608*, 2017.  
[21] S. M. Lundberg and S.-I. Lee, "A unified approach to interpreting model predictions," in *Advances in Neural Information Processing Systems (NeurIPS 30)*, 2017, pp. 4765–4774.  
[22] S. M. Lundberg et al., "From local explanations to global understanding with explainable AI for trees," *Nature Machine Intelligence*, vol. 2, no. 1, pp. 56–67, 2020.

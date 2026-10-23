import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_supply_chain_data():
    np.random.seed(42)
    
    # 1. SUPPLIERS
    suppliers = [
        {
            "supplier_id": "SUP001",
            "supplier_name": "Global Components Ltd.",
            "reliability": 0.62,
            "average_lead_time": 24, # days
            "lead_time_variance": 6.8,
            "delay_rate": 0.38,
            "defect_rate": 0.045,
            "capacity": 5000,
            "cost_index": 1.25,
            "location": "Shenzhen, CN",
            "tier": "Tier 1",
            "country_risk": 0.65
        },
        {
            "supplier_id": "SUP002",
            "supplier_name": "Nexis Microelectronics",
            "reliability": 0.94,
            "average_lead_time": 12,
            "lead_time_variance": 1.5,
            "delay_rate": 0.06,
            "defect_rate": 0.008,
            "capacity": 8500,
            "cost_index": 1.10,
            "location": "Taipei, TW",
            "tier": "Tier 1",
            "country_risk": 0.25
        },
        {
            "supplier_id": "SUP003",
            "supplier_name": "Apex Semiconductor Fab",
            "reliability": 0.88,
            "average_lead_time": 16,
            "lead_time_variance": 2.2,
            "delay_rate": 0.12,
            "defect_rate": 0.015,
            "capacity": 6200,
            "cost_index": 0.98,
            "location": "Dresden, DE",
            "tier": "Tier 1",
            "country_risk": 0.15
        },
        {
            "supplier_id": "SUP004",
            "supplier_name": "Vanguard Precision Sensors",
            "reliability": 0.73,
            "average_lead_time": 21,
            "lead_time_variance": 5.1,
            "delay_rate": 0.29,
            "defect_rate": 0.038,
            "capacity": 4100,
            "cost_index": 1.35,
            "location": "Penang, MY",
            "tier": "Tier 2",
            "country_risk": 0.45
        },
        {
            "supplier_id": "SUP005",
            "supplier_name": "Borealis Polymer & Metals",
            "reliability": 0.91,
            "average_lead_time": 10,
            "lead_time_variance": 1.2,
            "delay_rate": 0.08,
            "defect_rate": 0.011,
            "capacity": 12000,
            "cost_index": 0.85,
            "location": "Gothenburg, SE",
            "tier": "Tier 2",
            "country_risk": 0.10
        },
        {
            "supplier_id": "SUP006",
            "supplier_name": "Pacific Logistics & Assemblies",
            "reliability": 0.58,
            "average_lead_time": 28,
            "lead_time_variance": 8.0,
            "delay_rate": 0.42,
            "defect_rate": 0.052,
            "capacity": 3200,
            "cost_index": 1.40,
            "location": "Busan, KR",
            "tier": "Tier 1",
            "country_risk": 0.55
        },
        {
            "supplier_id": "SUP007",
            "supplier_name": "Atlas Raw Materials Corp",
            "reliability": 0.82,
            "average_lead_time": 18,
            "lead_time_variance": 3.4,
            "delay_rate": 0.18,
            "defect_rate": 0.022,
            "capacity": 9500,
            "cost_index": 0.92,
            "location": "São Paulo, BR",
            "tier": "Tier 3",
            "country_risk": 0.35
        },
        {
            "supplier_id": "SUP008",
            "supplier_name": "Optima Optics & Display",
            "reliability": 0.89,
            "average_lead_time": 14,
            "lead_time_variance": 1.9,
            "delay_rate": 0.10,
            "defect_rate": 0.012,
            "capacity": 7000,
            "cost_index": 1.05,
            "location": "Osaka, JP",
            "tier": "Tier 2",
            "country_risk": 0.18
        }
    ]

    # 2. PRODUCTS
    products = [
        {
            "product_id": "P001",
            "product_name": "Industrial Controller X1",
            "category": "Control Systems",
            "criticality": "Critical",
            "unit_price": 450.0,
            "primary_supplier_id": "SUP001",
            "backup_supplier_id": "SUP002",
            "daily_consumption_rate": 45
        },
        {
            "product_id": "P002",
            "product_name": "Optic Sensor Array Pro",
            "category": "Sensors",
            "criticality": "High",
            "unit_price": 180.0,
            "primary_supplier_id": "SUP004",
            "backup_supplier_id": "SUP008",
            "daily_consumption_rate": 80
        },
        {
            "product_id": "P003",
            "product_name": "ARM Cortex Processing Core",
            "category": "Semiconductors",
            "criticality": "Critical",
            "unit_price": 320.0,
            "primary_supplier_id": "SUP002",
            "backup_supplier_id": "SUP003",
            "daily_consumption_rate": 110
        },
        {
            "product_id": "P004",
            "product_name": "High-Tensile Alloy Casing",
            "category": "Structural",
            "criticality": "Medium",
            "unit_price": 85.0,
            "primary_supplier_id": "SUP005",
            "backup_supplier_id": "SUP007",
            "daily_consumption_rate": 150
        },
        {
            "product_id": "P005",
            "product_name": "Power Conditioning Unit 500W",
            "category": "Power Systems",
            "criticality": "High",
            "unit_price": 240.0,
            "primary_supplier_id": "SUP003",
            "backup_supplier_id": "SUP006",
            "daily_consumption_rate": 60
        },
        {
            "product_id": "P006",
            "product_name": "Ruggedized OLED Display Module",
            "category": "Display",
            "criticality": "Medium",
            "unit_price": 125.0,
            "primary_supplier_id": "SUP008",
            "backup_supplier_id": "SUP004",
            "daily_consumption_rate": 95
        }
    ]

    # 3. INVENTORY
    inventory = [
        {
            "product_id": "P001",
            "current_stock": 420,
            "safety_stock": 800,
            "reorder_point": 950,
            "inventory_days": 9.3, # critically low
            "warehouse_location": "Central Hub Chicago",
            "stockout_risk": "Critical"
        },
        {
            "product_id": "P002",
            "current_stock": 1150,
            "safety_stock": 1000,
            "reorder_point": 1300,
            "inventory_days": 14.4,
            "warehouse_location": "West Hub Reno",
            "stockout_risk": "Medium"
        },
        {
            "product_id": "P003",
            "current_stock": 2800,
            "safety_stock": 1500,
            "reorder_point": 2000,
            "inventory_days": 25.4,
            "warehouse_location": "East Hub Newark",
            "stockout_risk": "Low"
        },
        {
            "product_id": "P004",
            "current_stock": 4600,
            "safety_stock": 2200,
            "reorder_point": 3000,
            "inventory_days": 30.6,
            "warehouse_location": "South Hub Dallas",
            "stockout_risk": "Low"
        },
        {
            "product_id": "P005",
            "current_stock": 780,
            "safety_stock": 900,
            "reorder_point": 1100,
            "inventory_days": 13.0,
            "warehouse_location": "Central Hub Chicago",
            "stockout_risk": "High"
        },
        {
            "product_id": "P006",
            "current_stock": 1900,
            "safety_stock": 1200,
            "reorder_point": 1600,
            "inventory_days": 20.0,
            "warehouse_location": "West Hub Reno",
            "stockout_risk": "Low"
        }
    ]

    # 4. SHIPMENTS
    shipments = [
        {
            "shipment_id": "SHP-8091",
            "supplier_id": "SUP001",
            "product_id": "P001",
            "origin": "Shenzhen, CN",
            "destination": "Chicago, US",
            "expected_delivery": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"),
            "delay_days": 5,
            "route_risk": 0.82,
            "transport_mode": "Maritime",
            "status": "Delayed"
        },
        {
            "shipment_id": "SHP-8092",
            "supplier_id": "SUP002",
            "product_id": "P003",
            "origin": "Taipei, TW",
            "destination": "Newark, US",
            "expected_delivery": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "delay_days": 0,
            "route_risk": 0.22,
            "transport_mode": "Air Freight",
            "status": "In Transit"
        },
        {
            "shipment_id": "SHP-8093",
            "supplier_id": "SUP003",
            "product_id": "P005",
            "origin": "Dresden, DE",
            "destination": "Chicago, US",
            "expected_delivery": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "delay_days": 1,
            "route_risk": 0.28,
            "transport_mode": "Air Freight",
            "status": "In Transit"
        },
        {
            "shipment_id": "SHP-8094",
            "supplier_id": "SUP004",
            "product_id": "P002",
            "origin": "Penang, MY",
            "destination": "Reno, US",
            "expected_delivery": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "delay_days": 3,
            "route_risk": 0.68,
            "transport_mode": "Maritime",
            "status": "Delayed"
        },
        {
            "shipment_id": "SHP-8095",
            "supplier_id": "SUP005",
            "product_id": "P004",
            "origin": "Gothenburg, SE",
            "destination": "Dallas, US",
            "expected_delivery": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "delay_days": 0,
            "route_risk": 0.15,
            "transport_mode": "Maritime",
            "status": "On Schedule"
        },
        {
            "shipment_id": "SHP-8096",
            "supplier_id": "SUP006",
            "product_id": "P001",
            "origin": "Busan, KR",
            "destination": "Chicago, US",
            "expected_delivery": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"),
            "delay_days": 6,
            "route_risk": 0.79,
            "transport_mode": "Maritime",
            "status": "Severely Delayed"
        },
        {
            "shipment_id": "SHP-8097",
            "supplier_id": "SUP007",
            "product_id": "P004",
            "origin": "São Paulo, BR",
            "destination": "Dallas, US",
            "expected_delivery": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "delay_days": 1,
            "route_risk": 0.35,
            "transport_mode": "Maritime",
            "status": "In Transit"
        },
        {
            "shipment_id": "SHP-8098",
            "supplier_id": "SUP008",
            "product_id": "P006",
            "origin": "Osaka, JP",
            "destination": "Reno, US",
            "expected_delivery": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "actual_delivery": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "delay_days": 0,
            "route_risk": 0.24,
            "transport_mode": "Air Freight",
            "status": "On Schedule"
        }
    ]

    # 5. DEMAND TIME SERIES (Past 60 days)
    demand_records = {}
    base_dates = [datetime.now() - timedelta(days=i) for i in range(59, -1, -1)]
    
    for prod in products:
        p_id = prod["product_id"]
        base_rate = prod["daily_consumption_rate"]
        # Add trends and seasonal components
        series = []
        for i, dt in enumerate(base_dates):
            # Upward trend for P001 & P003, slight noise
            trend_mult = 1.0 + (0.28 * (i / 60.0)) if p_id in ["P001", "P003"] else 1.0 + (0.05 * (i / 60.0))
            day_of_week_effect = 1.15 if dt.weekday() < 5 else 0.7
            noise = np.random.normal(0, base_rate * 0.12)
            val = max(5, int(base_rate * trend_mult * day_of_week_effect + noise))
            series.append({
                "date": dt.strftime("%Y-%m-%d"),
                "demand": val
            })
        demand_records[p_id] = series

    # 6. EXTERNAL RISKS
    external_risks = {
        "weather_risk": 0.74, # Elevated typhoon / storm risk on trans-pacific routes
        "fuel_price_change": 8.5, # +8.5%
        "economic_risk": 0.42,
        "geopolitical_risk": 0.68,
        "transport_risk": 0.71,
        "port_congestion_index": 0.78
    }

    return {
        "suppliers": suppliers,
        "products": products,
        "inventory": inventory,
        "shipments": shipments,
        "demand_records": demand_records,
        "external_risks": external_risks
    }

def generate_ml_training_dataset(num_samples=1500):
    np.random.seed(42)
    
    # Generate realistic synthetic tabular data for training the risk classification model
    # Features
    reliability = np.random.beta(5, 2, num_samples) # 0 to 1
    delay_rate = np.random.beta(2, 5, num_samples)  # 0 to 1
    avg_lead_time = np.random.uniform(5, 45, num_samples) # days
    lead_time_var = np.random.uniform(0.5, 10.0, num_samples)
    defect_rate = np.random.beta(1.5, 25, num_samples) # 0 to ~0.1
    inventory_coverage_days = np.random.uniform(3, 45, num_samples) # days
    demand_growth = np.random.uniform(-0.15, 0.45, num_samples) # -15% to +45%
    demand_volatility = np.random.uniform(0.05, 0.35, num_samples)
    route_risk = np.random.beta(3, 3, num_samples) # 0 to 1
    weather_risk = np.random.beta(2.5, 3.5, num_samples) # 0 to 1
    economic_risk = np.random.beta(2, 3, num_samples)
    geopolitical_risk = np.random.beta(2.5, 3, num_samples)
    transport_risk = np.random.beta(3, 3, num_samples)

    # Risk probability equation based on domain ground truth
    logits = (
        - 3.5 * reliability
        + 4.8 * delay_rate
        + 0.05 * avg_lead_time
        + 0.18 * lead_time_var
        + 12.0 * defect_rate
        - 0.09 * inventory_coverage_days
        + 3.2 * demand_growth
        + 2.5 * demand_volatility
        + 3.0 * route_risk
        + 2.8 * weather_risk
        + 1.8 * economic_risk
        + 2.6 * geopolitical_risk
        + 2.4 * transport_risk
        - 0.8
    )

    prob = 1.0 / (1.0 + np.exp(-logits))
    disruption = (prob > 0.48).astype(int)

    df = pd.DataFrame({
        "supplier_reliability": reliability,
        "delay_rate": delay_rate,
        "average_lead_time": avg_lead_time,
        "lead_time_variance": lead_time_var,
        "defect_rate": defect_rate,
        "inventory_days": inventory_coverage_days,
        "demand_growth": demand_growth,
        "demand_volatility": demand_volatility,
        "route_risk": route_risk,
        "weather_risk": weather_risk,
        "economic_risk": economic_risk,
        "geopolitical_risk": geopolitical_risk,
        "transport_risk": transport_risk,
        "disruption": disruption
    })

    return df

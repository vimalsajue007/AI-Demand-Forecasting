from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.schemas.forecast import DashboardStats
from app.core.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_datasets = db.query(Dataset).filter(Dataset.owner_id == current_user.id).count()
    total_forecasts = db.query(Forecast).filter(Forecast.owner_id == current_user.id).count()

    forecasts = db.query(Forecast).filter(
        Forecast.owner_id == current_user.id,
        Forecast.status == "completed",
    ).all()

    accuracies = [f.accuracy_score for f in forecasts if f.accuracy_score is not None]
    avg_accuracy = round(sum(accuracies) / len(accuracies) * 100, 2) if accuracies else 0

    total_sales = 0.0
    monthly_data: dict = {}
    product_data: dict = {}

    for forecast in forecasts:
        if forecast.historical_data:
            for row in forecast.historical_data:
                if "ds" in row and "y" in row:
                    month_key = str(row["ds"])[:7]
                    monthly_data[month_key] = monthly_data.get(month_key, 0) + float(row["y"])
                    total_sales += float(row["y"])
                if "product" in row and "y" in row:
                    prod = row["product"]
                    product_data[prod] = product_data.get(prod, 0) + float(row["y"])

    monthly_trends = [
        {"month": k, "sales": round(v, 2)}
        for k, v in sorted(monthly_data.items())[-12:]
    ]

    top_products = sorted(
        [{"product": k, "sales": round(v, 2)} for k, v in product_data.items()],
        key=lambda x: x["sales"],
        reverse=True,
    )[:10]

    recent_forecasts = [
        {
            "id": f.id,
            "name": f.name,
            "model": f.model_type,
            "accuracy": round(f.accuracy_score * 100, 2) if f.accuracy_score else None,
            "status": f.status,
            "created_at": str(f.created_at),
        }
        for f in sorted(forecasts, key=lambda x: x.created_at, reverse=True)[:5]
    ]

    return DashboardStats(
        total_datasets=total_datasets,
        total_forecasts=total_forecasts,
        total_sales=round(total_sales, 2),
        avg_accuracy=avg_accuracy,
        monthly_trends=monthly_trends,
        top_products=top_products,
        recent_forecasts=recent_forecasts,
    )

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.schemas.forecast import ForecastCreate, ForecastResponse
from app.core.security import get_current_user
from app.ml.forecasting import run_forecast

router = APIRouter(prefix="/api/forecasts", tags=["Forecasts"])


def _run_forecast_task(forecast_id: int, db_url: str):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
        if not forecast:
            return
        dataset = db.query(Dataset).filter(Dataset.id == forecast.dataset_id).first()
        result = run_forecast(
            file_path=dataset.file_path,
            model_type=forecast.model_type,
            periods=forecast.periods,
            target_column=forecast.target_column,
            date_column=forecast.date_column,
            feature_columns=forecast.feature_columns or [],
        )
        forecast.predictions = result["predictions"]
        forecast.historical_data = result["historical"]
        forecast.accuracy_score = result.get("r2_score")
        forecast.mae = result.get("mae")
        forecast.rmse = result.get("rmse")
        forecast.status = "completed"
        db.commit()
    except Exception as e:
        forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
        if forecast:
            forecast.status = "error"
            forecast.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/", response_model=ForecastResponse, status_code=201)
def create_forecast(
    forecast_data: ForecastCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(
        Dataset.id == forecast_data.dataset_id,
        Dataset.owner_id == current_user.id,
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.status != "processed":
        raise HTTPException(status_code=400, detail="Dataset not processed yet")

    forecast = Forecast(
        name=forecast_data.name,
        model_type=forecast_data.model_type,
        periods=forecast_data.periods,
        target_column=forecast_data.target_column,
        date_column=forecast_data.date_column,
        feature_columns=forecast_data.feature_columns,
        dataset_id=forecast_data.dataset_id,
        owner_id=current_user.id,
        status="running",
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    from app.core.config import settings
    background_tasks.add_task(_run_forecast_task, forecast.id, settings.DATABASE_URL)
    return forecast


@router.get("/", response_model=List[ForecastResponse])
def list_forecasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Forecast).filter(Forecast.owner_id == current_user.id).all()


@router.get("/{forecast_id}", response_model=ForecastResponse)
def get_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id, Forecast.owner_id == current_user.id
    ).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast


@router.delete("/{forecast_id}")
def delete_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id, Forecast.owner_id == current_user.id
    ).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    db.delete(forecast)
    db.commit()
    return {"message": "Forecast deleted"}

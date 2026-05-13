import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def run_forecast(
    file_path: str,
    model_type: str,
    periods: int,
    target_column: str,
    date_column: str,
    feature_columns: List[str],
) -> Dict[str, Any]:
    """Main forecasting dispatcher."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
    df = df.dropna(subset=[date_column, target_column])
    df = df.sort_values(date_column)

    if model_type == "prophet":
        return _run_prophet(df, date_column, target_column, periods)
    else:
        return _run_linear_regression(df, date_column, target_column, feature_columns, periods)


def _run_prophet(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    periods: int,
) -> Dict[str, Any]:
    """
    Try Prophet first, then NeuralProphet, then fall back to Linear Regression.
    """
    prophet_df = df[[date_column, target_column]].rename(
        columns={date_column: "ds", target_column: "y"}
    )
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])
    prophet_df["y"] = pd.to_numeric(prophet_df["y"], errors="coerce")
    prophet_df = prophet_df.dropna()

    train_size = max(int(len(prophet_df) * 0.8), len(prophet_df) - 20)
    train_df = prophet_df.iloc[:train_size]
    test_df = prophet_df.iloc[train_size:]

    # ── Try Meta Prophet ──────────────────────────────────────────────────────
    try:
        from prophet import Prophet  # type: ignore

        model = Prophet(yearly_seasonality=True, weekly_seasonality=True,
                        daily_seasonality=False, interval_width=0.95)
        model.fit(train_df)

        metrics = _evaluate_prophet_model(model, test_df)

        full_model = Prophet(yearly_seasonality=True, weekly_seasonality=True,
                             daily_seasonality=False)
        full_model.fit(prophet_df)
        future = full_model.make_future_dataframe(periods=periods)
        forecast = full_model.predict(future)

        predictions = (
            forecast.tail(periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
            .copy()
        )
        predictions["ds"] = predictions["ds"].dt.strftime("%Y-%m-%d")
        for col in ["yhat", "yhat_lower", "yhat_upper"]:
            predictions[col] = predictions[col].round(2)

        historical = prophet_df.copy()
        historical["ds"] = historical["ds"].dt.strftime("%Y-%m-%d")
        historical["y"] = historical["y"].round(2)

        return {
            "predictions": predictions.to_dict(orient="records"),
            "historical": historical.to_dict(orient="records"),
            **metrics,
        }

    except ImportError:
        pass  # Prophet not installed, try NeuralProphet

    # ── Try NeuralProphet ─────────────────────────────────────────────────────
    try:
        from neuralprophet import NeuralProphet  # type: ignore
        import logging
        logging.getLogger("NP.forecaster").setLevel(logging.ERROR)
        logging.getLogger("NP.config").setLevel(logging.ERROR)

        np_model = NeuralProphet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            epochs=50,
            batch_size=16,
            learning_rate=0.01,
            verbose=False,
        )
        np_model.fit(train_df, freq=_detect_frequency(df[date_column]))

        metrics = {}
        if len(test_df) > 0:
            test_pred = np_model.predict(test_df)
            y_true = test_df["y"].values
            y_pred = test_pred["yhat1"].values if "yhat1" in test_pred else test_pred.get("yhat", pd.Series()).values
            if len(y_pred) > 0:
                metrics["mae"] = float(mean_absolute_error(y_true[:len(y_pred)], y_pred))
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_true[:len(y_pred)], y_pred)))
                metrics["r2_score"] = float(max(0, r2_score(y_true[:len(y_pred)], y_pred)))

        # Retrain on full data
        full_model = NeuralProphet(
            yearly_seasonality=True, weekly_seasonality=True,
            daily_seasonality=False, epochs=50, batch_size=16,
            learning_rate=0.01, verbose=False,
        )
        full_model.fit(prophet_df, freq=_detect_frequency(df[date_column]))
        future = full_model.make_future_dataframe(prophet_df, periods=periods)
        forecast = full_model.predict(future)

        pred_col = "yhat1" if "yhat1" in forecast.columns else "yhat"
        predictions = forecast.tail(periods)[["ds", pred_col]].copy()
        predictions = predictions.rename(columns={pred_col: "yhat"})
        predictions["ds"] = pd.to_datetime(predictions["ds"]).dt.strftime("%Y-%m-%d")
        predictions["yhat"] = predictions["yhat"].round(2)

        historical = prophet_df.copy()
        historical["ds"] = historical["ds"].dt.strftime("%Y-%m-%d")
        historical["y"] = historical["y"].round(2)

        return {
            "predictions": predictions.to_dict(orient="records"),
            "historical": historical.to_dict(orient="records"),
            **metrics,
        }

    except ImportError:
        pass  # NeuralProphet not installed either, fall back

    # ── Final fallback: Linear Regression ─────────────────────────────────────
    return _run_linear_regression(df, date_column, target_column, [], periods)


def _evaluate_prophet_model(model, test_df) -> Dict[str, float]:
    if len(test_df) == 0:
        return {}
    test_forecast = model.predict(test_df[["ds"]])
    y_true = test_df["y"].values
    y_pred = test_forecast["yhat"].values
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2_score": float(max(0, r2_score(y_true, y_pred))),
    }


def _run_linear_regression(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    feature_columns: List[str],
    periods: int,
) -> Dict[str, Any]:
    df = df.copy()
    df["_date_ordinal"] = pd.to_datetime(df[date_column]).map(pd.Timestamp.toordinal)

    feature_cols = ["_date_ordinal"]
    for col in feature_columns:
        if col in df.columns and col != target_column and col != date_column:
            try:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                feature_cols.append(col)
            except Exception:
                pass

    df_clean = df[feature_cols + [target_column]].dropna()
    X = df_clean[feature_cols].values
    y = pd.to_numeric(df_clean[target_column], errors="coerce").fillna(0).values

    if len(X) < 4:
        raise ValueError("Not enough data rows to train a model (need at least 4 rows).")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(max(0, r2_score(y_test, y_pred)))

    # Generate future dates
    last_date = pd.to_datetime(df[date_column]).max()
    freq = _detect_frequency(df[date_column])
    future_dates = pd.date_range(start=last_date, periods=periods + 1, freq=freq)[1:]

    future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
    if len(feature_cols) > 1:
        extra = np.hstack([
            np.full((len(future_dates), 1), df[col].median())
            for col in feature_cols[1:]
        ])
        future_X = np.hstack([future_ordinals, extra])
    else:
        future_X = future_ordinals

    future_X_s = scaler.transform(future_X)
    future_preds = model.predict(future_X_s)

    predictions = [
        {"ds": d.strftime("%Y-%m-%d"), "yhat": round(float(v), 2)}
        for d, v in zip(future_dates, future_preds)
    ]

    historical = []
    for _, row in df[[date_column, target_column]].dropna().iterrows():
        ds = row[date_column]
        historical.append({
            "ds": ds.strftime("%Y-%m-%d") if hasattr(ds, "strftime") else str(ds)[:10],
            "y": round(float(row[target_column]), 2),
        })

    return {
        "predictions": predictions,
        "historical": historical,
        "mae": mae,
        "rmse": rmse,
        "r2_score": r2,
    }


def _detect_frequency(date_series: pd.Series) -> str:
    dates = pd.to_datetime(date_series).sort_values().dropna()
    if len(dates) < 2:
        return "D"
    diff = (dates.iloc[-1] - dates.iloc[0]) / (len(dates) - 1)
    days = diff.days
    if days <= 1:
        return "D"
    elif days <= 8:
        return "W"
    elif days <= 32:
        return "MS"
    elif days <= 93:
        return "QS"
    else:
        return "YS"

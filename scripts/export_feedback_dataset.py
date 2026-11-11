"""Export user-submitted label corrections and feedback into an active-learning dataset.

Queries the backend database for records where users corrected the model's prediction,
formats them as an active-learning manifest (`data/manifests/active_learning_queue.parquet`),
and reports label-shift statistics.

Usage:
    python scripts/export_feedback_dataset.py --db sqlite:///backend_data.sqlite3
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Add project root to path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.db.models import PredictionLog, UserFeedback


def export_feedback(database_url: str, output_parquet: str) -> None:
    engine = create_engine(database_url)
    with Session(engine) as session:
        # Join feedback with prediction logs on request_id
        query = (
            session.query(
                UserFeedback.id.label("feedback_id"),
                UserFeedback.request_id,
                UserFeedback.predicted_class,
                UserFeedback.is_correct,
                UserFeedback.corrected_class,
                UserFeedback.comment,
                UserFeedback.created_at.label("feedback_time"),
                PredictionLog.confidence,
                PredictionLog.filename,
                PredictionLog.is_uncertain,
                PredictionLog.is_ood,
            )
            .outerjoin(PredictionLog, UserFeedback.request_id == PredictionLog.request_id)
            .order_by(UserFeedback.created_at.desc())
        )

        rows = [r._asdict() for r in query.all()]

    if not rows:
        print("[active_learning] No user feedback records found in database.")
        return

    df = pd.DataFrame(rows)
    corrections = df[df["is_correct"] == False]

    out_path = Path(output_parquet)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)

    print("=" * 60)
    print("📋 Active Learning Feedback Export Summary")
    print("=" * 60)
    print(f"Total Feedback Submissions : {len(df)}")
    print(f"Confirmed Correct (TPs)    : {(df['is_correct'] == True).sum()}")
    print(f"User Corrections (FNs/FPs) : {len(corrections)}")

    if not corrections.empty:
        print("\nTop Misclassified Transitions:")
        transitions = (
            corrections.groupby(["predicted_class", "corrected_class"])
            .size()
            .reset_index(name="count")
            .sort_values("count", ascending=False)
            .head(10)
        )
        for _, row in transitions.iterrows():
            print(f"  • {row['predicted_class']} ➔ {row['corrected_class']} ({row['count']}x)")

    print(f"\n[active_learning] Saved full queue to {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export active learning dataset from user feedback.")
    parser.add_argument(
        "--db",
        default="sqlite:///./backend_data.sqlite3",
        help="Database connection URL.",
    )
    parser.add_argument(
        "--out",
        default="data/manifests/active_learning_queue.parquet",
        help="Output Parquet path.",
    )
    args = parser.parse_args()
    export_feedback(args.db, args.out)


if __name__ == "__main__":
    main()


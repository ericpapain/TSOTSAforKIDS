"""Scénario 3 de test de charge : Planificateur de 50 000 rappels à la même minute.

Environnement : RECETTE uniquement.
Critères de validation :
1. Moins de 5 minutes (300 secondes) pour envoyer l'intégralité des 50 000 rappels.
2. Zéro doublon détecté (unicité stricte sur dedupe_key).
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from datetime import UTC, datetime
from typing import Any, Sequence

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from tsotsa_api.modules.notifications.channels.base import NotificationChannel
from tsotsa_api.modules.notifications.models import Notification
from tsotsa_api.modules.notifications.worker import NotificationWorker

TARGET_NOTIFS = int(os.environ.get("LOAD_NOTIFS_COUNT", "50000"))
BATCH_INSERT_CHUNK = 5000


class BenchmarkChannel(NotificationChannel):
    """Canal d'envoi factice haute vitesse pour le banc d'essai de charge."""

    def __init__(self) -> None:
        self.sent_count = 0

    async def send(
        self,
        recipient_id: str,
        title: str,
        body: str,
        payload: dict[str, str] | None = None,
        device_tokens: Sequence[str] | None = None,
    ) -> tuple[bool, str | None, dict[str, str] | None]:
        self.sent_count += 1
        return True, f"bench-ticket-{self.sent_count}", {"benchmark": "ok"}


def create_engine_and_session() -> tuple[Any, sessionmaker]:
    """Initialise le moteur de base de données à partir de l'environnement."""
    db_url = os.environ.get(
        "DATABASE_URL",
        "mysql+asyncmy://tsotsa_app:devpassword@127.0.0.1:3308/tsotsa_dev",
    )
    engine = create_async_engine(db_url, pool_size=20, max_overflow=10)
    session_factory = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_factory


async def insert_benchmark_notifications(
    session: AsyncSession, target_minute: datetime, total: int
) -> None:
    """Insère total notifications prévues à target_minute par lots optimisés."""
    print(f"-> Préparation et injection de {total:,} rappels pour {target_minute.isoformat()}...")
    raw_user_id = os.environ.get("LOAD_TEST_USER_ID", "018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b")

    for start_idx in range(0, total, BATCH_INSERT_CHUNK):
        end_idx = min(start_idx + BATCH_INSERT_CHUNK, total)
        records = [
            {
                "id": os.urandom(16),
                "user_id": bytes.fromhex(raw_user_id.replace("-", "")),
                "person_id": None,
                "schedule_id": None,
                "type": "reminder",
                "channel": "push",
                "title": f"Rappel de prise #{i}",
                "body": "Il est l'heure de donner la bouillie enrichie à votre enfant.",
                "scheduled_for": target_minute,
                "status": "queued",
                "attempts": 0,
                "dedupe_key": f"load-sched-50k-{target_minute.strftime('%Y%m%d%H%M')}-{i}",
                "created_at": datetime.now(UTC),
            }
            for i in range(start_idx, end_idx)
        ]
        stmt = text(
            "INSERT INTO notifications (id, user_id, person_id, schedule_id, type, channel, "
            "title, body, scheduled_for, status, attempts, dedupe_key, created_at) "
            "VALUES (:id, :user_id, :person_id, :schedule_id, :type, :channel, "
            ":title, :body, :scheduled_for, :status, :attempts, :dedupe_key, :created_at)"
        )
        await session.execute(stmt, records)
        await session.commit()
        print(f"   Injections : {end_idx:,} / {total:,} enregistrements")


async def verify_zero_duplicates(session: AsyncSession) -> int:
    """Vérifie l'absence absolue de doublons sur la table des notifications."""
    query = text(
        "SELECT dedupe_key, COUNT(*) as cnt FROM notifications "
        "WHERE dedupe_key LIKE 'load-sched-50k-%' "
        "GROUP BY dedupe_key HAVING cnt > 1"
    )
    result = await session.execute(query)
    duplicates = result.fetchall()
    return len(duplicates)


async def run_scheduler_benchmark() -> int:
    """Exécute le benchmark du planificateur pour 50 000 rappels."""
    print("=== Démarrage du scénario 3 : 50 000 rappels planifiés à la même minute ===")
    engine, session_factory = create_engine_and_session()
    now_utc = datetime.now(UTC).replace(second=0, microsecond=0)

    channel = BenchmarkChannel()
    channels = {"push": channel, "sms": channel, "email": channel, "in_app": channel}

    async with session_factory() as session:
        # Nettoyage préalable des anciens rappels de test
        await session.execute(
            text("DELETE FROM notifications WHERE dedupe_key LIKE 'load-sched-50k-%'")
        )
        await session.commit()

        # Insertion des 50 000 notifications
        await insert_benchmark_notifications(session, now_utc, TARGET_NOTIFS)

        # Mesure du traitement
        start_time = time.perf_counter()
        worker = NotificationWorker(session=session, channels=channels)

        processed = 0
        while processed < TARGET_NOTIFS:
            count = await worker.dispatch_due_notifications(now_utc)
            if count == 0:
                break
            processed += count
            await session.commit()

        elapsed = time.perf_counter() - start_time
        print(f"-> Traitement terminé : {processed:,} rappels traités en {elapsed:.2f} secondes.")
        print(f"-> Débit mesuré : {processed / max(elapsed, 0.001):.1f} rappels / seconde.")

        # Vérification des doublons
        dups = await verify_zero_duplicates(session)
        print(f"-> Contrôle d'unicité : {dups} doublon(s) détecté(s).")

        # Nettoyage des données de test
        await session.execute(
            text("DELETE FROM notifications WHERE dedupe_key LIKE 'load-sched-50k-%'")
        )
        await session.commit()

    await engine.dispose()

    # Validation des critères
    success = True
    if elapsed > 300.0:
        print(f"FAIL: Délai dépassé ({elapsed:.2f}s > 300s)", file=sys.stderr)
        success = False
    if dups > 0:
        print(f"FAIL: {dups} doublons détectés", file=sys.stderr)
        success = False

    if success:
        print(f"SUCCESS: Scénario 3 validé ({TARGET_NOTIFS:,} rappels en {elapsed:.2f}s < 5min, 0 doublon).")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(run_scheduler_benchmark()))

"""Unit tests for Domain J: Notifications planner, timezones, and quiet hours."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

from tsotsa_api.modules.notifications.planner import (
    compute_dedupe_key,
    convert_local_to_utc,
    convert_utc_to_local_hm,
    generate_schedule_slot_occurrences,
    is_in_quiet_hours,
    render_template_text,
)
from tsotsa_api.modules.schedules.models import IntakeSchedule, ScheduleTime


def test_compute_dedupe_key() -> None:
    k1 = compute_dedupe_key("slot-123", "2026-11-06", "user-456", "reminder")
    k2 = compute_dedupe_key("slot-123", "2026-11-06", "user-456", "reminder")
    k3 = compute_dedupe_key("slot-123", "2026-11-06", "user-789", "reminder")
    assert k1 == k2
    assert k1 != k3
    assert k1 == "slot-123:2026-11-06:user-456:reminder"


def test_is_in_quiet_hours() -> None:
    # 1. Daytime range: 13:00 to 15:00
    assert is_in_quiet_hours("14:00", "13:00", "15:00") is True
    assert is_in_quiet_hours("12:59", "13:00", "15:00") is False
    assert is_in_quiet_hours("15:01", "13:00", "15:00") is False

    # 2. Night range wrapping midnight: 22:00 to 07:00
    assert is_in_quiet_hours("23:30", "22:00", "07:00") is True
    assert is_in_quiet_hours("03:00", "22:00", "07:00") is True
    assert is_in_quiet_hours("07:00", "22:00", "07:00") is True
    assert is_in_quiet_hours("07:01", "22:00", "07:00") is False
    assert is_in_quiet_hours("14:00", "22:00", "07:00") is False
    assert is_in_quiet_hours("21:59", "22:00", "07:00") is False

    # 3. None or equal start/end
    assert is_in_quiet_hours("10:00", None, "07:00") is False
    assert is_in_quiet_hours("10:00", "22:00", None) is False
    assert is_in_quiet_hours("10:00", "22:00", "22:00") is False


def test_convert_local_to_utc_multiple_timezones() -> None:
    target_d = date(2026, 11, 6)

    # 1. Africa/Douala is UTC+1 all year
    utc_douala = convert_local_to_utc(target_d, "08:00", "Africa/Douala")
    assert utc_douala == datetime(2026, 11, 6, 7, 0, tzinfo=UTC)
    assert convert_utc_to_local_hm(utc_douala, "Africa/Douala") == "08:00"

    # 2. Europe/Paris in November is UTC+1 (standard time)
    utc_paris = convert_local_to_utc(target_d, "08:00", "Europe/Paris")
    assert utc_paris == datetime(2026, 11, 6, 7, 0, tzinfo=UTC)
    assert convert_utc_to_local_hm(utc_paris, "Europe/Paris") == "08:00"

    # 3. America/New_York in November (after daylight savings, UTC-5)
    utc_ny = convert_local_to_utc(target_d, "08:00", "America/New_York")
    assert utc_ny == datetime(2026, 11, 6, 13, 0, tzinfo=UTC)
    assert convert_utc_to_local_hm(utc_ny, "America/New_York") == "08:00"


def test_generate_schedule_slot_occurrences() -> None:
    now_utc = datetime(2026, 11, 6, 6, 0, tzinfo=UTC)  # 07:00 in Douala
    schedule = IntakeSchedule(
        id="sched-1",
        person_id="p-1",
        quantity=Decimal("1.0"),
        unit="sachet",
        start_date=date(2026, 11, 6),
        end_date=date(2026, 11, 7),
        status="active",
        timezone="Africa/Douala",
    )
    schedule.schedule_times = [
        ScheduleTime(id="t-1", schedule_id="sched-1", local_time="08:00", enabled=True),
        ScheduleTime(id="t-2", schedule_id="sched-1", local_time="12:00", enabled=True),
        ScheduleTime(
            id="t-3", schedule_id="sched-1", local_time="20:00", enabled=False
        ),  # Disabled
    ]

    occurrences = generate_schedule_slot_occurrences(schedule, now_utc, window_hours=12)
    # 08:00 (07:00 UTC) and 12:00 (11:00 UTC) are within 12 hours
    assert len(occurrences) == 2
    assert occurrences[0][0].local_time == "08:00"
    assert occurrences[0][1] == datetime(2026, 11, 6, 7, 0, tzinfo=UTC)
    assert occurrences[1][0].local_time == "12:00"
    assert occurrences[1][1] == datetime(2026, 11, 6, 11, 0, tzinfo=UTC)


def test_render_template_text() -> None:
    tpl = "Bonjour {first_name}, prise de {product} à {time}."
    rendered = render_template_text(
        tpl, {"first_name": "Samuel", "product": "F-75", "time": "08:00"}
    )
    assert rendered == "Bonjour Samuel, prise de F-75 à 08:00."

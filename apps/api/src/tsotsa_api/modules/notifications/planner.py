"""Pure planning functions for reminder generation, timezones, and quiet hours."""

from __future__ import annotations

import zoneinfo
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from tsotsa_api.modules.schedules.models import IntakeSchedule, ScheduleTime


def compute_dedupe_key(
    schedule_time_id: str,
    target_date_iso: str,
    user_id: str,
    notification_type: str,
) -> str:
    """Build a unique dedupe key ensuring zero duplicate notifications across multiple workers."""
    return f"{schedule_time_id}:{target_date_iso}:{user_id}:{notification_type}"


def is_in_quiet_hours(
    current_time_hm: str,
    quiet_start: str | None,
    quiet_end: str | None,
) -> bool:
    """Check if the given HH:MM time falls within the quiet hours window."""
    if not quiet_start or not quiet_end:
        return False
    if quiet_start == quiet_end:
        return False

    def _parse(hm: str) -> time:
        h, m = map(int, hm.split(":"))
        return time(h, m)

    t = _parse(current_time_hm)
    start = _parse(quiet_start)
    end = _parse(quiet_end)

    if start < end:
        return start <= t <= end
    # Wraps around midnight (e.g. 22:00 -> 07:00)
    return t >= start or t <= end


def convert_local_to_utc(
    local_date: date,
    time_hm: str,
    timezone_name: str = "Africa/Douala",
) -> datetime:
    """Convert a local calendar date and HH:MM time in a timezone to a UTC datetime."""
    try:
        tz = zoneinfo.ZoneInfo(timezone_name)
    except Exception:
        tz = zoneinfo.ZoneInfo("Africa/Douala")

    h, m = map(int, time_hm.split(":"))
    local_dt = datetime(local_date.year, local_date.month, local_date.day, h, m, tzinfo=tz)
    return local_dt.astimezone(UTC)


def convert_utc_to_local_hm(
    utc_dt: datetime,
    timezone_name: str = "Africa/Douala",
) -> str:
    """Format a UTC datetime to HH:MM in the specified timezone."""
    try:
        tz = zoneinfo.ZoneInfo(timezone_name)
    except Exception:
        tz = zoneinfo.ZoneInfo("Africa/Douala")
    local_dt = utc_dt.astimezone(tz)
    return local_dt.strftime("%H:%M")


def generate_schedule_slot_occurrences(
    schedule: IntakeSchedule,
    now_utc: datetime,
    window_hours: int = 24,
) -> list[tuple[ScheduleTime, datetime, date]]:
    """Generate all upcoming occurrences for an active schedule within window_hours."""
    if schedule.status != "active":
        return []

    try:
        tz = zoneinfo.ZoneInfo(schedule.timezone)
    except Exception:
        tz = zoneinfo.ZoneInfo("Africa/Douala")

    local_now = now_utc.astimezone(tz)
    window_end_utc = now_utc + timedelta(hours=window_hours)
    occurrences: list[tuple[ScheduleTime, datetime, date]] = []

    # Check today and next 2 days to cover 24h across timezones
    for day_offset in range(3):
        target_date = (local_now + timedelta(days=day_offset)).date()
        if target_date < schedule.start_date:
            continue
        if schedule.end_date and target_date > schedule.end_date:
            continue

        weekday_iso = target_date.isoweekday()  # 1=Monday, ..., 7=Sunday
        for slot in schedule.schedule_times:
            if not slot.enabled:
                continue
            if slot.days_of_week and weekday_iso not in slot.days_of_week:
                continue

            slot_utc = convert_local_to_utc(target_date, slot.local_time, schedule.timezone)
            if now_utc <= slot_utc <= window_end_utc:
                occurrences.append((slot, slot_utc, target_date))

    return occurrences


def render_template_text(template_text: str, context: dict[str, Any]) -> str:
    """Format text safely by replacing {key} with str(value)."""
    result = template_text
    for key, val in context.items():
        result = result.replace(f"{{{key}}}", str(val))
    return result

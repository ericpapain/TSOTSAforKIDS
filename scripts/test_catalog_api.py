import json
import urllib.request

req = urllib.request.Request(
    "http://127.0.0.1:8000/v1/auth/email/login",
    data=json.dumps({"email": "parent@tsotsa-for-kids.com", "password": "Tsotsa2026!Demo"}).encode(),
    headers={"Content-Type": "application/json"}
)
res = json.loads(urllib.request.urlopen(req).read())
token = res["access_token"]

event_payload = {
    "person_id": "child-1794775062994",
    "declaration_context": "standalone",
    "meal_interrupted": False,
    "symptoms": [
        {"symptom_code": "convulsions", "duration": "less_than_24h", "duration_days": 1}
    ],
    "comment": "Crise observée"
}

req_event = urllib.request.Request(
    "http://127.0.0.1:8000/v1/health/events",
    data=json.dumps(event_payload).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
)

res_event = json.loads(urllib.request.urlopen(req_event).read())
print("DANGER EVENT RESULT:")
print("Priority:", res_event["priority"])
print("Has danger sign:", res_event["has_danger_sign"])
print("Guidance:", res_event["parent_guidance_message"])

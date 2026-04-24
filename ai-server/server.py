from fastapi import FastAPI, File, UploadFile, Form
import mediapipe as mp
import cv2
import numpy as np
import math

app = FastAPI()

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=2,
    enable_segmentation=False
)

def dist(p1, p2):
    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)


def process_image(file: UploadFile):
    try:
        contents = file.file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_landmarks:
            return None

        return results.pose_landmarks.landmark

    except Exception as e:
        return None


def validate_front_pose(lm):
    required_points = [0, 11, 12, 25, 26, 27, 28]

    for i in required_points:
        if lm[i].visibility < 0.3:
            return False

    return True


def validate_side_pose(lm):
    ls = lm[11]
    rs = lm[12]

    if abs(ls.x - rs.x) > 0.05:
        return False

    if abs(ls.z - rs.z) < 0.02:
        return False

    return True


@app.post("/measure-pro")
async def measure_pro(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: float = Form(...),
    category: str = Form(...),
    type: str = Form(...),
    style: str = Form(...)
):

    front_lm = process_image(front)
    side_lm = process_image(side)

    if not front_lm or not side_lm:
        return {"error": "Body not detected. Ensure full body is visible."}

    if not validate_front_pose(front_lm):
        return {"error": "Stand straight. Full body must be visible."}

    if not validate_side_pose(side_lm):
        return {"error": "Turn completely sideways."}

    # -------- HEIGHT SCALE -------- #
    head = front_lm[0]
    l_ankle = front_lm[27]
    r_ankle = front_lm[28]

    ankle = l_ankle if l_ankle.visibility > r_ankle.visibility else r_ankle

    height_px = dist(head, ankle)

    if height_px < 0.2:
        return {"error": "Move closer to camera."}

    scale = height / height_px

    # -------- SHOULDER -------- #
    ls = front_lm[11]
    rs = front_lm[12]

    shoulder_px = dist(ls, rs)

    # ✅ calibration factor (important)
    shoulder_cm = shoulder_px * scale * 0.85

    # -------- CHEST (REALISTIC FIX) -------- #
    chest_cm = shoulder_cm * 1.75

    # -------- CONVERT -------- #
    chest = chest_cm / 2.54
    shoulder = shoulder_cm / 2.54
    height_in = height / 2.54

    # -------- DERIVED (REALISTIC RATIOS) -------- #
    waist = chest * 0.85
    sleeve = shoulder * 1.2
    neck = chest * 0.37

    measurements = {}

    if type == "Top":
        measurements = {
            "chest": round(chest, 2),
            "waist": round(waist, 2),
            "shoulder": round(shoulder, 2),
            "sleeve": round(sleeve, 2),
            "neck": round(neck, 2),
            "length": round(height_in * 0.43, 2),
            "armhole": round(chest * 0.42, 2),
            "bicep": round(chest * 0.15, 2)
        }

    elif type == "Bottom":
        measurements = {
            "waist": round(waist, 2),
            "hip": round(chest * 0.92, 2),
            "thigh": round(chest * 0.52, 2),
            "knee": round(chest * 0.36, 2),
            "bottom": round(chest * 0.30, 2),
            "length": round(height_in * 0.55, 2),
            "crotch": round(height_in * 0.30, 2)
        }

    elif type == "Full Suit":
        measurements = {
            "chest": round(chest, 2),
            "waist": round(waist, 2),
            "shoulder": round(shoulder, 2),
            "sleeve": round(sleeve, 2),
            "neck": round(neck, 2),
            "kameezLength": round(height_in * 0.43, 2),
            "armhole": round(chest * 0.42, 2),
            "shalwarLength": round(height_in * 0.50, 2),
            "hip": round(chest * 0.92, 2),
            "thigh": round(chest * 0.52, 2),
            "bottom": round(chest * 0.30, 2)
        }

    return measurements
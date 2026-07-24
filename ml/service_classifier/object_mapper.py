# service_classifier/object_mapper.py

PLUMBING_OBJECTS = {
    "sink",
    "toilet"
}

ELECTRICAL_OBJECTS = {
    "tv",
    "remote",
    "keyboard",
    "mouse",
    "laptop"
}

AC_OBJECTS = {
    "air_conditioner"
}


def get_service_category(detected_objects):
    """
    Convert detected YOLO objects
    into FixMate service categories.
    """

    detected_objects = set(detected_objects)

    if detected_objects.intersection(PLUMBING_OBJECTS):
        return "Plumbing"

    if detected_objects.intersection(ELECTRICAL_OBJECTS):
        return "Electrical"

    if detected_objects.intersection(AC_OBJECTS):
        return "AC Repair"

    return "Unknown"
# Gets the area name from an address, used for "hotspot areas" in /stats and /report.
# Convention (shown on the request form): addresses are written "Street, Area"; the part after the last comma is the area.


def area_from_address(address):
    """'4th Main Road, Velachery' -> 'Velachery'. An address without a comma is used as-is."""
    if not address:
        return "Chennai"
    return address.split(",")[-1].strip() or "Chennai"

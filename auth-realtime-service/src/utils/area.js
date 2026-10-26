// Gets the area name from an address, so the activity log can say "...in Velachery".
// Convention (shown on the request form): addresses are written "Street, Area"; the part after the last comma is the area.
function areaFromAddress(address) {
  if (!address) return 'Chennai';
  const parts = address.split(',');
  return parts[parts.length - 1].trim() || 'Chennai';
}

module.exports = { areaFromAddress };

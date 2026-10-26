// [Person 1 – live] Live volunteer dots for any react-leaflet map: one teal dot per online volunteer who shares
// their location (rounded to about 100 m by the server). The list arrives over Socket.io as "presence:changed"
// (see useLiveUpdates), so dots appear, move and disappear on every screen in real time.
// Rendered inside Person 2's RequestMap.
import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { formatTimeAgo } from '../../app/format';
import './live.css';

// A plain HTML dot (styled in live.css) instead of Leaflet's default pin image
const volunteerIcon = L.divIcon({
  className: 'fl-volunteer',
  html: '<span class="fl-volunteer__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function VolunteerDots() {
  const volunteers = useSelector((state) => state.live.volunteers);
  const myId = useSelector((state) => state.auth.user?.id);

  return (
    <>
      {volunteers.filter((volunteer) => volunteer.latitude !== null).map((volunteer) => (
        <Marker key={volunteer.userId} position={[volunteer.latitude, volunteer.longitude]} icon={volunteerIcon}
          keyboard={false} zIndexOffset={-500}>
          <Tooltip direction="top" offset={[0, -10]}>
            {volunteer.userId === myId ? 'You' : volunteer.name} (volunteer) · {formatTimeAgo(volunteer.updatedAt)}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

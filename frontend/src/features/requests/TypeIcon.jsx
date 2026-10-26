// [Person 2 – requests] The one icon per help type, used everywhere a type appears (cards, tiles, filters, legend),
// so people learn them once: lifebuoy = rescue, medical kit = medicine, cutlery = food, house = shelter.
// TypeAvatar is the icon on a tile in the type's colour.
import { Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SupportIcon from '@mui/icons-material/Support';
import { TYPE_COLORS } from '../../app/theme';

export const TYPE_ICONS = {
  RESCUE: SupportIcon,
  MEDICINE: MedicalServicesIcon,
  FOOD: RestaurantIcon,
  SHELTER: HomeIcon,
};

export default function TypeIcon({ type, ...iconProps }) {
  const Icon = TYPE_ICONS[type];
  return <Icon {...iconProps} />;
}

export function TypeAvatar({ type, size = 36 }) {
  const color = TYPE_COLORS[type];
  return (
    <Box sx={{
      width: size, height: size, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center',
      color, bgcolor: `${color}22`, border: `1px solid ${color}55`,
    }}>
      <TypeIcon type={type} sx={{ fontSize: size * 0.55 }} />
    </Box>
  );
}

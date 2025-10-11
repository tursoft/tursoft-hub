// Shared color configuration for different entity types across the application

export const ENTITY_COLORS = {
  project: {
    text: 'text-blue-500',
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-500',
    borderLight: 'border-blue-500/20',
    hover: 'hover:bg-blue-500/20',
  },
  experience: {
    text: 'text-blue-500',
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-500',
    borderLight: 'border-blue-500/20',
    hover: 'hover:bg-blue-500/20',
  },
  education: {
    text: 'text-purple-500',
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-500/10',
    border: 'border-purple-500',
    borderLight: 'border-purple-500/20',
    hover: 'hover:bg-purple-500/20',
  },
  customer: {
    text: 'text-green-500',
    bg: 'bg-green-500',
    bgLight: 'bg-green-500/10',
    border: 'border-green-500',
    borderLight: 'border-green-500/20',
    hover: 'hover:bg-green-500/20',
  },
} as const;

export type EntityType = keyof typeof ENTITY_COLORS;

// Helper function to get color classes for an entity type
export const getEntityColors = (type: EntityType) => {
  return ENTITY_COLORS[type] || ENTITY_COLORS.project;
};

// Helper function to get raw hex colors for use in inline styles or libraries that need hex values
export const ENTITY_HEX_COLORS = {
  project: '#3b82f6',      // blue-500
  experience: '#3b82f6',   // blue-500
  education: '#a855f7',    // purple-500
  customer: '#22c55e',     // green-500
} as const;

export const getEntityHexColor = (type: EntityType): string => {
  return ENTITY_HEX_COLORS[type] || ENTITY_HEX_COLORS.project;
};

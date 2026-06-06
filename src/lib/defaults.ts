export const DEFAULT_UNITS = [
  { id: 'unit-1', label: '1A', floor: '1', rent_amount: 20000, unit_type: '1BR', created_at: new Date().toISOString() },
  { id: 'unit-2', label: '1B', floor: '1', rent_amount: 18000, unit_type: 'Studio', created_at: new Date().toISOString() },
  { id: 'unit-3', label: '2A', floor: '2', rent_amount: 22000, unit_type: '2BR', created_at: new Date().toISOString() },
  { id: 'unit-4', label: '2B', floor: '2', rent_amount: 20000, unit_type: '1BR', created_at: new Date().toISOString() },
];

export const DEFAULT_POSTS = [
  { id: 'post-welcome', author_id: 'system', audience: 'all', content: 'Welcome to the building — check notices for updates.', created_at: new Date().toISOString() },
];

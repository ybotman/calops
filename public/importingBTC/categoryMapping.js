// TangoTiempo categories matched to WordPress category names
export const categoryNameMap = {
  "Class": "Class",
  "Drop-in Class": "Class",
  "Progressive Class": "Class",
  "Workshop": "Workshop",
  "DayWorkshop": "DayWorkshop",
  "Festivals": "Festival",
  "Milonga": "Milonga",
  "Practica": "Practica",
  "Trips-Hosted": "Trip",
  "Virtual": "Virtual",
  "Party/Gathering": "Gathering",
  "Live Orchestra": "Orchestra",
  "Concert/Show": "Concert",
  "Forum/RoundTable/Labs": "Forum",
  "First Timer Friendly": "NewBee",
};

// Optionally handle unmapped or ignored categories
export const ignoredCategories = new Set([
  "Canceled",
  "Other",
]);

// Helper: maps incoming name to TT name or null if ignored/unmapped
export function mapToTTCategory(sourceName) {
  if (ignoredCategories.has(sourceName)) return null;
  return categoryNameMap[sourceName] || null;
}
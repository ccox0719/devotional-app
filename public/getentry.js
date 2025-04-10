import { loadPlanById } from './storage.js';

export async function getEntryForDate(fileName, dateStr) {
  const plan = await loadPlanById(fileName);
  if (!plan || !plan.entries) {
    throw new Error('Invalid or missing plan data.');
  }

  return plan.entries.find(entry => entry.date === dateStr);
}

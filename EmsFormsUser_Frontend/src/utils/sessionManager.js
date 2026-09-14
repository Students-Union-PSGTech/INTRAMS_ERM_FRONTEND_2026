const DRAFT_KEY = 'eventFormDraft';
const DRAFT_VERSION = 1;

export const sessionManager = {
  saveDraft: (eventData) => {
    try {
      const payload = { version: DRAFT_VERSION, savedAt: new Date().toISOString(), data: eventData };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      return true;
    } catch (_) {
      return false;
    }
  },
  getDraft: () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'data')
        ? parsed.data
        : parsed;
    } catch (_) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
  },
  getDraftMetadata: () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY));
      return parsed?.savedAt ? { version: parsed.version, savedAt: parsed.savedAt } : null;
    } catch (_) {
      return null;
    }
  },
  clearDraft: () => localStorage.removeItem(DRAFT_KEY)
};

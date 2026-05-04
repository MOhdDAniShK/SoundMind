const LOCAL_STORAGE_KEY = 'soundmind_assessments';
const API_URL = '/api/assessments';

export const saveAssessment = async (data) => {
  const assessment = {
    ...data,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment)
    });
    
    if (response.ok) {
      const savedData = await response.json();
      return savedData.id;
    } else {
      console.warn("Backend error saving assessment, falling back to local storage.");
      saveToLocalStorage(assessment);
      return assessment.id;
    }
  } catch (e) {
    console.error("Network error saving assessment, falling back to local storage: ", e);
    saveToLocalStorage(assessment);
    return assessment.id;
  }
};

export const getAssessmentHistory = async () => {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      return await response.json();
    } else {
      console.warn("Backend error fetching history, falling back to local storage.");
      return getFromLocalStorage();
    }
  } catch (e) {
    console.error("Network error fetching history, falling back to local storage: ", e);
    return getFromLocalStorage();
  }
};

// Helper functions for localStorage fallback
const saveToLocalStorage = (assessment) => {
  const existing = getFromLocalStorage();
  const updated = [assessment, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
};

const getFromLocalStorage = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  return [];
};

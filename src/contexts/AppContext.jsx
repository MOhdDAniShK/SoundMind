import React, { createContext, useReducer, useContext } from 'react';

const initialState = {
  consent: {
    webcam: false,
    dataProcessing: false,
    research: false,
    parentNotification: false,
    timestamp: null
  },
  // Parent contact info
  parentContact: { name: '', phone: '', email: '' },
  parentNotificationSent: false,
  // Survey
  surveyData: null,
  surveyScore: 0,
  surveyQuestions: [],
  surveyAnswers: {},
  userHobbies: '',
  academicStressType: null, // 'backlog' | 'exam_readiness' | 'comprehension' | 'time_management' | null
  // Behavioral (webcam)
  behavioralData: null,
  behavioralScore: 0,
  // Keyboard/Cursor
  keyboardData: null,
  keyboardScore: 0,
  // Final
  finalScore: 0,
  // History & Chat
  assessmentHistory: [],
  chatMessages: [],
  // Task verification
  currentTask: null,
  taskBaseline: null,
  taskResults: [],
};

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONSENT':
      return { ...state, consent: { ...state.consent, ...action.payload } };
    case 'SET_PARENT_CONTACT':
      return { ...state, parentContact: { ...state.parentContact, ...action.payload } };
    case 'SET_PARENT_NOTIFICATION_SENT':
      return { ...state, parentNotificationSent: action.payload };
    case 'SET_SURVEY':
      return { ...state, surveyData: action.payload.data, surveyScore: action.payload.score };
    case 'SET_SURVEY_QUESTIONS':
      return { ...state, surveyQuestions: action.payload };
    case 'SET_SURVEY_ANSWERS':
      return { ...state, surveyAnswers: action.payload };
    case 'SET_USER_HOBBIES':
      return { ...state, userHobbies: action.payload };
    case 'SET_ACADEMIC_STRESS_TYPE':
      return { ...state, academicStressType: action.payload };
    case 'SET_BEHAVIORAL':
      return { ...state, behavioralData: action.payload.data, behavioralScore: action.payload.score };
    case 'SET_KEYBOARD':
      return { ...state, keyboardData: action.payload.data, keyboardScore: action.payload.score };
    case 'SET_FINAL_SCORE':
      return { ...state, finalScore: action.payload };
    case 'ADD_ASSESSMENT':
      return { ...state, assessmentHistory: [...state.assessmentHistory, action.payload] };
    case 'SET_ASSESSMENT_HISTORY':
      return { ...state, assessmentHistory: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'CLEAR_CHAT':
      return { ...state, chatMessages: [] };
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };
    case 'SET_TASK_BASELINE':
      return { ...state, taskBaseline: action.payload };
    case 'ADD_TASK_RESULT':
      return { ...state, taskResults: [...state.taskResults, action.payload] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

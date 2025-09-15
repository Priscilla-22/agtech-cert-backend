// Challenge-specific checklist questions
const CHECKLIST_QUESTIONS = {
  syntheticInputs: "Any synthetic inputs in the last 36 months?",
  bufferZones: "Adequate buffer zones?",
  organicSeed: "Organic seed or permitted exceptions?",
  compostManagement: "Compost/soil fertility managed organically?",
  recordKeeping: "Recordkeeping/logs available?"
};

const DEFAULT_CHECKLIST = [
  {
    id: 'syntheticInputs',
    question: 'Any synthetic inputs in the last 36 months?'
  },
  {
    id: 'bufferZones',
    question: 'Adequate buffer zones?'
  },
  {
    id: 'organicSeed',
    question: 'Organic seed or permitted exceptions?'
  },
  {
    id: 'compostManagement',
    question: 'Compost/soil fertility managed organically?'
  },
  {
    id: 'recordKeeping',
    question: 'Recordkeeping/logs available?'
  }
];

const createChecklist = () => {
  return DEFAULT_CHECKLIST.map(item => ({
    ...item,
    answer: undefined
  }));
};

const calculateComplianceScore = (checklist) => {
  const answeredQuestions = checklist.filter(item => item.answer !== undefined);
  if (answeredQuestions.length === 0) return 0;
  
  const yesAnswers = answeredQuestions.filter(item => item.answer === true);
  return Math.round((yesAnswers.length / answeredQuestions.length) * 100);
};

const isEligibleForCertification = (complianceScore) => {
  return complianceScore >= 80;
};

// Validate checklist data
const validateChecklist = (checklist) => {
  const errors = [];
  const questions = Object.keys(CHECKLIST_QUESTIONS);

  questions.forEach(question => {
    const answer = checklist[question];
    if (answer !== true && answer !== false && answer !== null) {
      errors.push(`Invalid answer for ${question}. Must be true, false, or null.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if all questions are answered
const isChecklistComplete = (checklist) => {
  const questions = Object.keys(CHECKLIST_QUESTIONS);
  return questions.every(question =>
    checklist[question] === true || checklist[question] === false
  );
};

module.exports = {
  CHECKLIST_QUESTIONS,
  DEFAULT_CHECKLIST,
  createChecklist,
  calculateComplianceScore,
  isEligibleForCertification,
  validateChecklist,
  isChecklistComplete
};
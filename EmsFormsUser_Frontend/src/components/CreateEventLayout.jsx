import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import StepProgress from './StepProgress';
import Instructions from './Instructions';
import NewDescriptionPage from './NewDescriptionPage';
import RoundsPage from './RoundsPage';
import PersonnelDetailsPage from './PersonnelDetailsPage';
import ItemsPage from './ItemsPage';
import ReviewSubmit from './ReviewSubmit';
import { userAPI } from '../api/api';
import { validateStep } from '../utils/stepValidation';
import { sessionManager } from '../utils/sessionManager';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

const getInitialFormData = () => ({
  name: '',
  tagline: '',
  about: '',
  form: {
    day: '',
    slot: '',
    duration: '',
    participant_type: 'Solo',
    team_min: 1,
    team_max: 1,
    preferred_halls: '',
    num_rounds: 1,
  },
  rounds: [
    { name: 'Round 1', description: '', rules: [''], num_participants: 50, has_tie_breaker: false }
  ],
  items: [],
  contacts: {
    secretaries: [
      { name: '', roll_number: '', mobile: '', department: '', year: '' },
      { name: '', roll_number: '', mobile: '', department: '', year: '' }
    ],
    secretary: { name: '', roll_number: '', mobile: '', department: '', year: '' },
    convenors: [
      { name: '', roll_number: '', mobile: '', department: '', year: '' },
      { name: '', roll_number: '', mobile: '', department: '', year: '' }
    ],
    volunteers: [
      { name: '', roll_number: '', mobile: '', department: '', year: '' },
      { name: '', roll_number: '', mobile: '', department: '', year: '' }
    ],
    faculty_advisor: { name: '', designation: '', department: '', mobile: '' },
    judge: { name: '', designation: '', mobile: '' }
  }
});

function CreateEventLayout() {
  const [currentStep, setCurrentStep] = useState(() => sessionManager.getDraft()?.currentStep || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState(() => sessionManager.getDraft()?.formData || getInitialFormData());

  const navigate = useNavigate();

  const [roundsInput, setRoundsInput] = useState(String(formData.rounds?.length || 1));

  // Persist the in-progress proposal so it survives navigating away and back.
  useEffect(() => {
    sessionManager.saveDraft({ formData, currentStep });
  }, [formData, currentStep]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    setRoundsInput(String(formData.rounds?.length || 1));
  }, [formData.rounds?.length]);

  const applyRoundsCount = (rawNum) => {
    const num = Math.max(1, parseInt(rawNum, 10) || 1);
    setRoundsInput(String(num));
    setFormData((prev) => {
      const currentRounds = [...(prev.rounds || [])];
      while (currentRounds.length < num) {
        currentRounds.push({
          name: `Round ${currentRounds.length + 1}`,
          description: '',
          rules: [''],
          num_participants: 50,
          has_tie_breaker: false,
          tie_breaker_name: '',
          tie_breaker_description: '',
          tie_breaker_rules: [''],
          tie_breaker_participants: ''
        });
      }
      const updatedRounds = currentRounds.slice(0, num);
      return {
        ...prev,
        form: { ...prev.form, num_rounds: num },
        rounds: updatedRounds,
      };
    });
  };

  const handleNext = () => {
    const { isValid, errors: stepErrors } = validateStep(currentStep, formData);
    if (!isValid) {
      setErrors(stepErrors);
      const firstError = Object.values(stepErrors)[0];
      alert(`⚠️ Please fill in all required fields before proceeding:\n• ${firstError}`);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleStepClick = (targetStep) => {
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    for (let s = currentStep; s < targetStep; s++) {
      const { isValid, errors: stepErrors } = validateStep(s, formData);
      if (!isValid) {
        setErrors(stepErrors);
        const firstError = Object.values(stepErrors)[0];
        alert(`⚠️ Please fill in required fields for Step ${s} before proceeding:\n• ${firstError}`);
        return;
      }
    }
    setErrors({});
    setCurrentStep(targetStep);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (dataToSubmit) => {
    setIsSubmitting(true);
    try {
      await userAPI.createEvent(dataToSubmit);
      sessionManager.clearDraft();
      alert('✅ Event Proposal Created Successfully!');
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      '⚠️ This will permanently clear everything you have entered for this event proposal. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    sessionManager.clearDraft();
    setFormData(getInitialFormData());
    setCurrentStep(1);
    setErrors({});
  };

  return (
    <UserLayout showSidebar={true}>
      <div className="relative z-10 min-h-full font-sans text-white space-y-4 max-w-4xl w-full mx-auto">
        <div className="relative z-10 w-full space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
          <StepProgress currentStep={currentStep} totalSteps={5} onStepClick={handleStepClick} />

          {/* STEP 1: Instructions */}
          {currentStep === 1 && <Instructions onNext={handleNext} />}

          {/* STEP 2: Basic Event & Round Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-slate-100">
                <h2 className="text-2xl font-bold text-white mb-4 font-heading">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      Event Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Tech Symposium 2026"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      Tagline <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Innovate, Create, Inspire."
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      About <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="e.g., A comprehensive technical event showcasing innovation and creativity in technology..."
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      Number of Rounds <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 3"
                      value={roundsInput}
                      onChange={(e) => setRoundsInput(e.target.value)}
                      onBlur={() => applyRoundsCount(roundsInput)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <RoundsPage formData={formData} setFormData={setFormData} errors={errors} />
            </div>
          )}

          {/* STEP 3: Personnel Details */}
          {currentStep === 3 && (
            <PersonnelDetailsPage formData={formData} setFormData={setFormData} errors={errors} />
          )}

          {/* STEP 4: Venue, Schedule & Items */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <NewDescriptionPage formData={formData} setFormData={setFormData} errors={errors} />
              <ItemsPage formData={formData} setFormData={setFormData} errors={errors} />
            </div>
          )}

          {/* STEP 5: Review & Final Submit */}
          {currentStep === 5 && (
            <ReviewSubmit formData={formData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}

          {/* Navigation Controls */}
          {currentStep > 1 && currentStep < 5 && (
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all transform hover:scale-[1.02]"
              >
                NEXT <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default CreateEventLayout;

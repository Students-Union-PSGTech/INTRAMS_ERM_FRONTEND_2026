import React from 'react';
import { Check } from 'lucide-react';

function StepProgress({ currentStep, totalSteps = 6, onStepClick }) {
  const steps = [
    { number: 1, label: 'Instructions' },
    { number: 2, label: 'Event & Rounds' },
    { number: 3, label: 'Personnel Details' },
    { number: 4, label: 'Venue' },
    { number: 5, label: 'Items' },
    { number: 6, label: 'Review & Submit' },
  ];

  const currentLabel = steps[currentStep - 1]?.label || '';

  return (
    <div className="w-full py-3 mb-6">
      {/* Mobile-only Progress Indicator (< 640px) */}
      <div className="sm:hidden bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-sky-400">
            STEP {currentStep} OF {totalSteps}
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            {currentLabel}
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 flex">
          <div
            className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center pt-1">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isClickable = onStepClick && (isCompleted || step.number < currentStep);

            return (
              <button
                key={step.number}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.number)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCompleted
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : isCurrent
                    ? 'bg-sky-500 text-white font-extrabold shadow-md shadow-sky-500/40'
                    : 'bg-slate-950 text-slate-600 border border-slate-900'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablet & Desktop Step Flow (≥ 640px) */}
      <div className="hidden sm:flex items-center justify-between max-w-4xl mx-auto px-2 sm:px-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = onStepClick && (isCompleted || step.number < currentStep);

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.number)}
                  aria-label={`Step ${step.number}: ${step.label}`}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shadow-lg ${
                    isCompleted
                      ? 'bg-black text-white cursor-pointer hover:bg-slate-800 border border-slate-700'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white ring-4 ring-sky-500/30 shadow-sky-500/40 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.number}
                </button>
                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-2 text-center max-w-[80px] sm:max-w-[110px] leading-tight transition-colors ${
                    isCurrent
                      ? 'text-sky-300 font-bold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-1 sm:mx-3 rounded-full transition-all duration-500 ${
                    currentStep > step.number ? 'bg-sky-500 shadow-sm shadow-sky-500/50' : 'bg-slate-800/80'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default StepProgress;

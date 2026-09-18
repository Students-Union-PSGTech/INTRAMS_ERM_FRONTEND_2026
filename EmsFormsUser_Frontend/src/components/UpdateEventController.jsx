import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UserLayout from './UserLayout';
import NewDescriptionPage from './NewDescriptionPage';
import RoundsPage from './RoundsPage';
import ItemsPage from './ItemsPage';
import ReviewSubmit from './ReviewSubmit';
import { userAPI } from '../api/api';
import { validateStep } from '../utils/stepValidation';
import { ArrowLeft, Loader2, Info, Calendar, Layers, Package, CheckCircle } from 'lucide-react';

// The event list (ViewEvents/HomePage) passes the full event aggregate as
// location.state, but the Edit Access list only passes a shallow-populated
// { event_name, event_id, status } object. Only trust state that actually
// looks like a complete event record; otherwise fetch it from the API.
const isCompleteEventState = (state) =>
  Boolean(state && typeof state === 'object' && state.form && state.contacts);

function UpdateEventController() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(isCompleteEventState(location.state) ? location.state : null);
  const [loading, setLoading] = useState(!isCompleteEventState(location.state));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isCompleteEventState(formData) && id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await userAPI.getEventById(id);
      const data = res.data?.data || res.data;
      if (data) {
        setFormData({
          name: data.name || data.event_name || '',
          tagline: data.tagline || '',
          about: data.about || data.description || '',
          form: data.form || {
            day: '',
            slot: '',
            duration: '',
            participant_type: 'Solo',
            team_min: 1,
            team_max: 1,
            preferred_halls: '',
          },
          rounds: data.rounds || [{ name: 'Round 1', description: '', rules: [''] }],
          items: data.items || [],
          contacts: data.contacts || {
            secretary: { name: '', roll_number: '', mobile: '' },
            convenors: [{ name: '', roll_number: '', mobile: '' }],
            faculty_advisor: { name: '', designation: '', department: '', mobile: '' }
          }
        });
      }
    } catch (err) {
      alert('Failed to load event data');
      navigate('/view-events');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedData) => {
    const data = updatedData || formData;
    const { isValid: basicValid, errors: basicErrors } = validateStep(2, data);
    const { isValid: personnelValid, errors: personnelErrors } = validateStep(3, data);
    const { isValid: descValid, errors: descErrors } = validateStep(4, data);

    if (!basicValid || !personnelValid || !descValid) {
      const allErrors = { ...basicErrors, ...personnelErrors, ...descErrors };
      setErrors(allErrors);
      const firstError = Object.values(allErrors)[0];
      alert(`⚠️ Please fix required fields before updating:\n• ${firstError}`);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await userAPI.updateEvent(id, updatedData || formData);
      alert('✅ Event Proposal Updated Successfully!');
      navigate('/view-events');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !formData) {
    return (
      <UserLayout showSidebar={true}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      </UserLayout>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'logistics', label: 'Venue & Logistics', icon: Calendar },
    { id: 'rounds', label: 'Rounds & Rules', icon: Layers },
    { id: 'items', label: 'Logistics Items', icon: Package },
    { id: 'review', label: 'Review & Submit', icon: CheckCircle },
  ];

  return (
    <UserLayout showSidebar={true}>
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel Edit
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Update Event Proposal</h1>
        </div>

        {/* Section Editing Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800 backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Basic Info */}
        {activeTab === 'basic' && (
          <div className="bg-zinc-900/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-zinc-400" /> Basic Event Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. CodeStorm"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white outline-none text-white"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Tagline *</label>
                <input
                  type="text"
                  placeholder="e.g. The Ultimate Coding Battle"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white outline-none text-white"
                />
                {errors.tagline && <p className="text-red-400 text-xs mt-1">{errors.tagline}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">
                  About Event <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows="4"
                  placeholder="Detailed description of the event concept and objectives..."
                  value={formData.about || ''}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white outline-none text-white"
                />
                {errors.about && <p className="text-red-400 text-xs mt-1">{errors.about}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">
                  Number of Rounds <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={formData.form?.num_rounds || formData.rounds?.length || 1}
                  onChange={(e) => {
                    const num = Math.max(1, parseInt(e.target.value) || 1);
                    setFormData((prev) => {
                      const currentRounds = [...(prev.rounds || [])];
                      while (currentRounds.length < num) {
                        currentRounds.push({
                          name: `Round ${currentRounds.length + 1}`,
                          description: '',
                          rules: [''],
                          num_participants: 50,
                          has_tie_breaker: false,
                        });
                      }
                      const updatedRounds = currentRounds.slice(0, num);
                      return {
                        ...prev,
                        form: { ...prev.form, num_rounds: num },
                        rounds: updatedRounds,
                      };
                    });
                  }}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white outline-none text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveTab('logistics')}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all"
              >
                Next: Venue & Logistics →
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Logistics & Venue */}
        {activeTab === 'logistics' && (
          <div>
            <NewDescriptionPage formData={formData} setFormData={setFormData} errors={errors} />
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveTab('basic')}
                className="px-6 py-2.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveTab('rounds')}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all"
              >
                Next: Rounds & Rules →
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Rounds & Rules */}
        {activeTab === 'rounds' && (
          <div>
            <RoundsPage formData={formData} setFormData={setFormData} errors={errors} />
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveTab('logistics')}
                className="px-6 py-2.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all"
              >
                Next: Logistics Items →
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Items */}
        {activeTab === 'items' && (
          <div>
            <ItemsPage formData={formData} setFormData={setFormData} />
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveTab('rounds')}
                className="px-6 py-2.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all"
              >
                Next: Review & Submit →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            <ReviewSubmit formData={formData} onSubmit={handleUpdate} isSubmitting={isSubmitting} isEdit={true} />
            <div className="mt-6 flex justify-start">
              <button
                onClick={() => setActiveTab('items')}
                className="px-6 py-2.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                ← Back to Items
              </button>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default UpdateEventController;

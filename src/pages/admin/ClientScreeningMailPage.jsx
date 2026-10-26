import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  RotateCcw,
  Inbox,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import { PUBLIC_CLIENT_SCREENING_PATH } from '../../components/forms/clientScreening/clientScreeningConstants';

const STAGES = [
  { key: 'pre', label: 'Pre-Establishment', desc: 'Starting or setting up the unit' },
  { key: 'post', label: 'Post-Establishment', desc: 'Unit is already running' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
};

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'question-' + Math.random().toString(36).substring(2, 6);

const ClientScreeningMailPage = () => {
  const [activeStage, setActiveStage] = useState('pre');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Shared configuration: { defaultEmail, preQuestions, postQuestions }
  const [config, setConfig] = useState({
    defaultEmail: '',
    preQuestions: [],
    postQuestions: [],
  });
  const [savedConfig, setSavedConfig] = useState({
    defaultEmail: '',
    preQuestions: [],
    postQuestions: [],
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client-screening/config');
      const loaded = res?.data?.config || (res?.data?.configs ? (res.data.configs.shared || res.data.configs['ap-idp']) : null) || {
        defaultEmail: '',
        preQuestions: [],
        postQuestions: [],
      };
      setConfig(JSON.parse(JSON.stringify(loaded)));
      setSavedConfig(JSON.parse(JSON.stringify(loaded)));
    } catch (err) {
      toast.error(errorToText(err, 'Failed to load configurations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const dirty = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  // Stage questions
  const questionsKey = activeStage === 'pre' ? 'preQuestions' : 'postQuestions';
  const questions = config[questionsKey] || [];

  const handleDefaultEmailChange = (val) => {
    setConfig((prev) => ({ ...prev, defaultEmail: val }));
  };

  const handleAddQuestion = () => {
    const newId = `custom-${Date.now().toString(36)}`;
    const newQuestion = {
      id: newId,
      label: 'New Question / Requirement',
      email: '',
      hasTextInput: false,
      order: questions.length,
    };
    setConfig((prev) => ({
      ...prev,
      [questionsKey]: [...(prev[questionsKey] || []), newQuestion],
    }));
    toast.success('New question added to list');
  };

  const handleUpdateQuestion = (index, field, value) => {
    setConfig((prev) => {
      const list = [...(prev[questionsKey] || [])];
      const target = { ...list[index], [field]: value };
      if (field === 'label' && (!target.id || target.id.startsWith('custom-'))) {
        target.id = slugify(value);
      }
      list[index] = target;
      return { ...prev, [questionsKey]: list };
    });
  };

  const handleDeleteQuestion = (index) => {
    const q = questions[index];
    if (!window.confirm(`Are you sure you want to remove question: "${q?.label || 'Untitled'}"?`)) {
      return;
    }
    setConfig((prev) => {
      const list = (prev[questionsKey] || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        [questionsKey]: list.map((item, idx) => ({ ...item, order: idx })),
      };
    });
    toast.success('Question removed');
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    setConfig((prev) => {
      const list = [...(prev[questionsKey] || [])];
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return {
        ...prev,
        [questionsKey]: list.map((item, idx) => ({ ...item, order: idx })),
      };
    });
  };

  const validate = () => {
    const def = (config.defaultEmail || '').trim();
    if (def && !EMAIL_RE.test(def)) {
      toast.error(`Invalid default email: "${def}"`);
      return false;
    }

    const checkList = (list, stageTitle) => {
      const ids = new Set();
      for (let i = 0; i < list.length; i++) {
        const q = list[i];
        const lbl = String(q.label || '').trim();
        if (!lbl) {
          toast.error(`Question #${i + 1} in ${stageTitle} cannot have an empty label.`);
          return false;
        }
        const id = String(q.id || '').trim();
        if (!id) {
          toast.error(`Question #${i + 1} ("${lbl}") requires a unique ID.`);
          return false;
        }
        if (ids.has(id)) {
          toast.error(`Duplicate Question ID "${id}" in ${stageTitle}. Please make IDs unique.`);
          return false;
        }
        ids.add(id);

        const emailText = String(q.email || '').trim();
        if (emailText) {
          if (!EMAIL_RE.test(emailText)) {
            toast.error(`Invalid email "${emailText}" in question: "${lbl}"`);
            return false;
          }
        }
      }
      return true;
    };

    if (!checkList(config.preQuestions || [], 'Pre-Establishment')) return false;
    if (!checkList(config.postQuestions || [], 'Post-Establishment')) return false;

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.put('/client-screening/config', config);
      const saved = res?.data?.config;
      if (saved) {
        setConfig(saved);
        setSavedConfig(JSON.parse(JSON.stringify(saved)));
      } else {
        await loadConfig();
      }
      toast.success('Pre & Post screening questions and email configurations saved!');
    } catch (err) {
      toast.error(errorToText(err, 'Failed to save configuration'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(JSON.parse(JSON.stringify(savedConfig)));
    toast.success('Reset to last saved configuration');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-purple-600" />
              Client Screening — Questions &amp; Email Configuration
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <Link
                to="/admin/client-screening/requests"
                className="inline-flex items-center gap-1.5 font-semibold text-purple-700 hover:underline"
              >
                <Inbox className="w-4 h-4" />
                View request status
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to={PUBLIC_CLIENT_SCREENING_PATH}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
                Open customer form ({PUBLIC_CLIENT_SCREENING_PATH})
              </Link>
            </div>
          </div>
        </div>

        {/* Default / Fallback Email Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Default / Fallback Email Address
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Notifications will fall back to this email if a customer selects questions with no specific recipient email configured.
              </p>
            </div>
            <div className="w-full md:w-96">
              <input
                type="email"
                value={config.defaultEmail || ''}
                onChange={(e) => handleDefaultEmailChange(e.target.value)}
                placeholder="e.g. screening-fallback@finvois.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Stage Selector Tabs (Pre / Post) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50/80 px-4 pt-3">
            <div className="flex space-x-2">
              {STAGES.map((st) => {
                const active = activeStage === st.key;
                const count = (st.key === 'pre' ? config.preQuestions : config.postQuestions)?.length || 0;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setActiveStage(st.key)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 text-sm font-medium transition ${
                      active
                        ? 'border-purple-600 text-purple-900 bg-white font-semibold shadow-xs'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        active ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {count} questions
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {activeStage === 'pre' ? 'Pre-Establishment Questions' : 'Post-Establishment Questions'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeStage === 'pre'
                    ? 'Questions shown to units starting up or seeking pre-establishment assistance.'
                    : 'Questions shown to units already operating and seeking expansion/post-establishment support.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading configuration…
              </div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm font-medium text-gray-600">No questions configured for this stage.</p>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:border-purple-200 transition-all shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Reorder & Number */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            title="Move Up"
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestion(idx, -1)}
                            className="p-1 rounded text-gray-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={idx === questions.length - 1}
                            onClick={() => handleMoveQuestion(idx, 1)}
                            className="p-1 rounded text-gray-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Question Label & Slug ID */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Question Label (shown to customer)
                          </label>
                          <input
                            type="text"
                            value={q.label || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'label', e.target.value)}
                            placeholder="e.g. Need Project Report (DPR) preparation"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium text-gray-900"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="shrink-0 font-mono text-gray-400">ID:</span>
                          <input
                            type="text"
                            value={q.id || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'id', e.target.value)}
                            placeholder="question-identifier-slug"
                            className="w-48 font-mono text-xs rounded border border-gray-200 px-2 py-0.5 text-gray-600 focus:border-purple-600 focus:outline-none"
                          />
                          <label className="inline-flex items-center gap-1.5 cursor-pointer ml-auto text-gray-700 select-none">
                            <input
                              type="checkbox"
                              checked={!!q.hasTextInput}
                              onChange={(e) => handleUpdateQuestion(idx, 'hasTextInput', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Require text detail from user</span>
                          </label>
                        </div>
                      </div>

                      {/* Right: Recipient Email (Single) & Delete */}
                      <div className="w-full lg:w-72 space-y-1 shrink-0">
                        <label className="block text-xs font-semibold text-gray-700">
                          Recipient Email
                        </label>
                        <input
                          type="email"
                          value={q.email || ''}
                          onChange={(e) => handleUpdateQuestion(idx, 'email', e.target.value.trim())}
                          placeholder="e.g. expert@finvois.com"
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                        />
                        <p className="text-[11px] text-gray-400">Single recipient email address for notifications.</p>
                      </div>

                      <div className="shrink-0 flex items-center lg:pt-5">
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          title="Remove question"
                          className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 shadow-xs transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Saving Changes…' : 'Save Questions & Emails'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClientScreeningMailPage;

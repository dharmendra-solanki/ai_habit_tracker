import { useState } from "react";
import { Sparkles, Check, RefreshCw } from "lucide-react";
import Modal from "./Modal.jsx";
import api from "../api/axios.js";

const normalizeFrequency = (frequency) => {
  const value = String(frequency || "Daily").toLowerCase();

  if (value === "daily") return "Daily";
  if (value === "weekly") return "Weekly";
  if (value === "monthly") return "Monthly";

  return "Daily";
};

export default function HabitSuggestionModal({ open, onClose, onAccept }) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState("");
  const [productiveTime, setProductiveTime] = useState("");
  const [struggles, setStruggles] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState({});

  const reset = () => {
    setStep(0);
    setGoals("");
    setProductiveTime("");
    setStruggles("");
    setSuggestions([]);
    setAdded({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setLoading(true);

    try {
      const res = await api.post("/ai/suggest-habits", {
        goals,
        productiveTime,
        struggles,
      });

      const normalizedSuggestions = (res.data.suggestions || []).map(
        (suggestion) => ({
          ...suggestion,
          frequency: normalizeFrequency(suggestion.frequency),
        })
      );

      setSuggestions(normalizedSuggestions);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (suggestion, index) => {
    await onAccept({
      ...suggestion,
      frequency: normalizeFrequency(suggestion.frequency),
    });

    setAdded((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="AI Habit Suggestions"
      maxWidth="max-w-xl"
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="text-sm text-soft">
            Answer 3 quick questions and I'll suggest 3 personalised habits.
          </div>

          <div>
            <label className="label">What are your goals right now?</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Get fitter, read more, reduce phone time..."
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={() => setStep(1)}
              disabled={!goals.trim()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="label">
              When are you most productive during the day?
            </label>

            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Early morning, late evenings..."
              value={productiveTime}
              onChange={(event) => setProductiveTime(event.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-between gap-2">
            <button className="btn-ghost" onClick={() => setStep(0)}>
              Back
            </button>

            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!productiveTime.trim()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="label">What habits have you struggled with?</label>

            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Gym in the morning, journaling at night..."
              value={struggles}
              onChange={(event) => setStruggles(event.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-between gap-2">
            <button className="btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>

            <button
              className="btn-primary"
              onClick={submit}
              disabled={loading || !struggles.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Get suggestions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {suggestions.length === 0 && (
            <div className="text-sm text-muted">
              No suggestions returned. Try again.
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <div key={`${suggestion.name}-${index}`} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xl">{suggestion.icon || "🎯"}</span>
                <div className="font-medium">{suggestion.name}</div>
                <span className="chip">{suggestion.category}</span>
                <span className="chip">{suggestion.frequency}</span>
              </div>

              <div className="text-sm text-soft">
                {suggestion.description}
              </div>

              {suggestion.reason && (
                <div className="text-xs text-brand-700 dark:text-brand-300 mt-2 bg-brand-500/10 rounded-lg px-2 py-1.5">
                  Why: {suggestion.reason}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                {added[index] ? (
                  <div className="text-sm text-emerald-500 flex items-center gap-1">
                    <Check size={14} />
                    Added
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => accept(suggestion, index)}
                  >
                    Add this habit
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button className="btn-secondary" onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

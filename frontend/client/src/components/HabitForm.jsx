import { useState } from "react";
import { CATEGORIES, COLORS, ICONS } from "../utils/constants.js";

export default function HabitForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    category: initial?.category || "Health",
    frequency: initial?.frequency || "Daily",
    targetDays: initial?.targetDays || 7,
    color: initial?.color || COLORS[0],
    icon: initial?.icon || ICONS[0],
  });

  const setField = (field) => (eventOrValue) => {
    setForm((prev) => ({
      ...prev,
      [field]: eventOrValue?.target ? eventOrValue.target.value : eventOrValue,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) return;

    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      targetDays: Number(form.targetDays),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Habit name</label>
        <input
          className="input"
          placeholder="e.g. Drink 2L of water"
          value={form.name}
          onChange={setField("name")}
          autoFocus
          required
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Why does this habit matter to you?"
          value={form.description}
          onChange={setField("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.category}
            onChange={setField("category")}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Frequency</label>
          <select
            className="input"
            value={form.frequency}
            onChange={setField("frequency")}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          Target days per week:{" "}
          <span className="font-semibold">{form.targetDays}</span>
        </label>

        <input
          type="range"
          min={1}
          max={7}
          value={form.targetDays}
          onChange={setField("targetDays")}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <label className="label">Icon</label>

        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              type="button"
              key={icon}
              onClick={() => setField("icon")(icon)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                form.icon === icon
                  ? "ring-2 ring-brand-500 bg-brand-500/15"
                  : "glass hover:bg-[var(--surface-hover)]"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Color</label>

        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              type="button"
              key={color}
              onClick={() => setField("color")(color)}
              className={`w-8 h-8 rounded-full transition ${
                form.color === color
                  ? "ring-4 ring-offset-2 ring-offset-[var(--bg-base)] ring-[var(--surface-ring)]"
                  : ""
              }`}
              style={{ background: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Create habit"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Exercise, Routine } from "@/lib/types";
import { getRoutine, saveRoutine, generateId } from "@/lib/store";

export default function RoutineEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [day, setDay] = useState("Monday");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isNew) {
      const routine = getRoutine(id);
      if (routine) {
        setName(routine.name);
        setDay(routine.day);
        setExercises(routine.exercises);
      }
    }
  }, [id, isNew]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: generateId(),
        name: "",
        order: exercises.length,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 0,
      },
    ]);
  };

  const updateExercise = (index: number, updates: Partial<Exercise>) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((e, i) => (e.order = i));
    setExercises(updated);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const routine: Routine = {
      id: isNew ? generateId() : id,
      name: name.trim(),
      day,
      exercises: exercises
        .filter((e) => e.name.trim())
        .map((e, i) => ({ ...e, order: i })),
      createdAt: isNew ? new Date().toISOString() : id,
    };
    saveRoutine(routine);
    router.push("/");
  };

  if (!mounted) return null;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <main className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-[var(--muted)] hover:text-white text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold">
          {isNew ? "New Routine" : "Edit Routine"}
        </h1>
        <div className="w-12" />
      </div>

      <div className="space-y-4">
        {/* Routine Name */}
        <div>
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider block mb-1.5">
            Routine Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Push Day"
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Day Select */}
        <div>
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider block mb-1.5">
            Day
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">
              Exercises
            </label>
          </div>

          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-[var(--muted)] font-mono w-5">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) =>
                      updateExercise(index, { name: e.target.value })
                    }
                    placeholder="Exercise name"
                    className="flex-1 bg-transparent border-b border-[var(--border)] pb-1 text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveExercise(index, -1)}
                      disabled={index === 0}
                      className="text-[var(--muted)] hover:text-white disabled:opacity-30 p-1 text-xs"
                    >
                      &#9650;
                    </button>
                    <button
                      onClick={() => moveExercise(index, 1)}
                      disabled={index === exercises.length - 1}
                      className="text-[var(--muted)] hover:text-white disabled:opacity-30 p-1 text-xs"
                    >
                      &#9660;
                    </button>
                    <button
                      onClick={() => removeExercise(index)}
                      className="text-[var(--muted)] hover:text-[var(--danger)] p-1 text-xs ml-1"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      value={exercise.targetSets}
                      onChange={(e) =>
                        updateExercise(index, {
                          targetSets: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                      Reps
                    </label>
                    <input
                      type="number"
                      value={exercise.targetReps}
                      onChange={(e) =>
                        updateExercise(index, {
                          targetReps: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                      Weight
                    </label>
                    <input
                      type="number"
                      value={exercise.targetWeight}
                      onChange={(e) =>
                        updateExercise(index, {
                          targetWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addExercise}
            className="w-full mt-3 border border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-3 text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm"
          >
            + Add Exercise
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors mt-6"
        >
          {isNew ? "Create Routine" : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

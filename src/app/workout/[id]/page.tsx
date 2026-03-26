"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ExerciseLog, SetLog, WorkoutLog } from "@/lib/types";
import {
  getRoutine,
  getWorkoutLogs,
  saveWorkoutLog,
  getLastWorkoutForExercise,
  generateId,
} from "@/lib/store";

// --- Rest Timer Component ---
function RestTimer({
  running,
  onDismiss,
}: {
  running: boolean;
  onDismiss: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setSeconds(0);
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  if (!running) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/50 px-6 py-4 flex items-center gap-4 min-w-[240px]">
      <div className="flex-1">
        <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">
          Rest Timer
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums">
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-xs text-[var(--muted)] hover:text-white border border-[var(--border)] hover:border-[var(--accent)] rounded-lg px-3 py-2 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

// --- Progress Indicator ---
function ProgressIndicator({
  current,
  previous,
}: {
  current: { totalReps: number; maxWeight: number };
  previous: { reps: number; weight: number } | null;
}) {
  if (!previous) return null;

  const weightDiff = current.maxWeight - previous.weight;
  const repsDiff = current.totalReps - previous.reps;

  if (weightDiff === 0 && repsDiff === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {weightDiff > 0 && (
        <span className="text-[10px] bg-green-500/20 text-[var(--success)] px-2 py-0.5 rounded-full">
          +{weightDiff} lbs weight
        </span>
      )}
      {weightDiff < 0 && (
        <span className="text-[10px] bg-red-500/20 text-[var(--danger)] px-2 py-0.5 rounded-full">
          {weightDiff} lbs weight
        </span>
      )}
      {repsDiff > 0 && (
        <span className="text-[10px] bg-green-500/20 text-[var(--success)] px-2 py-0.5 rounded-full">
          +{repsDiff} reps avg
        </span>
      )}
      {repsDiff < 0 && (
        <span className="text-[10px] bg-red-500/20 text-[var(--danger)] px-2 py-0.5 rounded-full">
          {repsDiff} reps avg
        </span>
      )}
    </div>
  );
}

// --- Main Workout Page ---
export default function WorkoutSession({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: routineId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const logId = searchParams.get("log");

  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setMounted(true);
    const routine = getRoutine(routineId);
    if (!routine) {
      router.push("/");
      return;
    }

    if (logId) {
      const logs = getWorkoutLogs();
      const existingLog = logs.find((l) => l.id === logId);
      if (existingLog) {
        setWorkout(existingLog);
        return;
      }
    }

    const exerciseLogs: ExerciseLog[] = routine.exercises
      .sort((a, b) => a.order - b.order)
      .map((exercise) => {
        const lastWorkout = getLastWorkoutForExercise(exercise.id);
        const weight = lastWorkout
          ? lastWorkout.weight
          : exercise.targetWeight;
        const reps = exercise.targetReps;

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: Array.from({ length: exercise.targetSets }, () => ({
            reps,
            weight,
            completed: false,
          })),
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetWeight: exercise.targetWeight,
        };
      });

    const newWorkout: WorkoutLog = {
      id: generateId(),
      routineId,
      routineName: routine.name,
      date: new Date().toISOString(),
      exercises: exerciseLogs,
      completed: false,
    };

    setWorkout(newWorkout);
    saveWorkoutLog(newWorkout);
  }, [routineId, logId, router]);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, updates: Partial<SetLog>) => {
      setWorkout((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.exercises = [...updated.exercises];
        updated.exercises[exerciseIndex] = {
          ...updated.exercises[exerciseIndex],
        };
        updated.exercises[exerciseIndex].sets = [
          ...updated.exercises[exerciseIndex].sets,
        ];
        updated.exercises[exerciseIndex].sets[setIndex] = {
          ...updated.exercises[exerciseIndex].sets[setIndex],
          ...updates,
        };
        saveWorkoutLog(updated);
        return updated;
      });
    },
    []
  );

  const toggleSetComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setWorkout((prev) => {
        if (!prev) return prev;
        const wasCompleted =
          prev.exercises[exerciseIndex].sets[setIndex].completed;
        const updated = { ...prev };
        updated.exercises = [...updated.exercises];
        updated.exercises[exerciseIndex] = {
          ...updated.exercises[exerciseIndex],
        };
        updated.exercises[exerciseIndex].sets = [
          ...updated.exercises[exerciseIndex].sets,
        ];
        updated.exercises[exerciseIndex].sets[setIndex] = {
          ...updated.exercises[exerciseIndex].sets[setIndex],
          completed: !wasCompleted,
        };
        saveWorkoutLog(updated);

        // Start timer when marking a set as completed
        if (!wasCompleted) {
          setTimerRunning(false);
          // Small delay so the state resets before starting again
          setTimeout(() => setTimerRunning(true), 50);
        }

        return updated;
      });
    },
    []
  );

  const addSet = useCallback((exerciseIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...updated.exercises];
      updated.exercises[exerciseIndex] = {
        ...updated.exercises[exerciseIndex],
      };
      const lastSet =
        updated.exercises[exerciseIndex].sets[
          updated.exercises[exerciseIndex].sets.length - 1
        ];
      updated.exercises[exerciseIndex].sets = [
        ...updated.exercises[exerciseIndex].sets,
        {
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          completed: false,
        },
      ];
      saveWorkoutLog(updated);
      return updated;
    });
  }, []);

  const removeSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setWorkout((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.exercises = [...updated.exercises];
        updated.exercises[exerciseIndex] = {
          ...updated.exercises[exerciseIndex],
        };
        updated.exercises[exerciseIndex].sets = updated.exercises[
          exerciseIndex
        ].sets.filter((_, i) => i !== setIndex);
        saveWorkoutLog(updated);
        return updated;
      });
    },
    []
  );

  const finishWorkout = () => {
    if (!workout) return;
    const updated = { ...workout, completed: true };
    saveWorkoutLog(updated);
    setWorkout(updated);
    setTimerRunning(false);
    router.push("/");
  };

  if (!mounted || !workout) return null;

  const totalSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.length,
    0
  );
  const completedSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0
  );
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <main className="pt-8 pb-28">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center mb-2">
        <Link
          href="/"
          className="text-[var(--muted)] hover:text-white text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold text-center truncate px-2">
          {workout.routineName}
        </h1>
        <div className="w-12" />
      </div>

      <div className="text-center text-sm text-[var(--muted)] mb-4">
        {new Date(workout.date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="grid grid-cols-2 text-xs text-[var(--muted)] mb-1">
          <span>Progress</span>
          <span className="text-right">
            {completedSets}/{totalSets} sets
          </span>
        </div>
        <div className="h-2 bg-[var(--card)] rounded-full overflow-hidden border border-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="grid grid-cols-1 gap-4">
        {workout.exercises.map((exercise, exerciseIndex) => {
          const completedExSets = exercise.sets.filter((s) => s.completed);
          const avgReps =
            completedExSets.length > 0
              ? Math.round(
                  completedExSets.reduce((sum, s) => sum + s.reps, 0) /
                    completedExSets.length
                )
              : 0;
          const maxWeight =
            completedExSets.length > 0
              ? Math.max(...completedExSets.map((s) => s.weight))
              : 0;

          const previousData = getLastWorkoutForExercise(
            exercise.exerciseId,
            workout.id
          );

          return (
            <div
              key={exercise.exerciseId}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
            >
              {/* Exercise header */}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2 mb-1">
                <h3 className="font-semibold truncate">
                  {exercise.exerciseName}
                </h3>
                <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                  {exercise.targetSets}x{exercise.targetReps} @{" "}
                  {exercise.targetWeight} lbs
                </span>
              </div>

              {previousData && (
                <div className="text-xs text-[var(--muted)] mb-2">
                  Last: {previousData.sets} sets, ~{previousData.reps} reps @{" "}
                  {previousData.weight} lbs
                </div>
              )}

              <ProgressIndicator
                current={{ totalReps: avgReps, maxWeight }}
                previous={previousData}
              />

              {/* Sets Header */}
              <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-2 mt-3 mb-1 text-[10px] text-[var(--muted)] uppercase tracking-wider">
                <span className="text-center">Set</span>
                <span className="text-center">Weight</span>
                <span className="text-center">Reps</span>
                <span />
              </div>

              {/* Sets */}
              <div className="grid grid-cols-1 gap-2">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-2 items-center ${
                      set.completed ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() =>
                        toggleSetComplete(exerciseIndex, setIndex)
                      }
                      className={`w-8 h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition-all mx-auto ${
                        set.completed
                          ? "bg-[var(--success)] border-[var(--success)] text-white scale-95"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {set.completed ? "\u2713" : setIndex + 1}
                    </button>

                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        updateSet(exerciseIndex, setIndex, {
                          weight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                    />

                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exerciseIndex, setIndex, {
                          reps: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                    />

                    <button
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      className="text-[var(--muted)] hover:text-[var(--danger)] text-xs transition-colors p-1 flex items-center justify-center"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(exerciseIndex)}
                className="w-full mt-2 text-xs text-[var(--muted)] hover:text-[var(--accent)] py-1.5 transition-colors"
              >
                + Add Set
              </button>
            </div>
          );
        })}
      </div>

      {/* Finish Button */}
      {!workout.completed && (
        <button
          onClick={finishWorkout}
          className="w-full mt-6 bg-[var(--success)] hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-opacity text-lg"
        >
          Finish Workout
        </button>
      )}

      {/* Completed Summary */}
      {workout.completed && (
        <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-[var(--success)] font-semibold text-lg mb-1">
            Workout Complete!
          </div>
          <div className="text-sm text-[var(--muted)]">
            {completedSets} sets completed
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {workout.exercises.map((exercise) => {
              const completedExSets = exercise.sets.filter(
                (s) => s.completed
              );
              if (completedExSets.length === 0) return null;

              const avgReps = Math.round(
                completedExSets.reduce((sum, s) => sum + s.reps, 0) /
                  completedExSets.length
              );
              const maxWeight = Math.max(
                ...completedExSets.map((s) => s.weight)
              );
              const previousData = getLastWorkoutForExercise(
                exercise.exerciseId,
                workout.id
              );

              const allTargetMet = completedExSets.every(
                (s) =>
                  s.reps >= exercise.targetReps &&
                  s.weight >= exercise.targetWeight
              );

              return (
                <div
                  key={exercise.exerciseId}
                  className="bg-[var(--card)] rounded-lg p-3 text-left"
                >
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {exercise.exerciseName}
                    </span>
                    {allTargetMet && (
                      <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent-hover)] px-2 py-0.5 rounded-full whitespace-nowrap">
                        Increase Weight!
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {completedExSets.length} sets &middot; ~{avgReps} reps
                    &middot; {maxWeight} lbs
                  </div>
                  <ProgressIndicator
                    current={{ totalReps: avgReps, maxWeight }}
                    previous={previousData}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest Timer - floating at bottom */}
      <RestTimer
        running={timerRunning}
        onDismiss={() => setTimerRunning(false)}
      />
    </main>
  );
}

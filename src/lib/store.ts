"use client";

import { Routine, WorkoutLog } from "./types";

const ROUTINES_KEY = "workout-tracker-routines";
const LOGS_KEY = "workout-tracker-logs";

export function getRoutines(): Routine[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRoutines(routines: Routine[]) {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export function getRoutine(id: string): Routine | undefined {
  return getRoutines().find((r) => r.id === id);
}

export function saveRoutine(routine: Routine) {
  const routines = getRoutines();
  const index = routines.findIndex((r) => r.id === routine.id);
  if (index >= 0) {
    routines[index] = routine;
  } else {
    routines.push(routine);
  }
  saveRoutines(routines);
}

export function deleteRoutine(id: string) {
  saveRoutines(getRoutines().filter((r) => r.id !== id));
}

export function getWorkoutLogs(): WorkoutLog[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWorkoutLogs(logs: WorkoutLog[]) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function saveWorkoutLog(log: WorkoutLog) {
  const logs = getWorkoutLogs();
  const index = logs.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    logs[index] = log;
  } else {
    logs.push(log);
  }
  saveWorkoutLogs(logs);
}

export function getLastWorkoutForExercise(
  exerciseId: string,
  currentLogId?: string
): { reps: number; weight: number; sets: number } | null {
  const logs = getWorkoutLogs()
    .filter((l) => l.completed && l.id !== currentLogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const log of logs) {
    const exerciseLog = log.exercises.find(
      (e) => e.exerciseId === exerciseId
    );
    if (exerciseLog) {
      const completedSets = exerciseLog.sets.filter((s) => s.completed);
      if (completedSets.length > 0) {
        const avgReps = Math.round(
          completedSets.reduce((sum, s) => sum + s.reps, 0) /
            completedSets.length
        );
        const maxWeight = Math.max(...completedSets.map((s) => s.weight));
        return { reps: avgReps, weight: maxWeight, sets: completedSets.length };
      }
    }
  }
  return null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

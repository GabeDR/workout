"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Routine, WorkoutLog } from "@/lib/types";
import { getRoutines, getWorkoutLogs, deleteRoutine } from "@/lib/store";

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRoutines(getRoutines());
    setRecentLogs(
      getWorkoutLogs()
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 5)
    );
  }, []);

  const handleDelete = (id: string) => {
    deleteRoutine(id);
    setRoutines(getRoutines());
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workout Tracker
          </h1>
          <p className="text-[var(--muted)] mt-1 text-sm">
            Track your progress. Get stronger.
          </p>
        </div>
      </div>

      {/* Quick Start */}
      {routines.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
            Start Workout
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {routines.map((routine) => (
              <Link
                key={routine.id}
                href={`/workout/${routine.id}`}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl p-4 transition-colors"
              >
                <div className="font-semibold">{routine.name}</div>
                <div className="text-sm opacity-80 mt-1">
                  {routine.day} &middot; {routine.exercises.length} exercises
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Routines */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider">
            My Routines
          </h2>
          <Link
            href="/routine/new"
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
          >
            + New Routine
          </Link>
        </div>

        {routines.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl p-8 text-center border border-[var(--border)]">
            <p className="text-[var(--muted)] mb-4">No routines yet</p>
            <Link
              href="/routine/new"
              className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Create Your First Routine
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const dayRoutines = routines.filter((r) => r.day === day);
              if (dayRoutines.length === 0) return null;
              return dayRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between group"
                >
                  <div>
                    <div className="font-medium">{routine.name}</div>
                    <div className="text-sm text-[var(--muted)]">
                      {routine.day} &middot; {routine.exercises.length}{" "}
                      exercises
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/routine/${routine.id}`}
                      className="text-xs text-[var(--muted)] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(routine.id)}
                      className="text-xs text-[var(--muted)] hover:text-[var(--danger)] px-3 py-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ));
            })}
          </div>
        )}
      </section>

      {/* Recent Workouts */}
      {recentLogs.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
            Recent Workouts
          </h2>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <Link
                key={log.id}
                href={`/workout/${log.routineId}?log=${log.id}`}
                className="block bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{log.routineName}</div>
                    <div className="text-sm text-[var(--muted)]">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  {log.completed && (
                    <span className="text-xs bg-green-500/20 text-[var(--success)] px-2 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export interface Exercise {
  id: string;
  name: string;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface Routine {
  id: string;
  name: string;
  day: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  exercises: ExerciseLog[];
  completed: boolean;
}

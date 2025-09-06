import { supabase } from "./supabase";

export type Workout = { id: string; name: string; sets: number; reps: number; created_at: string };

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id,name,sets,reps,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

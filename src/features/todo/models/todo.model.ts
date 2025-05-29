import { todo } from '@db/postgres/generated/postgres-client';

// Base type from Prisma schema
export type Todo = todo;

// Type for creating a new todo (omit auto-generated fields)
export type TodoCreateInput = {
  title: string;
  description?: string;
};

// Type for updating an existing todo (all fields optional)
export type TodoUpdateInput = {
  title?: string;
  description?: string;
  is_completed?: boolean;
};

// Type for todo responses (what's sent back to clients)
export type TodoResponse = {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: Date;
};

// Type for filtering todos in queries
export type TodoFilters = {
  is_completed?: boolean;
  title?: string;
};

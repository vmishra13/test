// Todo model types - placeholder since 'todo' table doesn't exist in schema
// When the todo table is added to the Prisma schema, uncomment the import below:
// import { todo } from '@db/postgres/generated/postgres-client';

// Placeholder Todo type that matches expected structure
export type Todo = {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: Date;
  updated_at?: Date;
  clientId: number;
  userId: number;
};

// Type for creating a new todo (omit auto-generated fields)
export type TodoCreateInput = {
  title: string;
  description?: string;
  clientId: number;
  userId: number;
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
  clientId: number;
  userId: number;
};

// Type for filtering todos in queries
export type TodoFilters = {
  is_completed?: boolean;
  title?: string;
  clientId?: number;
  userId?: number;
};

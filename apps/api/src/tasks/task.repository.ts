import { Task } from './task.entity.js';

export abstract class TaskRepository {
  abstract findById(id: string): Promise<Task | null>;
  abstract findByTitleAndOwner(
    title: string,
    ownerId: string,
  ): Promise<Task | null>;
  abstract create(task: Omit<Task, 'id'>): Promise<Task>;
  abstract delete(id: string): Promise<void>;
}

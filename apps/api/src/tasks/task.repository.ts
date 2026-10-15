import { Task } from './task.entity.js';

export abstract class TaskRepository {
  abstract findById(id: string): Promise<Task | null>;
  abstract findByTitleAndOwner(
    title: string,
    ownerId: string,
  ): Promise<Task | null>;
  abstract findAllByOwner(ownerId: string): Promise<Task[]>;
  abstract create(task: Omit<Task, 'id'>): Promise<Task>;
  abstract setDone(id: string, done: boolean): Promise<Task>;
  abstract delete(id: string): Promise<void>;
}

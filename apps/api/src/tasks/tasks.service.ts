import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Task } from './task.entity.js';
import { TaskRepository } from './task.repository.js';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(title: string, ownerId: string): Promise<Task> {
    const existing = await this.taskRepository.findByTitleAndOwner(
      title,
      ownerId,
    );
    if (existing) {
      throw new ConflictException(
        `Task with title "${title}" already exists for this owner`,
      );
    }

    return this.taskRepository.create({ title, ownerId, done: false });
  }

  async deleteTask(taskId: string, requesterId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task "${taskId}" not found`);
    }

    if (task.ownerId !== requesterId) {
      throw new ForbiddenException('Only the owner can delete this task');
    }

    await this.taskRepository.delete(taskId);
  }
}

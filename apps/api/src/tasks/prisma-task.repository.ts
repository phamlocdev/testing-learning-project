import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Task } from './task.entity.js';
import { TaskRepository } from './task.repository.js';

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  findByTitleAndOwner(title: string, ownerId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({ where: { title, ownerId } });
  }

  findAllByOwner(ownerId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { ownerId } });
  }

  create(task: Omit<Task, 'id'>): Promise<Task> {
    return this.prisma.task.create({ data: task });
  }

  setDone(id: string, done: boolean): Promise<Task> {
    return this.prisma.task.update({ where: { id }, data: { done } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }
}

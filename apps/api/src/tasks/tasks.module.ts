import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PrismaTaskRepository } from './prisma-task.repository.js';
import { TaskRepository } from './task.repository.js';
import { TasksController } from './tasks.controller.js';
import { TaskService } from './tasks.service.js';

@Module({
  controllers: [TasksController],
  providers: [
    TaskService,
    PrismaService,
    { provide: TaskRepository, useClass: PrismaTaskRepository },
  ],
})
export class TasksModule {}

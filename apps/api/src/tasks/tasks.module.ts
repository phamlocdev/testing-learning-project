import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PrismaTaskRepository } from './prisma-task.repository.js';
import { TaskRepository } from './task.repository.js';
import { TasksController } from './tasks.controller.js';
import { TaskService } from './tasks.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TasksController],
  providers: [
    TaskService,
    PrismaService,
    { provide: TaskRepository, useClass: PrismaTaskRepository },
  ],
})
export class TasksModule {}

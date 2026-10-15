import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type AuthUser, CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { SetTaskDoneDto } from './dto/set-task-done.dto.js';
import type { Task } from './task.entity.js';
import { TaskService } from './tasks.service.js';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  createTask(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.taskService.createTask(dto.title, user.id);
  }

  @Get()
  listTasks(@CurrentUser() user: AuthUser): Promise<Task[]> {
    return this.taskService.listTasks(user.id);
  }

  @Get(':id')
  getTask(@Param('id') id: string): Promise<Task> {
    return this.taskService.getTask(id);
  }

  @Patch(':id')
  setTaskDone(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetTaskDoneDto,
  ): Promise<Task> {
    return this.taskService.setTaskDone(id, user.id, dto.done);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.taskService.deleteTask(id, user.id);
  }
}

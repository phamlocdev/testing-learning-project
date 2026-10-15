import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { Task } from './task.entity.js';
import { TaskService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  createTask(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.taskService.createTask(dto.title, dto.ownerId);
  }

  @Get()
  listTasks(@Query('ownerId') ownerId: string): Promise<Task[]> {
    return this.taskService.listTasks(ownerId);
  }

  @Get(':id')
  getTask(@Param('id') id: string): Promise<Task> {
    return this.taskService.getTask(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(
    @Param('id') id: string,
    @Query('requesterId') requesterId: string,
  ): Promise<void> {
    return this.taskService.deleteTask(id, requesterId);
  }
}

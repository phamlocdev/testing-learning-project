import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from './tasks.service.js';
import { TaskRepository } from './task.repository.js';
import { Task } from './task.entity.js';

describe('TaskService', () => {
  let taskService: TaskService;
  let taskRepository: {
    [K in keyof TaskRepository]: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    taskRepository = {
      findById: vi.fn(),
      findByTitleAndOwner: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: taskRepository },
      ],
    }).compile();

    taskService = moduleRef.get(TaskService);
  });

  describe('createTask', () => {
    it('creates a task when no task with the same title exists for this owner', async () => {
      // Arrange
      taskRepository.findByTitleAndOwner.mockResolvedValue(null);
      const created: Task = {
        id: 't1',
        title: 'Write report',
        ownerId: 'user-A',
        done: false,
      };
      taskRepository.create.mockResolvedValue(created);

      // Act
      const result = await taskService.createTask('Write report', 'user-A');

      // Assert
      expect(result).toEqual(created);
    });

    it('throws Conflict when a task with the same title already exists for this owner', async () => {
      // Arrange
      const existing: Task = {
        id: 't1',
        title: 'Write report',
        ownerId: 'user-A',
        done: false,
      };
      taskRepository.findByTitleAndOwner.mockResolvedValue(existing);

      // Act
      const act = () => taskService.createTask('Write report', 'user-A');

      // Assert
      await expect(act).rejects.toThrow(ConflictException);
      expect(taskRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('deletes the task when the requester is the owner', async () => {
      // Arrange
      const task: Task = {
        id: 't1',
        title: 'Write report',
        ownerId: 'user-A',
        done: false,
      };
      taskRepository.findById.mockResolvedValue(task);

      // Act
      await taskService.deleteTask('t1', 'user-A');

      // Assert
      expect(taskRepository.delete).toHaveBeenCalledWith('t1');
    });

    it('throws Forbidden when the requester is not the owner', async () => {
      // Arrange
      const task: Task = {
        id: 't1',
        title: 'Write report',
        ownerId: 'user-A',
        done: false,
      };
      taskRepository.findById.mockResolvedValue(task);

      // Act
      const act = () => taskService.deleteTask('t1', 'user-B');

      // Assert
      await expect(act).rejects.toThrow(ForbiddenException);
      expect(taskRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFound when the task does not exist', async () => {
      // Arrange
      taskRepository.findById.mockResolvedValue(null);

      // Act
      const act = () => taskService.deleteTask('missing', 'user-A');

      // Assert
      await expect(act).rejects.toThrow(NotFoundException);
    });
  });
});

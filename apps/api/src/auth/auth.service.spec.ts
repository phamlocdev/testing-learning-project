import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UserRepository } from '../users/user.repository.js';
import { User } from '../users/user.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: {
    [K in keyof UserRepository]: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    userRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a user with a hashed password when the email is not taken', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockImplementation(
        async (user: Omit<User, 'id'>) => ({ id: 'u1', ...user }),
      );

      // Act
      const result = await authService.register('user@example.com', 'correct-password');

      // Assert
      expect(result).toEqual({ id: 'u1', email: 'user@example.com' });
      const [[createdUser]] = userRepository.create.mock.calls;
      expect(createdUser.passwordHash).not.toBe('correct-password');
      await expect(
        bcrypt.compare('correct-password', createdUser.passwordHash),
      ).resolves.toBe(true);
    });

    it('throws Conflict when the email is already registered', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash: 'hash',
      });

      // Act
      const act = () => authService.register('user@example.com', 'correct-password');

      // Assert
      await expect(act).rejects.toThrow(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns an access token when the credentials are correct', async () => {
      // Arrange
      const passwordHash = await bcrypt.hash('correct-password', 4);
      userRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash,
      });

      // Act
      const result = await authService.login('user@example.com', 'correct-password');

      // Assert
      expect(result.accessToken).toEqual(expect.any(String));
      const jwtService = new JwtService({ secret: 'test-secret' });
      const payload = await jwtService.verifyAsync(result.accessToken);
      expect(payload).toMatchObject({ sub: 'u1', email: 'user@example.com' });
    });

    it('throws Unauthorized when the email does not exist', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const act = () => authService.login('missing@example.com', 'whatever');

      // Assert
      await expect(act).rejects.toThrow(UnauthorizedException);
    });

    it('throws Unauthorized when the password is wrong', async () => {
      // Arrange
      const passwordHash = await bcrypt.hash('correct-password', 4);
      userRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash,
      });

      // Act
      const act = () => authService.login('user@example.com', 'wrong-password');

      // Assert
      await expect(act).rejects.toThrow(UnauthorizedException);
    });
  });
});

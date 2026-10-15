import { User } from './user.entity.js';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: Omit<User, 'id'>): Promise<User>;
}

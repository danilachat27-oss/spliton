import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findUserWithProfileAndRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      profile: user.profile,
      roles: user.userRoles.map((item) => item.role.code),
      createdAt: user.createdAt,
    };
  }
}

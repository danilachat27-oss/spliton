import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getStatus() {
    void this.usersRepository;
    return { module: "users", ready: false };
  }
}

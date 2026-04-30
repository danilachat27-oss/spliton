import { Injectable } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  getStatus() {
    void this.authRepository;
    return { module: "auth", ready: false };
  }
}

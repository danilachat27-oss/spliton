import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto";
import { AuthUser } from "./types/auth-user.type";

type SafeUserResponse = {
  id: string;
  email: string;
  status: UserStatus;
  profile: {
    displayName: string | null;
  } | null;
  roles: string[];
  createdAt: Date;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;
    try {
      user = await this.authRepository.createInvestorUser({
        email,
        passwordHash,
        displayName: dto.displayName,
        status: UserStatus.ACTIVE,
      });
    } catch {
      throw new InternalServerErrorException("Unable to create user");
    }

    const safeUser = this.toSafeUser(user);
    const tokens = await this.generateTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    // Avoid leaking whether email exists or password was wrong.
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    this.assertCanLogin(user.status);

    const safeUser = this.toSafeUser(user);
    const tokens = await this.generateTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new InternalServerErrorException("Refresh secret is not configured");
    }

    let payload: AuthUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    this.assertCanLogin(user.status);
    const safeUser = this.toSafeUser(user);
    const tokens = await this.generateTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  logout() {
    return { success: true };
  }

  private assertCanLogin(status: UserStatus) {
    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED || status === UserStatus.DELETED) {
      throw new ForbiddenException("User is not allowed to login");
    }
  }

  private async generateTokens(user: SafeUserResponse): Promise<AuthTokens> {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new InternalServerErrorException("Refresh secret is not configured");
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "15m" }),
      this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: "7d" }),
    ]);

    return { accessToken, refreshToken };
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    status: UserStatus;
    createdAt: Date;
    profile: { displayName: string | null } | null;
    userRoles: Array<{ role: { code: string } }>;
  }): SafeUserResponse {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile ? { displayName: user.profile.displayName } : null,
      roles: user.userRoles.map((row) => row.role.code),
    };
  }
}

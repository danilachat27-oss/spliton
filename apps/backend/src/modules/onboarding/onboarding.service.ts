import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { ONBOARDING_STEPS, type OnboardingStepId } from './onboarding.constants';

type StepOverride = { status?: 'completed' | 'skipped'; completedAt?: string };

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const [user, state, depositCount, positionCount, orderCount, twoFa] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        }),
        this.ensureState(userId),
        this.prisma.walletTransaction.count({
          where: {
            wallet: { userId },
            txType: 'DEPOSIT',
            status: 'COMPLETED',
          },
        }),
        this.prisma.userPosition.count({
          where: { userId, unitsTotal: { gt: 0 } },
        }),
        this.prisma.order.count({
          where: {
            userId,
            status: { in: ['FILLED', 'PARTIALLY_FILLED', 'SETTLED', 'PAID'] },
          },
        }),
        this.prisma.twoFactorMethod.count({
          where: { userId, status: 'ENABLED' },
        }),
      ]);

    if (!user) {
      throwAppError(ErrorCodes.AUTH_REQUIRED, 'User not found', HttpStatus.UNAUTHORIZED);
    }

    const overrides = this.parseOverrides(state.stepOverrides);
    const autoCompleted = new Set<OnboardingStepId>();

    if (user!.emailVerifiedAt) autoCompleted.add('verify_email');
    if (user!.profile?.displayName?.trim()) autoCompleted.add('complete_profile');
    if (depositCount > 0) autoCompleted.add('deposit_wallet');
    if (orderCount > 0 || positionCount > 0) autoCompleted.add('first_purchase');
    if (positionCount > 0) autoCompleted.add('view_portfolio');
    if (twoFa > 0) autoCompleted.add('enable_2fa');

    const steps = ONBOARDING_STEPS.map((def) => {
      const override = overrides[def.id];
      let status: 'pending' | 'completed' | 'skipped' = 'pending';
      let completedAt: string | null = null;
      let blockingReason: string | null = null;

      if (override?.status === 'skipped') {
        status = 'skipped';
        completedAt = override.completedAt ?? null;
      } else if (autoCompleted.has(def.id) || override?.status === 'completed') {
        status = 'completed';
        completedAt =
          override?.completedAt ??
          (def.id === 'verify_email' && user!.emailVerifiedAt
            ? user!.emailVerifiedAt.toISOString()
            : new Date().toISOString());
      } else if (def.id === 'deposit_wallet' && !user!.emailVerifiedAt) {
        blockingReason = 'Сначала подтвердите email';
      }

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        status,
        completedAt,
        actionUrl: def.actionUrl,
        priority: def.priority,
        required: def.required,
        blockingReason,
      };
    });

    const requiredSteps = steps.filter((s) => s.required);
    const requiredDone = requiredSteps.every(
      (s) => s.status === 'completed' || s.status === 'skipped',
    );
    const progressPct = Math.round(
      (steps.filter((s) => s.status === 'completed').length / steps.length) * 100,
    );

    return {
      dismissed: Boolean(state.dismissedAt),
      completed: Boolean(state.completedAt) || requiredDone,
      progressPct,
      steps,
    };
  }

  async completeStep(userId: string, stepId: OnboardingStepId) {
    if (!ONBOARDING_STEPS.some((s) => s.id === stepId)) {
      throwAppError(ErrorCodes.VALIDATION_ERROR, 'Unknown onboarding step', HttpStatus.BAD_REQUEST);
    }
    const state = await this.ensureState(userId);
    const overrides = this.parseOverrides(state.stepOverrides);
    overrides[stepId] = { status: 'completed', completedAt: new Date().toISOString() };
    await this.prisma.userOnboardingState.update({
      where: { userId },
      data: { stepOverrides: overrides as Prisma.InputJsonObject },
    });
    return this.getForUser(userId);
  }

  async skipStep(userId: string, stepId: OnboardingStepId) {
    const def = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!def || def.required) {
      throwAppError(ErrorCodes.VALIDATION_ERROR, 'Step cannot be skipped', HttpStatus.BAD_REQUEST);
    }
    const state = await this.ensureState(userId);
    const overrides = this.parseOverrides(state.stepOverrides);
    overrides[stepId] = { status: 'skipped', completedAt: new Date().toISOString() };
    await this.prisma.userOnboardingState.update({
      where: { userId },
      data: { stepOverrides: overrides as Prisma.InputJsonObject },
    });
    return this.getForUser(userId);
  }

  async dismiss(userId: string) {
    await this.prisma.userOnboardingState.upsert({
      where: { userId },
      create: { userId, dismissedAt: new Date() },
      update: { dismissedAt: new Date() },
    });
    return this.getForUser(userId);
  }

  async markComplete(userId: string) {
    const snapshot = await this.getForUser(userId);
    const requiredPending = snapshot.steps.filter(
      (s) => s.required && s.status === 'pending',
    );
    if (requiredPending.length > 0) {
      throwAppError(
        ErrorCodes.VALIDATION_ERROR,
        'Required onboarding steps incomplete',
        HttpStatus.BAD_REQUEST,
        { pending: requiredPending.map((s) => s.id) },
      );
    }
    await this.prisma.userOnboardingState.update({
      where: { userId },
      data: { completedAt: new Date() },
    });
    return this.getForUser(userId);
  }

  private async ensureState(userId: string) {
    return this.prisma.userOnboardingState.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private parseOverrides(raw: Prisma.JsonValue | null): Record<string, StepOverride> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as Record<string, StepOverride>;
  }
}

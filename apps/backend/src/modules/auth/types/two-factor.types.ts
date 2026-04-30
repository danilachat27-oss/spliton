export type TwoFactorVerifyMethod = 'totp' | 'backup_code';

export type TwoFactorVerifySetupResponse = {
  enabled: true;
  backupCodes: string[];
};

export type TwoFactorSetupResponse = {
  methodId: string;
  otpauthUrl: string;
};

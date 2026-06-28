import { LegalPolicyStatus, LegalPolicyType } from '@prisma/client';
import { planBootstrapActions } from './legal-bootstrap.util';
import type { BootstrapPolicyEntry } from './legal-bootstrap-content';

const entry = (
  type: LegalPolicyType,
  content: string,
  required = true,
): BootstrapPolicyEntry => ({
  type,
  version: '2026.06.1',
  title: type,
  content,
  required,
});

describe('planBootstrapActions', () => {
  const longContent = 'x'.repeat(600);

  it('dry-run proposes create when nothing exists', () => {
    const actions = planBootstrapActions(
      [entry(LegalPolicyType.TERMS_OF_SERVICE, longContent)],
      [],
      'dry-run',
    );
    expect(actions).toEqual([
      expect.objectContaining({ action: 'CREATE_DRAFT', type: LegalPolicyType.TERMS_OF_SERVICE }),
    ]);
  });

  it('skips when ACTIVE exists', () => {
    const actions = planBootstrapActions(
      [entry(LegalPolicyType.TERMS_OF_SERVICE, longContent)],
      [
        {
          type: LegalPolicyType.TERMS_OF_SERVICE,
          version: '2026.06.1',
          status: LegalPolicyStatus.ACTIVE,
          content: longContent,
        },
      ],
      'publish-approved',
    );
    expect(actions[0]).toEqual(
      expect.objectContaining({ action: 'SKIP_ACTIVE_EXISTS' }),
    );
  });

  it('blocks publish for placeholder content', () => {
    const actions = planBootstrapActions(
      [entry(LegalPolicyType.AML_POLICY, `${'TODO '.repeat(200)}`)],
      [],
      'publish-approved',
    );
    expect(actions.some((a) => a.action === 'BLOCKED_PUBLISH')).toBe(true);
    expect(actions.some((a) => a.action === 'PUBLISH')).toBe(false);
  });

  it('is idempotent for existing draft version', () => {
    const actions = planBootstrapActions(
      [entry(LegalPolicyType.FEE_POLICY, longContent)],
      [
        {
          type: LegalPolicyType.FEE_POLICY,
          version: '2026.06.1',
          status: LegalPolicyStatus.DRAFT,
          content: longContent,
        },
      ],
      'create-drafts',
    );
    expect(actions[0]).toEqual(
      expect.objectContaining({
        action: 'SKIP_VERSION_EXISTS',
        version: '2026.06.1',
        status: LegalPolicyStatus.DRAFT,
      }),
    );
  });
});

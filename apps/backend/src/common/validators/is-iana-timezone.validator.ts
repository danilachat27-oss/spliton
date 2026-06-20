import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isIanaTimezone', async: false })
export class IsIanaTimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 64) return false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: trimmed });
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'timezone must be a valid IANA time zone';
  }
}

export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIanaTimezoneConstraint,
    });
  };
}

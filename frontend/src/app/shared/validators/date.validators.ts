import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator: the control's value (a date/datetime string) must be strictly
 * in the future. Used to enforce "an event's date must be in the future"
 * both at creation and at update time, mirroring the backend rule.
 */
export const futureDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null; // let `required` handle empty values

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null; // let a format validator handle this

  return date.getTime() > Date.now() ? null : { pastDate: true };
};

/**
 * Form-level (group) validator ensuring `endDate` is strictly after
 * `startDate`. Sets the `dateRangeInvalid` error on the `endDate` control
 * so it can be displayed next to the relevant field.
 */
export const dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;

  if (!start || !end) return null;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return null;

  const endControl = group.get('endDate');
  if (endTime <= startTime) {
    endControl?.setErrors({ ...endControl.errors, dateRangeInvalid: true });
    return { dateRangeInvalid: true };
  }

  // Clear the error if it was previously set but is no longer relevant
  if (endControl?.hasError('dateRangeInvalid')) {
    const { dateRangeInvalid, ...rest } = endControl.errors || {};
    endControl.setErrors(Object.keys(rest).length ? rest : null);
  }

  return null;
};

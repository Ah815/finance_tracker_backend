class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

function required(fields, body) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) {
    throw new ValidationError(`Missing required field(s): ${missing.join(', ')}`);
  }
}

function isPositiveNumber(value, fieldName = 'value') {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return num;
}

function isValidDate(value, fieldName = 'date') {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError(`${fieldName} is not a valid date`);
  }
  return d;
}

function isOneOf(value, allowed, fieldName = 'value') {
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

module.exports = {
  ValidationError,
  required,
  isPositiveNumber,
  isValidDate,
  isOneOf,
  isValidEmail,
};

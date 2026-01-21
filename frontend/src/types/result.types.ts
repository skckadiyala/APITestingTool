/**
 * Result type for functional error handling
 * Eliminates the need for throw/catch in service layer
 */
export type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful Result
 */
export function Ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create an error Result
 */
export function Err<E = string>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Unwrap a Result, throwing if it's an error
 * Use sparingly - prefer pattern matching with isOk/isErr
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error(typeof result.error === 'string' ? result.error : 'Unwrap failed');
  }
  return result.data;
}

/**
 * Unwrap a Result or return a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue;
}

/**
 * Map a Result's success value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? Ok(fn(result.data)) : result;
}

/**
 * Map a Result's error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? Err(fn(result.error)) : result;
}

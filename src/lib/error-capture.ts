let lastError: unknown = null;

export function captureError(error: unknown) {
  lastError = error;
}

export function consumeLastCapturedError(): unknown {
  const err = lastError;
  lastError = null;
  return err;
}

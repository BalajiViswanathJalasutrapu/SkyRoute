export function createOkResponse(data) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  };
}

export function createErrorResponse(status, title) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ title }),
  };
}

export function createNetworkError(message = 'Network error') {
  return Promise.reject(new Error(message));
}

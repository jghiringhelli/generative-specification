export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: Record<string, string[]>,
  ) {
    super("API request failed");
  }
}

export class ProfileNotFoundError extends Error {
  public constructor(username: string) {
    super(`Profile ${username} was not found`);
    this.name = 'ProfileNotFoundError';
  }
}

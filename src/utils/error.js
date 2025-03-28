export class ErrorWithStatus extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }

  toJSON() {
    return {
      message: this.message,
      status: this.status,
    };
  }
}

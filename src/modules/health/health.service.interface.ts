export const HEALTH_SERVICE = Symbol('HEALTH_SERVICE');

export abstract class HealthServiceToken {
  abstract getStatus(): { status: 'ok'; timestamp: string };
}

export const ROOT_SERVICE = Symbol('ROOT_SERVICE');

export abstract class RootServiceToken {
  abstract getHello(): string;
}

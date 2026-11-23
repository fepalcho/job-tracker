import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { CurrentUser } from './current-user.decorator.js';

function getFactory() {
  class TestController {
    handler(@CurrentUser() _user: unknown) {}
  }
  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'handler',
  );
  return (Object.values(args)[0] as { factory: Function }).factory;
}

describe('CurrentUser', () => {
  it("renvoie l'utilisateur attaché à la requête", () => {
    const user = { uid: 'u1', email: 'a@b.c' };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as ExecutionContext;

    expect(getFactory()(undefined, context)).toBe(user);
  });
});

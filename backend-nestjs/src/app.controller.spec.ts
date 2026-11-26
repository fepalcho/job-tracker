import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('health renvoie le statut du back-end', () => {
    expect(new AppController().health()).toEqual({
      status: 'ok',
      backend: 'nestjs',
    });
  });
});

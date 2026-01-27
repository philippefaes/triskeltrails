import { TrailModel } from './trail-model';

describe('TrailModel', () => {
  let model: TrailModel;

  beforeEach(() => {
    model = new TrailModel();
  });

  it('should be created', () => {
    expect(model).toBeTruthy();
  });
});

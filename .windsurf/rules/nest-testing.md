---
trigger: manual
---

# 🧪 Testing Rules for NestJS (Unit & E2E)

## General
- Use **Jest** for testing.
- Follow **Arrange–Act–Assert (AAA)** for unit tests.
- Follow **Given–When–Then (GWT)** for e2e tests.
- Each test file tests **one class** (spec) or **one module** (e2e).
- Use clear variable names: `inputX`, `mockX`, `expectedX`, `actualX`.
- Avoid magic values; use constants or mock builders.
- Prefer one assertion per test.

---

## Unit Tests (`*.spec.ts`)
- Place beside the source file.
- Mock dependencies with `jest.fn()`, `jest.spyOn()`, or `TestingModule`.
- Test all **public methods**, both success and error paths.
- Keep test blocks under **10 lines**.
- Don’t test private methods directly.

**Example:**
```ts
describe('UserService', () => {
  let service: UserService;
  let mockRepo: Partial<UserRepository>;

  beforeEach(async () => {
    mockRepo = { findById: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();
    service = moduleRef.get(UserService);
  });

  it('should return user when ID exists', async () => {
    const inputId = '123';
    const expectedUser = { id: '123', name: 'John' };
    (mockRepo.findById as jest.Mock).mockResolvedValue(expectedUser);
    const actualUser = await service.getUserById(inputId);
    expect(actualUser).toEqual(expectedUser);
  });
});
```

## E2E Tests (*.e2e-spec.ts)
- Place under test/ or e2e/ folder.
- Use Test.createTestingModule() + Supertest.
- Test full request/response with real app instance.
- Always start/stop app with beforeAll / afterAll.

Example:
```ts
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => await app.close());

  it('should return user for GET /users/:id', async () => {
    const inputId = '123';
    const res = await request(app.getHttpServer()).get(`/users/${inputId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', inputId);
  });
});
```

## Controller Smoke Test
- Add an /admin/test or /test route per controller as a simple health check.
```ts
@Get('test')
getTest(): string {
  return 'OK';
}
```
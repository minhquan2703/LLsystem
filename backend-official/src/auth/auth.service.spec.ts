import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import * as util from '@/helpers/util';

jest.mock('@/helpers/util');

const makeUser = (overrides?: Partial<User>): User => ({
  id: 'user-id-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  phone: null,
  address: null,
  image: null,
  role: 'USER',
  accountType: 'LOCAL',
  learnLang: 'zh',
  transLang: 'vi',
  hskLevel: null,
  isActive: true,
  refreshToken: null,
  codeId: null,
  codeExpired: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            updateRefreshToken: jest.fn(),
            handleRegister: jest.fn(),
            handleActive: jest.fn(),
            retryActive: jest.fn(),
            retryPassword: jest.fn(),
            changePassword: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('returns null when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('no@email.com', 'pass');

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('no@email.com');
    });

    it('returns null when password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());
      (util.comparePasswordHelper as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });

    it('returns the user when credentials are valid', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      (util.comparePasswordHelper as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'correct');

      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('returns user info and both tokens, saves hashed refresh token', async () => {
      const user = makeUser();
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('some-secret');
      (util.hashPasswordHelper as jest.Mock).mockResolvedValue('hashed-rt');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(user);

      expect(result).toEqual({
        user: { email: user.email, _id: user.id, name: user.name, role: user.role },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(user.id, 'hashed-rt');
    });
  });

  describe('refreshTokens', () => {
    it('returns new tokens and updates stored refresh token', async () => {
      const user = makeUser();
      jwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');
      configService.get.mockReturnValue('some-secret');
      (util.hashPasswordHelper as jest.Mock).mockResolvedValue('hashed-new-rt');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens(user);

      expect(result).toEqual({ access_token: 'new-access', refresh_token: 'new-refresh' });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(user.id, 'hashed-new-rt');
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout('user-id-1');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-id-1', null);
    });
  });

  describe('delegation methods', () => {
    it('handleRegister delegates to usersService.handleRegister', async () => {
      const dto = { name: 'Test', email: 'test@example.com', password: 'pass' };
      usersService.handleRegister.mockResolvedValue({ id: 'new-id' });

      const result = await service.handleRegister(dto);

      expect(result).toEqual({ id: 'new-id' });
      expect(usersService.handleRegister).toHaveBeenCalledWith(dto);
    });

    it('checkCode delegates to usersService.handleActive', async () => {
      const dto = { _id: 'uid', code: 'abc' };
      usersService.handleActive.mockResolvedValue({ isBeforeCheck: true });

      const result = await service.checkCode(dto);

      expect(result).toEqual({ isBeforeCheck: true });
      expect(usersService.handleActive).toHaveBeenCalledWith(dto);
    });

    it('retryActive delegates to usersService.retryActive', async () => {
      usersService.retryActive.mockResolvedValue({ id: 'uid' });

      const result = await service.retryActive('test@example.com');

      expect(result).toEqual({ id: 'uid' });
      expect(usersService.retryActive).toHaveBeenCalledWith('test@example.com');
    });

    it('retryPassword delegates to usersService.retryPassword', async () => {
      usersService.retryPassword.mockResolvedValue({ id: 'uid', email: 'test@example.com' });

      const result = await service.retryPassword('test@example.com');

      expect(result).toEqual({ id: 'uid', email: 'test@example.com' });
    });

    it('changePassword delegates to usersService.changePassword', async () => {
      const dto = { code: 'abc', password: 'new', confirmPassword: 'new', email: 'test@example.com' };
      usersService.changePassword.mockResolvedValue({ isBeforeCheck: true });

      const result = await service.changePassword(dto);

      expect(result).toEqual({ isBeforeCheck: true });
    });

    it('getProfile delegates to usersService.findOne', async () => {
      const user = makeUser();
      usersService.findOne.mockResolvedValue(user);

      const result = await service.getProfile('user-id-1');

      expect(result).toEqual(user);
      expect(usersService.findOne).toHaveBeenCalledWith('user-id-1');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import dayjs from 'dayjs';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AppErrorCode } from '@/common/errors.enum';
import * as util from '@/helpers/util';

jest.mock('@/helpers/util');

// ---------- helpers ----------

const makeUser = (overrides?: Partial<User>): User => ({
  id: 'user-id-1',
  name: 'Test User',
  email: 'test@example.com',
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
  codeId: 'some-code',
  codeExpired: dayjs().add(5, 'minutes').toDate(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Tạo mock QueryBuilder chainable (mỗi method trả về `this` để chain được)
// — Query Builder là design pattern "Builder": mỗi method trả về chính object đó
//   để có thể viết `.where(...).skip(...).take(...)` liên tiếp.
const makeQB = (getOneResult: User | null = null, getManyAndCountResult: [User[], number] = [[], 0]) => ({
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(getOneResult),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(getManyAndCountResult),
});

// ---------- test suite ----------

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: any;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    usersRepo = {
      existsBy: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(makeQB()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('isEmailExist', () => {
    it('returns true when email is already taken', async () => {
      usersRepo.existsBy.mockResolvedValue(true);
      expect(await service.isEmailExist('taken@example.com')).toBe(true);
    });

    it('returns false when email is available', async () => {
      usersRepo.existsBy.mockResolvedValue(false);
      expect(await service.isEmailExist('free@example.com')).toBe(false);
    });
  });

  // ------------------------------------------------------------------ //
  describe('create', () => {
    it('hashes password, saves user, returns id', async () => {
      usersRepo.existsBy.mockResolvedValue(false);
      (util.hashPasswordHelper as jest.Mock).mockResolvedValue('hashed-pw');
      const created = makeUser({ id: 'new-id' });
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      const result = await service.create({
        name: 'Test', email: 'new@example.com', password: 'pass',
        phone: null, address: null, image: null, role: 'USER',
      });

      expect(result).toEqual({ id: 'new-id' });
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws EMAIL_EXISTS when email is already registered', async () => {
      usersRepo.existsBy.mockResolvedValue(true);

      await expect(
        service.create({ name: 'T', email: 'taken@example.com', password: 'p', phone: null, address: null, image: null, role: 'USER' }),
      ).rejects.toThrow(new BadRequestException(AppErrorCode.EMAIL_EXISTS));
    });
  });

  // ------------------------------------------------------------------ //
  describe('findOne', () => {
    it('returns the user by id', async () => {
      const user = makeUser();
      usersRepo.findOneBy.mockResolvedValue(user);

      const result = await service.findOne('user-id-1');

      expect(result).toEqual(user);
      expect(usersRepo.findOneBy).toHaveBeenCalledWith({ id: 'user-id-1' });
    });
  });

  // ------------------------------------------------------------------ //
  describe('findByEmail', () => {
    it('selects password field and queries by email', async () => {
      const user = makeUser({ password: 'exposed-hash' });
      const qb = makeQB(user);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      // addSelect('user.password') là điểm quan trọng — field này bị `select: false` trong entity
      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
      expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'test@example.com' });
    });
  });

  // ------------------------------------------------------------------ //
  describe('findAll', () => {
    it('returns paginated results without a WHERE clause when no search term', async () => {
      const users = [makeUser()];
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(null, [users, 1]));

      const result = await service.findAll('', 1, 10);

      expect(result.meta).toEqual({ current: 1, pageSize: 10, pages: 1, total: 1 });
      expect(result.results).toEqual(users);
    });

    it('adds WHERE ILIKE clause when search term is provided', async () => {
      const qb = makeQB(null, [[], 0]);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('john', 1, 10);

      expect(qb.where).toHaveBeenCalledWith(
        '(user.name ILIKE :searchPattern OR user.email ILIKE :searchPattern)',
        { searchPattern: '%john%' },
      );
    });

    it('defaults current to 1 and pageSize to 10 when not provided', async () => {
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(null, [[], 0]));

      const result = await service.findAll('', 0, 0);

      expect(result.meta.current).toBe(1);
      expect(result.meta.pageSize).toBe(10);
    });
  });

  // ------------------------------------------------------------------ //
  describe('remove', () => {
    it('deletes the user and returns the delete result', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      usersRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('user-id-1');

      expect(result).toEqual({ affected: 1 });
      expect(usersRepo.delete).toHaveBeenCalledWith('user-id-1');
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost-id')).rejects.toThrow(
        new BadRequestException(AppErrorCode.USER_NOT_FOUND),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('handleRegister', () => {
    it('creates an inactive user, sends activation email, returns id', async () => {
      usersRepo.existsBy.mockResolvedValue(false);
      (util.hashPasswordHelper as jest.Mock).mockResolvedValue('hashed-pw');
      const created = makeUser({ id: 'new-id', isActive: false });
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      const result = await service.handleRegister({
        name: 'New', email: 'new@example.com', password: 'pass123',
      });

      expect(result).toEqual({ id: 'new-id' });
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: created.email, template: 'register' }),
      );
    });

    it('throws EMAIL_EXISTS without saving or sending email', async () => {
      usersRepo.existsBy.mockResolvedValue(true);

      await expect(
        service.handleRegister({ name: 'T', email: 'taken@example.com', password: 'p' }),
      ).rejects.toThrow(new BadRequestException(AppErrorCode.EMAIL_EXISTS));

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  describe('handleActive', () => {
    it('sets isActive=true when code matches and is not expired', async () => {
      const user = makeUser({
        codeId: 'valid-code',
        codeExpired: dayjs().add(5, 'minutes').toDate(),
      });
      usersRepo.findOneBy.mockResolvedValue(user);

      const result = await service.handleActive({ _id: 'user-id-1', code: 'valid-code' });

      expect(result).toEqual({ isBeforeCheck: true });
      expect(usersRepo.update).toHaveBeenCalledWith(user.id, { isActive: true });
    });

    it('throws INVALID_CODE when user/code combination not found', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(service.handleActive({ _id: 'uid', code: 'wrong' })).rejects.toThrow(
        new BadRequestException(AppErrorCode.INVALID_CODE),
      );
    });

    it('throws INVALID_CODE when activation code is expired', async () => {
      const user = makeUser({ codeExpired: dayjs().subtract(1, 'hour').toDate() });
      usersRepo.findOneBy.mockResolvedValue(user);

      await expect(service.handleActive({ _id: 'user-id-1', code: 'some-code' })).rejects.toThrow(
        new BadRequestException(AppErrorCode.INVALID_CODE),
      );
      expect(usersRepo.update).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  describe('retryActive', () => {
    it('generates a new code, updates DB, re-sends activation email', async () => {
      const user = makeUser({ isActive: false });
      usersRepo.findOneBy.mockResolvedValue(user);

      const result = await service.retryActive('test@example.com');

      expect(result).toEqual({ id: user.id });
      expect(usersRepo.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ codeId: expect.any(String) }),
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email, template: 'register' }),
      );
    });

    it('throws USER_NOT_FOUND when email is not registered', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(service.retryActive('ghost@example.com')).rejects.toThrow(
        new BadRequestException(AppErrorCode.USER_NOT_FOUND),
      );
    });

    it('throws ACCOUNT_ALREADY_ACTIVE when account is already activated', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser({ isActive: true }));

      await expect(service.retryActive('test@example.com')).rejects.toThrow(
        new BadRequestException(AppErrorCode.ACCOUNT_ALREADY_ACTIVE),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('retryPassword', () => {
    it('generates a new code, updates DB, sends reset email', async () => {
      const user = makeUser();
      usersRepo.findOneBy.mockResolvedValue(user);

      const result = await service.retryPassword('test@example.com');

      expect(result).toEqual({ id: user.id, email: user.email });
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email, template: 'reset-password' }),
      );
    });

    it('throws USER_NOT_FOUND when email is not registered', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(service.retryPassword('ghost@example.com')).rejects.toThrow(
        new BadRequestException(AppErrorCode.USER_NOT_FOUND),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('updateRefreshToken', () => {
    it('persists the hashed token', async () => {
      await service.updateRefreshToken('user-id-1', 'hashed-rt');
      expect(usersRepo.update).toHaveBeenCalledWith('user-id-1', { refreshToken: 'hashed-rt' });
    });

    it('persists null on logout', async () => {
      await service.updateRefreshToken('user-id-1', null);
      expect(usersRepo.update).toHaveBeenCalledWith('user-id-1', { refreshToken: null });
    });
  });

  // ------------------------------------------------------------------ //
  describe('validateRefreshToken', () => {
    it('returns the user when token matches', async () => {
      const user = makeUser({ refreshToken: 'hashed-rt', isActive: true });
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(user));
      (util.comparePasswordHelper as jest.Mock).mockResolvedValue(true);

      const result = await service.validateRefreshToken('user-id-1', 'raw-rt');

      expect(result).toEqual(user);
    });

    it('throws INVALID_REFRESH_TOKEN when user is not found', async () => {
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(null));

      await expect(service.validateRefreshToken('uid', 'token')).rejects.toThrow(
        new UnauthorizedException(AppErrorCode.INVALID_REFRESH_TOKEN),
      );
    });

    it('throws INVALID_REFRESH_TOKEN when account is inactive', async () => {
      const user = makeUser({ isActive: false, refreshToken: 'hashed-rt' });
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(user));

      await expect(service.validateRefreshToken('uid', 'token')).rejects.toThrow(
        new UnauthorizedException(AppErrorCode.INVALID_REFRESH_TOKEN),
      );
    });

    it('throws INVALID_REFRESH_TOKEN when token does not match hash', async () => {
      const user = makeUser({ refreshToken: 'hashed-rt', isActive: true });
      usersRepo.createQueryBuilder.mockReturnValue(makeQB(user));
      (util.comparePasswordHelper as jest.Mock).mockResolvedValue(false);

      await expect(service.validateRefreshToken('uid', 'wrong-token')).rejects.toThrow(
        new UnauthorizedException(AppErrorCode.INVALID_REFRESH_TOKEN),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('changePassword', () => {
    const validDto = {
      email: 'test@example.com',
      code: 'some-code',
      password: 'NewPass123',
      confirmPassword: 'NewPass123',
    };

    it('hashes new password and saves it when all inputs are valid', async () => {
      const user = makeUser({ codeId: 'some-code', codeExpired: dayjs().add(5, 'minutes').toDate() });
      usersRepo.findOneBy.mockResolvedValue(user);
      (util.hashPasswordHelper as jest.Mock).mockResolvedValue('new-hashed-pw');

      const result = await service.changePassword(validDto);

      expect(result).toEqual({ isBeforeCheck: true });
      expect(usersRepo.update).toHaveBeenCalledWith(user.id, { password: 'new-hashed-pw' });
    });

    it('throws PASSWORD_MISMATCH when passwords do not match', async () => {
      await expect(
        service.changePassword({ ...validDto, confirmPassword: 'different' }),
      ).rejects.toThrow(new BadRequestException(AppErrorCode.PASSWORD_MISMATCH));

      expect(usersRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('throws USER_NOT_FOUND when email is not registered', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(service.changePassword(validDto)).rejects.toThrow(
        new BadRequestException(AppErrorCode.USER_NOT_FOUND),
      );
    });

    it('throws INVALID_CODE when reset code does not match', async () => {
      const user = makeUser({ codeId: 'different-code' });
      usersRepo.findOneBy.mockResolvedValue(user);

      await expect(service.changePassword(validDto)).rejects.toThrow(
        new BadRequestException(AppErrorCode.INVALID_CODE),
      );
    });

    it('throws CODE_EXPIRED when reset code has expired', async () => {
      const user = makeUser({
        codeId: 'some-code',
        codeExpired: dayjs().subtract(1, 'hour').toDate(),
      });
      usersRepo.findOneBy.mockResolvedValue(user);

      await expect(service.changePassword(validDto)).rejects.toThrow(
        new BadRequestException(AppErrorCode.CODE_EXPIRED),
      );
    });
  });
});

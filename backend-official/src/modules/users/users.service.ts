import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { User } from '@/modules/users/entities/user.entity';
import { hashPasswordHelper } from '@/helpers/util';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private readonly mailerService: MailerService,
  ) {}

  async isEmailExist(email: string) {
    return await this.usersRepo.existsBy({ email });
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    if (await this.isEmailExist(email)) {
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác.`);
    }

    const hashPassword = await hashPasswordHelper(password);
    const user = this.usersRepo.create({ name, email, password: hashPassword, phone, address, image });
    await this.usersRepo.save(user);
    return { id: user.id };
  }

  async findAll(query: string, current: number, pageSize: number) {
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const [results, total] = await this.usersRepo.findAndCount({
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return {
      meta: {
        current,
        pageSize,
        pages: Math.ceil(total / pageSize),
        total,
      },
      results,
    };
  }

  async findOne(id: string) {
    return await this.usersRepo.findOneBy({ id });
  }

  async findByEmail(email: string) {
    return await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(updateUserDto: UpdateUserDto) {
    const { id, ...rest } = updateUserDto;
    return await this.usersRepo.update(id, rest);
  }

  async remove(id: string) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');
    return await this.usersRepo.delete(id);
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    if (await this.isEmailExist(email)) {
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác.`);
    }

    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuidv4();
    const user = this.usersRepo.create({
      name, email, password: hashPassword,
      isActive: false,
      codeId,
      codeExpired: dayjs().add(5, 'minutes').toDate(),
    });
    await this.usersRepo.save(user);

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account at @hoidanit',
      template: 'register',
      context: { name: user.name ?? user.email, activationCode: codeId },
    });

    return { id: user.id };
  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.usersRepo.findOneBy({ id: data._id, codeId: data.code });
    if (!user) throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');

    if (!dayjs().isBefore(user.codeExpired)) {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }

    await this.usersRepo.update(user.id, { isActive: true });
    return { isBeforeCheck: true };
  }

  async retryActive(email: string) {
    const user = await this.usersRepo.findOneBy({ email });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');
    if (user.isActive) throw new BadRequestException('Tài khoản đã được kích hoạt');

    const codeId = uuidv4();
    await this.usersRepo.update(user.id, {
      codeId,
      codeExpired: dayjs().add(5, 'minutes').toDate(),
    });

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account at @hoidanit',
      template: 'register',
      context: { name: user.name ?? user.email, activationCode: codeId },
    });

    return { id: user.id };
  }

  async retryPassword(email: string) {
    const user = await this.usersRepo.findOneBy({ email });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    const codeId = uuidv4();
    await this.usersRepo.update(user.id, {
      codeId,
      codeExpired: dayjs().add(5, 'minutes').toDate(),
    });

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Change your password account at @hoidanit',
      template: 'register',
      context: { name: user.name ?? user.email, activationCode: codeId },
    });

    return { id: user.id, email: user.email };
  }

  async changePassword(data: ChangePasswordAuthDto) {
    if (data.confirmPassword !== data.password) {
      throw new BadRequestException('Mật khẩu/xác nhận mật khẩu không chính xác.');
    }

    const user = await this.usersRepo.findOneBy({ email: data.email });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');
    if (user.codeId !== data.code) {
      throw new BadRequestException('Mã code không hợp lệ');
    }
    if (!dayjs().isBefore(user.codeExpired)) {
      throw new BadRequestException('Mã code đã hết hạn');
    }


    const newPassword = await hashPasswordHelper(data.password);
    await this.usersRepo.update(user.id, { password: newPassword });
    return { isBeforeCheck: true };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { User } from '@/modules/users/entities/user.entity';
import { hashPasswordHelper } from '@/helpers/util';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { AppErrorCode } from '@/common/errors.enum';
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
            throw new BadRequestException(AppErrorCode.EMAIL_EXISTS);
        }

        const hashedPassword = await hashPasswordHelper(password);
        //admin tạo account: active ngay, không cần verify email
        const newUser = this.usersRepo.create({
            name, email, password: hashedPassword, phone, address, image,
            role: createUserDto.role ?? 'USER',
            isActive: true,
        });
        await this.usersRepo.save(newUser);
        return { id: newUser.id };
    }

    async findAll(search: string, current: number, pageSize: number) {
        if (!current) {
            current = 1;
        }
        if (!pageSize) {
            pageSize = 10;
        }

        const queryBuilder = this.usersRepo.createQueryBuilder('user');

        if (search) {
            queryBuilder.where(
                '(user.name ILIKE :searchPattern OR user.email ILIKE :searchPattern)',
                { searchPattern: `%${search}%` },
            );
        }

        const [results, total] = await queryBuilder
            .skip((current - 1) * pageSize)
            .take(pageSize)
            .orderBy('user.createdAt', 'DESC')
            .getManyAndCount();

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
        const { id, ...updateFields } = updateUserDto;
        return await this.usersRepo.update(id, updateFields);
    }

    async remove(id: string) {
        const user = await this.usersRepo.findOneBy({ id });
        if (!user) {
            throw new BadRequestException(AppErrorCode.USER_NOT_FOUND);
        }
        return await this.usersRepo.delete(id);
    }

    async handleRegister(registerDto: CreateAuthDto) {
        const { name, email, password } = registerDto;

        if (await this.isEmailExist(email)) {
            throw new BadRequestException(AppErrorCode.EMAIL_EXISTS);
        }

        const hashedPassword = await hashPasswordHelper(password);
        const activationCode = uuidv4();
        const newUser = this.usersRepo.create({
            name,
            email,
            password: hashedPassword,
            isActive: false,
            codeId: activationCode,
            codeExpired: dayjs().add(5, 'minutes').toDate(),
        });
        await this.usersRepo.save(newUser);

        this.mailerService.sendMail({
            to: newUser.email,
            subject: 'Activate your account at @hoidanit',
            template: 'register',
            context: { name: newUser.name ?? newUser.email, activationCode },
        });

        return { id: newUser.id };
    }

    async handleActive(data: CodeAuthDto) {
        const user = await this.usersRepo.findOneBy({ id: data._id, codeId: data.code });
        if (!user) {
            throw new BadRequestException(AppErrorCode.INVALID_CODE);
        }
        if (!dayjs().isBefore(user.codeExpired)) {
            throw new BadRequestException(AppErrorCode.INVALID_CODE);
        }

        await this.usersRepo.update(user.id, { isActive: true });
        return { isBeforeCheck: true };
    }

    async retryActive(email: string) {
        const user = await this.usersRepo.findOneBy({ email });
        if (!user) {
            throw new BadRequestException(AppErrorCode.USER_NOT_FOUND);
        }
        if (user.isActive) {
            throw new BadRequestException(AppErrorCode.ACCOUNT_ALREADY_ACTIVE);
        }

        const newActivationCode = uuidv4();
        await this.usersRepo.update(user.id, {
            codeId: newActivationCode,
            codeExpired: dayjs().add(5, 'minutes').toDate(),
        });

        this.mailerService.sendMail({
            to: user.email,
            subject: 'Activate your account at @hoidanit',
            template: 'register',
            context: { name: user.name ?? user.email, activationCode: newActivationCode },
        });

        return { id: user.id };
    }

    async retryPassword(email: string) {
        const user = await this.usersRepo.findOneBy({ email });
        if (!user) {
            throw new BadRequestException(AppErrorCode.USER_NOT_FOUND);
        }

        const newActivationCode = uuidv4();
        await this.usersRepo.update(user.id, {
            codeId: newActivationCode,
            codeExpired: dayjs().add(5, 'minutes').toDate(),
        });

        this.mailerService.sendMail({
            to: user.email,
            subject: 'Change your password account at @hoidanit',
            template: 'register',
            context: { name: user.name ?? user.email, activationCode: newActivationCode },
        });

        return { id: user.id, email: user.email };
    }

    async changePassword(data: ChangePasswordAuthDto) {
        if (data.confirmPassword !== data.password) {
            throw new BadRequestException(AppErrorCode.PASSWORD_MISMATCH);
        }

        const user = await this.usersRepo.findOneBy({ email: data.email });
        if (!user) {
            throw new BadRequestException(AppErrorCode.USER_NOT_FOUND);
        }
        if (user.codeId !== data.code) {
            throw new BadRequestException(AppErrorCode.INVALID_CODE);
        }
        if (!dayjs().isBefore(user.codeExpired)) {
            throw new BadRequestException(AppErrorCode.CODE_EXPIRED);
        }

        const newHashedPassword = await hashPasswordHelper(data.password);
        await this.usersRepo.update(user.id, { password: newHashedPassword });
        return { isBeforeCheck: true };
    }
}

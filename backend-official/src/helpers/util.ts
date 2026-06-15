import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPasswordHelper = async (plainPassword: string) => {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export const comparePasswordHelper = async (plainPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPasswordHelper = async (plainPassword: string) => {
    try {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    } catch (error) {
        console.log(error);
    }
}

export const comparePasswordHelper = async (plainPassword: string, hashedPassword: string) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        console.log(error);
    }
}

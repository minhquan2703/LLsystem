import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { AppModule } from '@/app.module';
import { Word } from '@/modules/words/entities/word.entity';

//format CC-CEDICT: Traditional Simplified [pin1 yin1] /def1/def2/
const LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/;
const BATCH_SIZE = 500;

function parseLine(line: string): Partial<Word> | null {
    const matches = line.match(LINE_RE);
    if (!matches) {
        return null;
    }
    const [, traditional, simplified, pinyin, defs] = matches;
    return {
        simplified,
        traditional: traditional !== simplified ? traditional : null,
        pinyin,
        //CC-CEDICT dùng / để ngăn cách nghĩa — chuyển thành " / " cho dễ đọc
        englishDef: defs.replace(/\//g, ' / '),
    };
}

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Cách dùng: npm run import:cedict -- <đường-dẫn-cedict.txt>');
        process.exit(1);
    }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        console.error(`Không tìm thấy file: ${absPath}`);
        process.exit(1);
    }

    //logger: false để tắt log khởi động NestJS
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const wordsRepo = app.get<Repository<Word>>(getRepositoryToken(Word));

    const existingCount = await wordsRepo.count();
    if (existingCount > 0) {
        console.log(`Cảnh báo: bảng words đã có ${existingCount} bản ghi. Script sẽ thêm vào, không xóa cũ.`);
        console.log('Nếu muốn import lại từ đầu, hãy truncate bảng words trước.\n');
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(absPath, { encoding: 'utf8' }),
        crlfDelay: Infinity,
    });

    let batch: Partial<Word>[] = [];
    let totalImported = 0;
    let totalSkipped = 0;

    for await (const line of rl) {
        //bỏ qua comment và dòng trống
        if (!line.trim() || line.startsWith('#')) {
            continue;
        }

        const parsedWord = parseLine(line);
        if (!parsedWord) {
            totalSkipped++;
            continue;
        }

        batch.push(parsedWord);

        if (batch.length >= BATCH_SIZE) {
            await wordsRepo.insert(batch as Word[]);
            totalImported += batch.length;
            batch = [];
            process.stdout.write(`\rĐã import: ${totalImported} từ...`);
        }
    }

    //flush batch còn lại
    if (batch.length) {
        await wordsRepo.insert(batch as Word[]);
        totalImported += batch.length;
    }

    console.log(`\n\nHoàn thành.`);
    console.log(`  Đã import : ${totalImported} từ`);
    console.log(`  Bỏ qua    : ${totalSkipped} dòng (không parse được)`);
    console.log(`\nBước tiếp theo: điền hanViet và vietnameseDef cho các từ vừa import.`);

    await app.close();
}

main().catch((err) => {
    console.error('\nLỗi khi import:', err.message);
    process.exit(1);
});

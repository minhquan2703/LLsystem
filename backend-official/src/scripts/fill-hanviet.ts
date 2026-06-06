import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan } from 'typeorm';
import { AppModule } from '@/app.module';
import { Word } from '@/modules/words/entities/word.entity';
import { getHanviet } from 'hanviet-pinyin-words';

const BATCH_SIZE = 500;

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const wordsRepo = app.get<Repository<Word>>(getRepositoryToken(Word));

    const totalNeedingUpdate = await wordsRepo.count({ where: { hanViet: IsNull(), pinyin: Not(IsNull()) } });
    console.log(`Cần điền hanViet: ${totalNeedingUpdate} từ\n`);

    let lastProcessedId = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    while (true) {
        //cursor-based: luôn lấy từ id > lastProcessedId, tránh pagination bug với WHERE thay đổi
        const words = await wordsRepo.find({
            where: { hanViet: IsNull(), pinyin: Not(IsNull()), id: MoreThan(lastProcessedId) },
            select: { id: true, simplified: true, traditional: true, pinyin: true },
            take: BATCH_SIZE,
            order: { id: 'ASC' },
        });

        if (!words.length) {
            break;
        }

        const idsToUpdate: number[] = [];
        const hanVietValues: string[] = [];

        for (const word of words) {
            //traditional mới có trong hanviet dataset, fallback về simplified nếu không có
            const textToConvert = word.traditional ?? word.simplified;
            const pinyinTokens = word.pinyin.trim().split(/\s+/);

            if (textToConvert.length !== pinyinTokens.length) {
                totalSkipped++;
                continue;
            }

            const hanVietResult = getHanviet(textToConvert, pinyinTokens);

            //'_' là ký tự trả về khi không map được — bỏ qua nếu có bất kỳ char nào không map được
            if (!hanVietResult || hanVietResult.includes('_')) {
                totalSkipped++;
                continue;
            }

            idsToUpdate.push(word.id);
            hanVietValues.push(hanVietResult);
        }

        if (idsToUpdate.length) {
            //bulk update bằng unnest — 1 query thay vì N queries
            await wordsRepo.query(
                `UPDATE words SET "hanViet" = v.hv
                 FROM (SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS hv) v
                 WHERE words.id = v.id`,
                [idsToUpdate, hanVietValues],
            );
            totalUpdated += idsToUpdate.length;
        }

        lastProcessedId = words[words.length - 1].id;
        process.stdout.write(
            `\rId hiện tại: ${lastProcessedId}/${totalNeedingUpdate} | Cập nhật: ${totalUpdated} | Bỏ qua: ${totalSkipped}...`,
        );
    }

    console.log(`\n\nHoàn thành.`);
    console.log(`  Đã cập nhật hanViet : ${totalUpdated}`);
    console.log(`  Bỏ qua (không map)  : ${totalSkipped}`);
    console.log(`\nBước tiếp theo: chạy fill-vietnamese-def để điền vietnameseDef từ CVDICT.`);

    await app.close();
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});

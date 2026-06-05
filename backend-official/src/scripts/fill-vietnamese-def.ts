import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan } from 'typeorm';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { AppModule } from '@/app.module';
import { Word } from '@/modules/words/entities/word.entity';

// format CVDICT giống CC-CEDICT: Traditional Simplified [pinyin] /def1/def2/
const LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/;
const BATCH_SIZE = 1000;

async function parseCvdict(filePath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim() || line.startsWith('#')) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;
    const [, , simplified, pinyin, defs] = m;
    // key giống hệt cách CC-CEDICT import lưu: simplified + pinyin
    const key = `${simplified}|${pinyin}`;
    // CVDICT dùng / để ngăn cách nghĩa — chuyển thành " / "
    map.set(key, defs.replace(/\//g, ' / '));
  }

  return map;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Cách dùng: npm run fill:viet -- <đường-dẫn-CVDICT.u8>');
    console.error('Tải CVDICT tại: https://github.com/ph0ngp/CVDICT');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Không tìm thấy file: ${absPath}`);
    process.exit(1);
  }

  console.log('Đang đọc CVDICT vào bộ nhớ...');
  const cvdict = await parseCvdict(absPath);
  console.log(`CVDICT: ${cvdict.size} entries đã load.\n`);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const wordsRepo = app.get<Repository<Word>>(getRepositoryToken(Word));

  const total = await wordsRepo.count({ where: { vietnameseDef: IsNull(), pinyin: Not(IsNull()) } });
  console.log(`Cần điền vietnameseDef: ${total} từ\n`);

  let lastId = 0;
  let totalUpdated = 0;
  let totalNotFound = 0;

  while (true) {
    const words = await wordsRepo.find({
      where: { vietnameseDef: IsNull(), pinyin: Not(IsNull()), id: MoreThan(lastId) },
      select: { id: true, simplified: true, pinyin: true },
      take: BATCH_SIZE,
      order: { id: 'ASC' },
    });

    if (!words.length) break;

    const ids: number[] = [];
    const defs: string[] = [];

    for (const word of words) {
      const key = `${word.simplified}|${word.pinyin}`;
      const vietDef = cvdict.get(key);
      if (!vietDef) { totalNotFound++; continue; }
      ids.push(word.id);
      defs.push(vietDef);
    }

    if (ids.length) {
      await wordsRepo.query(
        `UPDATE words SET "vietnameseDef" = v.def
         FROM (SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS def) v
         WHERE words.id = v.id`,
        [ids, defs],
      );
      totalUpdated += ids.length;
    }

    lastId = words[words.length - 1].id;
    process.stdout.write(
      `\rId hiện tại: ${lastId}/${total} | Cập nhật: ${totalUpdated} | Không có trong CVDICT: ${totalNotFound}...`,
    );
  }

  console.log(`\n\nHoàn thành.`);
  console.log(`  Đã cập nhật vietnameseDef : ${totalUpdated}`);
  console.log(`  Không có trong CVDICT     : ${totalNotFound}`);

  await app.close();
}

main().catch((err) => { console.error(err.message); process.exit(1); });

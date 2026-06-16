import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EnglishWord } from './entities/english-word.entity';
import { EnglishWordSense } from './entities/english-word-sense.entity';

@Injectable()
export class EnglishWordsService {
    constructor(
        @InjectRepository(EnglishWord)
        private englishWordRepo: Repository<EnglishWord>,
        @InjectRepository(EnglishWordSense)
        private englishWordSenseRepo: Repository<EnglishWordSense>,
    ) {}

    getTopics = async (): Promise<string[]> => {
        const senses = await this.englishWordSenseRepo
            .createQueryBuilder('sense')
            .select('sense.contextTags', 'contextTags')
            .getRawMany<{ contextTags: string[] }>();
        const topicSet = new Set<string>();
        for (const row of senses) {
            for (const tag of row.contextTags ?? []) {
                topicSet.add(tag);
            }
        }
        return Array.from(topicSet).sort();
    };

    getSensesByTopic = async (topic: string): Promise<EnglishWordSense[]> => {
        return this.englishWordSenseRepo
            .createQueryBuilder('sense')
            .leftJoinAndSelect('sense.word', 'word')
            .where(':topic = ANY(sense.contextTags)', { topic })
            .getMany();
    };

    getSensesByIds = async (ids: number[]): Promise<EnglishWordSense[]> => {
        if (ids.length === 0) return [];
        return this.englishWordSenseRepo.find({
            where: { id: In(ids) },
            relations: { word: true },
        });
    };

    addSynonymsToSense = async (senseId: number, newSynonyms: string[]): Promise<void> => {
        const sense = await this.englishWordSenseRepo.findOne({ where: { id: senseId } });
        if (!sense) return;
        const merged = [...new Set([...sense.synonyms, ...newSynonyms.map(s => s.toLowerCase().trim())])];
        await this.englishWordSenseRepo.update(senseId, { synonyms: merged });
    };
}

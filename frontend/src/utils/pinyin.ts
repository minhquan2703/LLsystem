import { convert } from 'pinyin-pro';

export function formatPinyin(raw: string | null | undefined): string {
    if (!raw) return '';
    try {
        return convert(raw, { format: 'num', separator: ' ' });
    } catch {
        return raw;
    }
}

export function getHskColor(level: number | null | undefined): string {
    const colors: Record<number, string> = {
        1: 'green',
        2: 'blue',
        3: 'cyan',
        4: 'purple',
        5: 'orange',
        6: 'red',
        7: 'volcano',
        8: 'volcano',
        9: 'volcano',
    };
    return level ? (colors[level] ?? 'default') : 'default';
}

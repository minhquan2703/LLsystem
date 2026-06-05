declare module 'hanviet-pinyin-words' {
  export function getHanviet(text: string, pinyinArr: string[]): string;
  export function getAllHanvietsOfChar(char: string): string[];
  export function isPrintableAscii(char: string): boolean;
  export const hanvietData: Record<string, unknown>;
}

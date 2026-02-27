export type QuestionType = 'choice' | 'judge' | 'card';

export interface Question {
  id: number;
  type: QuestionType;
  module: string;
  question: string;
  options?: string[]; // 仅选择题有
  answer: number | boolean | string; // 索引/布尔/文本
  analysis?: string;
}

export interface QuestionModule {
  id: string;
  name: string;
  count: number;
}

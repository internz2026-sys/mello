import { Injectable } from '@nestjs/common';
import type {
  CreateFutureLetterInput,
  FutureLetter,
  FutureSelf,
  ListFutureLettersQuery,
} from '../schemas';

@Injectable()
export class FutureSelfService {
  async listFutureSelves(_userId: string): Promise<FutureSelf[]> {
    return [];
  }

  async listLetters(
    _userId: string,
    _query: ListFutureLettersQuery,
  ): Promise<FutureLetter[]> {
    return [];
  }

  async createLetter(
    _userId: string,
    _input: CreateFutureLetterInput,
  ): Promise<FutureLetter | null> {
    return null;
  }
}

import {
  IRepository,
  TPaginationOptions,
  TPaginationResult,
  TSearchOptions,
} from '@ld3v/nqh-shared';
import { GoogleEvent } from './event.entity';

export type TSearchEventsOptions = TSearchOptions & {
  isTodayOnly?: boolean;
};
export type TCreateGoogleEvent = {
  id: string;
  recurringId?: string;
  summary: string;
  description: string;
  meetingLink?: string;
  eventLink?: string;
  startedAt: string; // ISO8601
  finishedAt: string; // ISO8601
  attendees: {
    email: string;
    status: 'needs_actions' | 'accepted' | 'declined';
  }[];
  isPrivate: boolean;
};

export const I_GOOGLE_EVENT_REPOSITORY = 'I-SP-GOOGLE-EVENT-REPOSITORY';
export interface IGoogleEventRepository extends IRepository<GoogleEvent> {
  getEvents(
    searchOptions: TSearchEventsOptions,
    pagination?: TPaginationOptions,
  ): Promise<TPaginationResult<GoogleEvent>>;
  createEvents(inputs: TCreateGoogleEvent[]): Promise<GoogleEvent[]>;
  createEventsIfNotExist(inputs: TCreateGoogleEvent[]): Promise<{
    created: GoogleEvent[];
    existed: GoogleEvent[];
  }>;
  getByEventIds(
    ids: string[],
  ): Promise<{ items: GoogleEvent[]; notExisted: string[] }>;
}

import { gRPC } from '@ld3v/nqh-shared';
import { GoogleEvent } from '../entities/google-event.entity';
import { TCreateGoogleEvent } from './google-event.interface';
import { HistoryEvent } from '../entities';

export const I_APP_SERVICE = 'I-APP-SERVICE';
export interface IAppService {
  createEventsIfNotExist(events: TCreateGoogleEvent[]): Promise<GoogleEvent[]>;
  getEventsToday(): Promise<GoogleEvent[]>;
  getLastEvent(): Promise<HistoryEvent>;
  getMembersExclude(): Promise<string[]>;
  triggerDS(request: {
    isIncludedHosted: boolean;
    isTestOnly: boolean;
  }): Promise<boolean>;
  transformProtoData(
    ...protoEvents: gRPC.GoogleEvent.CreateEventRequest[]
  ): TCreateGoogleEvent[];
  transformEvents(
    ...googleEvents: GoogleEvent[]
  ): gRPC.GoogleEvent.EventResponse[];
}

export const I_CRON_SERVICE = 'I-CRON-SERVICE';
export interface ICronService {
  dailyLogTaskReminder(): Promise<void>;
  dailyMeetingReminder(): Promise<void>;
}

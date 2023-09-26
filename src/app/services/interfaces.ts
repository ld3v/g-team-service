import { GoogleEventService } from '@ld3v/nqh-shared/dist/gRPC/generate';
import { GoogleEvent } from '../entities/google-event.entity';
import { TCreateGoogleEvent } from '../interfaces/google-event.interface';

export const I_APP_SERVICE = 'I-APP-SERVICE';
export interface IAppService {
  createEventsIfNotExist(events: TCreateGoogleEvent[]): Promise<GoogleEvent[]>;
  getEventsToday(): Promise<GoogleEvent[]>;
  transformProtoData(
    ...protoEvents: GoogleEventService.CreateEventRequest[]
  ): TCreateGoogleEvent[];
  transformEvents(
    ...googleEvents: GoogleEvent[]
  ): GoogleEventService.EventResponse[];
}

export const I_CRON_SERVICE = 'I-CRON-SERVICE';
export interface ICronService {
  dailyLogTaskReminder(): Promise<void>;
  dailyMeetingReminder(): Promise<void>;
}

import { Injectable, Inject } from '@nestjs/common';
import { IAppService } from './interfaces';
import {
  IGoogleEventRepository,
  I_GOOGLE_EVENT_REPOSITORY,
  TCreateGoogleEvent,
} from '../interfaces/google-event.interface';
import { GoogleEvent } from '../entities/google-event.entity';
import {
  GoogleEventService,
  GoogleEventType,
} from '@ld3v/nqh-shared/dist/gRPC/generate';

@Injectable()
export class AppService implements IAppService {
  constructor(
    @Inject(I_GOOGLE_EVENT_REPOSITORY)
    private readonly googleEventRepository: IGoogleEventRepository,
  ) {}

  public async createEventsIfNotExist(
    inputs: TCreateGoogleEvent[],
  ): Promise<GoogleEvent[]> {
    const { created } =
      await this.googleEventRepository.createEventsIfNotExist(inputs);

    return created;
  }

  public async getEventsToday(): Promise<GoogleEvent[]> {
    const { items } = await this.googleEventRepository.getEvents({
      isTodayOnly: true,
    });

    return items;
  }

  public transformProtoData(
    ...events: GoogleEventService.CreateEventRequest[]
  ): TCreateGoogleEvent[] {
    return events.map((e) => ({
      ...e,
      attendees: e.attendees.map((eA) => ({
        ...eA,
        status:
          eA.status === GoogleEventType.GoogleEventAttendee_Status.UNRECOGNIZED
            ? GoogleEventType.GoogleEventAttendee_Status.needs_actions
            : eA.status,
      })) as unknown as TCreateGoogleEvent['attendees'],
    }));
  }

  public transformEvents(
    ...events: GoogleEvent[]
  ): GoogleEventService.EventResponse[] {
    return events.map(
      ({
        id,
        eventId,
        eventRecurringId,
        eventLink,
        meetingLink,
        summary,
        description,
        startedAt,
        finishedAt,
        members,
      }) => ({
        id,
        eventId,
        eventRecurringId,
        eventLink,
        meetingLink,
        summary,
        description,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        members: JSON.parse(members) as string[],
        isPrivate: false,
      }),
    );
  }
}

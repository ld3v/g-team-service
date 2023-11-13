import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAppService,
  IGoogleEventRepository,
  IHistoryEventRepository,
  I_GOOGLE_EVENT_REPOSITORY,
  I_HISTORY_EVENT_REPOSITORY,
  TCreateGoogleEvent,
} from '../interfaces';
import { GoogleEvent, HistoryEvent } from '../entities';
import { gRPC } from '@ld3v/nqh-shared';
import { randomMember } from 'utils/random-member';
import { APM_MEMBERS } from 'utils/constants';
import { sendDailyMeetingNotify } from '../jobs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements IAppService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(I_GOOGLE_EVENT_REPOSITORY)
    private readonly googleEventRepository: IGoogleEventRepository,
    @Inject(I_HISTORY_EVENT_REPOSITORY)
    private readonly historyEventRepository: IHistoryEventRepository,
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

  public async getLastEvent(): Promise<HistoryEvent> {
    return this.historyEventRepository.getLast();
  }

  public async triggerDS({
    isIncludedHosted,
    isTestOnly,
  }: {
    isIncludedHosted: boolean;
    isTestOnly: boolean;
  }) {
    try {
      Logger.log('Trigger DS manually!');
      const membersHostedBefore = await this.getMembersExclude();
      const memberHosted = randomMember(
        APM_MEMBERS,
        undefined,
        isIncludedHosted ? [] : membersHostedBefore,
      );
      const noteMsg =
        'This event was triggered manually. ' +
        ` Hosts will be randomly selected based on the ${
          isIncludedHosted
            ? 'members who have not hosted this event before'
            : 'list of the members'
        }!<br/>` +
        'This meeting host will <b>not be added</b> to <b>the excluded list in the next few days</b>!';

      const membersQuery = Object.keys(APM_MEMBERS)
        .map((mem) => (mem === memberHosted.alias ? `_${mem}` : mem))
        .join('@');
      const membersEncoded = encodeURIComponent(membersQuery);

      const hook = isTestOnly
        ? this.configService.get<string>('GG_CHAT_WEBHOOK_DEV')
        : this.configService.get<string>('GG_CHAT_WEBHOOK');
      const res = await sendDailyMeetingNotify(hook, memberHosted, null, {
        noteMessage: noteMsg,
        newHostedLink: `https://team.nqhuy.dev/p/tools/random/${membersEncoded}`,
      });
      if (!res) {
        Logger.error('Look like something went wrong!');
        return false;
      }
      Logger.log(
        `Sent to ${res.name}`,
        '\n',
        '----------------------------------------------',
      );
      return true;
    } catch (error) {
      console.error(error);
      Logger.error(
        'Something went wrong when run job dailyMeetingReminder: ' +
          error.message,
      );
      return false;
    }
  }

  public async getMembersExclude(): Promise<string[]> {
    const lastHistoryEvent = await this.historyEventRepository.getLast();
    if (!lastHistoryEvent) return [];
    const data = JSON.parse(lastHistoryEvent.memberExclude);

    return Array.isArray(data) ? data : [];
  }

  public transformProtoData(
    ...events: gRPC.GoogleEvent.CreateEventRequest[]
  ): TCreateGoogleEvent[] {
    return events.map((e) => ({
      ...e,
      attendees: (e.attendees || []).map((eA) => ({
        ...eA,
        status:
          eA.status === gRPC.GoogleEvent.GoogleEventAttendee_Status.UNRECOGNIZED
            ? gRPC.GoogleEvent.GoogleEventAttendee_Status.needs_actions
            : eA.status,
      })) as unknown as TCreateGoogleEvent['attendees'],
    }));
  }

  public transformEvents(
    ...events: GoogleEvent[]
  ): gRPC.GoogleEvent.EventResponse[] {
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

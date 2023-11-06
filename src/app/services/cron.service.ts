import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sendDailyLogworkNotify, sendDailyMeetingNotify } from '../jobs';
import { ConfigService } from '@nestjs/config';
import { randomMember } from 'utils/random-member';
import { APM_MEMBERS, DS_NAME_START_WITH } from 'utils/constants';
import * as moment from 'moment';
import {
  IAppService,
  IHistoryEventRepository,
  I_APP_SERVICE,
  I_HISTORY_EVENT_REPOSITORY,
} from '../interfaces';
import { GoogleEvent, HistoryEvent } from '../entities';

@Injectable()
export class CronService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(I_APP_SERVICE)
    private readonly appService: IAppService,
    @Inject(I_HISTORY_EVENT_REPOSITORY)
    private readonly historyEventRepository: IHistoryEventRepository,
  ) {}

  @Cron('30 8 * * 1-5', {
    name: 'daily_meeting_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async dailyMeetingReminder() {
    try {
      const events = await this.appService.getEventsToday();
      const dsEvent = events.find((ev) =>
        ev.summary.toLowerCase().startsWith(DS_NAME_START_WITH),
      );
      if (!dsEvent) {
        Logger.log('Today have no DS meetings');
        return;
      }
      Logger.log(
        'Found an DS meeting will be started at ' +
          moment(dsEvent.startedAt).format('DD/MM/YYYY HH:mm:ss'),
      );
      // From event
      const memberEmails = JSON.parse(dsEvent.members) as string[];
      const membersJoin = Array.isArray(memberEmails)
        ? memberEmails.map((m) => m.replace('.tpv@one-line.com', ''))
        : undefined;
      // Filter from cache
      const membersHostedBefore = await this.appService.getMembersExclude();
      Logger.log(
        'Member hosted before: ' + JSON.stringify(membersHostedBefore),
      );
      let noteMsg = '';
      let membersExclude = [];
      let memberHosted = randomMember(
        APM_MEMBERS,
        membersJoin,
        membersHostedBefore,
      );
      if (membersJoin.length === 0) {
        // No one join meeting (dsEvent.attendees = [])
        Logger.log('No one join this meeting! Random based on all member');
        noteMsg =
          'It looks like <b>no one joined</b> this meeting (<i>NO ATTENDEES</i>). Random based on all the members!<br/>This meeting host will <b>not be added</b> to <b>the exclude list in the next few days</b>!';
        memberHosted = randomMember(APM_MEMBERS);
        membersExclude = [...membersHostedBefore];
      } else if (memberHosted.id === '-1') {
        // The exclude list is full -> Reset to empty.
        memberHosted = randomMember(APM_MEMBERS, membersJoin);
        membersExclude = [memberHosted.alias];
      } else {
        Logger.log(`Added "${memberHosted.alias}" to hosted list!`);
        membersExclude = [...membersHostedBefore, memberHosted.alias];
      }
      console.log(memberHosted, membersExclude);
      await this.addHistoryEvent(dsEvent, memberHosted.alias, membersExclude);

      const membersQuery = Object.keys(APM_MEMBERS)
        .map((mem) => (mem === memberHosted.alias ? `_${mem}` : mem))
        .join('@');
      const membersEncoded = encodeURIComponent(membersQuery);

      const hook = this.configService.get<string>('GG_CHAT_WEBHOOK');
      const res = await sendDailyMeetingNotify(
        hook,
        memberHosted,
        new Date(dsEvent.startedAt),
        {
          meetingLink: dsEvent.meetingLink,
          eventLink: dsEvent.eventLink,
          newHostedLink: `https://team.nqhuy.dev/p/tools/random/${membersEncoded}`,
          noteMessage: noteMsg,
        },
      );
      if (!res) {
        Logger.error('Look like something went wrong!');
        return;
      }
      Logger.log(
        `Sent to ${res.name}`,
        '\n',
        '----------------------------------------------',
      );
    } catch (error) {
      console.error(error);
      Logger.error(
        'Something went wrong when run job dailyMeetingReminder: ' +
          error.message,
      );
    }
  }

  @Cron('0 17 * * 1-5', {
    name: 'daily_logwork_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async dailyLogTaskReminder() {
    try {
      const hook = this.configService.get<string>('GG_CHAT_WEBHOOK');
      await sendDailyLogworkNotify(hook);
    } catch (error) {
      Logger.error(
        'Something went wrong when run job dailyLogTaskReminder: ' +
          error.message,
      );
    }
  }

  async addHistoryEvent(
    event: GoogleEvent,
    host: string,
    excludes: string[],
  ): Promise<HistoryEvent> {
    return this.historyEventRepository.create({
      event,
      memberHosted: host,
      memberExclude: JSON.stringify(excludes),
    });
  }
}

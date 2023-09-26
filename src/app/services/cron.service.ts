import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sendDailyLogworkNotify, sendDailyMeetingNotify } from '../jobs';
import { ConfigService } from '@nestjs/config';
import { randomMember } from 'utils/random-member';
import {
  APM_MEMBERS,
  CACHE_HOSTED_HISTORY,
  CACHE_HOSTED_TTL,
  DS_NAME_START_WITH,
} from 'utils/constants';
import * as moment from 'moment';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IAppService, I_APP_SERVICE } from './interfaces';

@Injectable()
export class CronService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(I_APP_SERVICE)
    private readonly appService: IAppService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
  ) {}

  @Cron('30 8 * * 1-5', {
    name: 'daily_meeting_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async dailyMeetingReminder() {
    try {
      //
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
      const members = await this.getCacheHosted();
      Logger.log('Member hosted before: ' + JSON.stringify(members));
      let memberHosted = randomMember(APM_MEMBERS, membersJoin, members);
      if (memberHosted.id === '-1') {
        Logger.log('Reset list member to empty');
        memberHosted = randomMember(APM_MEMBERS, membersJoin);
        await this.addCacheHosted(memberHosted.alias, true);
      } else {
        Logger.log(`Added "${memberHosted.alias}" to hosted list!`);
        await this.addCacheHosted(memberHosted.alias);
      }

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
        },
      );
      Logger.log(res, '\n', '----------------------------------------------');
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

  private async getCacheHosted(): Promise<string[]> {
    const membersCached = await this.cacheService.get(CACHE_HOSTED_HISTORY);
    const members = membersCached
      ? JSON.parse(membersCached as string)
      : undefined;
    if (!membersCached || !Array.isArray(members)) {
      await this.cacheService.set(CACHE_HOSTED_HISTORY, '[]', CACHE_HOSTED_TTL);
      return [];
    }
    return members;
  }

  private async addCacheHosted(
    alias: string,
    isNew = false,
  ): Promise<string[]> {
    const membersCached = await this.cacheService.get(CACHE_HOSTED_HISTORY);
    const members = membersCached
      ? JSON.parse(membersCached as string)
      : undefined;
    if (!membersCached || !Array.isArray(members)) {
      await this.cacheService.set(
        CACHE_HOSTED_HISTORY,
        `[${alias}]`,
        CACHE_HOSTED_TTL,
      );
      return [];
    }
    const newHostedList = isNew
      ? [alias]
      : Array.from([...new Set([...members, alias])]);
    await this.cacheService.set(
      CACHE_HOSTED_HISTORY,
      JSON.stringify(newHostedList),
      CACHE_HOSTED_TTL,
    );
    return newHostedList;
  }
}

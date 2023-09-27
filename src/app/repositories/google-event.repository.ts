// Libs importing
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  AbstractRepository,
  TPaginationOptions,
  TPaginationResult,
  queryByKeywordAndPagination,
  common,
} from '@ld3v/nqh-shared';
import * as moment from 'moment';
import {
  IGoogleEventRepository,
  TCreateGoogleEvent,
  TSearchEventsOptions,
} from '../interfaces';
import { GoogleEvent } from '../entities';

@Injectable()
export class GoogleEventRepository
  extends AbstractRepository<GoogleEvent>
  implements IGoogleEventRepository
{
  __query: SelectQueryBuilder<GoogleEvent>;
  constructor(
    @InjectRepository(GoogleEvent) _repository: Repository<GoogleEvent>,
  ) {
    super(_repository);
    this.__query = this._repository.createQueryBuilder('e');
  }

  public async getEvents(
    { isTodayOnly, ...opts }: TSearchEventsOptions,
    paginationOpts: TPaginationOptions,
  ): Promise<TPaginationResult<GoogleEvent>> {
    const query = this.__query.andWhere(
      'e.startedAt BETWEEN :startTime AND :finishTime',
      {
        startTime: moment().toISOString(),
        finishTime: moment().endOf('day').toISOString(),
      },
    );
    const { items, total } = await queryByKeywordAndPagination<GoogleEvent>(
      isTodayOnly ? query : this.__query,
      opts,
      paginationOpts,
      'e.googleEventSummary LIKE :keyword OR e.googleEventDescription LIKE :keyword',
    );

    return {
      items,
      total,
    };
  }

  public async getByEventIds(
    ids: string[],
  ): Promise<{ items: GoogleEvent[]; notExisted: string[] }> {
    const items = await this.__query
      .andWhere('e.eventId IN (:...ids)', {
        ids: [...ids],
      })
      .getMany();
    if (items.length < ids.length) {
      const existedIds = items.map((item) => item.eventId);
      const notExisted = ids.filter((id) => !existedIds.includes(id));

      return {
        items,
        notExisted,
      };
    }
    return { items, notExisted: [] };
  }

  public async createEvents(
    inputs: TCreateGoogleEvent[],
  ): Promise<GoogleEvent[]> {
    const items = inputs.map(
      ({
        id,
        recurringId,
        summary,
        description,
        meetingLink,
        eventLink,
        startedAt,
        finishedAt,
        attendees,
      }) =>
        this._repository.create({
          eventId: id,
          eventRecurringId: recurringId,
          summary,
          description,
          meetingLink,
          eventLink,
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date(finishedAt).toISOString(),
          members: JSON.stringify(attendees.map((a) => a.email)),
        }),
    );

    return await this._repository.save(items);
  }

  public async createEventsIfNotExist(
    inputs: TCreateGoogleEvent[],
  ): Promise<{ created: GoogleEvent[]; existed: GoogleEvent[] }> {
    const { ids, dic: inputDic } = common.arrayToDic(inputs);
    const { items: existed, notExisted } = await this.getByEventIds(ids);
    if (notExisted.length === 0) {
      Logger.log('No events need to create!');
      return { created: [], existed };
    }

    const eventNeedCreate = notExisted.map((id) => inputDic[id]);
    const items = await this.createEvents(eventNeedCreate);
    return {
      created: items,
      existed,
    };
  }
}

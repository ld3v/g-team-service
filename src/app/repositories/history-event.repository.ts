// Libs importing
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { AbstractRepository } from '@ld3v/nqh-shared';
import { IHistoryEventRepository } from '../interfaces';
import { HistoryEvent } from '../entities';

@Injectable()
export class HistoryEventRepository
  extends AbstractRepository<HistoryEvent>
  implements IHistoryEventRepository
{
  __query: SelectQueryBuilder<HistoryEvent>;
  constructor(
    @InjectRepository(HistoryEvent) _repository: Repository<HistoryEvent>,
  ) {
    super(_repository);
    this.__query = this._repository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.event', 'event');
  }

  public async getLast(): Promise<HistoryEvent> {
    const items = await this.__query
      .orderBy('e.createdAt', 'DESC')
      .limit(1)
      .getMany();

    return items.length === 0 ? null : items[0];
  }
}

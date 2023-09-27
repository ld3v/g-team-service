import { IRepository } from '@ld3v/nqh-shared';
import { GoogleEvent, HistoryEvent } from '../entities';

export type TCreateHistoryEvent = {
  event: GoogleEvent;
  memberHosted: string;
};

export const I_HISTORY_EVENT_REPOSITORY = 'I-HISTORY-EVENT-REPOSITORY';
export interface IHistoryEventRepository extends IRepository<HistoryEvent> {
  getLast(): Promise<HistoryEvent>;
}

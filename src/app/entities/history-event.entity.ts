import { Entity, Column, BeforeInsert, ManyToOne } from 'typeorm';
import { common, AbstractEntity } from '@ld3v/nqh-shared';
import { GoogleEvent } from './google-event.entity';

@Entity({ name: 'history_event' })
export class HistoryEvent extends AbstractEntity<HistoryEvent> {
  @Column()
  memberExclude: string;

  @Column()
  memberHosted: string;

  // Relations
  @ManyToOne(() => GoogleEvent, (e) => e.historyEvents)
  event: GoogleEvent;

  // Actions
  @BeforeInsert()
  _updateId() {
    this.id = common.generateId('DSHisEv', this.id);
  }
}

import { Entity, Column, BeforeInsert, OneToMany } from 'typeorm';
import { common, AbstractEntity } from '@ld3v/nqh-shared';
import { HistoryEvent } from './history-event.entity';

@Entity({ name: 'google_event' })
export class GoogleEvent extends AbstractEntity<GoogleEvent> {
  @Column()
  eventId: string;

  @Column({
    default: '',
  })
  eventRecurringId: string;

  @Column()
  summary: string;

  @Column({
    default: '',
  })
  description: string;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  finishedAt: Date;

  @Column({
    default: '',
  })
  meetingLink: string;

  @Column()
  eventLink: string;

  @Column({
    default: '[]',
  })
  members: string;

  @OneToMany(() => HistoryEvent, (e) => e.event)
  historyEvents: HistoryEvent[];

  // Actions
  @BeforeInsert()
  _updateId() {
    this.id = common.generateId('GEvent', this.id);
  }
}

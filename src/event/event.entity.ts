import { Entity, Column, BeforeInsert } from 'typeorm';
import { common, AbstractEntity } from '@ld3v/nqh-shared';

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

  // Actions
  @BeforeInsert()
  _updateId() {
    this.id = common.generateId('GEvent', this.id);
  }
}

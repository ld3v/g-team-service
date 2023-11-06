import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './services/app.service';
import { RepositoriesModule, common } from '@ld3v/nqh-shared';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {
  I_APP_SERVICE,
  I_CRON_SERVICE,
} from './interfaces/google-event.service.interfaces';
import { CronService } from './services';
import { I_GOOGLE_EVENT_REPOSITORY } from './interfaces/google-event.interface';
import { GoogleEventRepository } from './repositories/google-event.repository';
import { GoogleEvent, HistoryEvent } from './entities';
import { I_HISTORY_EVENT_REPOSITORY } from './interfaces';
import { HistoryEventRepository } from './repositories/history-event.repository';
import { ScheduleModule } from '@nestjs/schedule';

const { env } = common;

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        GG_CHAT_WEBHOOK: Joi.string().required(),
        GG_CHAT_WEBHOOK_DEV: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    RepositoriesModule.forRoot(
      {
        database: env().DB_DATABASE,
        host: env().DB_HOST,
        port: env().DB_PORT,
        username: env().DB_USERNAME,
        password: env().DB_PASSWORD,
      },
      {
        entities: [GoogleEvent, HistoryEvent],
        providers: [
          {
            provide: I_GOOGLE_EVENT_REPOSITORY,
            useClass: GoogleEventRepository,
          },
          {
            provide: I_HISTORY_EVENT_REPOSITORY,
            useClass: HistoryEventRepository,
          },
        ],
        exports: [I_GOOGLE_EVENT_REPOSITORY, I_HISTORY_EVENT_REPOSITORY],
      },
      true,
    ),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: I_APP_SERVICE,
      useClass: AppService,
    },
    {
      provide: I_CRON_SERVICE,
      useClass: CronService,
    },
  ],
  exports: [I_APP_SERVICE],
})
export class AppModule {}

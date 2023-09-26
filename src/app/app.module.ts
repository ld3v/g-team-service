import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './services/app.service';
import { RepositoriesModule } from '@ld3v/nqh-shared';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import environment from '../../utils/environment';
import { I_APP_SERVICE, I_CRON_SERVICE } from './services/interfaces';
import { CronService } from './services';
import { I_GOOGLE_EVENT_REPOSITORY } from './interfaces/google-event.interface';
import { GoogleEventRepository } from './google-event.repository';
import { GoogleEvent } from './entities/google-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        GG_CHAT_WEBHOOK: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
      }),
      envFilePath: '.env',
    }),
    RepositoriesModule.forRoot(
      {
        database: environment().DB_DATABASE,
        host: environment().DB_HOST,
        port: environment().DB_PORT,
        username: environment().DB_USERNAME,
        password: environment().DB_PASSWORD,
      },
      {
        entities: [GoogleEvent],
        providers: [
          {
            provide: I_GOOGLE_EVENT_REPOSITORY,
            useClass: GoogleEventRepository,
          },
        ],
        exports: [I_GOOGLE_EVENT_REPOSITORY],
        synchronize: true,
      },
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

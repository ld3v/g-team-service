import { Logger, Inject } from '@nestjs/common';
import {
  IAppService,
  I_APP_SERVICE,
} from './interfaces/google-event.service.interfaces';
import { GoogleEvent } from '@ld3v/nqh-shared/dist/gRPC/generate';

@GoogleEvent.GoogleEventServiceControllerMethods()
export class AppController {
  constructor(
    @Inject(I_APP_SERVICE) private readonly appService: IAppService,
  ) {}

  async createEvents(
    data$: GoogleEvent.CreateEventsRequest,
  ): Promise<GoogleEvent.EventsResponse> {
    Logger.log('Receive request to create events - ', data$.events?.length);
    const dataToCreate = this.appService.transformProtoData(
      ...(data$.events || []),
    );
    const data = await this.appService.createEventsIfNotExist(dataToCreate);
    const dataRes = this.appService.transformEvents(...data);

    return { events: dataRes };
  }

  async triggerDs({
    isIncludeHosted,
    env,
  }: GoogleEvent.TriggerRequest): Promise<GoogleEvent.TriggerResponse> {
    Logger.log('Receive Request to trigger manually');
    const res = await this.appService.triggerDS({
      isIncludedHosted: isIncludeHosted,
      isTestOnly: env === 'DEV',
    });

    return {
      isSuccessed: res,
    };
  }

  async getEvents(): Promise<GoogleEvent.EventsResponse> {
    Logger.log('Receive request to get events');
    const events = await this.appService.getEventsToday();
    const dataRes = this.appService.transformEvents(...events);

    return { events: dataRes };
  }

  async getMembers(): Promise<GoogleEvent.MembersResponse> {
    Logger.log('Receive request to get members HOSTED before');
    const lastEvent = await this.appService.getLastEvent();

    if (!lastEvent) {
      Logger.log('No events before!');
      return { members: [] };
    }
    return {
      members: JSON.parse(lastEvent.memberExclude),
    };
  }
}

import { Logger, Inject } from '@nestjs/common';
import {
  IAppService,
  I_APP_SERVICE,
} from './interfaces/google-event.service.interfaces';
import { GoogleEventService } from '@ld3v/nqh-shared/dist/gRPC/generate';

@GoogleEventService.GoogleEventServiceControllerMethods()
export class AppController {
  constructor(
    @Inject(I_APP_SERVICE) private readonly appService: IAppService,
  ) {}

  async createEvents(
    data$: GoogleEventService.CreateEventsRequest,
  ): Promise<GoogleEventService.EventsResponse> {
    Logger.log('Receive request to create events - ', data$.events?.length);
    const dataToCreate = this.appService.transformProtoData(
      ...(data$.events || []),
    );
    const data = await this.appService.createEventsIfNotExist(dataToCreate);
    const dataRes = this.appService.transformEvents(...data);

    return { events: dataRes };
  }

  async triggerDs(): Promise<{ isSuccess: boolean }> {
    return {
      isSuccess: false,
    };
  }

  async getEvents(): Promise<GoogleEventService.EventsResponse> {
    Logger.log('Receive request to get events');
    const events = await this.appService.getEventsToday();
    const dataRes = this.appService.transformEvents(...events);

    return { events: dataRes };
  }
}

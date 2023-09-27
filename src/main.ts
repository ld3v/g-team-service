import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { gRPC } from '@ld3v/nqh-shared';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:4050',
        package: gRPC.GoogleEventService.protobufPackage,
        protoPath: ['google-event.service.proto'],
        loader: {
          includeDirs: [
            join(
              __dirname,
              '../..',
              'node_modules/@ld3v/nqh-shared/dist/gRPC/proto/v1',
            ),
          ],
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { exposeDefaultValues: true },
    }),
  );

  await app.listen();
}
bootstrap();

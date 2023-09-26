import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { gRPC } from '@ld3v/nqh-shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:4050',
        package: gRPC.GoogleEventService.protobufPackage,
        protoPath: [
          join(
            process.cwd(),
            'node_modules/@ld3v/nqh-shared',
            'src/gRPC/proto/v1/google-event.service.proto',
          ),
        ],
      },
    },
  );

  await app.listen();
}
bootstrap();

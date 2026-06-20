import { Module } from '@nestjs/common';
import { SiemService } from './siem.service';
import { SplunkSiemProvider } from './providers/splunk.siem-provider';
import { ElasticSiemProvider } from './providers/elastic.siem-provider';
import { ISiemProvider } from './interfaces/siem-provider.interface';

/**
 * SIEM Integration Module.
 *
 * Providers are registered conditionally based on environment variables so
 * deployments without a SIEM platform incur no overhead.
 *
 * To add a new provider:
 * 1. Implement ISiemProvider in providers/
 * 2. Add its config env vars to .env.example
 * 3. Register it in the SIEM_PROVIDERS factory below
 */
@Module({
  providers: [
    SiemService,
    {
      provide: 'SIEM_PROVIDERS',
      useFactory: (): ISiemProvider[] => {
        const providers: ISiemProvider[] = [];

        if (process.env.SPLUNK_HEC_URL && process.env.SPLUNK_HEC_TOKEN) {
          providers.push(
            new SplunkSiemProvider({
              hecUrl: process.env.SPLUNK_HEC_URL,
              hecToken: process.env.SPLUNK_HEC_TOKEN,
              sourceType: process.env.SPLUNK_SOURCE_TYPE,
            }),
          );
        }

        if (process.env.ELASTIC_URL && process.env.ELASTIC_API_KEY) {
          providers.push(
            new ElasticSiemProvider({
              elasticUrl: process.env.ELASTIC_URL,
              apiKey: process.env.ELASTIC_API_KEY,
              index: process.env.ELASTIC_INDEX,
            }),
          );
        }

        return providers;
      },
    },
  ],
  exports: [SiemService],
})
export class SiemModule {}

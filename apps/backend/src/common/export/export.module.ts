import { Module } from '@nestjs/common';
import { ReportRendererService } from './report-renderer.service';

@Module({
  providers: [ReportRendererService],
  exports: [ReportRendererService],
})
export class ExportModule {}

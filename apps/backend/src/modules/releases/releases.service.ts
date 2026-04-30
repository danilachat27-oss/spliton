import { Injectable } from "@nestjs/common";
import { ReleasesRepository } from "./releases.repository";

@Injectable()
export class ReleasesService {
  constructor(private readonly releasesRepository: ReleasesRepository) {}

  findAll() {
    return this.releasesRepository.findAll();
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { ChallengesService } from './challenges.service';

@Controller('challenges')

export class ChallengesController {

  constructor(private readonly challengesService: ChallengesService) {}

  @Post()

  create(@Body() body: any) {

    return this.challengesService.create(body);

  }

  @Get()

  findAll() {

    return this.challengesService.findAll();

  }

  @Get(':id')

  findOne(@Param('id') id: string) {

    return this.challengesService.findOne(id);

  }

  @Patch(':id')

  update(@Param('id') id: string, @Body() body: any) {

    return this.challengesService.update(id, body);

  }

  @Delete(':id')

  remove(@Param('id') id: string) {

    return this.challengesService.remove(id);

  }

}

import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { memoryStorage } from 'multer';
import { UserModel } from '../users/models/user.model';
import { TweetsService } from './tweets.service';
import { TweetType } from './tweets.types';

type AuthenticatedRequest = ExpressRequest & { user: UserModel };

@Controller('tweets')
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Post(':tweetId/images')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImages(
    @Req() request: AuthenticatedRequest,
    @Param('tweetId', ParseUUIDPipe) tweetId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<TweetType> {
    return this.tweetsService.uploadImages(request.user.id, tweetId, images);
  }
}

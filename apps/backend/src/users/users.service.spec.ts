import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from './users.select';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: { user: { findMany } },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns public profiles without selecting email or password', async () => {
    await service.findAll('viewer-1');

    expect(findMany).toHaveBeenCalledWith({
      where: { isDeleted: false, id: { not: 'viewer-1' } },
      orderBy: { username: 'asc' },
      select: publicUserSelect,
    });
    expect(publicUserSelect).not.toHaveProperty('email');
    expect(publicUserSelect).not.toHaveProperty('password');
  });
});

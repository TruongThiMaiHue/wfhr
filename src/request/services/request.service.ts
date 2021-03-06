import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Request, User } from '@prisma/client';
import { RequestDto } from '../dto/request.dto';
import { RequestNotFoundException } from '../exception/request.exception';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaError } from '../../common/utils/prismaError';
import { RequestStatus } from '../request-status.enum';

@Injectable()
export class RequestService {
  constructor(private prisma: PrismaService) {}

  async getAllRequests() {
    return await this.prisma.request.findMany();
  }

  async getRequestsByTeam(id: User) {
    const team = await this.prisma.team.findUnique({
      where: {
        leader: +id.id,
      },
    });
    console.log(team.id);
    const user = await this.prisma.user_team.findMany({
      where: {
        team_id: team.id,
      },
    });
    console.log(user);
    const b = [];
    user.forEach((a) => {
      b.push(a.user_id);
    });
    console.log(b);

    return await this.prisma.request.findMany({
      where: {
        user: {
          id: user,
        },
      },
    });
  }

  async getRequestsByOwner(user: User): Promise<Request[]> {
    return await this.prisma.request.findMany({ where: { user } });
  }

  async getRequestById(id: number, user: User): Promise<Request> {
    const request = await this.prisma.request.findUnique({
      where: {
        id_created_by: {
          id: id,
          created_by: user.id,
        },
      },
    });
    if (!request) {
      throw new RequestNotFoundException(id);
    }
    return request;
  }

  async createRequest(request: RequestDto, user: User): Promise<Request> {
    return this.prisma.request.create({
      data: {
        ...request,
        user: {
          connect: { id: user.id },
        },
      },
    });
  }

  async updateRequest(
    id: number,
    request: RequestDto,
    user: User,
  ): Promise<Request> {
    try {
      return await this.prisma.request.update({
        data: {
          ...request,
        },
        where: {
          id_created_by: {
            id: id,
            created_by: user.id,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new RequestNotFoundException(id);
      }
      throw error;
    }
  }

  async updateRequestStatus(
    id: number,
    status: RequestStatus,
  ): Promise<Request> {
    try {
      return await this.prisma.request.update({
        data: {
          status,
        },
        where: {
          id_created_by: {
            id: id,
            created_by: id,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new RequestNotFoundException(id);
      }
      throw error;
    }
  }

  async deleteRequest(id: number): Promise<Request> {
    try {
      return await this.prisma.request.delete({
        where: {
          id_created_by: {
            id: id,
            created_by: null,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new RequestNotFoundException(id);
      }
      throw error;
    }
  }
}

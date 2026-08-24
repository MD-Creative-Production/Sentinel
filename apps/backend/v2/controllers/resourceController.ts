import { Request, Response } from 'express';

export class ResourceControllerV2 {
  public static getResources(req: Request, res: Response): void {
    res.status(200).json({
      version: 'v2',
      deprecated: false,
      meta: { total: 2, pageSize: 10, page: 1 },
      data: [
        {
          uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          title: 'Modern Resource A',
          status: 'ACTIVE',
        },
        {
          uuid: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          title: 'Modern Resource B',
          status: 'INACTIVE',
        },
      ],
    });
  }
}

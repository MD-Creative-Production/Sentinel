import { Request, Response } from 'express';
import { setDeprecationHeaders } from '../../common/utils/deprecation';

export class ResourceControllerV1 {
  public static getResources(req: Request, res: Response): void {
    // RFC 8594 Deprecation Header enforcement for v1
    setDeprecationHeaders(res, {
      sunsetDate: 'Sun, 31 Dec 2028 23:59:59 GMT',
      successorVersion: '/api/v2/resources',
    });

    res.status(200).json({
      version: 'v1',
      deprecated: true,
      data: [
        { id: '1', name: 'Legacy Resource A' },
        { id: '2', name: 'Legacy Resource B' },
      ],
    });
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Observable } from 'rxjs';
import { traceStorage } from './trace.storage';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const traceId = nanoid(12);

    return new Observable((subscriber) => {
      traceStorage.run({ traceId }, () => {
        const req = context.switchToHttp().getRequest();
        req.traceId = traceId;
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}

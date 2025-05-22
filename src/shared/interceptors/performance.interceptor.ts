import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const operationType = info.operation.operation;
    const fieldName = info.fieldName;

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - now;
        if (executionTime > 500) {
          this.logger.warn(`Slow ${operationType} operation detected: ${fieldName} took ${executionTime}ms`);
        } else {
          this.logger.log(`${operationType} ${fieldName} completed in ${executionTime}ms`);
        }
      }),
    );
  }
}
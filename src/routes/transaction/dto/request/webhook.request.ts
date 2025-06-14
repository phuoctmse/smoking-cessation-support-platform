import { createZodDto } from 'nestjs-zod'

import { WebhookPaymentBodySchema } from '../../transaction.model'

export class WebhookPaymentBodyDTO extends createZodDto(WebhookPaymentBodySchema) {}
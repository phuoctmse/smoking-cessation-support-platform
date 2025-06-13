import { createZodDto } from 'nestjs-zod'

import { WebhookPaymentBodySchema } from '../../webhook.model'

export class WebhookPaymentBodyDTO extends createZodDto(WebhookPaymentBodySchema) {}
// Event Publisher Port
// Defines the interface for publishing domain events

import { DomainEvent } from '../events/domain-event'

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>
  publishMany(events: DomainEvent[]): Promise<void>
}
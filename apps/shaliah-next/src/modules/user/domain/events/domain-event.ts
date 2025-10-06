// Base Domain Event Interface
// Common interface for all domain events in the user module

export interface DomainEvent {
  readonly eventId: string
  readonly eventType: string
  readonly aggregateId: string
  readonly occurredAt: Date
  readonly eventVersion: number
}
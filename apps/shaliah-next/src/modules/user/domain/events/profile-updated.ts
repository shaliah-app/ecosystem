// Domain Events for User Profile
// Events that represent important business moments

import { DomainEvent } from './domain-event'

export class ProfileUpdatedEvent implements DomainEvent {
  readonly eventId: string
  readonly eventType = 'ProfileUpdated'
  readonly eventVersion = 1

  constructor(
    readonly aggregateId: string, // user ID
    readonly occurredAt: Date,
    readonly previousProfile: {
      language: string
      fullName: string | null
    },
    readonly updatedProfile: {
      language: string
      fullName: string | null
    }
  ) {
    this.eventId = `profile-updated-${aggregateId}-${occurredAt.getTime()}`
  }
}
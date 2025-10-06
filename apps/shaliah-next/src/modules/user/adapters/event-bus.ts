// Event Bus Adapter
// Simple in-memory event publisher for development

import { EventPublisher } from '../domain/ports/event-publisher'
import { DomainEvent } from '../domain/events/domain-event'

export class EventBus implements EventPublisher {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> = new Map()

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || []
    await Promise.all(handlers.map(handler => handler(event)))
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)))
  }
}

// Singleton instance for the application
export const eventBus = new EventBus()
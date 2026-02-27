# Design Document: Hierarchical Event Approval System

## Overview

The hierarchical event approval system extends the existing event management platform to enforce organizational hierarchy rules during event creation. When lower-level roles attempt to invite higher-level roles to events, the system triggers an approval workflow that requires consent from the invited higher-level roles before the event is created.

The system integrates seamlessly with the existing event creation flow, event-requests interface, and notification system while maintaining backward compatibility for events that don't require approval.

## Architecture

### System Components

The hierarchical approval system consists of four main components:

1. **Hierarchy Validation Service**: Validates invitation rules and determines when approval is required
2. **Event Approval Workflow**: Manages the approval process and state transitions
3. **Enhanced Event Request System**: Extends existing EventRequestController to handle hierarchy approvals
4. **UI Integration Layer**: Modifies existing forms and interfaces to support approval workflows

### Integration Points

The system integrates with existing components:

- **EventController**: Extended to validate hierarchy rules during event creation
- **EventRequestController**: Enhanced to handle both coordinator requests and hierarchy approvals
- **AddEvent Form**: Modified to detect hierarchy violations and show approval warnings
- **EventRequests Page**: Updated to display both request types in unified interface
- **Notification System**: Leveraged for approval notifications

## Components and Interfaces

### Backend Components

#### HierarchyService

```php
class HierarchyService
{
    public function validateInvitations(User $host, array $inviteeIds): ValidationResult
    public function requiresApproval(User $host, array $inviteeIds): bool
    public function getApproversNeeded(User $host, array $inviteeIds): array
    public function getRoleHierarchy(): array
}
```

The HierarchyService encapsulates all hierarchy validation logic and determines approval requirements based on organizational roles.

#### EventApprovalWorkflow

```php
class EventApprovalWorkflow
{
    public function createPendingEvent(array $eventData, array $approvers): EventApproval
    public function processApproval(EventApproval $approval, User $approver, string $decision, ?string $reason = null): void
    public function checkApprovalStatus(EventApproval $approval): string
    public function finalizeEvent(EventApproval $approval): Event
}
```

The EventApprovalWorkflow manages the complete approval process from creation to finalization.

#### Enhanced EventRequestController

```php
class EventRequestController extends Controller
{
    public function index(): JsonResponse // Enhanced to show both request types
    public function reviewHierarchyApproval(EventApproval $approval, Request $request): JsonResponse
    public function getApprovalDetails(EventApproval $approval): JsonResponse
}
```

The existing EventRequestController is extended to handle hierarchy approval requests alongside coordinator requests.

#### Enhanced EventController

```php
class EventController extends Controller
{
    public function store(Request $request): JsonResponse // Enhanced with hierarchy validation
    public function validateHierarchy(Request $request): JsonResponse // New endpoint for real-time validation
}
```

The existing EventController is enhanced to validate hierarchy rules and trigger approval workflows when needed.

### Frontend Components

#### Enhanced EventForm

The existing EventForm component is enhanced with:

- Real-time hierarchy validation as users select invitees
- Warning messages when hierarchy violations are detected
- Clear indication of which roles need approval
- Submission flow that handles both direct creation and approval workflows

#### Enhanced EventRequests Page

The existing EventRequests page is enhanced to:

- Display both coordinator requests and hierarchy approvals
- Provide different interfaces for different request types
- Show event details and invited participants for hierarchy approvals
- Support approval/rejection actions with optional reasons

#### HierarchyWarning Component

```jsx
function HierarchyWarning({ violations, approversNeeded }) {
  // Displays warning when hierarchy violations are detected
  // Shows which roles need to approve
  // Allows user to proceed with submission
}
```

A new component that provides clear feedback about hierarchy violations and approval requirements.

## Data Models

### EventApproval Model

```php
class EventApproval extends Model
{
    protected $fillable = [
        'title',
        'description',
        'location', 
        'date',
        'time',
        'host_id',
        'event_data', // JSON field storing complete event details
        'status', // 'pending', 'approved', 'rejected'
        'created_event_id', // References final event when approved
    ];

    protected $casts = [
        'event_data' => 'array',
        'date' => 'date',
        'time' => 'datetime:H:i',
    ];

    public function host(): BelongsTo
    public function approvers(): HasMany
    public function createdEvent(): BelongsTo
}
```

### EventApprover Model

```php
class EventApprover extends Model
{
    protected $fillable = [
        'event_approval_id',
        'approver_id',
        'status', // 'pending', 'approved', 'rejected'
        'decision_reason',
        'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function eventApproval(): BelongsTo
    public function approver(): BelongsTo
}
```

### Database Schema

#### event_approvals table

```sql
CREATE TABLE event_approvals (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    host_id BIGINT UNSIGNED NOT NULL,
    event_data JSON NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_event_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_event_id) REFERENCES events(id) ON DELETE SET NULL
);
```

#### event_approvers table

```sql
CREATE TABLE event_approvers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    event_approval_id BIGINT UNSIGNED NOT NULL,
    approver_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    decision_reason TEXT NULL,
    decided_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (event_approval_id) REFERENCES event_approvals(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_approval_approver (event_approval_id, approver_id)
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, I need to analyze the acceptance criteria from the requirements document to determine which ones are testable as properties.

### Hierarchy Validation Properties

**Property 1: Dean invitation freedom**
*For any* event created by a Dean and any combination of invitees, the system should create the event immediately without triggering approval workflow
**Validates: Requirements 1.1**

**Property 2: Chairperson same-level invitation**
*For any* event created by a Chairperson with only Faculty Members or Coordinators as invitees, the system should create the event immediately without approval
**Validates: Requirements 1.2**

**Property 3: Chairperson upward invitation triggers approval**
*For any* event created by a Chairperson that includes a Dean as invitee, the system should trigger the approval workflow
**Validates: Requirements 1.3**

**Property 4: Coordinator same-level invitation**
*For any* event created by a Coordinator with only Faculty Members as invitees, the system should create the event immediately without approval
**Validates: Requirements 1.4**

**Property 5: Coordinator upward invitation triggers approval**
*For any* event created by a Coordinator that includes a Dean or Chairperson as invitee, the system should trigger the approval workflow
**Validates: Requirements 1.5**

### Approval Workflow Properties

**Property 6: Hierarchy violation creates pending status**
*For any* event that triggers approval workflow due to hierarchy violation, the system should set the event status to "pending approval"
**Validates: Requirements 2.1**

**Property 7: Approval notification delivery**
*For any* event requiring approval, the system should notify all higher-level roles being invited via the notification system
**Validates: Requirements 2.2, 5.1**

**Property 8: Approval finalizes event**
*For any* pending approval event, when all required approvers approve, the system should change status to "approved" and make the event visible on calendars
**Validates: Requirements 2.3, 3.3**

**Property 9: Rejection cancels and notifies**
*For any* pending approval event, when any required approver rejects, the system should cancel the event and notify the host with rejection reason if provided
**Validates: Requirements 2.4, 5.3**

**Property 10: Pending events remain hidden**
*For any* event with "pending approval" status, the system should exclude it from public calendar queries
**Validates: Requirements 2.5**

**Property 11: Approval completion notifications**
*For any* event that gets approved, the system should notify both the event host and all invited participants
**Validates: Requirements 5.2**

### Interface Integration Properties

**Property 12: Unified request display**
*For any* higher-level role accessing the event-requests page, the system should display both coordinator requests and hierarchy approval requests in the interface
**Validates: Requirements 3.1, 7.4**

**Property 13: Complete approval request information**
*For any* hierarchy approval request displayed, the system should include event details, host information, and invited participants
**Validates: Requirements 3.2**

**Property 14: Request type distinction**
*For any* event-requests interface display, the system should visually distinguish between coordinator requests and hierarchy approval requests
**Validates: Requirements 3.5**

**Property 15: Real-time hierarchy validation**
*For any* invitee selection in the event creation form, the system should validate hierarchy rules and provide immediate feedback
**Validates: Requirements 4.1**

**Property 16: Violation submission acceptance**
*For any* event submission with hierarchy violations, the system should accept the submission and route it to the approval workflow
**Validates: Requirements 4.5**

### Data Integrity Properties

**Property 17: Complete event data storage**
*For any* event requiring approval, the system should store the approval request with all complete event details including title, description, location, date, time, and invitees
**Validates: Requirements 6.1**

**Property 18: Comprehensive approval audit trail**
*For any* approval action taken, the system should record the approver identity, timestamp, decision, and optional reason for audit purposes
**Validates: Requirements 6.2, 5.5**

**Property 19: Approval history preservation**
*For any* event that goes through approval workflow, the system should maintain complete approval history even after final decision
**Validates: Requirements 6.3**

**Property 20: Approved event integration**
*For any* event that gets approved through hierarchy workflow, the resulting event should integrate seamlessly with existing calendar system and behave identically to directly-created events
**Validates: Requirements 6.4**

**Property 21: Workflow data preservation**
*For any* approval workflow state transition, the system should preserve all event data without loss
**Validates: Requirements 6.5**

### Backward Compatibility Properties

**Property 22: Non-hierarchy event preservation**
*For any* event creation that doesn't involve hierarchy violations, the system should maintain identical behavior to the original event creation process
**Validates: Requirements 7.1, 7.3**

**Property 23: Dual request handling**
*For any* EventRequestController operation, the system should properly handle both coordinator requests and hierarchy approvals using the same interface
**Validates: Requirements 7.2**

**Property 24: Authentication mechanism reuse**
*For any* new hierarchy approval feature, the system should use existing authentication and authorization mechanisms without modification
**Validates: Requirements 7.5**

## Error Handling

### Hierarchy Validation Errors

The system handles hierarchy validation errors gracefully:

- **Invalid Role Detection**: When unknown roles are encountered, the system defaults to requiring approval from all higher-level roles
- **Missing User Data**: When user role information is incomplete, the system treats the user as the lowest hierarchy level
- **Concurrent Approval Conflicts**: When multiple approvers act simultaneously, the system uses database transactions to ensure consistency

### Approval Workflow Errors

The system manages approval workflow errors:

- **Approver Unavailability**: When required approvers are inactive or deleted, the system notifies administrators and allows manual intervention
- **Timeout Handling**: Pending approvals don't timeout automatically, but administrators can manually resolve stale requests
- **Partial Approval Failures**: When some approvers approve but others reject, the system follows rejection precedence

### Data Consistency Errors

The system maintains data consistency:

- **Event Creation Failures**: If approved event creation fails, the system maintains approval records and allows retry
- **Notification Failures**: Failed notifications are logged but don't prevent approval workflow progression
- **Calendar Integration Errors**: If calendar integration fails for approved events, the system provides manual resolution tools

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:
- Specific hierarchy rule examples (Dean inviting Faculty, Coordinator inviting Dean)
- Edge cases like empty invitee lists or invalid user roles
- Error conditions such as database failures or network issues
- Integration points between existing and new components

**Property-Based Tests** focus on:
- Universal hierarchy rules across all role combinations
- Approval workflow state transitions with random data
- Data integrity preservation through all operations
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

The system uses **PHPUnit with Eris** for property-based testing in PHP:

- Each property test runs minimum **100 iterations** with random data
- Tests generate random users with different roles, random event data, and random invitee combinations
- Each test references its corresponding design document property
- Tag format: **Feature: hierarchical-event-approval, Property {number}: {property_text}**

### Test Data Generation

Property tests use generators for:
- **User Generation**: Random users with roles (Dean, Chairperson, Coordinator, Faculty Member)
- **Event Generation**: Random event data with valid dates, times, and descriptions
- **Invitee Generation**: Random combinations of users for invitation testing
- **Approval Scenario Generation**: Random approval/rejection decisions with reasons

### Integration Testing

Integration tests verify:
- End-to-end approval workflows from creation to finalization
- UI component integration with backend services
- Database transaction integrity across approval operations
- Notification system integration with approval events

The testing strategy ensures both concrete examples work correctly (unit tests) and universal properties hold across all inputs (property tests), providing comprehensive validation of the hierarchical approval system.
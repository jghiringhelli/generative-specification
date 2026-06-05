<!-- UNFILLED: State Machine — Primary Entity -->
<!-- Replace state names (Draft, Pending, Active, etc.) and transition labels -->
<!-- with the actual lifecycle states of your domain entity.               -->
# State Machine: Primary Entity

```mermaid
stateDiagram-v2
    [*] --> Draft

    Draft --> Pending: submit()
    Pending --> Active: approve()
    Pending --> Rejected: reject()
    Active --> Completed: complete()
    Active --> Cancelled: cancel()

    Completed --> [*]
    Rejected --> [*]
    Cancelled --> [*]

    note right of Active
        FILL: add invariant or constraint
        e.g. "requires valid payment method"
    end note
```

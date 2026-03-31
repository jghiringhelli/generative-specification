# Loom Language Specification v0.1

**Status:** Design document. Not yet implemented.
**Version:** 0.1
**Author:** Jorge Ghiringhelli
**Date:** 2025

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Syntax](#2-syntax)
3. [Type System](#3-type-system)
4. [Effect System](#4-effect-system)
5. [Module System](#5-module-system)
6. [Contracts](#6-contracts)
7. [Compilation Pipeline](#7-compilation-pipeline)
8. [The GS Connection](#8-the-gs-connection)
9. [What Loom Is Not](#9-what-loom-is-not)
10. [Status and Next Steps](#10-status-and-next-steps)

---

## 1. Design Philosophy

Loom is a programming language designed for AI generation and human review, not human typing. It compiles to LLVM IR and from there to native binaries, WASM, and hardware accelerator kernels. Every design decision flows from five principles.

### Principle 1: Intent-Preserving

The language captures what a system should do, not how memory is laid out. There is no manual memory model, no stack discipline encoded in syntax, no pointer arithmetic. Those are compiler concerns. A Loom function says: "given this input, produce this output, with these effects." It does not say how the values travel through registers.

### Principle 2: Effect-Transparent

Every function that touches the outside world declares it in its type signature. Purity is the default. Effects are explicit, tracked through call chains, and verified by the compiler. Calling a `NetworkCall` function from a `Pure` context is a compile error, not a runtime surprise.

### Principle 3: Contract-First

Preconditions and postconditions are part of the function signature. They are not comments, not documentation strings, not assertions scattered in the body. The compiler reads them. The type checker enforces them where it can. The runtime checks them where static verification is undecidable. A missing precondition that would allow an invalid state is a compile error.

### Principle 4: Refinement-Typed

Types encode invariants, not just shapes. `Email` is not `String`. `PositiveInt` is not `Int`. `NonEmptyList<T>` is not `List<T>`. Refinements are predicates attached to base types. Where the predicate is decidable at compile time, it is enforced there. Where it is not, it is enforced at the first point of construction.

### Principle 5: No Ceremony

No `null`. No exceptions. No undefined behavior. No implicit coercions. No overloaded operators with surprising semantics. Absence is `Option<T>`. Failure is `Result<T, E>`. Branching over variants is `match`, and the compiler refuses to accept non-exhaustive matches. Every construct has one meaning.

---

## 2. Syntax

Loom syntax is designed to be readable by humans reviewing AI-generated code. It borrows structural ideas from ML and Rust while removing historical accidents. It is not an S-expression language. Significant whitespace is not used for block structure; blocks use `end` terminators.

### 2.1 Lexical Conventions

- Keywords: `module`, `fn`, `type`, `enum`, `let`, `match`, `with`, `require`, `ensure`, `import`, `spec`, `provides`, `effect`, `where`, `end`
- Identifiers: `snake_case` for values and functions, `PascalCase` for types and modules
- Comments: `--` for line comments, `{- -}` for block comments
- String literals: double-quoted, UTF-8
- Numeric literals: `42`, `3.14`, `0xFF`, `1_000_000`

### 2.2 Module Declaration

Every file is a module. The module header is mandatory.

```loom
module UserService
  spec "Manages user lifecycle: creation, lookup, deactivation."
  provides
    create_user : CreateUserRequest -> Effect<[DatabaseWrite, Log], Result<User, UserError>>
    find_user   : UserId -> Effect<[DatabaseRead], Option<User>>
    deactivate  : UserId -> Effect<[DatabaseWrite, Log], Result<Unit, UserError>>
  requires
    user_repository : UserRepository
    logger          : Logger
end
```

The `spec` field is a single sentence. The compiler enforces this. The `provides` block lists the full typed signature of every exported operation. The `requires` block lists dependencies as typed interfaces, never as concrete implementations.

### 2.3 Function Definitions

```loom
fn create_user :: CreateUserRequest -> Effect<[DatabaseWrite, Log], Result<User, UserError>>
  require: request.email is Email
  require: request.password.length >= 8
  ensure:  result is Ok implies result.value.email == request.email
  with user_repository, logger
  let normalized = normalize_email(request.email)
  let hashed     = hash_password(request.password)
  let candidate  = User.new(normalized, hashed)
  match user_repository.insert(candidate)
    Ok(saved)  -> log_then_return(logger, "user.created", saved)
    Err(e)     -> Err(UserError.from_repository_error(e))
  end
end
```

The `::` separator reads "has type." The effect list `[DatabaseWrite, Log]` lists every effect the function may perform. The `with` clause names the injected dependencies the function uses. The body is a sequence of `let` bindings followed by an expression.

### 2.4 Type Definitions

Product types (records):

```loom
type User =
  id       : UserId
  email    : Email
  password : HashedPassword
  active   : Bool
  created  : Timestamp
end
```

Sum types (enums with data):

```loom
enum UserError =
  | EmailAlreadyExists of Email
  | InvalidPassword
  | UserNotFound of UserId
  | RepositoryFailure of String
end
```

Refined types:

```loom
type Email       = String where is_valid_email
type UserId      = UUID
type PositiveInt = Int where (> 0)
type NonEmptyStr = String where (.length > 0)
type HashedPassword = Bytes where (.length == 60)  -- bcrypt output
```

The `where` clause attaches a predicate to a base type. The predicate must be a pure boolean expression. The compiler checks it statically where possible. Where static checking is undecidable, the compiler inserts a checked assertion at construction points.

### 2.5 Let Bindings and Immutability

All bindings are immutable. There is no reassignment.

```loom
let x = 42
let name = "Jorge"
let users = find_all_users()
```

Mutation of data structures is expressed through returning new values. The LLVM backend is responsible for optimizing in-place updates where safe.

### 2.6 Match Expressions

`match` is exhaustive. The compiler rejects patterns that fail to cover all variants.

```loom
match result
  Ok(user)          -> user.email
  Err(UserNotFound) -> "unknown"
  Err(e)            -> log_error(e) then "error"
end
```

Patterns support destructuring, guards, and nested matches.

```loom
match payment
  Authorized(amount) where amount > 0 -> process(amount)
  Authorized(_)                        -> Err(PaymentError.ZeroAmount)
  Declined(reason)                     -> Err(PaymentError.Declined(reason))
  Pending                              -> Err(PaymentError.NotReady)
end
```

### 2.7 Complete Example: Pure Calculation Module

```loom
module PricingEngine
  spec "Computes order totals, discounts, and tax. No side effects."
  provides
    compute_total : OrderLineList -> DiscountCode -> TaxRate -> Result<OrderTotal, PricingError>
    apply_discount : Price -> DiscountCode -> Result<Price, PricingError>
  requires
end  -- no dependencies: this module is Pure

type OrderLine =
  sku      : ProductSku
  quantity : PositiveInt
  unit_price : Price
end

type OrderTotal =
  subtotal : Price
  discount : Price
  tax      : Price
  total    : Price
end

fn compute_total :: OrderLineList -> DiscountCode -> TaxRate -> Result<OrderTotal, PricingError>
  require: lines.length > 0
  require: tax_rate >= 0.0 and tax_rate <= 1.0
  ensure:  result is Ok implies result.value.total == result.value.subtotal - result.value.discount + result.value.tax
  let subtotal = sum_lines(lines)
  match apply_discount(subtotal, discount_code)
    Ok(discounted) ->
      let tax   = discounted * tax_rate
      let total = discounted + tax
      Ok(OrderTotal.new(subtotal, subtotal - discounted, tax, total))
    Err(e) -> Err(e)
  end
end

fn sum_lines :: OrderLineList -> Price
  require: lines.length > 0
  ensure:  result > 0
  lines |> map(fn line -> line.quantity * line.unit_price end) |> fold(0, (+))
end
```

### 2.8 Complete Example: Payment Processor Stub

```loom
module PaymentGateway
  spec "Submits charges to the payment provider and returns authorization results."
  provides
    authorize : ChargeRequest -> Effect<[NetworkCall, Log], Result<Authorization, PaymentError>>
    capture   : AuthorizationId -> Effect<[NetworkCall, Log], Result<Receipt, PaymentError>>
    refund    : ReceiptId -> Amount -> Effect<[NetworkCall, Log], Result<Refund, PaymentError>>
  requires
    http_client : HttpClient
    logger      : Logger
end

type ChargeRequest =
  amount      : PositiveInt   -- amount in smallest currency unit (cents)
  currency    : CurrencyCode
  card_token  : PaymentToken
  idempotency : IdempotencyKey
end

enum PaymentError =
  | InsufficientFunds
  | CardDeclined of String
  | NetworkTimeout
  | InvalidToken
  | ProviderError of Int of String  -- status code, message
end

fn authorize :: ChargeRequest -> Effect<[NetworkCall, Log], Result<Authorization, PaymentError>>
  require: request.amount > 0
  ensure:  result is Ok implies result.value.amount == request.amount
  with http_client, logger
  let payload = serialize_charge(request)
  match http_client.post("/v1/authorize", payload)
    Ok(response) ->
      logger.info("payment.authorized", [("idempotency", request.idempotency)])
      parse_authorization(response)
    Err(timeout) -> Err(PaymentError.NetworkTimeout)
    Err(e)       -> Err(PaymentError.ProviderError(e.status, e.body))
  end
end
```

---

## 3. Type System

### 3.1 Base Types

| Type        | Description                               |
|-------------|-------------------------------------------|
| `Int`       | 64-bit signed integer                     |
| `Float`     | 64-bit IEEE 754 double                    |
| `String`    | UTF-8 encoded text                        |
| `Bool`      | `True` or `False`                         |
| `Bytes`     | Byte array                                |
| `Timestamp` | UTC timestamp, microsecond precision      |
| `UUID`      | 128-bit universally unique identifier     |
| `Unit`      | The type of functions that return nothing |

### 3.2 Composite Types

**Product types (records):** Named fields, all fields required, no inheritance.

```loom
type Point = x : Float, y : Float end
```

**Sum types (enums):** Exhaustive variants, each may carry data.

```loom
enum Shape =
  | Circle of Float          -- radius
  | Rectangle of Float of Float  -- width, height
  | Triangle of Point of Point of Point
end
```

**Tuples:** Unnamed, positionally accessed, fixed arity.

```loom
let pair : (String, Int) = ("hello", 42)
let first = pair.0
let second = pair.1
```

### 3.3 Parameterized Types

```loom
Option<T>       -- Some(value) or None
Result<T, E>    -- Ok(value) or Err(error)
List<T>         -- homogeneous ordered sequence
Map<K, V>       -- key-value store, keys must be comparable
Set<T>          -- deduplicated collection, T must be comparable
```

These are part of the standard library. They are not special syntax; they are regular type constructors.

### 3.4 Refined Types

A refined type is a base type with a predicate.

```loom
type Email        = String where is_valid_email
type PositiveInt  = Int    where (> 0)
type Probability  = Float  where (>= 0.0 and <= 1.0)
type NonEmptyList<T> = List<T> where (.length > 0)
type BoundedStr<N>   = String  where (.length <= N)
```

Refinement predicates must be pure boolean functions or inline pure expressions. The type checker attempts static verification via SMT solving. Where it cannot decide statically (e.g., string validation requires runtime regex evaluation), it inserts a checked construction:

```loom
-- This is a compile error if the type checker can prove it false statically.
-- Otherwise, it generates a runtime check at this construction point.
let email : Email = Email.from("jorge@example.com")
```

`Email.from` is generated by the compiler for every refined type. It returns `Result<Email, RefinementError>` and can never be bypassed.

### 3.5 No Subtyping

There is no inheritance. There is no subtype relationship between any two types. Composition is the only mechanism for sharing structure. Interface satisfaction is structural (duck-typed at the module boundary): a module satisfies a `requires` interface if it provides all the required operations with compatible types.

---

## 4. Effect System

The effect system is the structural heart of Loom. It is not a library or an annotation layer. It is part of the type system, enforced by the compiler, and propagated through every function call chain.

### 4.1 Effect Declarations

Effects are declared in function signatures using the `Effect<[effects], ReturnType>` type.

```loom
fn read_user :: UserId -> Effect<[DatabaseRead], Option<User>>
fn write_log :: String -> Effect<[Log], Unit>
fn current_time :: Unit -> Effect<[Clock], Timestamp>
fn generate_id :: Unit -> Effect<[Random], UUID>
fn pure_add :: Int -> Int -> Int  -- no Effect wrapper: this is Pure
```

A function with no `Effect` wrapper is `Pure` by default. The compiler verifies this: any attempt to call an effectful function from a pure function is a type error.

### 4.2 Built-in Effects

| Effect          | Meaning                                                        |
|-----------------|----------------------------------------------------------------|
| `Pure`          | No side effects. Default when `Effect` is omitted.            |
| `DatabaseRead`  | Reads from a persistent database                              |
| `DatabaseWrite` | Writes to a persistent database                               |
| `NetworkCall`   | Makes an outbound network request                              |
| `FileRead`      | Reads from the filesystem                                      |
| `FileWrite`     | Writes to the filesystem                                       |
| `Clock`         | Reads the current time (non-deterministic without this)       |
| `Random`        | Generates random values                                        |
| `Log`           | Writes to a structured log output                              |

`Clock` and `Random` are effects because their output is non-deterministic. Marking them as effects means that any function using them is, by type, non-deterministic, and testing infrastructure can inject controlled implementations.

### 4.3 Effect Propagation

Effects propagate upward through call chains automatically.

```loom
fn get_or_create_user :: Email -> Effect<[DatabaseRead, DatabaseWrite, Log], Result<User, UserError>>
  -- calling find_user introduces DatabaseRead
  -- calling create_user introduces DatabaseWrite and Log
  -- the union of all called effects appears in this signature
  match find_user_by_email(email)
    Some(user) -> Ok(user)
    None       -> create_user(CreateUserRequest.new(email))
  end
end
```

If the declared effects do not match the union of effects of all called functions, the compiler emits an error. You cannot under-declare effects.

### 4.4 Effect Polymorphism

Higher-order functions can be parameterized over effects.

```loom
fn map_result :: Result<A, E> -> (A -> Effect<[fx], B>) -> Effect<[fx], Result<B, E>>
```

Here `fx` is an effect variable. The function is effect-polymorphic: it propagates whatever effects the callback `f` requires. This allows generic combinators to work with both pure and effectful callbacks without specialization.

### 4.5 Effect Containment Example

```loom
-- COMPILE ERROR: pure function cannot call effectful function
fn compute_discount :: Price -> Price
  let now = current_time()  -- current_time has Effect<[Clock], Timestamp>
  -- Error: Clock effect escapes Pure context
  Price.from(now.unix_seconds)
end

-- CORRECT: declare the Clock effect
fn compute_time_based_discount :: Price -> Effect<[Clock], Price>
  let now = current_time()
  if is_happy_hour(now) then Price.from(price * 0.8) else price
end
```

### 4.6 Testing Implications

Because `Clock` and `Random` are effects, test code can inject deterministic implementations through the module's `requires` interface. There is no need for mocking frameworks. The effect system creates the seam automatically.

---

## 5. Module System

### 5.1 Module as GS Boundary

Each Loom module is a Generative Specification boundary. The module header encodes the GS `spec`, `provides`, and `requires` properties directly. This is not convention; it is enforced by the parser. A file without a valid module header does not parse.

```loom
module OrderService
  spec "Processes customer orders from submission to fulfillment."
  provides
    submit_order  : SubmitOrderRequest -> Effect<[DatabaseWrite, NetworkCall, Log], Result<Order, OrderError>>
    cancel_order  : OrderId -> Reason -> Effect<[DatabaseWrite, Log], Result<Unit, OrderError>>
    get_order     : OrderId -> Effect<[DatabaseRead], Option<Order>>
  requires
    order_repository   : OrderRepository
    payment_gateway    : PaymentGateway
    inventory_service  : InventoryPort
    logger             : Logger
end
```

### 5.2 Dependency Inversion by Construction

The `requires` block names typed interfaces, never concrete modules. The concrete implementations are wired at the composition root. There is no import of a concrete implementation module inside a service module. The type checker enforces this: you can only use identifiers from your own module's scope and your declared `requires` interfaces.

### 5.3 Circular Import Prevention

The module dependency graph is checked at compile time for cycles. A circular import is a compile error. This is not a lint warning; the type checker cannot proceed with cyclic dependencies.

### 5.4 Spec Generation

The compiler can emit a GS spec stub from a module header:

```
loom spec UserService.loom --output docs/specs/UserService.md
```

This generates a structured spec document with the module purpose, operations table, dependency table, and effect inventory. The stub is a starting point; the human fills in invariants, constraints, and domain notes.

---

## 6. Contracts

### 6.1 Preconditions and Postconditions

`require:` and `ensure:` are first-class constructs. They appear at the top of a function body, before any `let` bindings.

```loom
fn divide :: Float -> Float -> Result<Float, ArithmeticError>
  require: divisor != 0.0
  ensure:  result is Ok implies result.value * divisor ~= dividend  -- within floating-point tolerance
  if divisor == 0.0 then Err(ArithmeticError.DivisionByZero)
  else Ok(dividend / divisor)
  end
end
```

### 6.2 Static vs. Dynamic Verification

The contract verifier operates in two passes:

**Static pass:** Contracts involving only the function's type signature, refined type predicates, and pure boolean expressions on literals are checked at compile time via SMT solving. If the precondition is provably violated at a call site, the compiler emits an error at the call site.

```loom
-- COMPILE ERROR at this call site:
-- Precondition `divisor != 0.0` is statically falsifiable: divisor is the literal 0.0
let result = divide(100.0, 0.0)
```

**Dynamic pass:** Contracts involving refined types with runtime predicates, or values whose range cannot be determined statically, are compiled to checked assertions. In debug builds, violations raise a `ContractViolationError` with the violated condition, function name, and source location. In release builds, contracts can be elided with `--release-contracts=zero-cost` after the developer has provided proofs for all contract obligations.

### 6.3 Contracts and Refined Types Interacting

```loom
fn index_of :: List<T> -> Int -> Effect<[Pure], Result<T, BoundsError>>
  require: index >= 0
  require: index < list.length
  ensure:  result is Ok
  Ok(list.unsafe_get(index))  -- safe because preconditions guarantee bounds
end
```

When both preconditions are in scope as verified, the compiler can verify that `unsafe_get` is actually safe and elides the bounds check from the output. Contracts are the mechanism through which safe high-level operations justify their unsafe lowerings.

### 6.4 Invariants on Types

Type-level invariants are expressed as contracts on the constructor:

```loom
type PositiveInt = Int where (> 0)

-- The compiler generates:
fn PositiveInt.from :: Int -> Result<PositiveInt, RefinementError>
  require: value > 0
  Ok(PositiveInt.unsafe_wrap(value))
end
```

There is no way to construct a `PositiveInt` that violates the invariant. `unsafe_wrap` is a compiler-internal construct, not accessible in user code.

---

## 7. Compilation Pipeline

```
source.loom
    |
    | [Lexer + Parser]
    v
Loom AST
    |
    | [Name resolution, module binding]
    v
Resolved AST
    |
    | [Type checker]
    |   - Infers and checks all types
    |   - Resolves refined type predicates
    |   - Emits type errors
    v
Typed AST
    |
    | [Effect checker]
    |   - Verifies effect declarations match call graph
    |   - Checks pure contexts for effect leakage
    |   - Emits effect errors
    v
Effect-checked AST
    |
    | [Contract verifier]
    |   - Static pass: SMT solving for decidable contracts
    |   - Marks remaining contracts for dynamic insertion
    |   - Emits static contract violation errors
    v
Contract-annotated AST
    |
    | [Lowering to Loom IR]
    |   - Monomorphization of parameterized types
    |   - Closure conversion
    |   - Contract insertion (dynamic checks)
    v
Loom IR
    |
    | [Optimizer]
    |   - Dead code elimination
    |   - Inlining
    |   - Provably safe contract elision
    v
Optimized Loom IR
    |
    | [LLVM backend]
    |   - Loom IR to LLVM IR translation
    v
LLVM IR
    |
    | [LLVM optimizer + codegen]
    v
    +--------+----------+----------+
    |        |          |          |
Native   WASM      PTX (GPU)   TPU kernel
binary
```

### 7.1 Parser

Standard recursive descent. The grammar is LL(2). Module header parsing is a distinct phase that completes before the body is parsed, enabling incremental compilation and parallel module processing.

### 7.2 Type Checker

Hindley-Milner type inference extended with refinement types and effect rows. Type variables are resolved before the effect checker runs. All types are monomorphic at IR generation.

### 7.3 Effect Checker

Walks the effect-checked call graph. For each function, computes the transitive effect set from its callees. Compares against the declared effect set. Reports missing or undeclared effects. Effect variables in polymorphic functions are instantiated during this pass.

### 7.4 Contract Verifier

Uses an embedded SMT solver (Z3 via API) for the static pass. Pure predicate expressions on integer and boolean types are translated to SMT formulae. String and custom type predicates are marked for dynamic insertion.

### 7.5 LLVM Backend

Loom IR maps closely to LLVM IR. Product types become LLVM structs. Sum types become tagged unions. Effect annotations have no runtime representation; they are erased after verification. `match` expressions become LLVM switch instructions with exhaustiveness guaranteed by the frontend. Contracts in release-mode-with-proof are elided entirely.

### 7.6 Verification Property

By the time source reaches LLVM IR, the following properties have been mechanically verified:

- All types are consistent (type safety)
- All effects are declared (effect safety)
- All decidable contracts hold at call sites (partial correctness)
- All pattern matches are exhaustive (no runtime match failure)
- No null dereferences (no null in the language)
- No unhandled exceptions (no exceptions in the language)

The LLVM IR produced by Loom carries fewer undefined behaviors than hand-written C or Rust, because the verification has been completed before codegen.

---

## 8. The GS Connection

Loom does not exist in isolation. It is the execution layer of the Generative Specification stack.

### 8.1 The Full Stack

```
Natural language intent (human)
        |
        v
Generative Specification
  (CLAUDE.md, spec files, ForgeCraft validation)
        |
        v
Loom source
  (AI-generated against GS spec)
        |
        v
Verified Loom IR
  (type-checked, effect-checked, contract-verified)
        |
        v
LLVM IR
        |
        v
Native binary / WASM / TPU kernel
```

### 8.2 GS Properties Encoded in Loom

The GS white paper defines four properties that a well-governed AI-generated artifact should satisfy: Bounded, Typed, Testable, and Verifiable.

**Bounded:** The Loom module system enforces this mechanically. Every module has a single-sentence `spec`, a named `provides` surface, and a named `requires` interface list. The compiler rejects modules without these. There is no way to generate an unbounded module.

**Typed:** The Loom type system, including refinement types, encodes the data contracts from the GS spec directly in the language. A GS spec that says "email must be a valid email address" becomes `type Email = String where is_valid_email` in Loom. The spec is the type.

**Testable:** The effect system makes all non-determinism explicit. Every dependency is injected. Every external call is declared. Test doubles are natural replacements: a test wires a different implementation into `requires`. No mocking framework is needed.

**Verifiable:** The contract system encodes GS postconditions as `ensure:` clauses. In a Loom world, "does this satisfy the spec?" is not answered by a human reading a rubric. It is answered by the compiler running the contract verifier.

### 8.3 ForgeCraft Integration

ForgeCraft's `setup_project` command will be extended to generate a Loom module stub from a GS spec:

```
forgecraft generate-loom --spec docs/specs/UserService.md --output src/UserService.loom
```

The generated stub includes the module header with `spec`, `provides`, and `requires` filled in from the GS spec, plus empty function bodies with `require:` and `ensure:` stubs derived from the spec's invariants section. The AI fills in the implementation against the stub. The compiler verifies the result.

This closes the loop: the specification drives generation, and generation produces something the compiler can verify against the specification.

---

## 9. What Loom Is Not

### Not a replacement for existing languages today

Loom has no ecosystem, no package registry, no production runtime, and no standard library beyond core types. It cannot be used to build production software today. It is a language design that targets future AI-native development workflows.

### Not designed for humans to write manually at scale

Loom is review-friendly: a human can read Loom source and understand what it does. It is not write-friendly in the way Python or TypeScript are, because it was not designed for that. The expected authorship pattern is: humans write GS specs, AI generates Loom, humans review and approve Loom, compiler verifies Loom. Writing Loom by hand is possible but not the primary use case.

### Not a research language for academic proof systems only

Loom must compile to real hardware. LLVM output to native binaries and WASM is a requirement, not a stretch goal. The effect system and contract system are designed to be practical, not theoretically complete. Decidability is traded for ergonomics where necessary.

### Not a DSL

Loom is general-purpose. It has modules, parameterized types, higher-order functions, and an effect system that handles arbitrary external I/O. It is not specialized to any domain. A Loom program can, in principle, implement any computation.

### Not attempting to replace human judgment

The humans in the Loom workflow operate at the specification layer: they write GS specs, they review AI-generated Loom, they approve deployments. Loom automates the translation from spec to verified code. It does not automate the decision about what the spec should say. That remains a human responsibility.

---

## 10. Status and Next Steps

v0.1 is a design document. No implementation exists. The following steps are required to produce a working prototype.

### 10.1 Formal Grammar

Produce a complete BNF or EBNF grammar for Loom. The grammar should be unambiguous and LL(2) parseable. Test the grammar against the examples in this document.

**Deliverable:** `docs/loom/grammar.ebnf`

### 10.2 Reference Type Checker

Implement the type checker and effect checker in Haskell or Rust. Haskell is preferred for the initial prototype due to its algebraic data type support for representing Loom ASTs. The reference implementation does not need to produce executable output; it needs to accept valid programs and reject invalid ones with useful error messages.

**Deliverable:** `loom-tc/` repository with parser, type checker, effect checker

### 10.3 Small Standard Library

Define the core standard library: base types, `Option<T>`, `Result<T, E>`, `List<T>`, `Map<K, V>`, basic string operations, basic arithmetic, basic IO types. The standard library is itself written in Loom where possible; IO primitives are written as builtin effect declarations.

**Deliverable:** `loom-stdlib/core/`

### 10.4 LLVM Backend Prototype

Implement the Loom IR to LLVM IR translation. The initial target is x86-64 native binaries and WASM. GPU and TPU targets are deferred. Use the LLVM C API or `inkwell` (Rust LLVM bindings) for IR construction.

**Deliverable:** `loom-llvm/` with working compilation of the examples in Section 2

### 10.5 ForgeCraft Integration

Extend ForgeCraft's `setup_project` command to emit a Loom module stub from a GS spec file. This requires defining the mapping from GS spec properties to Loom module declarations.

**Deliverable:** `forgecraft generate-loom` command, documented in ForgeCraft README

### 10.6 Validation Corpus

Produce a corpus of 20-30 non-trivial Loom programs covering: pure computation, database-backed services, network clients, mixed-effect orchestration. Use these programs to validate the type checker, effect checker, and LLVM backend against expected behavior.

**Deliverable:** `loom-corpus/` with programs and expected type-check and compile outcomes

---

*Loom v0.1 specification. Subject to revision as the prototype progresses.*

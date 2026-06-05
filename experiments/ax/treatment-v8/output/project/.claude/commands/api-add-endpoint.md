Create a new API endpoint. $ARGUMENTS should describe the endpoint (e.g., "POST /api/users - create a user").

Steps:
1. Identify existing endpoint patterns in the project:
   - Router file structure
   - Validation approach (Zod, Joi, class-validator, etc.)
   - Response format conventions
   - Error handling patterns
   - Middleware chain
2. Create the endpoint following discovered patterns:
   - Route handler (thin — delegates to service layer)
   - Input validation schema
   - Service method with business logic
   - Error handling with appropriate HTTP status codes
3. Add tests:
   - Happy path test
   - Validation error test
   - At least one edge case
4. Update any route index/registry if the project uses one

Follow existing patterns exactly. Do not introduce new patterns or libraries.

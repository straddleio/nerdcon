# Contributing Guidelines

## Development Workflow

1. **Check out a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests first** (TDD)
   - Write failing test
   - Run test to verify it fails
   - Write minimal code to pass
   - Refactor if needed

3. **Make your changes**
   - Follow TypeScript strict mode
   - Use structured logger (no console.log)
   - Add proper types (no `any`)
   - Write clear commit messages

4. **Run quality checks**

   ```bash
   npm run lint          # Fix any lint errors
   npm run type-check    # Fix any type errors
   npm test              # Ensure all tests pass
   npm run build         # Verify builds work
   ```

5. **Commit your changes**
   - Pre-commit hooks will auto-run
   - Lint and format will auto-fix
   - Commit will be blocked if errors remain

6. **Push and create PR**
   ```bash
   git push -u origin feature/your-feature-name
   ```

   - GitHub Actions will run CI checks
   - All checks must pass for merge

## Code Standards

### TypeScript

- ✅ Use proper types (`Record<string, unknown>`, interfaces)
- ❌ Never use `any` type
- ✅ Explicit function return types
- ❌ No implicit any returns

### Logging

- ✅ Use `logger.debug()`, `logger.info()`, `logger.error()`
- ❌ No `console.log()` or `console.error()`
- ✅ Include context objects for structured logging

### Error Handling

- ✅ Use `try/catch` with proper error types
- ✅ Use `toExpressError()` for API errors
- ❌ Never throw string literals
- ✅ Include error context in logs

### Testing

- ✅ Write tests for new features
- ✅ Update tests for changed behavior
- ✅ Maintain 50%+ coverage
- ❌ Don't skip tests to make CI pass

## Commit Message Format

```
type(scope): brief description

- Detailed point 1
- Detailed point 2

Fixes #123
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Scopes:**

- `server`: Backend changes
- `web`: Frontend changes
- `deps`: Dependency updates

**Examples:**

```
feat(server): add customer KYC verification endpoint

- Add GET /api/customers/:id/kyc route
- Include verification breakdown details
- Add error handling for missing customers

Fixes #42
```

## Getting Help

- Check `CLAUDE.md` for architecture and setup
- Review `docs/TESTING.md` for test guidelines
- Look at existing code for patterns
- Ask questions in PR comments

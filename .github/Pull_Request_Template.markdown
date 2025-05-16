# Pull Request

## Description
Briefly describe what this PR does and why it’s needed.

- **Changes**: [e.g., Added `signup` mutation to GraphQL API with `SignupInput` validation.]
- **Purpose**: [e.g., Enable user registration with secure password handling.]
- **Related Issues**: [e.g., Closes #123]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor
- [ ] Documentation

## Testing
How did you test your changes?

- [e.g., Ran `npm run test` to verify `AuthService.signup`.]
- [e.g., Tested `signup` mutation in GraphQL Playground with query: `{ signup(signupInput: { email: "test@example.com", password: "123456", username: "testuser", name: "Test User" }) { id, email } }`.]

## Checklist
- [ ] Code follows project style guidelines.
- [ ] I reviewed my code.
- [ ] Tests pass.
- [ ] Documentation updated (if needed).

## Notes
Any additional info (e.g., sample query/response, known issues).

**Sample Query**:
```graphql
mutation {
  signup(signupInput: { email: "test@example.com", password: "123456", username: "testuser", name: "Test User" }) {
    id
    email
  }
}
```

**Sample Response**:
```json
{
  "data": {
    "signup": {
      "id": 1,
      "email": "test@example.com"
    }
  }
}
```
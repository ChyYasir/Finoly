# Git Commit Message Guidelines

Clear and consistent commit messages are vital for collaboration, debugging, and understanding project history.

## The Golden Rule: 50/72

- **Subject Line:** Max 50 characters, imperative mood, capitalize first letter, no period.

- **Blank Line:** Always one blank line after the subject.

- **Body:** Wrap at 72 characters, explain "what" and "why."

### 1. Subject Line (The "What")

- **Concise Summary:** Briefly describe the change.

  - **Good:** `Fix: Prevent crash on invalid input`

  - **Bad:** `Fixed a bug where the app would crash`

- **Imperative Mood:** Act as if giving a command.

  - **Good:** `Add user profile page`

  - **Bad:** `Added user profile page`

- **Capitalize First Letter & No Period.**

- **Prefix with Type (Conventional Commits - Recommended):**

  - `feat`: New feature - `feat: Add dark mode toggle`

  - `fix`: Bug fix - `fix: Resolve infinite loop in parser`

  - `docs`: Documentation changes - `docs: Update README with setup steps`

  - `style`: Formatting, whitespace - `style: Format code with Prettier`

  - `refactor`: Code restructuring, no functional change - `refactor: Extract validation logic to helper`

  - `perf`: Performance improvement - `perf: Optimize image loading speed`

  - `test`: Add/correct tests - `test: Add unit tests for API endpoints`

  - `build`: Build system, dependencies - `build: Update npm packages`

  - `ci`: CI configuration - `ci: Add linting step to pipeline`
  - `chore`: Other minor changes - `chore: Update gitignore`
  - `revert`: Reverts a previous commit - `revert: "feat: Add experimental feature"`

  **Syntax:** `type(scope): subject` (Scope is optional)

  - `feat(auth): Implement OAuth2 login`

  - `fix(ui): Correct button alignment`

### 2. Blank Line

- **Crucial Separator:** Ensures `git log --oneline` works correctly.

### 3. Body (The "Why" and "How")

- **Explain "Why":** What problem does this solve? Why was it necessary?

- **Explain "How" (if not obvious):** How was the problem addressed? Key decisions?

- **Full Sentences:** Use clear, complete sentences.

- **Wrap Lines:** Keep lines at 72 characters for readability.

- **Reference Issues:** Link to relevant issue trackers (e.g., `Closes #123`, `Fixes BUG-456`).

### Example:

```
feat(notifications): Add email notifications for new comments

This introduces email notifications for post authors when a new
comment is added. This aims to increase user engagement as in-app
notifications were often missed.

- Integrates with 'sendgrid' for email delivery.
- Uses a new 'NotificationService' for modularity.

Closes #45
```

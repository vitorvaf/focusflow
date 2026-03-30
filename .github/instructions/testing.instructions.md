---
applyTo: "tests/**/*.cs,**/*.test.ts,**/*.test.tsx,**/*.spec.ts"
---

# Testing Instructions

## C# Tests (xUnit + FluentAssertions)

- Use xUnit as the test framework.
- Use FluentAssertions for readable assertions.
- Use NSubstitute for mocking interfaces.
- Test class name: `{ClassUnderTest}Tests`.
- Method name: `{Method}_{Scenario}_{ExpectedResult}`.

```csharp
public class TaskServiceTests
{
    private readonly AppDbContext _db;
    private readonly IObsidianSyncService _sync;
    private readonly TaskService _sut;

    public TaskServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _sync = Substitute.For<IObsidianSyncService>();
        _sut = new TaskService(_db, _sync);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsCreatedTask()
    {
        // Arrange
        var request = new CreateTaskRequest { Title = "Test Task", BoardId = 1 };

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Title.Should().Be("Test Task");
        await _sync.Received(1).SyncBoardToVault(1);
    }
}
```

## TypeScript Tests (Vitest + Testing Library)

- Use Vitest as the test runner.
- Use React Testing Library for component tests.
- Test file co-located: `ComponentName.test.tsx` next to `ComponentName.tsx`.
- Assert user-visible behavior, not internal state.

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  it('renders task title and pomodoro count', () => {
    const task = createMockTask({ title: 'Minha Tarefa', completedPomodoros: 2, estimatedPomodoros: 5 });
    render(<TaskCard task={task} onMove={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText('Minha Tarefa')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });
});
```

## What to Test

- Services: all public methods, including error paths and edge cases.
- Controllers: route mapping, status codes, and request validation.
- Components: rendering, user interactions, loading/error states.
- ObsidianSyncService: generated Markdown matches expected Kanban format.
- PomodoroService: state transitions (idle → focus → break → focus).

## What NOT to Test

- EF Core migrations or DbContext configuration.
- Third-party library internals.
- Trivial getters/setters or DTO mapping unless complex.

using FluentAssertions;
using FocusFlow.Api.Data;

namespace FocusFlow.Api.Tests;

public class SqliteConnectionStringResolverTests
{
    [Fact]
    public void Resolve_WhenDataDirectoryIsProvided_MovesRelativeDatabasePath()
    {
        var dataDirectory = CreateTempDirectory();

        try
        {
            var connectionString = SqliteConnectionStringResolver.Resolve("Data Source=focusflow.db", dataDirectory);

            connectionString.Should().Contain($"Data Source={Path.Combine(dataDirectory, "focusflow.db")}");
            Directory.Exists(dataDirectory).Should().BeTrue();
        }
        finally
        {
            CleanupDirectory(dataDirectory);
        }
    }

    [Fact]
    public void Resolve_WhenDataDirectoryIsMissing_UsesConfiguredConnectionString()
    {
        var connectionString = SqliteConnectionStringResolver.Resolve("Data Source=focusflow.db", null);

        connectionString.Should().Be("Data Source=focusflow.db");
    }

    [Fact]
    public void Resolve_WhenConfiguredPathIsAbsolute_KeepsAbsolutePath()
    {
        var dataDirectory = CreateTempDirectory();
        var absoluteDatabasePath = Path.Combine(dataDirectory, "custom.db");

        try
        {
            var connectionString = SqliteConnectionStringResolver.Resolve(
                $"Data Source={absoluteDatabasePath}",
                Path.Combine(dataDirectory, "ignored"));

            connectionString.Should().Contain($"Data Source={absoluteDatabasePath}");
        }
        finally
        {
            CleanupDirectory(dataDirectory);
        }
    }

    [Fact]
    public void Resolve_WhenConfigurationIsEmpty_UsesDefaultDatabaseName()
    {
        var dataDirectory = CreateTempDirectory();

        try
        {
            var connectionString = SqliteConnectionStringResolver.Resolve(null, dataDirectory);

            connectionString.Should().Contain($"Data Source={Path.Combine(dataDirectory, "focusflow.db")}");
        }
        finally
        {
            CleanupDirectory(dataDirectory);
        }
    }

    private static string CreateTempDirectory()
    {
        var directory = Path.Combine(Path.GetTempPath(), "focusflow-sqlite-resolver-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(directory);
        return directory;
    }

    private static void CleanupDirectory(string directory)
    {
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, true);
        }
    }
}

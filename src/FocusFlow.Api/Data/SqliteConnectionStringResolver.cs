using Microsoft.Data.Sqlite;

namespace FocusFlow.Api.Data;

/// <summary>
/// Resolves the SQLite connection string considering runtime overrides.
/// </summary>
public static class SqliteConnectionStringResolver
{
    /// <summary>
    /// Resolves the final connection string, optionally relocating relative SQLite files to a data directory.
    /// </summary>
    /// <param name="configuredConnectionString">Connection string from configuration.</param>
    /// <param name="dataDirectoryPath">Optional writable directory for application data.</param>
    /// <returns>Resolved SQLite connection string.</returns>
    public static string Resolve(string? configuredConnectionString, string? dataDirectoryPath)
    {
        var connectionString = string.IsNullOrWhiteSpace(configuredConnectionString)
            ? "Data Source=focusflow.db"
            : configuredConnectionString;

        if (string.IsNullOrWhiteSpace(dataDirectoryPath))
        {
            return connectionString;
        }

        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (string.IsNullOrWhiteSpace(builder.DataSource))
        {
            builder.DataSource = "focusflow.db";
        }

        if (Path.IsPathRooted(builder.DataSource))
        {
            return builder.ToString();
        }

        Directory.CreateDirectory(dataDirectoryPath);
        builder.DataSource = Path.Combine(dataDirectoryPath, builder.DataSource);

        return builder.ToString();
    }
}

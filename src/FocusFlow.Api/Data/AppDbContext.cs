using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FocusFlow.Api.Data;

/// <summary>Main EF Core database context for FocusFlow.</summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Board> Boards => Set<Board>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<PomodoroSession> PomodoroSessions => Set<PomodoroSession>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<AppSettings> Settings => Set<AppSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Board>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).IsRequired().HasMaxLength(200);
            b.Property(x => x.VaultPath).HasMaxLength(500);
        });

        modelBuilder.Entity<TaskItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).IsRequired().HasMaxLength(500);
            b.HasOne(x => x.Board)
             .WithMany(x => x.Tasks)
             .HasForeignKey(x => x.BoardId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.Tags)
             .WithMany(x => x.Tasks)
             .UsingEntity("TaskTag");
            b.HasIndex(x => new { x.BoardId, x.SortOrder });
            b.HasIndex(x => x.Status);
        });

        modelBuilder.Entity<PomodoroSession>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Task)
             .WithMany(x => x.PomodoroSessions)
             .HasForeignKey(x => x.TaskId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => x.TaskId);
        });

        modelBuilder.Entity<Tag>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).IsRequired().HasMaxLength(100);
            b.Property(x => x.Color).HasMaxLength(7);
        });

        modelBuilder.Entity<AppSettings>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Key).IsRequired().HasMaxLength(100);
            b.Property(x => x.Value).HasMaxLength(2000);
            b.HasIndex(x => x.Key).IsUnique();
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Board>().HasData(new Board
        {
            Id = 1,
            Name = "Meu Board",
            VaultPath = null,
            CreatedAt = seedDate,
            UpdatedAt = seedDate,
        });

        modelBuilder.Entity<AppSettings>().HasData(
            new AppSettings { Id = 1, Key = "FocusDurationMinutes",      Value = "25",    UpdatedAt = seedDate },
            new AppSettings { Id = 2, Key = "ShortBreakMinutes",         Value = "5",     UpdatedAt = seedDate },
            new AppSettings { Id = 3, Key = "LongBreakMinutes",          Value = "15",    UpdatedAt = seedDate },
            new AppSettings { Id = 4, Key = "PomodorosUntilLongBreak",   Value = "4",     UpdatedAt = seedDate },
            new AppSettings { Id = 5, Key = "Theme",                     Value = "light", UpdatedAt = seedDate }
        );
    }
}

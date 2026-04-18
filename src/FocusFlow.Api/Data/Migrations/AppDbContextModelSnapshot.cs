using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using FocusFlow.Api.Data;

#nullable disable

namespace FocusFlow.Api.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0");

            modelBuilder.Entity("FocusFlow.Api.Models.Project", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<string>("Color")
                    .IsRequired()
                    .HasMaxLength(7)
                    .HasColumnType("TEXT");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasMaxLength(200)
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("VaultPath")
                    .HasMaxLength(500)
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.ToTable("Projects");

                b.HasData(
                    new
                    {
                        Id = 1,
                        Color = "#6366f1",
                        CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                        Name = "Geral",
                        UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                        VaultPath = (string)null
                    });
            });

            modelBuilder.Entity("FocusFlow.Api.Models.TaskItem", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<DateTime?>("CompletedAt")
                    .HasColumnType("TEXT");

                b.Property<int>("CompletedPomodoros")
                    .HasColumnType("INTEGER");

                b.Property<string>("Description")
                    .HasColumnType("TEXT");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<DateTime?>("DueDate")
                    .HasColumnType("TEXT");

                b.Property<int>("EstimatedPomodoros")
                    .HasColumnType("INTEGER");

                b.Property<int>("Priority")
                    .HasColumnType("INTEGER");

                b.Property<int>("ProjectId")
                    .HasColumnType("INTEGER");

                b.Property<int>("SortOrder")
                    .HasColumnType("INTEGER");

                b.Property<int>("Status")
                    .HasColumnType("INTEGER");

                b.Property<string>("Title")
                    .IsRequired()
                    .HasMaxLength(500)
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("ProjectId", "SortOrder");

                b.HasIndex("Status");

                b.ToTable("Tasks");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.Tag", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<string>("Color")
                    .IsRequired()
                    .HasMaxLength(7)
                    .HasColumnType("TEXT");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.ToTable("Tags");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.PomodoroSession", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<bool>("Completed")
                    .HasColumnType("INTEGER");

                b.Property<int>("DurationMinutes")
                    .HasColumnType("INTEGER");

                b.Property<DateTime?>("EndedAt")
                    .HasColumnType("TEXT");

                b.Property<DateTime>("StartedAt")
                    .HasColumnType("TEXT");

                b.Property<int>("TaskId")
                    .HasColumnType("INTEGER");

                b.Property<int>("Type")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.HasIndex("TaskId");

                b.ToTable("PomodoroSessions");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.AppSettings", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<string>("Key")
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("Value")
                    .IsRequired()
                    .HasMaxLength(2000)
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("Key")
                    .IsUnique();

                b.ToTable("AppSettings");

                b.HasData(
                    new { Id = 1, Key = "FocusDurationMinutes", UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), Value = "25" },
                    new { Id = 2, Key = "ShortBreakMinutes", UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), Value = "5" },
                    new { Id = 3, Key = "LongBreakMinutes", UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), Value = "15" },
                    new { Id = 4, Key = "PomodorosUntilLongBreak", UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), Value = "4" },
                    new { Id = 5, Key = "Theme", UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), Value = "light" });
            });

            modelBuilder.Entity("FocusFlow.Api.Models.TaskItem", b =>
            {
                b.HasOne("FocusFlow.Api.Models.Project", "Project")
                    .WithMany("Tasks")
                    .HasForeignKey("ProjectId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("Project");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.PomodoroSession", b =>
            {
                b.HasOne("FocusFlow.Api.Models.TaskItem", "Task")
                    .WithMany("PomodoroSessions")
                    .HasForeignKey("TaskId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("Task");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.TaskItem", b =>
            {
                b.Navigation("Tags");
            });

            modelBuilder.Entity("FocusFlow.Api.Models.Project", b =>
            {
                b.Navigation("Tasks");
            });
#pragma warning restore 612, 618
        }
    }
}

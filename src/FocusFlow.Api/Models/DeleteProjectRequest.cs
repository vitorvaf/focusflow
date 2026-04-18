namespace FocusFlow.Api.Models;

/// <summary>Request body for deleting a project.</summary>
public class DeleteProjectRequest
{
    /// <summary>
    /// Optional destination project ID for task reassignment.
    /// Required when the source project still contains tasks.
    /// </summary>
    public int? TargetProjectId { get; set; }
}

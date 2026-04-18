using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FocusFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
    {
        var projects = await _projectService.GetAllAsync();
        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDto>> GetById(int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project is null)
            return NotFound(new ProblemDetails { Title = "Projeto não encontrado", Status = 404 });
        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectRequest request)
    {
        var project = await _projectService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProjectDto>> Update(int id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _projectService.UpdateAsync(id, request);
        if (project is null)
            return NotFound(new ProblemDetails { Title = "Projeto não encontrado", Status = 404 });
        return Ok(project);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var result = await _projectService.DeleteAsync(id);
            if (!result)
                return NotFound(new ProblemDetails { Title = "Projeto não encontrado", Status = 404 });
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }
}

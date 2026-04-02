using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FocusFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;

    public BoardsController(AppDbContext db, ObsidianSyncService sync)
    {
        _db = db;
        _sync = sync;
    }

    /// <summary>Returns all boards.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Board>>> GetAll()
    {
        var boards = await _db.Boards.AsNoTracking().ToListAsync();
        return Ok(boards);
    }

    /// <summary>Returns a board by ID.</summary>
    /// <param name="id">Board ID.</param>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Board>> GetById(int id)
    {
        var board = await _db.Boards.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (board is null)
            return NotFound(new ProblemDetails { Title = "Board não encontrado", Status = 404 });
        return Ok(board);
    }

    /// <summary>Creates a new board.</summary>
    [HttpPost]
    public async Task<ActionResult<Board>> Create([FromBody] Board board)
    {
        board.CreatedAt = DateTime.UtcNow;
        board.UpdatedAt = DateTime.UtcNow;
        _db.Boards.Add(board);
        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(board.Id);
        return CreatedAtAction(nameof(GetById), new { id = board.Id }, board);
    }

    /// <summary>Updates an existing board (name and vault path).</summary>
    /// <param name="id">Board ID.</param>
    /// <param name="board">Updated board data.</param>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Board>> Update(int id, [FromBody] Board board)
    {
        var existing = await _db.Boards.FirstOrDefaultAsync(b => b.Id == id);
        if (existing is null)
            return NotFound(new ProblemDetails { Title = "Board não encontrado", Status = 404 });

        existing.Name = board.Name;
        existing.VaultPath = board.VaultPath;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(id);

        return Ok(existing);
    }
}

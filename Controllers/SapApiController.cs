using Microsoft.AspNetCore.Mvc;

namespace SapTagApp.Controllers;

[ApiController]
[Route("api/sap")]
public class SapApiController : ControllerBase
{
    private readonly SapProxyService _sap;
    private readonly ILogger<SapApiController> _logger;

    public SapApiController(SapProxyService sap, ILogger<SapApiController> logger)
    {
        _sap = sap;
        _logger = logger;
    }

    // GET /api/sap/status
    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        try
        {
            var result = await _sap.GetConnectionStatusAsync();
            return Ok(new { status = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verificando conexión SAP");
            return Ok(new { status = "SIN CONEXIÓN" });
        }
    }

    // GET /api/sap/tag?empId=16941471&docNum=7300
    [HttpGet("tag")]
    public async Task<IActionResult> Tag([FromQuery] string empId, [FromQuery] int docNum)
    {
        if (string.IsNullOrWhiteSpace(empId) || docNum <= 0)
            return BadRequest(new { ok = false, message = "Parámetros inválidos." });

        try
        {
            // 1. Validar orden
            var orderStatus = await _sap.ValidateOrderAsync(docNum);

            if (orderStatus != "R")
                return Ok(new { ok = false, message = $"Orden {docNum}: {orderStatus}" });

            // 2. Validar empleado / obtener recurso
            var resource = await _sap.ValidateEmployeeAsync(empId);

            if (resource.StartsWith("[Error]", StringComparison.OrdinalIgnoreCase))
                return Ok(new { ok = false, message = resource });

            // 3. Insertar registro de tiempo
            var result = await _sap.InsertTimeAsync(docNum, empId, resource);

            return Ok(new { ok = true, message = result, resource });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error de comunicación con API SAP");
            return Ok(new { ok = false, message = "No se pudo conectar con SAP Business One." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado en TAG");
            return StatusCode(500, new { ok = false, message = "Error interno del servidor." });
        }
    }
}

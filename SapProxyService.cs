namespace SapTagApp;

public class SapProxyService
{
    private readonly HttpClient _http;
    private readonly string _base;

    public SapProxyService(HttpClient http, IConfiguration cfg)
    {
        _http = http;
        _base = cfg["SapApi:BaseUrl"]
            ?? throw new InvalidOperationException("SapApi:BaseUrl no configurado en appsettings.json");

        _http.Timeout = TimeSpan.FromSeconds(15);
    }

    /// <summary>Verifica conexión con SAP. Retorna "CONECTADO" o mensaje de error.</summary>
    public async Task<string> GetConnectionStatusAsync()
    {
        try
        {
            var result = await _http.GetStringAsync($"{_base}/wmvc/sap");
            return result?.Trim() ?? "CONECTADO";
        }
        catch
        {
            return "SIN CONEXIÓN";
        }
    }

    /// <summary>
    /// Valida el estado de una orden de fabricación.
    /// Retorna "R" si está liberada, o un mensaje de error.
    /// </summary>
    public async Task<string> ValidateOrderAsync(int docNum)
    {
        var result = await _http.GetStringAsync(
            $"{_base}/wmvc/ValidOrder/Details/{docNum}");
        return result?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// Valida el empleado y retorna el código de recurso asociado,
    /// o "[Error]..." si no está activo o no existe.
    /// </summary>
    public async Task<string> ValidateEmployeeAsync(string empId)
    {
        var result = await _http.GetStringAsync(
            $"{_base}/wmvc/ValidEmp/Details/{Uri.EscapeDataString(empId)}");
        return result?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// Inserta el registro de tiempo en SAP.
    /// Retorna el mensaje de confirmación o error de la API.
    /// </summary>
    public async Task<string> InsertTimeAsync(int docNum, string empId, string resource)
    {
        var url = $"{_base}/wmvc/sap/details" +
                  $"?id={docNum}" +
                  $"&&oEmp={Uri.EscapeDataString(empId)}" +
                  $"&&oRec={Uri.EscapeDataString(resource)}";

        var result = await _http.GetStringAsync(url);
        return result?.Trim() ?? string.Empty;
    }
}

# SAP TAG — Registro de tiempos
### ASP.NET Core 8 · PWA · SAP Business One

---

## Requisitos del servidor (IIS)

- Windows Server 2016+ / Windows 10+
- IIS con **ASP.NET Core Hosting Bundle** instalado
  → https://dotnet.microsoft.com/download/dotnet/8.0 (sección "Hosting Bundle")
- .NET 8 Runtime

---

## Configuración

Antes de publicar, ajuste la URL de la API SAP en `appsettings.json`:

```json
"SapApi": {
  "BaseUrl": "http://<IP_SERVIDOR_SAP>:<PUERTO>"
}
```

---

## Publicar desde Visual Studio

1. Clic derecho en el proyecto → **Publish**
2. Target: **Folder** → seleccione la carpeta de destino
3. Configuration: **Release**
4. Target Runtime: `win-x64` (self-contained) o `Portable` (framework-dependent)
5. Clic en **Publish**

## Publicar desde CLI

```bash
dotnet publish -c Release -r win-x64 --self-contained true -o ./publish
```

---

## Configurar IIS

1. Crear un nuevo **Sitio** o **Aplicación** en IIS Manager
2. Apuntar la ruta física a la carpeta `publish/`
3. **Application Pool**:
   - .NET CLR Version: **No Managed Code**
   - Pipeline Mode: Integrated
4. Asignar puerto y hostname según su red
5. Asegurarse de que el App Pool tiene permisos de lectura sobre la carpeta

---

## Iconos PWA

Coloque los iconos en `wwwroot/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Fondo azul `#0057b8` con logo SAP en blanco — los usuarios podrán
agregar la app a la pantalla de inicio del TC21 desde Chrome.

---

## Flujo operativo

```
[Inicio] → Verificar conexión SAP
    ↓
[Campo Funcionario] ← TC21 escanea carnet QR
    ↓ (foco automático)
[Campo Orden]       ← TC21 escanea QR de orden
    ↓
[Botón TAG]         ← Operario presiona
    ↓
GET /api/sap/tag?empId=...&docNum=...
    ↓
1. ValidateOrder  → debe retornar "R" (Liberada)
2. ValidateEmployee → retorna código de recurso
3. InsertTime     → registra en SAP B1
    ↓
[Feedback en pantalla] → campos limpios → foco a Funcionario
```

---

## Notas de compatibilidad con Zebra TC21

- El lector envía los caracteres del QR como **teclado HID** seguido de `Enter`
- El campo Funcionario transfiere el foco al campo Orden automáticamente al recibir `Enter`
- El campo Orden dispara el TAG automáticamente si ambos campos están llenos y se recibe `Enter`
- Sin necesidad de cámara, librerías QR ni permisos especiales del navegador

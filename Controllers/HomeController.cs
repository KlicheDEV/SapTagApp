using Microsoft.AspNetCore.Mvc;

namespace SapTagApp.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => View();
}

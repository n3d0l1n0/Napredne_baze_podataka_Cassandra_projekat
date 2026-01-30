using Microsoft.AspNetCore.Mvc;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;

namespace StudentOrganiserApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest model)
        {
            if (model == null || string.IsNullOrEmpty(model.StudentId) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest("Student ID and password are required.");
            }

            var student = DataProvider.GetStudentForLogin(model.StudentId);

            if (student == null || student.password == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(model.Password, student.password);

            if (!isPasswordValid)
            {
                return Unauthorized("Invalid credentials.");
            }
            

            return Ok(new { 
                studentID = student.studentID, 
                fname = student.fname,
                lname = student.lname 
            });
        }
    }
}
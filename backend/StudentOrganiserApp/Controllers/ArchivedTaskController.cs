using Microsoft.AspNetCore.Mvc;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;
using System.Collections.Generic;

namespace StudentOrganiserApi.Controllers
{
    [ApiController]
    [Route("api/students/{studentId}/archived-tasks")]
    public class ArchivedTasksController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<StudentOrganiserApp.Entities.Task>> GetArchivedTasks(string studentId)
        {
            var student = DataProvider.GetStudent(studentId);
            if (student == null)
            {
                return NotFound($"Student sa ID-jem '{studentId}' nije pronađen.");
            }

            var archivedTasks = DataProvider.GetArchivedTasks(studentId);
            return Ok(archivedTasks);
        }
    }
}
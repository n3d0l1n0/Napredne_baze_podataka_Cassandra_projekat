using Microsoft.AspNetCore.Mvc;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;
using System.Collections.Generic;

namespace StudentOrganiserApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<Student>> GetAllStudents()
        {
            var students = DataProvider.GetStudents();
            return Ok(students);
        }

        [HttpGet("{studentId}")]
        public ActionResult<Student> GetStudentById(string studentId)
        {
            var student = DataProvider.GetStudent(studentId);
            if (student == null)
            {
                return NotFound($"Student with ID '{studentId}' not found.");
            }
            return Ok(student);
        }

        [HttpPost]
        public IActionResult CreateStudent([FromBody] Student newStudent)
        {
            if (newStudent == null || string.IsNullOrEmpty(newStudent.studentID))
            {
                return BadRequest("Student data is invalid.");
            }

            DataProvider.AddStudent(newStudent);

            return CreatedAtAction(nameof(GetStudentById), new { studentId = newStudent.studentID }, newStudent);
        }

        [HttpPut("{studentId}")]
        public IActionResult UpdateStudent(string studentId, [FromBody] Student studentToUpdate)
        {
            if (studentToUpdate == null || studentId != studentToUpdate.studentID)
            {
                return BadRequest("Student ID mismatch or invalid data.");
            }

            var existingStudent = DataProvider.GetStudent(studentId);
            if (existingStudent == null)
            {
                return NotFound($"Student with ID '{studentId}' not found.");
            }

            DataProvider.UpdateStudent(studentToUpdate);
            return NoContent(); 
        }

        [HttpDelete("{studentId}")]
        public IActionResult DeleteStudent(string studentId)
        {
            var existingStudent = DataProvider.GetStudent(studentId);
            if (existingStudent == null)
            {
                return NotFound($"Student with ID '{studentId}' not found.");
            }


            DataProvider.DeleteStudent(studentId);
            return NoContent();
        }
    }
}
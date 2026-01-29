using Cassandra;
using Microsoft.AspNetCore.Mvc;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions; 

namespace StudentOrganiserApi.Controllers
{
    [ApiController]
    [Route("api/students/{studentId}/tasks")]
    public class TasksController : ControllerBase
    {
    
        [HttpPost]
        public IActionResult CreateTask(string studentId, [FromBody] StudentOrganiserApp.Entities.Task newTask)
        {
            if (newTask == null)
            {
                return BadRequest("Task data is required.");
            }

            newTask.StudentId = studentId;
            newTask.TaskId = Guid.NewGuid();
            newTask.CreatedAt = DateTime.UtcNow;
            newTask.UpdatedAt = DateTime.UtcNow;

            string period = newTask.TaskTime.ToString("yyyy-MM");

            DataProvider.AddTask(newTask, period);
            
            return StatusCode(201, newTask);
        }

        [HttpPut("{taskId}")]
        public IActionResult UpdateTask(string studentId, Guid taskId, [FromBody] StudentOrganiserApp.Entities.Task taskToUpdate)
        {
            if (taskToUpdate == null || taskId != taskToUpdate.TaskId || studentId != taskToUpdate.StudentId)
            {
                return BadRequest("Task ID mismatch or invalid data.");
            }
            
            taskToUpdate.UpdatedAt = DateTime.UtcNow;
            string period = taskToUpdate.TaskTime.ToString("yyyy-MM");

            DataProvider.UpdateTask(taskToUpdate, period);
            return NoContent(); 
        }

        [HttpDelete("{taskId}")]
        public IActionResult DeleteTask(string studentId, Guid taskId, [FromQuery] DateTime taskTime, [FromQuery] string type)
        {
            if (taskTime == default || string.IsNullOrEmpty(type))
            {
                return BadRequest("Query parametri 'taskTime' i 'type' su obavezni.");
            }
            
            string period = taskTime.ToString("yyyy-MM");
            
            var existingTask = DataProvider.GetTask(studentId, period, taskTime, taskId);
            if (existingTask == null)
            {
                return NotFound("Zadatak nije pronađen.");
            }

            var taskToDelete = new StudentOrganiserApp.Entities.Task
            {
                StudentId = studentId,
                TaskId = taskId,
                TaskTime = taskTime,
                Type = type
            };

            DataProvider.DeleteTask(taskToDelete, period);
            return NoContent();
        }


        [HttpPost("{taskId}/archive")]
        public IActionResult ArchiveTask(string studentId, Guid taskId, [FromBody] StudentOrganiserApp.Entities.Task taskToArchive)
        {
             if (taskToArchive == null || taskId != taskToArchive.TaskId || studentId != taskToArchive.StudentId)
            {
                return BadRequest("Task ID mismatch or invalid data.");
            }

            DataProvider.ArchiveTask(taskToArchive);
            return Ok("Zadatak je uspešno arhiviran.");
        }

        [HttpGet("{taskId}/history")]
        public ActionResult<List<TaskStatusHistory>> GetTaskHistory(string studentId, Guid taskId)
        {
            var history = DataProvider.GetTaskStatusHistory(studentId, taskId);
            return Ok(history);
        }
        
        [HttpGet("period/{period}")]
        public ActionResult<List<StudentOrganiserApp.Entities.Task>> GetTasksByPeriod(string studentId, string period)
        {
            if (!Regex.IsMatch(period, @"^\d{4}-\d{2}$"))
            {
                return BadRequest("Neispravan format perioda. Koristite 'yyyy-MM'.");
            }
            var tasks = DataProvider.GetTasksByStudentAndPeriod(studentId, period);
            return Ok(tasks);
        }

        [HttpGet("daily/{date}")]
        public ActionResult<List<StudentOrganiserApp.Entities.Task>> GetDailyTasks(string studentId, string date)
        {
            if (!DateOnly.TryParse(date, out DateOnly parsedDate))
            {
                return BadRequest("Neispravan format datuma. Koristite 'yyyy-MM-dd'.");
            }
            var localDate = new LocalDate(parsedDate.Year, parsedDate.Month, parsedDate.Day);
            var tasks = DataProvider.GetDailyPlan(studentId, localDate);
            return Ok(tasks);
        }

        [HttpGet("weekly/{startDate}")]
        public ActionResult<List<StudentOrganiserApp.Entities.Task>> GetWeeklyTasks(string studentId, string startDate)
        {
            if (!DateOnly.TryParse(startDate, out DateOnly parsedDate))
            {
                return BadRequest("Neispravan format datuma. Koristite 'yyyy-MM-dd'.");
            }
            var localDate = new LocalDate(parsedDate.Year, parsedDate.Month, parsedDate.Day);
            var tasks = DataProvider.GetWeeklyPlan(studentId, localDate);
            return Ok(tasks);
        }

        [HttpGet("type/{type}")]
        public ActionResult<List<StudentOrganiserApp.Entities.Task>> GetTasksByType(string studentId, string type)
        {
            var tasks = DataProvider.GetTasksByType(studentId, type);
            return Ok(tasks);
        }
    }
}
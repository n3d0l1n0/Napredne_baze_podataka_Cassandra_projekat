using Microsoft.AspNetCore.Mvc;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;
using System;
using System.Collections.Generic;

namespace StudentOrganiserApi.Controllers
{
    [ApiController]
    [Route("api/students/{studentId}/tasks/{taskId}/status-history")]
    public class TaskStatusHistoryController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<TaskStatusHistory>> GetHistory(string studentId, Guid taskId)
        {
            var history = DataProvider.GetTaskStatusHistory(studentId, taskId);
            return Ok(history);
        }

        [HttpPost]
        public IActionResult AddHistory(string studentId, Guid taskId, [FromBody] TaskStatusHistory history)
        {
            if (history == null)
                return BadRequest();

            history.StudentId = studentId;
            history.TaskId = taskId;
            history.ChangeTime = DateTime.UtcNow;

            DataProvider.AddTaskStatusHistory(history);
            return StatusCode(201, history);
        }

        [HttpPut]
        public IActionResult UpdateHistory(string studentId, Guid taskId, [FromBody] TaskStatusHistory history)
        {
            if (history == null ||
                history.StudentId != studentId ||
                history.TaskId != taskId)
            {
                return BadRequest();
            }

            DataProvider.UpdateTaskStatusHistory(history);
            return NoContent();
        }

        [HttpDelete]
        public IActionResult DeleteHistory(string studentId, Guid taskId, [FromQuery] DateTime changeTime)
        {
            var history = new TaskStatusHistory
            {
                StudentId = studentId,
                TaskId = taskId,
                ChangeTime = changeTime
            };

            DataProvider.DeleteTaskStatusHistory(history);
            return NoContent();
        }
    }
}
